import { Request, Response, Router } from "express";
import { agentBridge } from "../services/agentBridge";

const router = Router();

/**
 * POST /api/approval
 * Resolves the Human-in-the-Loop policy gate by writing y/n to the Python agent's stdin.
 */
router.post("/", (req: Request, res: Response) => {
  const { approved } = req.body;

  if (typeof approved !== "boolean") {
    return res.status(400).json({
      error: "Invalid request payload. Expected { 'approved': boolean }.",
    });
  }

  if (!agentBridge.isWaitingForUser()) {
    return res.status(409).json({
      error: "No agent process is currently awaiting human-in-the-loop approval.",
    });
  }

  const success = agentBridge.sendApprovalDecision(approved);

  if (success) {
    console.log(`[API] HITL Gate resolved: user decided -> ${approved ? "APPROVED" : "REJECTED"}`);
    return res.json({
      success: true,
      decision: approved ? "approved" : "rejected",
      message: `Remediation action successfully ${approved ? "approved" : "rejected"}.`,
    });
  } else {
    return res.status(500).json({
      error: "Failed to write approval decision to the active agent process.",
    });
  }
});

/**
 * GET /api/approval/status
 * Queries whether the agent is currently blocked waiting for approval.
 */
router.get("/status", (_req: Request, res: Response) => {
  return res.json({
    isWaitingForUser: agentBridge.isWaitingForUser(),
  });
});

export default router;
