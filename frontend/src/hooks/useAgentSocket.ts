import { useState, useCallback, useRef, useEffect } from "react";
import { FairnessAuditReport, HITLRequest } from "../types/audit";

import { API_BASE_URL } from "../utils/apiConfig";

export interface UseAgentSocketReturn {
  logs: string[];
  isWaitingForApproval: boolean;
  hitlRequest: HITLRequest | null;
  report: FairnessAuditReport | null;
  isAuditing: boolean;
  error: string | null;
  startAudit: (file: File) => Promise<void>;
  approveAction: (decision: boolean) => Promise<void>;
  resetAudit: () => void;
}

export function useAgentSocket(): UseAgentSocketReturn {
  const [logs, setLogs] = useState<string[]>([]);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState<boolean>(false);
  const [hitlRequest, setHitlRequest] = useState<HITLRequest | null>(null);
  const [report, setReport] = useState<FairnessAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Performance Optimization: Batching buffer for high-frequency SSE logs (120ms throttle)
  const logBufferRef = useRef<string[]>([]);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushLogs = useCallback(() => {
    if (logBufferRef.current.length > 0) {
      const incoming = [...logBufferRef.current];
      logBufferRef.current = [];
      setLogs((prev) => [...prev, ...incoming]);
    }
    batchTimerRef.current = null;
  }, []);

  const queueLog = useCallback(
    (message: string, immediate = false) => {
      logBufferRef.current.push(message);

      if (immediate) {
        if (batchTimerRef.current) {
          clearTimeout(batchTimerRef.current);
        }
        flushLogs();
      } else if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(flushLogs, 150);
      }
    },
    [flushLogs]
  );

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  const resetAudit = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    logBufferRef.current = [];
    setLogs([]);
    setIsWaitingForApproval(false);
    setHitlRequest(null);
    setReport(null);
    setIsAuditing(false);
    setError(null);
  }, []);

  const parseSSEBuffer = useCallback(
    (chunkText: string, bufferRef: { current: string }) => {
      bufferRef.current += chunkText;
      const parts = bufferRef.current.split("\n\n");
      bufferRef.current = parts.pop() || ""; // Keep incomplete trailing chunk

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = "message";
        let dataStr = "";

        const lines = part.split("\n");
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataStr = line.slice(5).trim();
          }
        }

        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);

          switch (eventType) {
            case "status":
              queueLog(`[*] ${data.message}`);
              break;

            case "thought":
              queueLog(`[Agent Thought] ${data.thought}`);
              break;

            case "action":
              queueLog(`[Agent Action] ${data.action}`);
              break;

            case "log":
              queueLog(data.text);
              break;

            case "hitl_required":
              setIsWaitingForApproval(true);
              setHitlRequest(data);
              queueLog(`🚨 [HITL SAFETY GATE] Human Approval Required: ${data.message}`, true);
              break;

            case "hitl_resolved":
              setIsWaitingForApproval(false);
              queueLog(`[HITL] Approval decision confirmed: ${data.approved ? "APPROVED" : "REJECTED"}`, true);
              break;

            case "report":
              setReport(data as FairnessAuditReport);
              queueLog(`[Audit Report] Generated structured report successfully.`, true);
              break;

            case "done":
              setIsAuditing(false);
              queueLog(`[Completed] ${data.message}`, true);
              break;

            case "error":
              setError(data.message);
              queueLog(`[Error] ${data.message}`, true);
              setIsAuditing(false);
              break;

            default:
              queueLog(`[Event: ${eventType}] ${dataStr}`);
          }
        } catch {
          // Fallback if raw text
          queueLog(dataStr);
        }
      }
    },
    [queueLog]
  );

  const startAudit = useCallback(
    async (file: File) => {
      resetAudit();
      setIsAuditing(true);
      queueLog(`[*] Preparing dataset '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`, true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const formData = new FormData();
      formData.append("dataset", file);

      try {
        const response = await fetch(`${API_BASE_URL}/audit`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("ReadableStream not supported by this browser.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        const bufferRef = { current: "" };

        queueLog("[*] SSE stream connection established. Spawning Antigravity Agent...", true);

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunkText = decoder.decode(value, { stream: true });
          parseSSEBuffer(chunkText, bufferRef);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          queueLog("[*] Audit stream aborted by user.", true);
        } else {
          const msg = err instanceof Error ? err.message : "Unexpected audit error occurred";
          setError(msg);
          queueLog(`[Fatal Error] ${msg}`, true);
        }
      } finally {
        flushLogs();
        setIsAuditing(false);
      }
    },
    [resetAudit, queueLog, parseSSEBuffer, flushLogs]
  );

  const approveAction = useCallback(
    async (decision: boolean) => {
      try {
        queueLog(`[HITL] Submitting human decision (${decision ? "APPROVE" : "DENY"})...`, true);
        const res = await fetch(`${API_BASE_URL}/approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: decision }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to submit approval decision.");
        }

        setIsWaitingForApproval(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Approval request failed";
        setError(msg);
        queueLog(`[HITL Error] ${msg}`, true);
      }
    },
    [queueLog]
  );

  return {
    logs,
    isWaitingForApproval,
    hitlRequest,
    report,
    isAuditing,
    error,
    startAudit,
    approveAction,
    resetAudit,
  };
}
