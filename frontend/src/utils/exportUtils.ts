export const downloadAuditCertificate = (report: any, auditorName: string) => {
  if (!report) return;

  const certificate = {
    metadata: {
      certificateId: `AEQ-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      auditor: auditorName || 'Guest Auditor',
      platform: "Aequitas AI Fairness Auditor",
    },
    target: {
      dataset: report.datasetName,
      totalRowsAnalyzed: report.totalRows,
      protectedAttribute: report.protectedAttribute,
    },
    metrics: {
      privilegedGroup: report.privilegedGroup,
      unprivilegedGroup: report.unprivilegedGroup,
      disparateImpactRatio: report.disparateImpactRatio,
      fairnessScore: report.score,
    },
    compliance: {
      regulatoryFramework: "EEOC Uniform Guidelines (4/5ths Rule)",
      thresholdApplied: "0.80",
      status: report.isBiased ? "FAILED_REQUIRES_REMEDIATION" : "PASSED_COMPLIANT"
    }
  };

  const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `Aequitas_Audit_${certificate.metadata.certificateId}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
