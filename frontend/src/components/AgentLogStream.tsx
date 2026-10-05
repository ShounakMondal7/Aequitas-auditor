import React, { useEffect, useRef, useState } from "react";
import { Terminal, ShieldAlert, Cpu, CheckCircle2, ChevronDown } from "lucide-react";

interface AgentLogStreamProps {
  logs: string[];
  isAuditing: boolean;
  isWaitingForApproval: boolean;
}

export const AgentLogStream = React.memo<AgentLogStreamProps>(({
  logs,
  isAuditing,
  isWaitingForApproval,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    if (autoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length, autoScroll]);

  const renderLogLine = (log: string, index: number) => {
    if (log.startsWith("[Agent Thought]")) {
      return (
        <div key={index} className="flex items-start space-x-2 py-0.5 text-sky-300">
          <span className="text-sky-400 font-semibold select-none">💭 [THOUGHT]</span>
          <span className="text-sky-200">{log.replace("[Agent Thought]", "")}</span>
        </div>
      );
    }

    if (log.startsWith("[Agent Action]")) {
      return (
        <div key={index} className="flex items-start space-x-2 py-0.5 text-amber-300">
          <span className="text-amber-400 font-semibold select-none">⚡ [TOOL]</span>
          <span className="text-amber-100">{log.replace("[Agent Action]", "")}</span>
        </div>
      );
    }

    if (log.includes("[HITL SAFETY GATE]") || log.includes("🚨")) {
      return (
        <div
          key={index}
          className="my-1.5 p-2 rounded bg-rose-950/70 border border-rose-600/40 text-rose-300 font-semibold flex items-center space-x-2 animate-pulse"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{log}</span>
        </div>
      );
    }

    if (log.startsWith("[Audit Report]") || log.startsWith("[Completed]")) {
      return (
        <div key={index} className="flex items-start space-x-2 py-0.5 text-emerald-300 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 select-none mt-0.5" />
          <span>{log}</span>
        </div>
      );
    }

    if (log.startsWith("[Error]") || log.startsWith("[Fatal Error]")) {
      return (
        <div key={index} className="py-0.5 text-red-400 font-semibold">
          <span className="text-red-500 font-bold select-none">[ERR] </span>
          <span>{log}</span>
        </div>
      );
    }

    return (
      <div key={index} className="py-0.5 text-emerald-400/90 leading-relaxed">
        <span className="text-slate-500 select-none mr-2">$</span>
        <span>{log}</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden flex flex-col font-mono text-xs sm:text-sm">
      {/* Terminal Title Bar */}
      <div className="bg-slate-100 dark:bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] select-none">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-700 dark:text-slate-300 ml-2 font-medium flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-600 dark:text-emerald-400" />
            Antigravity Agent Runtime Terminal
          </span>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center space-x-3">
          {isWaitingForApproval ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
              <ShieldAlert className="w-3 h-3 mr-1" />
              HITL GATE PAUSED
            </span>
          ) : isAuditing ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
              <Cpu className="w-3 h-3 mr-1 animate-spin" />
              AGENT EXECUTING
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              IDLE / READY
            </span>
          )}

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              autoScroll
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-sm"
                : "bg-slate-200/50 dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-800"
            }`}
            title="Toggle Auto Scroll"
          >
            <ChevronDown className="w-3.5 h-3.5 inline mr-1" />
            Auto-Scroll
          </button>
        </div>
      </div>

      {/* Terminal Output Area with GPU Composited Scrolling */}
      <div
        style={{ transform: "translateZ(0)" }}
        className="h-80 sm:h-96 p-4 overflow-y-auto terminal-scroll bg-slate-950 font-mono will-change-scroll"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic">
            Waiting for dataset upload to initialize Antigravity agent process...
          </div>
        ) : (
          logs.map((log, idx) => renderLogLine(log, idx))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
});

AgentLogStream.displayName = "AgentLogStream";
