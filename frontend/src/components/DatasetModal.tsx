import React from "react";
import { Database, Play, X, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ENTERPRISE_REPOSITORY_DATASETS, EnterpriseDatasetMeta } from "../utils/sampleData";

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (name: string, rows: Record<string, any>[]) => void;
}

export const DatasetModal: React.FC<DatasetModalProps> = ({
  isOpen,
  onClose,
  onSelectDataset,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-white/95 dark:bg-[#0c1022]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-sans select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {t("modals.datasets_title", "Enterprise Datasets Vault")}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  Cloud Repository
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("modals.datasets_desc", "Select an enterprise dataset to initialize autonomous fairness auditing:")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dataset Repository List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto terminal-scroll pr-1">
          {ENTERPRISE_REPOSITORY_DATASETS.map((ds: EnterpriseDatasetMeta) => (
            <div
              key={ds.id}
              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-500/50 hover:bg-white dark:hover:bg-white/[0.05] transition-all group shadow-sm"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30 transition-colors shrink-0 mt-0.5">
                  <Database className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {ds.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ds.biasRisk === "High"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30"
                      }`}
                    >
                      {ds.biasRisk === "High" ? "High Disparity Risk" : "Moderate Risk"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ds.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{ds.rowCount}</span>
                    <span>•</span>
                    <span>
                      Protected Attribute:{" "}
                      <strong className="text-teal-700 dark:text-teal-300">{ds.protectedAttribute}</strong>
                    </span>
                    <span>•</span>
                    <span>Target: <code className="text-slate-600 dark:text-slate-300 font-semibold">{ds.targetColumn}</code></span>
                  </div>
                </div>
              </div>

              {/* Prominent "Run Audit" Action Button */}
              <button
                type="button"
                onClick={() => {
                  onSelectDataset(ds.name, ds.data);
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Audit</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            Runs comprehensive statistical parity and EEOC 4/5ths analysis.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer font-medium"
          >
            {t("modal.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetModal;
