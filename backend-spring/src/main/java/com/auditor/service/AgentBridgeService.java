package com.auditor.service;

import com.auditor.entity.AuditRecord;
import com.auditor.repository.AuditRecordRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

@Service
public class AgentBridgeService {

    private static final Logger log = LoggerFactory.getLogger(AgentBridgeService.class);
    private static final Pattern HITL_PROMPT_PATTERN = Pattern.compile("Approve agent (?:data )?remediation script\\?\\s*\\[y/N\\]:", Pattern.CASE_INSENSITIVE);

    @Value("${agent.engine.python-path:python}")
    private String pythonPath;

    @Value("${agent.engine.script-path:../engine/agent.py}")
    private String agentScriptPath;

    @Value("${agent.engine.working-dir:../engine}")
    private String workingDir;

    private final AuditRecordRepository auditRecordRepository;
    private final ObjectMapper objectMapper;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    // Active sub-process state management
    private volatile Process activeProcess;
    private volatile BufferedWriter processStdinWriter;
    private final AtomicBoolean isAwaitingApproval = new AtomicBoolean(false);
    private volatile SseEmitter currentEmitter;

    @Autowired
    public AgentBridgeService(AuditRecordRepository auditRecordRepository, ObjectMapper objectMapper) {
        this.auditRecordRepository = auditRecordRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Initializes the sub-process and establishes the Server-Sent Events stream.
     */
    public synchronized SseEmitter startAudit(String uploadedCsvAbsolutePath) {
        // Cancel existing process if running
        terminateActiveProcess();

        // 10-minute timeout for autonomous audit loop
        SseEmitter emitter = new SseEmitter(10 * 60 * 1000L);
        this.currentEmitter = emitter;
        this.isAwaitingApproval.set(false);

        emitter.onCompletion(this::cleanup);
        emitter.onTimeout(this::cleanup);
        emitter.onError((ex) -> cleanup());

        executorService.submit(() -> executeAgentProcess(uploadedCsvAbsolutePath, emitter));

        return emitter;
    }

    private void executeAgentProcess(String csvPath, SseEmitter emitter) {
        try {
            sendSseEvent(emitter, "status", "{\"message\":\"Spawning Antigravity Agent runtime via Java ProcessBuilder...\"}");

            Path scriptFile = Paths.get(agentScriptPath).toAbsolutePath().normalize();
            Path workDirectory = Paths.get(workingDir).toAbsolutePath().normalize();

            ProcessBuilder pb = new ProcessBuilder(
                    pythonPath,
                    scriptFile.toString(),
                    Paths.get(csvPath).toAbsolutePath().normalize().toString()
            );

            pb.directory(workDirectory.toFile());
            pb.environment().put("INTERACTIVE_CLI_HITL", "true");
            pb.environment().put("PYTHONUNBUFFERED", "1");
            pb.environment().put("PYTHONIOENCODING", "utf-8");

            this.activeProcess = pb.start();
            this.processStdinWriter = new BufferedWriter(new OutputStreamWriter(activeProcess.getOutputStream(), StandardCharsets.UTF_8));

            // Concurrently monitor stdout (thoughts, actions, reports)
            Future<?> stdoutFuture = executorService.submit(() -> readStdout(activeProcess.getInputStream(), emitter, csvPath));

            // Concurrently monitor stderr (logs and HITL approval prompts)
            Future<?> stderrFuture = executorService.submit(() -> readStderr(activeProcess.getErrorStream(), emitter));

            int exitCode = activeProcess.waitFor();
            try {
                stdoutFuture.get(5, TimeUnit.SECONDS);
            } catch (Exception ignored) {}
            try {
                stderrFuture.get(5, TimeUnit.SECONDS);
            } catch (Exception ignored) {}

            sendSseEvent(emitter, "done", String.format("{\"exitCode\":%d,\"message\":\"Audit pipeline terminated.\"}", exitCode));
            emitter.complete();

        } catch (Exception ex) {
            log.error("Execution error in Antigravity agent process", ex);
            sendSseEvent(emitter, "error", String.format("{\"message\":\"%s\"}", ex.getMessage()));
            emitter.completeWithError(ex);
        } finally {
            cleanup();
        }
    }

    private void readStdout(InputStream inputStream, SseEmitter emitter, String csvPath) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            boolean capturingJson = false;
            StringBuilder jsonBuffer = new StringBuilder();

            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                // Detect Structured JSON report boundary
                if (trimmed.contains("FINAL AUDIT REPORT (STRUCTURED JSON)")) {
                    capturingJson = true;
                    jsonBuffer.setLength(0);
                    continue;
                }

                if (capturingJson) {
                    if (trimmed.startsWith("=")) continue;
                    jsonBuffer.append(line).append("\n");
                    try {
                        String potentialJson = jsonBuffer.toString().trim();
                        JsonNode root = objectMapper.readTree(potentialJson);

                        // Successfully parsed full JSON report
                        sendSseEvent(emitter, "report", potentialJson);
                        persistAuditToDatabase(root, csvPath);
                        capturingJson = false;
                    } catch (Exception ignored) {
                        // Accumulate chunks until complete JSON is parsed
                    }
                    continue;
                }

                if (trimmed.startsWith("[Agent Thought]")) {
                    String thought = trimmed.replace("[Agent Thought]", "").trim();
                    sendSseEvent(emitter, "thought", objectMapper.writeValueAsString(new ThoughtPayload(thought)));
                } else if (trimmed.startsWith("[Agent Action]")) {
                    String action = trimmed.replace("[Agent Action]", "").trim();
                    sendSseEvent(emitter, "action", objectMapper.writeValueAsString(new ActionPayload(action)));
                } else {
                    sendSseEvent(emitter, "log", objectMapper.writeValueAsString(new LogPayload(trimmed, "stdout")));
                }
            }
        } catch (IOException ex) {
            log.debug("Stdout closed or terminated: {}", ex.getMessage());
        }
    }

    private void readStderr(InputStream errorStream, SseEmitter emitter) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(errorStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                sendSseEvent(emitter, "log", objectMapper.writeValueAsString(new LogPayload(trimmed, "stderr")));

                // Intercept Human-in-the-Loop policy gate prompt
                if (HITL_PROMPT_PATTERN.matcher(trimmed).find()) {
                    isAwaitingApproval.set(true);
                    String payload = String.format("{\"message\":\"Agent detected bias and requests permission to apply algorithmic remediation.\",\"timestamp\":\"%s\"}", LocalDateTime.now());
                    sendSseEvent(emitter, "hitl_required", payload);
                }
            }
        } catch (IOException ex) {
            log.debug("Stderr closed or terminated: {}", ex.getMessage());
        }
    }

    /**
     * Resumes the paused agent by writing 'y' or 'n' into stdin.
     */
    public synchronized boolean sendApprovalDecision(boolean approved) {
        if (activeProcess == null || !activeProcess.isAlive() || !isAwaitingApproval.get()) {
            return false;
        }

        try {
            String decisionChar = approved ? "y\n" : "n\n";
            processStdinWriter.write(decisionChar);
            processStdinWriter.flush();
            isAwaitingApproval.set(false);

            if (currentEmitter != null) {
                sendSseEvent(currentEmitter, "hitl_resolved", String.format("{\"approved\":%b,\"timestamp\":\"%s\"}", approved, LocalDateTime.now()));
            }
            return true;
        } catch (IOException ex) {
            log.error("Failed to write HITL decision to Python stdin", ex);
            return false;
        }
    }

    public boolean isWaitingForUser() {
        return isAwaitingApproval.get();
    }

    private void persistAuditToDatabase(JsonNode reportNode, String csvPath) {
        try {
            String datasetName = reportNode.path("dataset_name").asText(Paths.get(csvPath).getFileName().toString());
            String targetCol = reportNode.path("target_column").asText("Unknown");
            String protectedAttr = reportNode.path("protected_attributes").isArray() && reportNode.path("protected_attributes").size() > 0 
                    ? reportNode.path("protected_attributes").get(0).asText() : "Demographic";
            boolean isBiased = reportNode.path("is_biased").asBoolean(true);
            String summary = reportNode.path("executive_summary").asText("");

            double initialDir = 1.0;
            double remediatedDir = 1.0;
            double spd = 0.0;

            JsonNode metrics = reportNode.path("metrics");
            if (metrics.isArray() && metrics.size() > 0) {
                for (JsonNode m : metrics) {
                    double dir = m.path("disparate_impact_ratio").asDouble(1.0);
                    if (dir < initialDir) initialDir = dir;

                    if (m.hasNonNull("remediated_selection_rate")) {
                        remediatedDir = Math.max(remediatedDir, m.path("remediated_selection_rate").asDouble());
                    }
                    spd = m.path("statistical_parity_diff").asDouble(0.0);
                }
            }

            String technique = reportNode.path("remediation").path("technique").asText("Sample Reweighting");
            boolean approved = reportNode.path("remediation").path("approved_by_user").asBoolean(false);

            AuditRecord record = new AuditRecord(
                    datasetName, targetCol, protectedAttr,
                    initialDir, remediatedDir, spd,
                    technique, approved, isBiased, summary
            );

            auditRecordRepository.save(record);
            log.info("Successfully persisted audit record for '{}' to MySQL database (ID: {})", datasetName, record.getId());
        } catch (Exception ex) {
            log.error("Failed to persist audit log into MySQL", ex);
        }
    }

    private void sendSseEvent(SseEmitter emitter, String eventName, String jsonData) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(jsonData));
        } catch (Exception ex) {
            log.debug("SSE send failed (client likely disconnected): {}", ex.getMessage());
        }
    }

    private synchronized void cleanup() {
        terminateActiveProcess();
        isAwaitingApproval.set(false);
        currentEmitter = null;
    }

    private void terminateActiveProcess() {
        if (activeProcess != null && activeProcess.isAlive()) {
            activeProcess.destroyForcibly();
            log.info("Terminated active Antigravity Python subprocess.");
        }
        activeProcess = null;
        processStdinWriter = null;
    }

    // Helper payload records for Jackson serialization
    private record ThoughtPayload(String thought) {}
    private record ActionPayload(String action) {}
    private record LogPayload(String text, String stream) {}
}
