CREATE DATABASE IF NOT EXISTS fairness_auditor_db
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE fairness_auditor_db;

CREATE TABLE IF NOT EXISTS audit_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    target_column VARCHAR(100),
    protected_attribute VARCHAR(100),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    initial_dir_score DOUBLE NOT NULL,
    remediated_dir_score DOUBLE,
    statistical_parity_diff DOUBLE,
    technique_used VARCHAR(255),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_biased BOOLEAN NOT NULL DEFAULT FALSE,
    executive_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
