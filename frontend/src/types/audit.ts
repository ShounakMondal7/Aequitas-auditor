export interface MetricBreakdown {
  demographic_group: string;
  baseline_selection_rate: number;
  remediated_selection_rate?: number | null;
  disparate_impact_ratio: number;
  statistical_parity_diff: number;
}

export interface RemediationProposal {
  technique: string;
  justification: string;
  code_snippet: string;
  approved_by_user: boolean;
}

export interface FairnessAuditReport {
  dataset_name: string;
  target_column: string;
  protected_attributes: string[];
  is_biased: boolean;
  benchmarks_consulted: string[];
  metrics: MetricBreakdown[];
  remediation?: RemediationProposal | null;
  executive_summary: string;
}

export interface HITLRequest {
  message: string;
  timestamp: string;
}
