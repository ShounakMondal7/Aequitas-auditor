import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { downloadAuditCertificate } from '../utils/exportUtils';
import { useActivity } from '../context/UserActivityContext';
import { FairnessReport } from '../utils/fairnessMetrics';

interface FairnessChartsProps {
  report: FairnessReport | null;
  isDark: boolean;
}

export const FairnessCharts: React.FC<FairnessChartsProps> = ({ report, isDark }) => {
  const { t } = useTranslation();
  const { logs, logAction } = useActivity();

  // Find the most recent login to get the current user's name, fallback to Guest
  const currentUser = logs.find((log) => log.action === 'USER_AUTHENTICATED')?.user || 'Guest';

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-sm text-slate-500 dark:text-slate-400 space-y-2 select-none">
        <p className="max-w-md font-medium leading-relaxed">
          {t('charts.empty_msg', 'No data loaded. Upload a CSV or select a repository dataset to visualize fairness metrics.')}
        </p>
      </div>
    );
  }

  const handleExport = () => {
    downloadAuditCertificate(report, currentUser);
    logAction('EXPORT_CERTIFICATE', { dataset: report.datasetName, score: report.score });
  };

  // Data mapping for Recharts
  const selectionData = [
    {
      group: report.privilegedGroup ? report.privilegedGroup.split(' ')[0] : t('charts.privileged', 'Privileged'),
      rate: report.privilegedSelectionRate != null ? parseFloat((report.privilegedSelectionRate * 100).toFixed(1)) : 0,
      type: 'Privileged',
    },
    {
      group: report.unprivilegedGroup ? report.unprivilegedGroup.split(' ')[0] : t('charts.unprivileged', 'Unprivileged'),
      rate: report.unprivilegedSelectionRate != null ? parseFloat((report.unprivilegedSelectionRate * 100).toFixed(1)) : 0,
      type: 'Unprivileged',
    },
  ];

  const textColor = isDark ? '#cbd5e1' : '#475569';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div id="fairness-charts-container" className="flex flex-col space-y-5 animate-fade-in p-4">
      {/* Action Header */}
      <div className="flex justify-between items-center w-full pb-2 border-b border-black/10 dark:border-white/10">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('charts.evaluation_results', 'Evaluation Results:')}{' '}
            <span className="text-teal-600 dark:text-teal-400 font-mono">{report.datasetName}</span>
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {report.appliedLaw} • {report.totalRows.toLocaleString()} rows audited
          </span>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center space-x-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950 text-xs font-semibold rounded-lg transition-colors shadow-md shadow-teal-600/20 cursor-pointer active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{t('charts.export_certificate', 'Export Certificate')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
        {/* Demographic Parity Bar Chart */}
        <div className="bg-slate-100/80 dark:bg-black/40 rounded-xl p-4 border border-slate-200 dark:border-white/5">
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
            {t('charts.demographic_selection_rates', 'Demographic Selection Rates')}
          </h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="group" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e1b4b' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    color: isDark ? '#fff' : '#000',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="rate" maxBarSize={50} radius={[4, 4, 0, 0]}>
                  {selectionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === 'Privileged' ? '#2dd4bf' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-teal-400"></div> {t('charts.privileged', 'Privileged')}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div> {t('charts.unprivileged', 'Unprivileged')}
            </span>
          </div>
        </div>

        {/* Disparate Impact Ratio Chart */}
        <div className="bg-slate-100/80 dark:bg-black/40 rounded-xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-center items-center relative">
          <h4 className="absolute top-4 left-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {t('charts.disparate_impact_title', 'Disparate Impact (4/5ths Rule)')}
          </h4>

          <div className="relative flex items-center justify-center mt-6">
            {/* Custom SVG Gauge representation */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke={gridColor} strokeWidth="12" fill="none" />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={report.isBiased ? '#f43f5e' : '#10b981'}
                strokeWidth="12"
                fill="none"
                strokeDasharray="351.8"
                strokeDashoffset={351.8 - (351.8 * Math.min(100, Math.max(0, report.score || 0))) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${report.isBiased ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {report.score ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">/ 100</span>
            </div>
          </div>
          <p className="text-xs text-center mt-4 text-slate-600 dark:text-slate-400 max-w-[220px]">
            {t('charts.ratio', 'Ratio:')} <strong className="text-slate-900 dark:text-slate-200">{report.disparateImpactRatio} DP</strong>
            <br />
            {report.isBiased
              ? t('charts.requires_remediation', 'Requires remediation to meet legal parity threshold.')
              : t('charts.meets_compliance', 'Meets demographic parity compliance thresholds.')}
          </p>
        </div>
      </div>

      {/* Intersectional Subgroup Matrix & Warning Badges */}
      {report.intersectionalMetrics && (
        <div className="bg-slate-100/80 dark:bg-black/40 rounded-xl p-4 border border-slate-200 dark:border-white/5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-black/10 dark:border-white/10">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-mono text-[10px] font-bold">
                  INTERSECTIONAL MATRIX
                </span>
                <span>
                  Compound Disparate Impact ({report.intersectionalMetrics.pair[0]} × {report.intersectionalMetrics.pair[1]})
                </span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Audited against reference benchmark <strong className="text-slate-900 dark:text-slate-200 font-mono">{report.intersectionalMetrics.privilegedSubgroup} ({report.intersectionalMetrics.privilegedRate}%)</strong>.
              </p>
            </div>
            {report.intersectionalMetrics.severeBiasedCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 shrink-0 flex items-center gap-1.5 animate-pulse">
                <span>⚠️</span>
                <span>{report.intersectionalMetrics.severeBiasedCount} Severe Disparity Clusters</span>
              </span>
            )}
          </div>

          {/* Subgroup Heatmap & Warning Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.intersectionalMetrics.subgroups.map((sub, idx) => {
              const isSevere = sub.severity === "severe";
              const isModerate = sub.severity === "moderate";
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 shadow-sm ${
                    isSevere
                      ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/30 text-rose-950 dark:text-rose-100"
                      : isModerate
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-100"
                      : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-xs tracking-tight">
                      {sub.subgroup}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 shadow-sm ${
                        isSevere
                          ? "bg-rose-600 text-white dark:bg-rose-500/50"
                          : isModerate
                          ? "bg-amber-600 text-white dark:bg-amber-500/40 dark:text-amber-100"
                          : "bg-emerald-600 text-white dark:bg-emerald-500/40"
                      }`}
                    >
                      {sub.disparateImpactRatio.toFixed(2)} DP
                    </span>
                  </div>

                  {sub.warningText ? (
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-black/30 border border-current/15 text-[11px] leading-tight font-medium">
                      {sub.warningText}
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-black/30 border border-current/15 text-[11px] leading-tight font-medium text-emerald-700 dark:text-emerald-300">
                      ✓ Parity compliant ({sub.selectionRate}% selection rate)
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 pt-1 border-t border-black/10 dark:border-white/10">
                    <span>{sub.total} records</span>
                    <span>Rate: {sub.selectionRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FairnessCharts;
