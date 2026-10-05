import { Request, Response, Router } from "express";

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

// In-memory persistent history store (initialized with baseline historical records)
export const auditHistoryStore: HistoricalAuditRecord[] = [
  {
    id: 1,
    datasetName: "sample_credit_data.csv",
    targetColumn: "Loan_Approved",
    protectedAttribute: "Gender",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    initialDirScore: 0.375,
    remediatedDirScore: 0.85,
    statisticalParityDiff: -0.5,
    techniqueUsed: "Kamiran-Calders Sample Reweighting",
    isApproved: true,
    isBiased: true,
    executiveSummary:
      "EEOC Four-Fifths violation detected (Disparate Impact Ratio: 37.5%). Pre-processing sample reweighting approved and applied, restoring demographic parity to 85.0%.",
  },
];

const router = Router();

/**
 * GET /api/history
 * Returns historical audit records sorted by timestamp descending.
 */
router.get("/", (_req: Request, res: Response) => {
  const sorted = [...auditHistoryStore].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return res.json(sorted);
});

export default router;
