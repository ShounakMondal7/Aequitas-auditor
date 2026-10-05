import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, Lock } from "lucide-react";
import { HITLRequest } from "../types/audit";

interface HumanApprovalModalProps {
  isOpen: boolean;
  hitlRequest: HITLRequest | null;
  onDecision: (approved: boolean) => Promise<void>;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  isOpen,
  hitlRequest,
  onDecision,
}) => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDecision = async (approved: boolean) => {
    setSubmitting(true);
    try {
      await onDecision(approved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-2 border-rose-500/50 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="bg-rose-50 dark:bg-rose-950/40 px-6 py-4 border-b border-rose-200 dark:border-rose-500/30 flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Human-in-the-Loop Policy Gate
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 font-mono">
              Google Antigravity SDK • ask_user Policy Triggered
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-950 dark:text-amber-100">Agent Proposed Action:</span>{" "}
              The agent has detected an algorithmic bias violation (Disparate Impact &lt; 0.80) and proposes executing a Python data remediation script to re-balance demographic selection rates.
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 mr-1.5 text-rose-500 dark:text-rose-400" />
              Safety Check Details
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gate Rule:</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">ask_user("run_command")</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Target Sandbox:</span>
                <span className="text-slate-800 dark:text-slate-200">engine/sandbox/</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Prompt:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {hitlRequest?.message || "Approve agent data remediation script?"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-100/80 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400">
            <p className="leading-relaxed">
              Under strict enterprise compliance, autonomous data mutations (synthetic oversampling or sample re-weighting) require affirmative human operator consent before code execution.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 dark:bg-slate-950/60 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleDecision(false)}
            className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-red-500/40 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 font-medium text-sm transition-all duration-150 flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-500 dark:text-red-400" />
            Deny Fix
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleDecision(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 dark:shadow-emerald-900/40 transition-all duration-150 flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? "Approving..." : "Approve Fix & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};
