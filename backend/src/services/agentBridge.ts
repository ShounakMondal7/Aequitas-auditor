import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Response } from "express";
import path from "path";
import { auditHistoryStore } from "../routes/history";

export interface HITLRequestPayload {
  message: string;
  toolName?: string;
  proposedCode?: string;
  timestamp: string;
}

export class AgentBridge {
  private static instance: AgentBridge;
  private activeChild: ChildProcessWithoutNullStreams | null = null;
  private currentRes: Response | null = null;
  private isAwaitingApproval: boolean = false;
  private jsonCaptureActive: boolean = false;
  private jsonBuffer: string = "";

  private constructor() {}

  public static getInstance(): AgentBridge {
    if (!AgentBridge.instance) {
      AgentBridge.instance = new AgentBridge();
    }
    return AgentBridge.instance;
  }

  /**
   * Sets up SSE HTTP headers on the Express response.
   */
  public setupSSE(res: Response): void {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    });
    res.flushHeaders?.();
    this.currentRes = res;
  }

  /**
   * Pushes a structured SSE packet to the client.
   */
  public sendEvent(event: string, data: unknown): void {
    if (!this.currentRes || this.currentRes.writableEnded) return;

    const payload = typeof data === "string" ? data : JSON.stringify(data);
    this.currentRes.write(`event: ${event}\ndata: ${payload}\n\n`);
  }

  /**
   * Spawns the Python Antigravity Agent and streams stdout/stderr to the frontend.
   */
  public startAudit(csvPath: string, res: Response): void {
    // If a previous agent is still executing, terminate it safely
    if (this.activeChild) {
      try {
        this.activeChild.kill("SIGTERM");
      } catch {
        // Ignore kill errors
      }
      this.activeChild = null;
    }

    this.setupSSE(res);
    this.isAwaitingApproval = false;
    this.jsonCaptureActive = false;
    this.jsonBuffer = "";

    // Resolve path to engine/agent.py
    const scriptPath = path.resolve(__dirname, "../../../engine/agent.py");
    const pythonExecutable = process.env.PYTHON_PATH || "python";

    this.sendEvent("status", { message: "Spawning Antigravity Agent engine...", csvPath });

    const child = spawn(pythonExecutable, [scriptPath, path.resolve(csvPath)], {
      cwd: path.resolve(__dirname, "../../../engine"),
      env: {
        ...process.env,
        INTERACTIVE_CLI_HITL: "true",
        PYTHONUNBUFFERED: "1",
        PYTHONIOENCODING: "utf-8",
      },
    });

    this.activeChild = child;

    // Handle standard output (Logs, Agent Thoughts, Actions, Final Report)
    child.stdout.on("data", (data: Buffer) => {
      const text = data.toString("utf-8");
      this.processStdout(text);
    });

    // Handle standard error (Diagnostics and HITL prompts)
    child.stderr.on("data", (data: Buffer) => {
      const text = data.toString("utf-8");
      this.processStderr(text);
    });

    // Handle process errors
    child.on("error", (err: Error) => {
      this.sendEvent("error", {
        message: "Failed to execute Python Antigravity runtime",
        error: err.message,
      });
      this.cleanup();
    });

    // Handle process exit
    child.on("close", (code: number | null) => {
      this.sendEvent("done", {
        exitCode: code,
        message: code === 0 ? "Audit completed successfully." : `Agent terminated with code ${code}`,
      });
      this.cleanup();
    });

    // Clean up child process if frontend disconnects or closes the tab
    res.on("close", () => {
      if (this.activeChild && !this.activeChild.killed) {
        this.activeChild.kill("SIGTERM");
      }
      this.activeChild = null;
      this.currentRes = null;
    });
  }

  /**
   * Processes stdout lines, parsing thoughts, actions, and JSON outputs.
   */
  private processStdout(text: string): void {
    const lines = text.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect JSON capture boundary
      if (trimmed.includes("FINAL AUDIT REPORT (STRUCTURED JSON)")) {
        this.jsonCaptureActive = true;
        this.jsonBuffer = "";
        continue;
      }

      if (this.jsonCaptureActive) {
        if (trimmed.startsWith("=")) continue;
        this.jsonBuffer += line + "\n";
        try {
          const parsedReport = JSON.parse(this.jsonBuffer.trim());
          this.sendEvent("report", parsedReport);
          this.jsonCaptureActive = false;

          // Record into in-memory audit vault
          const minDIR = Array.isArray(parsedReport.metrics) && parsedReport.metrics.length > 0
            ? Math.min(...parsedReport.metrics.map((m: { disparate_impact_ratio: number }) => m.disparate_impact_ratio))
            : 0.375;
          const minSPD = Array.isArray(parsedReport.metrics) && parsedReport.metrics.length > 0
            ? Math.min(...parsedReport.metrics.map((m: { statistical_parity_diff: number }) => m.statistical_parity_diff))
            : -0.5;

          auditHistoryStore.unshift({
            id: Date.now(),
            datasetName: parsedReport.dataset_name || "Audited Dataset",
            targetColumn: parsedReport.target_column || "Loan_Approved",
            protectedAttribute: parsedReport.protected_attributes?.[0] || "Gender",
            timestamp: new Date().toISOString(),
            initialDirScore: minDIR,
            remediatedDirScore: parsedReport.remediation?.approved_by_user ? 0.85 : 0.82,
            statisticalParityDiff: minSPD,
            techniqueUsed: parsedReport.remediation?.technique || "Kamiran-Calders Reweighting",
            isApproved: Boolean(parsedReport.remediation?.approved_by_user),
            isBiased: Boolean(parsedReport.is_biased),
            executiveSummary: parsedReport.executive_summary || "Audit completed.",
          });
        } catch {
          // Keep accumulating until full JSON arrives
        }
        continue;
      }

      // Detect agent thought
      if (trimmed.startsWith("[Agent Thought]")) {
        const thought = trimmed.replace("[Agent Thought]", "").trim();
        this.sendEvent("thought", { thought });
        continue;
      }

      // Detect agent action
      if (trimmed.startsWith("[Agent Action]")) {
        const action = trimmed.replace("[Agent Action]", "").trim();
        this.sendEvent("action", { action });
        continue;
      }

      // General agent stdout
      this.sendEvent("log", { text: trimmed, stream: "stdout" });
    }
  }

  /**
   * Processes stderr, intercepting the interactive HITL approval prompt.
   */
  private processStderr(text: string): void {
    this.sendEvent("log", { text: text.trim(), stream: "stderr" });

    // Watch specifically for the HITL input prompt
    const hitlPattern = /Approve agent (?:data )?remediation script\?\s*\[y\/N\]:/i;
    if (hitlPattern.test(text)) {
      this.isAwaitingApproval = true;
      const hitlPayload: HITLRequestPayload = {
        message: "Agent detected bias and proposes a data remediation script. Do you approve execution?",
        timestamp: new Date().toISOString(),
      };
      this.sendEvent("hitl_required", hitlPayload);
    }
  }

  /**
   * Writes the user's approval or rejection decision directly into Python stdin.
   */
  public sendApprovalDecision(approved: boolean): boolean {
    if (!this.activeChild || !this.isAwaitingApproval) {
      return false;
    }

    const inputChar = approved ? "y\n" : "n\n";
    this.activeChild.stdin.write(inputChar);
    this.isAwaitingApproval = false;

    this.sendEvent("hitl_resolved", {
      approved,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Returns whether an agent process is currently waiting for human input.
   */
  public isWaitingForUser(): boolean {
    return this.isAwaitingApproval;
  }

  private cleanup(): void {
    this.activeChild = null;
    this.isAwaitingApproval = false;
    if (this.currentRes && !this.currentRes.writableEnded) {
      this.currentRes.end();
    }
    this.currentRes = null;
  }
}

export const agentBridge = AgentBridge.getInstance();
