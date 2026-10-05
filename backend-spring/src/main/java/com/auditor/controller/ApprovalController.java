package com.auditor.controller;

import com.auditor.dto.ApprovalRequestDto;
import com.auditor.service.AgentBridgeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/approval")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"}, allowCredentials = "true")
public class ApprovalController {

    private static final Logger log = LoggerFactory.getLogger(ApprovalController.class);

    private final AgentBridgeService agentBridgeService;

    @Autowired
    public ApprovalController(AgentBridgeService agentBridgeService) {
        this.agentBridgeService = agentBridgeService;
    }

    /**
     * POST /api/approval
     * Resolves the Human-in-the-Loop policy gate by writing "y" or "n"
     * into the active Python agent process's standard input.
     */
    @PostMapping
    public ResponseEntity<?> submitApprovalDecision(@RequestBody ApprovalRequestDto requestDto) {
        if (requestDto == null || requestDto.getApproved() == null) {
            log.warn("POST /api/approval rejected null or malformed approval payload");
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid request body. Expected format: {\"approved\": boolean}"
            ));
        }

        if (!agentBridgeService.isWaitingForUser()) {
            log.warn("POST /api/approval received when no agent process was awaiting user decision");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "No agent execution is currently awaiting human-in-the-loop approval."
            ));
        }

        boolean approved = requestDto.isApproved();
        boolean success = agentBridgeService.sendApprovalDecision(approved);

        if (success) {
            log.info("HITL approval gate resolved successfully: operator decided -> {}", approved ? "APPROVED" : "REJECTED");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "decision", approved ? "approved" : "rejected",
                    "message", "Remediation action " + (approved ? "approved." : "rejected.")
            ));
        } else {
            log.error("Failed to write approval token to active agent process stdin");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to deliver decision token to the Antigravity agent process."
            ));
        }
    }

    /**
     * GET /api/approval/status
     * Queries whether an active agent loop is currently blocked on the ask_user policy hook.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getApprovalStatus() {
        return ResponseEntity.ok(Map.of(
                "isWaitingForUser", agentBridgeService.isWaitingForUser()
        ));
    }
}
