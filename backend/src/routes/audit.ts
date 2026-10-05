import { Request, Response, Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { agentBridge } from "../services/agentBridge";

const router = Router();

// Configure Multer storage
const uploadsDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".csv" || file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are accepted."));
    }
  },
});

/**
 * POST /api/audit
 * Receives multipart CSV upload and directly establishes an SSE stream
 * piping the autonomous agent's execution, thoughts, and HITL prompts.
 */
router.post(
  "/",
  upload.fields([{ name: "dataset", maxCount: 1 }, { name: "file", maxCount: 1 }]),
  (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const uploadedFile = files?.dataset?.[0] || files?.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: "No CSV file provided. Please attach under 'dataset' or 'file'." });
    }

    const csvPath = uploadedFile.path;
    console.log(`[API] Received dataset for audit: ${uploadedFile.originalname} -> ${csvPath}`);

    // Delegate stream management to AgentBridge
    agentBridge.startAudit(csvPath, res);
  }
);

export default router;
