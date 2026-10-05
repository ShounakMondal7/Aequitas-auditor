package com.auditor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_records", indexes = {
    @Index(name = "idx_dataset_name", columnList = "dataset_name"),
    @Index(name = "idx_timestamp", columnList = "timestamp")
})
public class AuditRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dataset_name", nullable = false)
    private String datasetName;

    @Column(name = "target_column")
    private String targetColumn;

    @Column(name = "protected_attribute")
    private String protectedAttribute;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "initial_dir_score", nullable = false)
    private Double initialDirScore;

    @Column(name = "remediated_dir_score")
    private Double remediatedDirScore;

    @Column(name = "statistical_parity_diff")
    private Double statisticalParityDiff;

    @Column(name = "technique_used")
    private String techniqueUsed;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "is_biased", nullable = false)
    private Boolean isBiased = false;

    @Lob
    @Column(name = "executive_summary", columnDefinition = "TEXT")
    private String executiveSummary;

    public AuditRecord() {}

    public AuditRecord(String datasetName, String targetColumn, String protectedAttribute,
                       Double initialDirScore, Double remediatedDirScore, Double statisticalParityDiff,
                       String techniqueUsed, Boolean isApproved, Boolean isBiased, String executiveSummary) {
        this.datasetName = datasetName;
        this.targetColumn = targetColumn;
        this.protectedAttribute = protectedAttribute;
        this.timestamp = LocalDateTime.now();
        this.initialDirScore = initialDirScore;
        this.remediatedDirScore = remediatedDirScore;
        this.statisticalParityDiff = statisticalParityDiff;
        this.techniqueUsed = techniqueUsed;
        this.isApproved = isApproved;
        this.isBiased = isBiased;
        this.executiveSummary = executiveSummary;
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDatasetName() { return datasetName; }
    public void setDatasetName(String datasetName) { this.datasetName = datasetName; }

    public String getTargetColumn() { return targetColumn; }
    public void setTargetColumn(String targetColumn) { this.targetColumn = targetColumn; }

    public String getProtectedAttribute() { return protectedAttribute; }
    public void setProtectedAttribute(String protectedAttribute) { this.protectedAttribute = protectedAttribute; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Double getInitialDirScore() { return initialDirScore; }
    public void setInitialDirScore(Double initialDirScore) { this.initialDirScore = initialDirScore; }

    public Double getRemediatedDirScore() { return remediatedDirScore; }
    public void setRemediatedDirScore(Double remediatedDirScore) { this.remediatedDirScore = remediatedDirScore; }

    public Double getStatisticalParityDiff() { return statisticalParityDiff; }
    public void setStatisticalParityDiff(Double statisticalParityDiff) { this.statisticalParityDiff = statisticalParityDiff; }

    public String getTechniqueUsed() { return techniqueUsed; }
    public void setTechniqueUsed(String techniqueUsed) { this.techniqueUsed = techniqueUsed; }

    public Boolean getIsApproved() { return isApproved; }
    public void setIsApproved(Boolean approved) { isApproved = approved; }

    public Boolean getIsBiased() { return isBiased; }
    public void setIsBiased(Boolean biased) { isBiased = biased; }

    public String getExecutiveSummary() { return executiveSummary; }
    public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
}
