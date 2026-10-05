import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  CheckCircle2,
  AlertOctagon,
  Scale,
  TrendingUp,
  FileText,
  Sliders,
  Sparkles,
} from "lucide-react";
import { FairnessAuditReport } from "../types/audit";
import { useTheme } from "../context/ThemeContext";

interface BiasChartsProps {
  report: FairnessAuditReport;
}

export const BiasCharts = React.memo<BiasChartsProps>(({ report }) => {
  const { isDark } = useTheme();

  // Prepare data for the BarChart (convert decimal rates to percentages)
  const chartData = report.metrics.map((m) => ({
    group: m.demographic_group,
    "Baseline Rate (%)": Number((m.baseline_selection_rate * 100).toFixed(1)),
    "Remediated Rate (%)":
      m.remediated_selection_rate != null
        ? Number((m.remediated_selection_rate * 100).toFixed(1))
        : null,
    dir: m.disparate_impact_ratio,
    spd: m.statistical_parity_diff,
  }));

  // Find minimum Disparate Impact Ratio across unprivileged groups
  const minDIR = Math.min(...report.metrics.map((m) => m.disparate_impact_ratio));
  const isDIRCompliant = minDIR >= 0.8;

  // Find minimum Statistical Parity Difference
  const minSPD = Math.min(...report.metrics.map((m) => m.statistical_parity_diff));

  return (
    <div className="w-full space-y-6">
      {/* Top Banner: Compliance Status */}
      <div
        className={`p-6 rounded-2xl border backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          report.is_biased
            ? "bg-rose-500/10 dark:bg-rose-500/[0.03] border-rose-500/20 text-rose-950 dark:text-rose-200"
            : "bg-emerald-500/10 dark:bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-950 dark:text-emerald-200"
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`p-3 rounded-2xl ${
              report.is_biased
                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {report.is_biased ? (
              <AlertOctagon className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06] text-slate-700 dark:text-slate-300">
                Audit Result
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {report.dataset_name} • Target: {report.target_column}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {report.is_biased
                ? "Algorithmic Bias Detected (EEOC 4/5ths Rule Violated)"
                : "Demographic Fairness Benchmarks Satisfied"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400">Protected:</span>
          {report.protected_attributes.map((attr) => (
            <span
              key={attr}
              className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]"
            >
              {attr}
            </span>
          ))}
        </div>
      </div>

      {/* KPI Cards Row (Frosted Glass Aesthetic: bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl p-6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Disparate Impact Ratio */}
        <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              Disparate Impact Ratio
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">EEOC: &ge; 0.80</span>
          </div>
          <div className="my-4">
            <div
              className={`text-3xl font-extrabold font-mono ${
                isDIRCompliant ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {(minDIR * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Metric Value: <span className="font-mono text-slate-800 dark:text-slate-200">{minDIR.toFixed(3)}</span>
            </div>
          </div>
          <div>
            {isDIRCompliant ? (
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full px-3 py-1 text-xs font-medium inline-block">
                Passes 4/5ths Rule (&ge; 80%)
              </span>
            ) : (
              <span className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full px-3 py-1 text-xs font-medium inline-block">
                Adverse Impact Detected (&lt; 80%)
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Statistical Parity Difference */}
        <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Statistical Parity Diff
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Goal: [-0.10, +0.10]</span>
          </div>
          <div className="my-4">
            <div
              className={`text-3xl font-extrabold font-mono ${
                Math.abs(minSPD) <= 0.1 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {(minSPD * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Differential: <span className="font-mono text-slate-800 dark:text-slate-200">{minSPD.toFixed(3)}</span>
            </div>
          </div>
          <div>
            {Math.abs(minSPD) <= 0.1 ? (
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full px-3 py-1 text-xs font-medium inline-block">
                Parity Within Tolerance
              </span>
            ) : (
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full px-3 py-1 text-xs font-medium inline-block">
                Disparity Exceeds Boundary
              </span>
            )}
          </div>
        </div>

        {/* Card 3: RAG Benchmark Sources */}
        <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl p-6 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              RAG Standards Consulted
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Vector Store</span>
          </div>
          <div className="my-3 space-y-1.5">
            {report.benchmarks_consulted.length > 0 ? (
              report.benchmarks_consulted.map((b, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.03] p-2 rounded-lg border border-slate-200/80 dark:border-white/[0.05] flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                  <span className="truncate">{b}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">EEOC 4/5ths Rule Guidelines</div>
            )}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            Retrieved via ChromaDB Local Collection
          </div>
        </div>
      </div>

      {/* Main Visualization: Before vs After Recharts Bar Chart */}
      <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/[0.05] pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Demographic Selection Rates: Before vs. After Remediation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison of baseline favorable outcome rates against post-remediation balanced rates
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="text-slate-700 dark:text-slate-300">Baseline Rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-700 dark:text-slate-300">Remediated Rate</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} />
              <XAxis dataKey="group" stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fill: isDark ? "#cbd5e1" : "#334155" }} />
              <YAxis
                unit="%"
                stroke={isDark ? "#94a3b8" : "#64748b"}
                tick={{ fill: isDark ? "#cbd5e1" : "#334155" }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#090d16" : "#ffffff",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                  borderRadius: "0.75rem",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              {/* EEOC 80% reference guide */}
              <ReferenceLine
                y={80}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: "80% Four-Fifths Reference",
                  fill: "#f59e0b",
                  fontSize: 11,
                  position: "top",
                }}
              />
              <Bar dataKey="Baseline Rate (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Remediated Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Remediation Details & Executive Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Remediation Proposal Card */}
        {report.remediation && (
          <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Algorithmic Remediation Applied
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  report.remediation.approved_by_user
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {report.remediation.approved_by_user ? "HITL Approved" : "Dry Run Only"}
              </span>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-200">
                {report.remediation.technique}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {report.remediation.justification}
              </p>
            </div>

            {report.remediation.code_snippet && (
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Generated Python Fix Code:
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto terminal-scroll max-h-40">
                  {report.remediation.code_snippet}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Executive Summary Card */}
        <div
          className={`bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl p-6 flex flex-col justify-between ${
            !report.remediation ? "lg:col-span-2" : ""
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Executive Diagnostic Summary</span>
          </div>

          <div className="my-3 p-4 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            {report.executive_summary}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-white/[0.04]">
            <span>Audit Standard: EEOC 29 C.F.R. § 1607</span>
            <span>Structured Output via Antigravity SDK</span>
          </div>
        </div>
      </div>
    </div>
  );
});

BiasCharts.displayName = "BiasCharts";
