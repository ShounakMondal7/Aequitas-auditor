import React, { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Sparkles, CheckCircle2 } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
}

export const FileUpload = React.memo<FileUploadProps>(({
  onFileSelect,
  onLoadSample,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv")) {
        onFileSelect(file);
      } else {
        alert("Please upload a valid CSV dataset file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileSelect(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Outer Ambient Glass Card */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center cursor-pointer text-center group backdrop-blur-xl shadow-xl ${
          dragActive
            ? "bg-indigo-50/80 dark:bg-white/[0.06] border-indigo-400 dark:border-white/30 scale-[1.01]"
            : "bg-white/60 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] hover:bg-white/80 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/10"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Icon */}
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-slate-800 dark:text-white shadow-sm">
          <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
          {dragActive ? (
            <span className="text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">
              Drop CSV to initialize Antigravity Audit...
            </span>
          ) : (
            <span>
              Drop your CSV dataset here, or{" "}
              <span className="text-indigo-600 dark:text-white underline underline-offset-4 decoration-indigo-300 dark:decoration-white/40 hover:decoration-indigo-600 dark:hover:decoration-white font-medium">
                browse local files
              </span>
            </span>
          )}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
          Supports tabular CSV files up to 25 MB. The agent inspects demographic classes and target outcomes.
        </p>

        <div className="mt-4 flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> EEOC 4/5ths Rule
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Auto-Reweighting
          </span>
        </div>
      </div>

      {/* One-Click Quick Benchmark with Premium Dual-Theme Button */}
      <div className="p-4 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-left">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-white/[0.03] border border-indigo-100 dark:border-white/[0.06] text-indigo-600 dark:text-indigo-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Try Built-in Loan Applicant Benchmark
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Pre-configured dataset with intentional EEOC 4/5ths disparate impact (37.5% vs 80%)
            </div>
          </div>
        </div>

        {/* Premium Primary Action Button per specification */}
        <button
          type="button"
          onClick={onLoadSample}
          className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-semibold rounded-full shadow-md hover:scale-105 transition-all duration-200 px-4 py-2 text-xs flex items-center gap-1.5 shrink-0 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
          <span>Load Sample</span>
        </button>
      </div>
    </div>
  );
});

FileUpload.displayName = "FileUpload";
