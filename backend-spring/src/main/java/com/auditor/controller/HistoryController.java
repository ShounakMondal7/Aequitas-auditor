package com.auditor.controller;

import com.auditor.entity.AuditRecord;
import com.auditor.repository.AuditRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"}, allowCredentials = "true")
public class HistoryController {

    private static final Logger log = LoggerFactory.getLogger(HistoryController.class);

    private final AuditRecordRepository auditRecordRepository;

    @Autowired
    public HistoryController(AuditRecordRepository auditRecordRepository) {
        this.auditRecordRepository = auditRecordRepository;
    }

    /**
     * GET /api/history
     * Retrieves all historical AI fairness audit records persisted in MySQL,
     * ordered by timestamp descending for analytics and historical tracking.
     */
    @GetMapping
    public ResponseEntity<List<AuditRecord>> getAuditHistory() {
        try {
            List<AuditRecord> records = auditRecordRepository.findAllByOrderByTimestampDesc();
            log.info("GET /api/history returned {} persisted audit records", records.size());
            return ResponseEntity.ok(records);
        } catch (Exception ex) {
            log.error("Failed to query historical audits from MySQL", ex);
            return ResponseEntity.internalServerError().build();
        }
    }
}
