"""
Autonomous AI Fairness & Bias Auditor - Agent Engine
Powered by Google Antigravity SDK (`google-antigravity`).
"""

import asyncio
import json
import os
import sys
from typing import Any, Dict, List, Optional

# Ensure UTF-8 output encoding for cross-platform terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from google.antigravity import Agent, CapabilitiesConfig, LocalAgentConfig
from google.antigravity.hooks.policy import allow, ask_user, deny

from schemas.audit_schema import FairnessAuditReport, MetricBreakdown, RemediationProposal
from rag.vector_store import get_rag_context


# =====================================================================
# Human-in-the-Loop (HITL) Policy Hook (`ask_user`)
# =====================================================================

async def hitl_approval_handler(tool_call: Any) -> bool:
    """
    Policy hook triggered before the agent executes high-impact operations
    such as running shell commands or modifying files.
    
    When integrated with the Express API gateway, this hook suspends the
    agent execution loop and emits a WebSocket/SSE event to the React frontend.
    For local smoke tests, it defaults to interactive CLI confirmation.
    """
    tool_name = getattr(tool_call, "name", "unknown")
    args = getattr(tool_call, "args", {})

    print("\n" + "=" * 65, file=sys.stderr)
    print("[HITL SAFETY GATE] AGENT PROPOSES SENSITIVE ACTION", file=sys.stderr)
    print(f"Tool to Execute: {tool_name}", file=sys.stderr)
    print(f"Proposed Arguments:\n{json.dumps(args, indent=2)}", file=sys.stderr)
    print("=" * 65, file=sys.stderr)

    interactive_mode = os.getenv("INTERACTIVE_CLI_HITL", "true").lower() == "true"
    if interactive_mode:
        loop = asyncio.get_event_loop()
        decision = await loop.run_in_executor(
            None,
            lambda: input("\nApprove agent data remediation script? [y/N]: ").strip().lower()
        )
        approved = decision in ("y", "yes")
        print(f"[HITL] User Decision: {'APPROVED' if approved else 'REJECTED'}\n", file=sys.stderr)
        return approved

    # In server mode without user response, default to deny for safety
    return False


# =====================================================================
# Agent Configuration Factory
# =====================================================================

def build_auditor_agent_config(csv_path: str, rag_context: str) -> LocalAgentConfig:
    """
    Constructs a LocalAgentConfig with:
    - Terminal tools and File I/O access
    - Declarative policy rules with HITL gate for `run_command`
    - Strict Pydantic response schema matching React frontend
    """
    system_prompt = f"""
You are the Autonomous AI Fairness & Bias Auditor.
You audit tabular datasets for demographic disparities, algorithmic bias, and regulatory non-compliance.

Target Dataset File: {csv_path}

Regulatory & Fairness Benchmarks Retrieved from Vector Store:
\"\"\"
{rag_context}
\"\"\"

Execution Protocol:
1. Examine the dataset structure using `view_file` or running a lightweight analysis script with `run_command`.
2. Calculate key algorithmic fairness metrics:
   - Disparate Impact Ratio (DIR = Selection Rate of unprivileged group / Selection Rate of privileged group).
     Benchmark: EEOC 4/5ths Rule requires DIR >= 0.80.
   - Statistical Parity Difference (SPD = Rate_unpriv - Rate_priv).
     Benchmark: Range between -0.10 and +0.10.
3. If DIR < 0.80:
   - Formulate a data remediation plan based on the retrieved benchmarks (e.g., Kamiran-Calders sample reweighting or targeted oversampling).
   - Write and execute the remediation script in the sandbox using `create_file` and `run_command`.
     Note: Any `run_command` execution will be intercepted by the Human-in-the-Loop safety gate.
4. Calculate remediated metrics post-execution and assemble the final `FairnessAuditReport`.
"""

    policies = [
        deny("*"),
        allow("view_file"),
        allow("list_directory"),
        allow("create_file"),
        ask_user("run_command", handler=hitl_approval_handler),
    ]

    return LocalAgentConfig(
        system_instructions=system_prompt,
        capabilities=CapabilitiesConfig(),
        policies=policies,
        response_schema=FairnessAuditReport,
    )


# =====================================================================
# Main Audit Orchestration Pipeline
# =====================================================================

async def run_audit(csv_path: str) -> FairnessAuditReport:
    """Orchestrates RAG retrieval, agent instantiation, and structured report synthesis."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Target dataset not found: {csv_path}")

    # Step 1: Query local vector store for relevant ethics & legal guidelines
    print(f"[*] Querying ChromaDB for fairness benchmarks relevant to '{os.path.basename(csv_path)}'...")
    rag_context = get_rag_context("EEOC 4/5ths rule for credit lending and disparate impact remediation", n_results=2)
    print("[*] Retrieved regulatory benchmarks successfully.")

    # Step 2: Instantiate Antigravity Agent
    config = build_auditor_agent_config(csv_path, rag_context)

    print("[*] Initializing Google Antigravity Agent with LocalAgentConfig...")
    async with Agent(config) as agent:
        prompt = (
            f"Please conduct an autonomous fairness audit of the dataset at '{csv_path}'. "
            "1. Identify the protected attribute and target outcome column. "
            "2. Audit for Disparate Impact violation against the EEOC 4/5ths benchmark. "
            "3. If biased, propose and execute an algorithmic remediation script. "
            "4. Return the structured audit findings."
        )

        response = await agent.chat(prompt)

        # Stream reasoning tokens in real-time
        async for thought in response.thoughts:
            print(f"[Agent Thought] {thought}")

        # Stream tool executions
        async for tool_call in response.tool_calls:
            print(f"[Agent Action] Executing: {tool_call.name}")

        # Extract strictly typed response validated against Pydantic schema
        report: FairnessAuditReport = await response.structured_output()
        return report


if __name__ == "__main__":
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        target_csv = os.path.abspath(sys.argv[1])
    else:
        target_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sandbox", "sample_credit_data.csv")

    print(f"[*] Starting Local Smoke Test on: {target_csv}\n")
    report = asyncio.run(run_audit(target_csv))
    print("\n" + "=" * 65)
    print("FINAL AUDIT REPORT (STRUCTURED JSON)")
    print("=" * 65)
    print(report.model_dump_json(indent=2))
