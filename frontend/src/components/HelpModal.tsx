import React from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Terminal, ShieldAlert, Sliders, FileCheck2 } from 'lucide-react';

export const HelpModal: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      num: 1,
      icon: UploadCloud,
      title: t('help.step1_title', 'Upload Dataset:'),
      desc: t(
        'help.step1_desc',
        'Drag and drop your tabular data (CSV) or load the sample dataset. The platform automatically detects protected demographic attributes.'
      ),
    },
    {
      num: 2,
      icon: Terminal,
      title: t('help.step2_title', 'AI Reasoning Analysis:'),
      desc: t(
        'help.step2_desc',
        "The AI engine analyzes the dataset's selection rates and streams real-time diagnostic logs to the terminal."
      ),
    },
    {
      num: 3,
      icon: ShieldAlert,
      title: t('help.step3_title', 'Global Compliance Check:'),
      desc: t(
        'help.step3_desc',
        'The system applies strict mathematical thresholds (such as the EEOC 4/5ths Rule or Constitutional Article 15) to evaluate if the data exhibits illegal bias.'
      ),
    },
    {
      num: 4,
      icon: Sliders,
      title: t('help.step4_title', 'Human-in-the-Loop Remediation:'),
      desc: t(
        'help.step4_desc',
        "If bias is detected, the AI proposes a mathematical fix (e.g., sample reweighing). You must review the before/after metrics and explicitly click 'Approve Remediation' to apply the fix."
      ),
    },
    {
      num: 5,
      icon: FileCheck2,
      title: t('help.step5_title', 'Export Audit Certificate:'),
      desc: t(
        'help.step5_desc',
        'Once the data passes compliance, download the official audit certificate for your regulatory records.'
      ),
    },
  ];

  return (
    <div className="space-y-4 text-xs font-sans">
      <div className="border-b border-black/10 dark:border-white/10 pb-3">
        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {t('help.title', 'How to Use Aequitas')}
        </h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          {t(
            'help.subtitle',
            'A step-by-step operational guide explaining how to audit, remediate, and certify models on the Aequitas platform.'
          )}
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-black/5 dark:border-white/10 hover:border-teal-500/40 transition-all flex items-start gap-3.5 group"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-bold shrink-0 text-xs group-hover:scale-110 transition-transform">
                {step.num}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <strong className="text-slate-900 dark:text-white font-semibold text-xs">
                    {step.title}
                  </strong>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HelpModal;
