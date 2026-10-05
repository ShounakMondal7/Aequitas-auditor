"""
Pydantic Schema definitions for the Autonomous AI Fairness & Bias Auditor.
Ensures strict structured output for direct consumption by React/Recharts frontend.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class MetricBreakdown(BaseModel):
    demographic_group: str = Field(description="Sensitive attribute category (e.g., 'Female', 'Minority')")
    baseline_selection_rate: float = Field(description="Selection/positive outcome rate before remediation")
    remediated_selection_rate: Optional[float] = Field(None, description="Selection rate after remediation")
    disparate_impact_ratio: float = Field(description="Selection rate compared to privileged group (EEOC 80% rule)")
    statistical_parity_diff: float = Field(description="Difference in probability of favorable outcome")


class RemediationProposal(BaseModel):
    technique: str = Field(description="Proposed mitigation (e.g., 'Kamiran-Calders Reweighting', 'Synthetic Oversampling')")
    justification: str = Field(description="Why this technique was chosen based on RAG benchmarks")
    code_snippet: str = Field(description="Python snippet prepared by agent to execute in sandbox")
    approved_by_user: bool = Field(default=False, description="Whether human-in-the-loop approved execution")


class FairnessAuditReport(BaseModel):
    dataset_name: str
    target_column: str
    protected_attributes: List[str]
    is_biased: bool = Field(description="True if Disparate Impact Ratio < 0.80 or Statistical Parity violated")
    benchmarks_consulted: List[str] = Field(description="References retrieved from local RAG vector store")
    metrics: List[MetricBreakdown] = Field(description="Detailed per-group fairness metrics for charting")
    remediation: Optional[RemediationProposal] = Field(None, description="Action taken or proposed to remediate bias")
    executive_summary: str = Field(description="High-level diagnostic summary for non-technical stakeholders")
