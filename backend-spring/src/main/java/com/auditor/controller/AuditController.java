package com.auditor.controller;

import com.auditor.service.AgentBridgeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = { "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:3000" }, allowCredentials = "true")
public class AuditController {

    private static final Logger log = LoggerFactory.getLogger(AuditController.class);
    private static final Path UPLOADS_DIR = Paths.get("uploads").toAbsolutePath().normalize();

    private final AgentBridgeService agentBridgeService;

    @Autowired
    public AuditController(AgentBridgeService agentBridgeService) {
        this.agentBridgeService = agentBridgeService;
        try {
            if (!Files.exists(UPLOADS_DIR)) {
                Files.createDirectories(UPLOADS_DIR);
            }
        } catch (IOException e) {
            log.error("Failed to initialize uploads staging directory", e);
        }
    }

    /**
     * POST /api/audit
     * Accepts a CSV dataset upload and establishes a real-time Server-Sent Events
     * (SSE)
     * stream connecting the React frontend directly to the Antigravity Agent
     * process.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SseEmitter> triggerAudit(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "dataset", required = false) MultipartFile dataset) {

        MultipartFile targetUpload = (file != null && !file.isEmpty()) ? file : dataset;

        if (targetUpload == null || targetUpload.isEmpty()) {
            log.warn("POST /api/audit received empty file payload");
            return ResponseEntity.badRequest().build();
        }

        String originalFilename = targetUpload.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".csv")) {
            log.warn("POST /api/audit rejected non-CSV file: {}", originalFilename);
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).build();
        }

        try {
            // Sanitize filename and save to local uploads directory
            String sanitizedName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedFileName = System.currentTimeMillis() + "-" + sanitizedName;
            Path destinationPath = UPLOADS_DIR.resolve(storedFileName);

            Files.copy(targetUpload.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved incoming audit dataset to: {}", destinationPath);

            // Delegate stream and sub-process lifecycle to the AgentBridgeService
            SseEmitter emitter = agentBridgeService.startAudit(destinationPath.toString());
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_EVENT_STREAM)
                    .body(emitter);

        } catch (IOException ex) {
            log.error("File I/O error staging dataset for audit", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception ex) {
            log.error("Unexpected error initializing audit pipeline", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
