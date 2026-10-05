import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Database,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { API_BASE_URL } from "../utils/apiConfig";

export interface HistoricalAuditRecord {
  id: number;
  datasetName: string;
  targetColumn?: string;
  protectedAttribute?: string;
  timestamp: string;
  initialDirScore: number;
  remediatedDirScore?: number | null;
  statisticalParityDiff?: number | null;
  techniqueUsed?: string;
  isApproved: boolean;
  isBiased: boolean;
  executiveSummary?: string;
}

export const HistoryTable = React.memo(() => {
  const [records, setRecords] = useState<HistoricalAuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      if (!response.ok) {
        throw new Error(`Failed to load audit vault: HTTP ${response.status}`);
      }
      const data = await response.json();
      setRecords(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to history API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredRecords = records.filter(
    (r) =>
      r.datasetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.techniqueUsed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.protectedAttribute?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAudits = records.length;
  const compliantAudits = records.filter(
    (r) => !r.isBiased || (r.remediatedDirScore != null && r.remediatedDirScore >= 0.8)
  ).length;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const renderDirBadge = (score: number | null | undefined, label: string) => {
    if (score == null) {
      return <span className="text-slate-500 font-mono text-xs">--</span>;
    }
    const isCompliant = score >= 0.8;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wider font-semibold font-mono ${
          isCompliant
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
        }`}
        title={`${label}: ${(score * 100).toFixed(1)}%`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isCompliant ? "bg-emerald-400" : "bg-rose-400 animate-ping"
          }`}
        />
        <span>{(score * 100).toFixed(1)}%</span>
      </span>
    );
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const rowVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Vault Summary Card (Ambient Glass Container) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-white/[0.04] border border-indigo-100 dark:border-white/[0.06] text-indigo-600 dark:text-white">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Enterprise Audit Vault
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                Immutable Records
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Persistent algorithmic governance and regulatory audit trail.
          </p>
        </div>

        {/* Stats & Action Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] text-xs font-mono">
            <div>
              <span className="text-slate-500">Total: </span>
              <span className="text-slate-800 dark:text-slate-100 font-bold">{totalAudits}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div>
              <span className="text-slate-500">Secured: </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{compliantAudits}</span>
            </div>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-medium shadow-md hover:scale-105 transition-all duration-200 active:scale-95 disabled:opacity-50"
            title="Refresh Vault"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-slate-400 dark:text-slate-700" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by dataset name, protected attribute, or mitigation technique..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] text-xs sm:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 dark:focus:border-white/20 transition-colors shadow-sm"
        />
      </div>

      {/* Main Frosted Glass Card Table Wrapper */}
      <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
        {loading && records.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 dark:text-slate-400 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Querying historical audits...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-rose-500 dark:text-rose-400 mx-auto" />
            <div className="text-sm font-semibold text-rose-600 dark:text-rose-300">{error}</div>
            <button
              onClick={fetchHistory}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
            >
              Retry Query
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchQuery ? "No matching audit records" : "Your enterprise audit vault is empty"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchQuery
                  ? "Try adjusting your search terms or clearing the filter."
                  : "Run an audit to secure your first dataset."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto terminal-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.05] bg-slate-50/60 dark:bg-white/[0.01] text-[11px] font-semibold tracking-wider text-slate-500 uppercase py-4 select-none sticky top-0">
                  <th className="py-4 pl-6 pr-4">Dataset Name</th>
                  <th className="py-4 px-4">Protected Attribute</th>
                  <th className="py-4 px-4 text-center">Initial DIR</th>
                  <th className="py-4 px-4 text-center">Remediated DIR</th>
                  <th className="py-4 px-4">Technique</th>
                  <th className="py-4 px-4 text-center">HITL Consent</th>
                  <th className="py-4 px-4">Timestamp</th>
                  <th className="py-4 pr-6 text-right">Details</th>
                </tr>
              </thead>

              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="divide-y divide-slate-100 dark:divide-white/[0.02]"
              >
                {filteredRecords.map((record) => {
                  const isExpanded = expandedId === record.id;
                  return (
                    <React.Fragment key={record.id}>
                      <motion.tr
                        variants={rowVariants}
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                        className={`border-b border-slate-100 dark:border-white/[0.02] hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors duration-200 text-sm cursor-pointer ${
                          isExpanded ? "bg-slate-50/90 dark:bg-white/[0.03]" : ""
                        }`}
                      >
                        {/* Dataset Name */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg ${
                                record.isBiased
                                  ? "bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {record.datasetName}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                Target: {record.targetColumn || "Outcome"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Protected Attribute */}
                        <td className="py-4 px-4 font-mono text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] text-[11px] text-slate-700 dark:text-slate-300">
                            {record.protectedAttribute || "Demographic"}
                          </span>
                        </td>

                        {/* Initial DIR */}
                        <td className="py-4 px-4 text-center">
                          {renderDirBadge(record.initialDirScore, "Baseline DIR")}
                        </td>

                        {/* Remediated DIR */}
                        <td className="py-4 px-4 text-center">
                          {renderDirBadge(record.remediatedDirScore, "Remediated DIR")}
                        </td>

                        {/* Technique */}
                        <td className="py-4 px-4">
                          <span className="text-slate-700 dark:text-slate-300 font-normal text-xs">
                            {record.techniqueUsed || "Sample Reweighting"}
                          </span>
                        </td>

                        {/* HITL Consent Status */}
                        <td className="py-4 px-4 text-center">
                          {record.isApproved ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.03] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.06]">
                              <XCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                              Dry Run
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            {formatDate(record.timestamp)}
                          </div>
                        </td>

                        {/* Details Toggle */}
                        <td className="py-4 pr-6 text-right text-slate-400 dark:text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 ml-auto text-slate-800 dark:text-white" />
                          ) : (
                            <ChevronRight className="w-4 h-4 ml-auto hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                          )}
                        </td>
                      </motion.tr>

                      {/* Expandable Executive Summary Drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0 bg-slate-50/50 dark:bg-white/[0.01] border-y border-slate-200 dark:border-white/[0.04]">
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="p-6 space-y-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-1 shadow-sm">
                                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                      Statistical Parity Diff
                                    </div>
                                    <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                                      {record.statisticalParityDiff != null
                                        ? `${(record.statisticalParityDiff * 100).toFixed(1)}%`
                                        : "0.0%"}
                                    </div>
                                  </div>

                                  <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-1 shadow-sm">
                                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                      Compliance Standard
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                      EEOC 29 C.F.R. § 1607 (4/5ths Rule)
                                    </div>
                                  </div>

                                  <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-1 shadow-sm">
                                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                      Record Reference
                                    </div>
                                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                      VAULT-AUDIT-00{record.id}
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-1 shadow-sm">
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-white" />
                                    Executive Diagnostic Summary
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {record.executiveSummary ||
                                      "Automated fairness audit completed. Initial disparate impact violation mitigated via sandboxed pre-processing remediation."}
                                  </p>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

HistoryTable.displayName = "HistoryTable";
