import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import auditRouter from "./routes/audit";
import approvalRouter from "./routes/approval";
import historyRouter from "./routes/history";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Vite dev server, Vercel frontend, and configured FRONTEND_URL
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or curl requests with no origin
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "Autonomous AI Fairness & Bias Auditor - API Gateway",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/audit", auditRouter);
app.use("/api/approval", approvalRouter);
app.use("/api/history", historyRouter);

// Global Error Handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server Error]", err.stack || err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Auditor API Gateway running on http://localhost:${PORT}`);
  console.log(`📡 SSE Audit Route: POST http://localhost:${PORT}/api/audit`);
  console.log(`🛡️  HITL Approval:  POST http://localhost:${PORT}/api/approval`);
  console.log(`=======================================================`);
});

export default app;
