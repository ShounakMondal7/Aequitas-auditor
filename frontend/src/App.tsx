import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Bell,
  Sun,
  Moon,
  Minus,
  Square,
  X,
  MoreHorizontal,
  Sparkles,
  BarChart2,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowUp,
  RotateCcw,
  LogOut,
  Database,
  Sliders,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserActivityProvider, useActivity } from "./context/UserActivityContext";
import { useAgentSocket } from "./hooks/useAgentSocket";
import { useProcessing } from "./hooks/useProcessing";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { BiasCharts } from "./components/BiasCharts";
import { SpotlightCard } from "./components/SpotlightCard";
import WebThreads from "./components/WebThreads";
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { HelpModal } from "./components/HelpModal";
import { DatasetModal } from "./components/DatasetModal";
import { FairnessAuditReport } from "./types/audit";
import Papa from "papaparse";
import { evaluateFairness, FairnessReport, detectProtectedColumn } from "./utils/fairnessMetrics";
import {
  sampleCreditData,
  customerCreditV4Data,
  q3LoanApplicationsData,
  techHiringPipelineData,
  ENTERPRISE_REPOSITORY_DATASETS,
} from "./utils/sampleData";
import { FairnessCharts } from "./components/FairnessCharts";
import { generateFairnessAnalysis } from "./services/aiService";
import { generateAuditPDF } from "./utils/pdfExport";

const GOOGLE_CLIENT_ID = "842090471237-ookvg6c3monopv4h6omfoddqj7e8j7pl.apps.googleusercontent.com";

export interface AuditRowItem {
  id: string;
  name: string;
  date: string;
  model: string;
  attribute: string;
  attributeColor: "rose" | "cyan" | "purple";
  status: "biased" | "remediated";
  statusText: string;
  score: number;
}

export interface AppNotification {
  id: string;
  text: string;
  time: string;
  isNew: boolean;
  type: "success" | "warning" | "info" | "error";
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "init-1",
    text: "Vector Index: EEOC 29 C.F.R. § 1607 (4/5ths Rule) refreshed.",
    time: "09:12 AM",
    isNew: false,
    type: "info",
  },
  {
    id: "init-2",
    text: "Model Registry: 'Loan_v3' submitted for autonomous fairness audit.",
    time: "11:45 AM",
    isNew: false,
    type: "info",
  },
];

// Initial demonstrative rows matching the reference design
const INITIAL_ROWS: AuditRowItem[] = [
  {
    id: "#D104",
    name: "Applicant_Data",
    date: "Oct 28",
    model: "Loan_v3",
    attribute: "Race",
    attributeColor: "rose",
    status: "biased",
    statusText: "Biased Data",
    score: 68,
  },
  {
    id: "#D103",
    name: "User_Logs",
    date: "Oct 28",
    model: "Fraud_v1",
    attribute: "Gender",
    attributeColor: "cyan",
    status: "remediated",
    statusText: "Remediated",
    score: 91,
  },
  {
    id: "#D102",
    name: "Customer_V4",
    date: "Oct 28",
    model: "Rank_v3",
    attribute: "Age",
    attributeColor: "purple",
    status: "remediated",
    statusText: "Remediated",
    score: 89,
  },
];

// Initial terminal lines matching the exact reference design
const DEFAULT_LOGS = [
  "[14:23:05] Analyzing dataset...",
  "[14:23:09] Detected bias in 'Approval Rate' by 'Ethnicity'...",
  "[14:23:14] Generating remediation plan...",
  "[14:24:16] Bias analysis continuing on 'Age' and 'Gender' protected attributes.",
];

// Enterprise Dataset Registry
export const sampleDatasets = [
  { id: 1, name: "HR_Retention_Q4.csv", protected: "Age & Gender", rows: "14,200", biasRisk: "High" },
  { id: 2, name: "Loan_Approvals_2026.csv", protected: "Race & Ethnicity", rows: "85,000", biasRisk: "Medium" },
  { id: 3, name: "Healthcare_Triage_ML.csv", protected: "Income Level", rows: "1.2M", biasRisk: "Low" },
  { id: 4, name: "Resume_Screening_AI.csv", protected: "Gender & Zip Code", rows: "45,600", biasRisk: "High" },
  { id: 5, name: "Credit_Scoring_Model.csv", protected: "Marital Status", rows: "230,000", biasRisk: "Medium" },
  { id: 6, name: "Ad_Targeting_Metrics.csv", protected: "Age & National Origin", rows: "510,000", biasRisk: "Low" },
];

// Sample Audit Report for the "Review Details" interactive chart viewer
const SAMPLE_REPORT: FairnessAuditReport = {
  dataset_name: "Applicant_Data_Credit_v3.csv",
  target_column: "Loan_Approved",
  protected_attributes: ["Race", "Gender", "Age"],
  is_biased: true,
  benchmarks_consulted: ["EEOC 29 C.F.R. § 1607", "NYC Local Law 144", "EU AI Act Art. 10"],
  metrics: [
    {
      demographic_group: "Privileged (Majority)",
      baseline_selection_rate: 0.85,
      remediated_selection_rate: 0.82,
      disparate_impact_ratio: 1.0,
      statistical_parity_diff: 0.0,
    },
    {
      demographic_group: "Protected Group A (Ethnicity)",
      baseline_selection_rate: 0.58,
      remediated_selection_rate: 0.77,
      disparate_impact_ratio: 0.82,
      statistical_parity_diff: -0.27,
    },
    {
      demographic_group: "Protected Group B (Underrepresented)",
      baseline_selection_rate: 0.52,
      remediated_selection_rate: 0.74,
      disparate_impact_ratio: 0.85,
      statistical_parity_diff: -0.33,
    },
  ],
  remediation: {
    technique: "Kamiran-Calders Reweighting (Mitigation Algorithm)",
    justification: "Reweighing instances to rebalance demographic parity across protected ethnicity groups without loss of accuracy.",
    code_snippet: "from aif360.algorithms.preprocessing import Reweighing\nreweighter = Reweighing(unprivileged_groups, privileged_groups)\ndataset_transf = reweighter.fit_transform(dataset)",
    approved_by_user: false,
  },
  executive_summary: "Disparate impact ratio is 0.82 on protected attribute 'Race', which is below the 0.80 four-fifths rule threshold.",
};

function AppContent({
  currentUser = "Guest",
  onUserChange,
}: {
  currentUser?: string;
  onUserChange?: (user: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollTerminalRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme, fontSize, setFontSize } = useTheme();
  const { logAction, logs } = useActivity();
  const { t, i18n } = useTranslation();

  // Dynamically set RTL for Arabic and Urdu
  useEffect(() => {
    const isRtl = ["ar", "ur"].includes(i18n.language);
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Application Routing & Authentication State
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>(currentUser);

  // Sync username if currentUser prop updates
  useEffect(() => {
    if (currentUser && currentUser !== username) {
      setUsername(currentUser);
    }
  }, [currentUser]);

  // Authenticate handler
  const handleAuthenticate = (name: string, email?: string) => {
    setUsername(name);
    onUserChange?.(name);
    setIsAuthModalOpen(false);
    logAction(name === "Guest" ? "GUEST_SESSION_STARTED" : "USER_AUTHENTICATED", {
      username: name,
      email: email || "N/A",
      timestamp: new Date().toISOString(),
    });
    triggerToast(
      name === "Guest"
        ? "Switched to Guest session."
        : `Authenticated as ${name}.`
    );
  };

  // Socket & Live Agent integration
  const {
    logs: socketLogs,
    report: socketReport,
    approveAction,
    resetAudit,
  } = useAgentSocket();

  // Real-Time Processing Transition state hook
  const {
    isProcessing,
    progress,
    statusMessage,
    startProcessing,
    resetProcessing,
  } = useProcessing();

  // Application & Ingestion State (Starts in strict quiet waiting state)
  const [activeDataset, setActiveDataset] = useState<{
    name: string;
    rows: number;
    protectedAttribute: string;
    source: "local" | "cloud";
  } | null>(null);
  const [activeNav, setActiveNav] = useState<string>("Dashboard");
  const [activeVaultTab, setActiveVaultTab] = useState<"Records" | "Charts">("Records");
  const [latestReport, setLatestReport] = useState<FairnessReport | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);

  // Terminal State (Empty waiting state, awaits ingestion)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState<boolean>(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState<boolean>(false);

  // Audit Table State (Empty in waiting state)
  const [tableRows, setTableRows] = useState<AuditRowItem[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // HITL Approval State (Null in waiting state)
  const [isRemediated, setIsRemediated] = useState<boolean>(false);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [hitlRemediationTarget, setHitlRemediationTarget] = useState<{
    dataset: string;
    model: string;
    attribute: string;
    beforeDP: number;
    afterDP: number;
    rowId: string;
  } | null>(null);

  // Modals & Policy State
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    content: React.ReactNode;
  } | null>(null);
  const [activeNavModal, setActiveNavModal] = useState<string | null>(null);
  const [complianceThreshold, setComplianceThreshold] = useState<string>("80");
  const notificationBoxRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread">("all");

  // Structured Notifications List
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Close notification popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationBoxRef.current && !notificationBoxRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  // Synchronize socket logs if active
  useEffect(() => {
    if (socketLogs.length > 0) {
      setTerminalLogs(socketLogs);
    }
  }, [socketLogs]);

  // Auto-scroll terminal
  useEffect(() => {
    if (scrollTerminalRef.current) {
      scrollTerminalRef.current.scrollTop = scrollTerminalRef.current.scrollHeight;
    }
    const timer = setTimeout(() => {
      if (scrollTerminalRef.current) {
        scrollTerminalRef.current.scrollTop = scrollTerminalRef.current.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [terminalLogs.length]);

  // Add Notification Directly to the Notification Box (No on-screen popups!)
  const addNotification = useCallback((msg: string, type?: "success" | "warning" | "info" | "error") => {
    let computedType: "success" | "warning" | "info" | "error" = type || "info";
    const lower = msg.toLowerCase();
    if (lower.includes("approved") || lower.includes("remediated") || lower.includes("passed") || lower.includes("compliant") || lower.includes("authenticated")) {
      computedType = "success";
    } else if (lower.includes("violation") || lower.includes("rejected") || lower.includes("sub-4/5ths") || lower.includes("error") || lower.includes("fail")) {
      computedType = "warning";
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const newEntry: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      text: msg,
      time: timeStr,
      isNew: true,
      type: computedType,
    };

    setNotifications((prev) => [newEntry, ...prev]);
  }, []);

  // triggerToast routes directly into the Notification Box without popping onto the screen
  const triggerToast = useCallback((msg: string, type?: "success" | "warning" | "info" | "error") => {
    addNotification(msg, type);
  }, [addNotification]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const newNotificationsCount = notifications.filter((n) => n.isNew).length;

  // Add Log Line Helper
  const appendLog = useCallback((line: string) => {
    setTerminalLogs((prev) => [...prev, line]);
  }, []);

  // Dynamic Log Streaming with sequential real-time delay
  const streamLogs = useCallback((logsToStream: string[], delayMs: number = 320) => {
    logsToStream.forEach((logText, idx) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, logText]);
      }, (idx + 1) * delayMs);
    });
  }, []);

  // Policy Setting Change Handler
  const handleThresholdChange = (newVal: string) => {
    setComplianceThreshold(newVal);
    const dpRatio = (parseInt(newVal, 10) / 100).toFixed(2);
    const timestamp = new Date().toLocaleTimeString();

    logAction("COMPLIANCE_THRESHOLD_UPDATED", {
      newThreshold: `${newVal}%`,
      disparateImpactFloor: dpRatio,
      standard: "EEOC Four-Fifths Parity",
    });

    appendLog(`[${timestamp}] Regulatory Policy Updated: EEOC disparate impact threshold adjusted to ${dpRatio} DP (${newVal}% rule).`);
    triggerToast(`EEOC Compliance Threshold updated to ${newVal}% (${dpRatio} DP).`, "info");
  };

  // 1. APPROVE REMEDIATION ACTION
  const handleApproveRemediation = () => {
    if (!hitlRemediationTarget) return;
    setIsRemediated(true);
    setIsRejected(false);

    // Update target row in the Audit Vault table to REMEDIATED with Score 94
    const targetId = hitlRemediationTarget.rowId;
    setTableRows((prev) =>
      prev.map((row) =>
        row.id === targetId || row.name === hitlRemediationTarget.dataset
          ? {
              ...row,
              status: "remediated",
              statusText: "Remediated",
              score: 94,
            }
          : row
      )
    );

    // Stream reasoning logs
    const timestamp = new Date().toLocaleTimeString();
    streamLogs([
      `[${timestamp}] [HITL SAFETY GATE APPROVED] Approved Model remediation for ${hitlRemediationTarget.model}.`,
      `[${timestamp}] Applying Kamiran-Calders Reweighting algorithm to protected attribute '${hitlRemediationTarget.attribute}' on ${hitlRemediationTarget.dataset}...`,
      `[${timestamp}] Disparate impact ratio improved from ${hitlRemediationTarget.beforeDP.toFixed(2)} DP to ${hitlRemediationTarget.afterDP.toFixed(2)} DP (Remediated).`,
      `[${timestamp}] Verification passed: Model ${hitlRemediationTarget.model} complies with EEOC 4/5ths standard.`,
    ]);

    logAction("HITL_REMEDIATION_APPROVED", {
      model: hitlRemediationTarget.model,
      dataset: hitlRemediationTarget.dataset,
      algorithm: "Kamiran-Calders Reweighting",
      priorScore: Math.round(hitlRemediationTarget.beforeDP * 100),
      remediatedScore: 94,
      disparateImpactRatio: `${hitlRemediationTarget.afterDP.toFixed(2)} DP`,
      status: "COMPLIANT",
    });

    triggerToast(`Remediation Approved! ${hitlRemediationTarget.model} successfully remediated to ${hitlRemediationTarget.afterDP.toFixed(2)} DP.`, "success");

    if (approveAction) {
      approveAction(true);
    }
  };

  // 2. REJECT REMEDIATION ACTION
  const handleRejectRemediation = () => {
    if (!hitlRemediationTarget) return;
    setIsRejected(true);
    const timestamp = new Date().toLocaleTimeString();

    streamLogs([
      `[${timestamp}] [HITL SAFETY GATE REJECTED] Operator rejected automated remediation for ${hitlRemediationTarget.dataset}.`,
      `[${timestamp}] Preservation: Model ${hitlRemediationTarget.model} baseline weights retained without modification.`,
    ]);

    logAction("HITL_REMEDIATION_REJECTED", {
      model: hitlRemediationTarget.model,
      dataset: hitlRemediationTarget.dataset,
      action: "Retain Baseline Weights",
      status: "NON_REMEDIATED",
    });

    triggerToast(`Remediation Rejected: ${hitlRemediationTarget.model} baseline parameters preserved.`);
    if (approveAction) {
      approveAction(false);
    }
  };

  // 3. RESET DEMO (Returns dashboard to strict quiet waiting state)
  const handleResetDemonstration = () => {
    resetProcessing();
    setActiveDataset(null);
    setSelectedFileName(null);
    setLatestReport(null);
    setIsRemediated(false);
    setIsRejected(false);
    setComplianceThreshold("80");
    setTableRows([]);
    setTerminalLogs([]);
    setHitlRemediationTarget(null);
    setSelectedRowId(null);

    logAction("AUDIT_STATE_RESET", { resetTo: "Empty Waiting State" });
    triggerToast("Dashboard reset to quiet waiting state. Awaiting dataset ingestion.");
    if (resetAudit) {
      resetAudit();
    }
  };

  // 4. CORE UNIFIED STATE HANDLER (Powers both Local File Upload and Cloud Repository Ingestion)
  const processDataset = useCallback(
    (
      rows: Record<string, any>[],
      datasetName: string,
      source: "local" | "cloud" = "local"
    ) => {
      if (!rows || rows.length === 0) {
        triggerToast("Dataset contains no valid records.", "warning");
        return;
      }

      setSelectedFileName(datasetName);

      // Initialize terminal with live stream announcement
      const startTimestamp = new Date().toLocaleTimeString();
      setTerminalLogs([
        `[${startTimestamp}] [WebSocket Connected] Ingesting CSV stream for '${datasetName}' (${rows.length.toLocaleString()} records)...`,
      ]);

      // Bridge empty state with 2.5-second simulated real-time WebSocket transition
      startProcessing(rows.length, () => {
        const fields = Object.keys(rows[0] || {});
        const protectedCol =
          detectProtectedColumn(fields) ||
          fields.find((f) =>
            /^(gender|sex|race|ethnicity|age|caste|religion|disability|nationality|marital_status|protected)/i.test(f.trim())
          ) ||
          fields[0];
        const favorableCol =
          fields.find((f) =>
            /^(approved|approval|target|loan_status|hired|status|label|pass|outcome)/i.test(f.trim())
          ) ||
          fields[fields.length - 1];

        try {
          const report = evaluateFairness(
            rows,
            protectedCol,
            favorableCol,
            parseFloat(complianceThreshold) / 100,
            datasetName
          );

          // 1. Activate Dashboard state
          setActiveDataset({
            name: datasetName,
            rows: rows.length,
            protectedAttribute: protectedCol,
            source,
          });

          // 2. Mount Fairness Charts
          setLatestReport(report);

          // 3. Populate Audit Vault Table
          const newId = `#D${Math.floor(100 + Math.random() * 900)}`;
          const currentDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const modelName = datasetName.includes("Loan")
            ? "RiskNet_v3"
            : datasetName.includes("Hiring")
            ? "TalentMatch_AI"
            : "CreditScorer_v4";

          const newRow: AuditRowItem = {
            id: newId,
            name: datasetName,
            date: currentDate,
            model: modelName,
            attribute: protectedCol.charAt(0).toUpperCase() + protectedCol.slice(1),
            attributeColor: report.isBiased ? "rose" : "cyan",
            status: report.isBiased ? "biased" : "remediated",
            statusText: report.isBiased ? "Biased Data" : "Remediated",
            score: report.score,
          };

          setTableRows((prev) => [newRow, ...prev.filter((r) => r.id !== newId)]);
          setSelectedRowId(newId);

          // 4. Populate HITL Confirmation card with Before/After comparison
          setHitlRemediationTarget({
            dataset: datasetName,
            model: modelName,
            attribute: protectedCol,
            beforeDP: report.disparateImpactRatio,
            afterDP: 0.94,
            rowId: newId,
          });
          setIsRemediated(false);
          setIsRejected(false);

          // 5. Activation Transition: Sequentially print logs to AI Reasoning Terminal
          const timestamp = new Date().toLocaleTimeString();
          setTerminalLogs((prev) => [
            ...prev,
            `[${timestamp}] [System Activated] Ingestion stream complete for '${datasetName}' via ${
              source === "cloud" ? "Cloud Repository" : "Local File Upload"
            }.`,
          ]);

          streamLogs([
            `[${timestamp}] Auto-detected protected demographic attribute: '${protectedCol}' | Target outcome: '${favorableCol}'.`,
            `[${timestamp}] Evaluated selection rates: Privileged Group (${(report.privilegedSelectionRate * 100).toFixed(1)}%) vs Unprivileged Group (${(report.unprivilegedSelectionRate * 100).toFixed(1)}%).`,
            `[${timestamp}] Disparate Impact Ratio calculated at ${report.disparateImpactRatio.toFixed(3)} DP against ${report.appliedLaw}.`,
            report.intersectionalMetrics
              ? `[${timestamp}] [Intersectional Analysis] Evaluated compound subgroup matrix (${report.intersectionalMetrics.pair[0]} × ${report.intersectionalMetrics.pair[1]}): ${report.intersectionalMetrics.severeBiasedCount} severe disparity clusters flagged.`
              : `[${timestamp}] Demographic parity evaluation complete.`,
            report.isBiased
              ? `[${timestamp}] Warning: Evaluated sub-4/5ths threshold (BIASED under ${report.appliedLaw}).`
              : `[${timestamp}] Verification passed: COMPLIANT with ${report.appliedLaw}.`,
            `[${timestamp}] Proposing autonomous algorithmic debiasing: Kamiran-Calders Reweighting algorithm.`,
            `[${timestamp}] [HITL SAFETY GATE] Awaiting Human-in-the-Loop authorization to deploy remediation...`,
          ]);

          // 6. Deep AI Service Analysis
          generateFairnessAnalysis(report).then((aiLines) => {
            const formattedLogs = aiLines.map((line) => {
              const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              return `[${time}] ${line.replace(/^>\s*/, "")}`;
            });
            setTerminalLogs((prev) => [...prev, ...formattedLogs]);
          });

          logAction("DATASET_AUDITED", {
            dataset: datasetName,
            score: report.score,
            dir: report.disparateImpactRatio,
            isBiased: report.isBiased,
            appliedLaw: report.appliedLaw,
            totalRows: rows.length,
            intersectionalClusters: report.intersectionalMetrics?.severeBiasedCount || 0,
            source,
          });

          triggerToast(
            report.isBiased
              ? `Dataset '${datasetName}' audited. Disparate Impact violation (${report.disparateImpactRatio.toFixed(2)} DP) flagged for HITL review.`
              : `Dataset '${datasetName}' audited. Compliant with ${report.appliedLaw}.`
          );
        } catch (err: any) {
          triggerToast(`Fairness calculation error: ${err?.message || "Unknown error"}`, "error");
        }
      });
    },
    [complianceThreshold, logAction, startProcessing, streamLogs, triggerToast]
  );

  // 5. PARSE LOCAL CSV FILE & PASS INTO UNIFIED INGESTION HANDLER
  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        if (!rows || rows.length === 0) {
          triggerToast("CSV file contains no valid data rows.", "warning");
          return;
        }
        processDataset(rows, file.name, "local");
      },
      error: (error) => {
        const timestamp = new Date().toLocaleTimeString();
        appendLog(`[${timestamp}] Papa Parse error parsing ${file.name}: ${error.message}`);
        triggerToast(`CSV parsing error: ${error.message}`, "error");
      },
    });
  };

  // 6. LOAD PRE-REGISTERED ENTERPRISE DATASET
  const handleLoadSampleDataset = (name = "Q3_Loan_Applications.csv") => {
    const found = ENTERPRISE_REPOSITORY_DATASETS.find((d) => d.name === name);
    if (found) {
      processDataset(found.data, found.name, "cloud");
    } else {
      processDataset(customerCreditV4Data, "Customer_Credit_V4.csv", "cloud");
    }
  };

  // 7. DRAG & DROP HANDLERS
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
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const filteredRows = tableRows;

  // If in landing view, render LandingPage, AuthModal, and Elevated Notification Stack
  if (view === "landing") {
    return (
      <>
        <LandingPage
          onLogin={() => setIsAuthModalOpen(true)}
          onLaunchWorkspace={() => {
            setView("dashboard");
            triggerToast("Entered Auditor Workspace.");
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthenticate={(name, email) => {
            handleAuthenticate(name, email);
            setView("dashboard");
          }}
        />
      </>
    );
  }

  // Dynamic Modal Title Resolver
  const getModalTitle = (modalName: string | null) => {
    switch (modalName) {
      case "Datasets":
        return t("modals.datasets_title", "Enterprise Datasets Vault");
      case "Models":
        return t("modals.models_title", "AI Model Safety Registry");
      case "Audits":
        return t("modals.audits_title", "Historical Audit Ledger");
      case "Settings":
        return t("modals.settings_title", "Autonomous Fairness Policy Settings");
      case "Help":
        return t("help.title", "How to Use Aequitas");
      default:
        return "System Modal";
    }
  };

  // Dynamic Modal Content Renderer
  const renderNavModalContent = (modalName: string | null) => {
    if (modalName === "Datasets") {
      return (
        <div className="space-y-3 text-xs font-sans">
          <p className="text-slate-600 dark:text-slate-300">
            {t("modals.datasets_desc", "Select an enterprise dataset to load directly into the autonomous fairness auditor:")}
          </p>
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto terminal-scroll pr-1">
            {sampleDatasets.map((ds) => (
              <div
                key={ds.id}
                className="p-3.5 rounded-xl bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 flex items-center justify-between hover:border-teal-500/60 hover:bg-white/80 dark:hover:bg-black/60 transition cursor-pointer group"
                onClick={() => {
                  handleLoadSampleDataset(ds.name);
                  setActiveNavModal(null);
                  setModalConfig(null);
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {ds.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ds.biasRisk === "High"
                          ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : ds.biasRisk === "Medium"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {ds.biasRisk === "High"
                        ? t("modals.high_risk", "High Risk")
                        : ds.biasRisk === "Medium"
                        ? t("modals.med_risk", "Medium Risk")
                        : t("modals.low_risk", "Low Risk")}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono flex items-center space-x-2">
                    <span>{ds.rows} {t("modals.records", "records")}</span>
                    <span>•</span>
                    <span>
                      {t("modals.protected", "Protected:")} <strong className="text-slate-700 dark:text-slate-300">{ds.protected}</strong>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/40 rounded-lg text-xs font-semibold hover:bg-teal-500/30 transition shrink-0 ml-3"
                >
                  {t("modals.load", "Load")}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (modalName === "Settings") {
      return (
        <div className="space-y-4 text-xs font-sans">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-800 dark:text-slate-200 font-semibold block text-sm">
                {t("modals.threshold_label", "Disparate Impact Threshold (EEOC 4/5ths Rule)")}
              </label>
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 font-mono font-bold text-xs">
                {(parseInt(complianceThreshold, 10) / 100).toFixed(2)} DP ({complianceThreshold}%)
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-2.5">
              {t("modals.threshold_desc", "Select or adjust the legal compliance standard used by the autonomous agent to flag biased models.")}
            </p>

            {/* Interactive Select Dropdown */}
            <select
              value={complianceThreshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium outline-none focus:border-teal-500 transition cursor-pointer mb-3"
            >
              <option value="80" className="dark:bg-[#0e1326] text-slate-900 dark:text-white">
                {t("modals.rule_80", "80 - Standard 4/5ths Rule (0.80 DP / 80% Parity)")}
              </option>
              <option value="85" className="dark:bg-[#0e1326] text-slate-900 dark:text-white">
                {t("modals.rule_85", "85 - Enhanced Compliance (0.85 DP / 85% Parity)")}
              </option>
              <option value="90" className="dark:bg-[#0e1326] text-slate-900 dark:text-white">
                {t("modals.rule_90", "90 - Strict Parity Standard (0.90 DP / 90% Parity)")}
              </option>
              <option value="95" className="dark:bg-[#0e1326] text-slate-900 dark:text-white">
                {t("modals.rule_95", "95 - Maximum Equity (0.95 DP / 95% Parity)")}
              </option>
            </select>

            {/* Interactive Range Slider */}
            <div className="p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{t("modals.slider_relaxed", "Relaxed (70%)")}</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {t("modals.slider_current", { val: complianceThreshold, defaultValue: `Current: ${complianceThreshold}% Floor` })}
                </span>
                <span>{t("modals.slider_max", "Maximum (95%)")}</span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                step="5"
                value={complianceThreshold}
                onChange={(e) => handleThresholdChange(e.target.value)}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* HITL Gate Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                {t("modals.hitl_gate_title", "Autonomous Remediation Approval")}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                {t("modals.hitl_gate_desc", "Require Human-in-the-Loop gate for high impact algorithmic fixes")}
              </span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 accent-teal-500 cursor-pointer rounded"
            />
          </div>

          {/* Active Frameworks */}
          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-black/30 border border-black/5 dark:border-white/10 space-y-1.5 text-[11px]">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              {t("modals.active_frameworks", "Active Regulatory Frameworks:")}
            </span>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 font-mono text-[10px]">
                EEOC 29 C.F.R. § 1607 (4/5ths Rule)
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-mono text-[10px]">
                NYC Local Law 144 (AEDT Bias Audit)
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 font-mono text-[10px]">
                EU AI Act Article 10 (Data Governance)
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (modalName === "Models") {
      return (
        <div className="space-y-3 text-xs font-sans">
          <p className="text-slate-600 dark:text-slate-300">
            {t("modals.models_desc", "Monitored models under continuous regulatory compliance checks:")}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10">
              <span className="text-teal-700 dark:text-teal-400 font-bold block text-sm">Loan_v3</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">XGBoost Underwriting</span>
              <span className="mt-2 inline-block px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                High Disparity Risk (0.82 DP)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10">
              <span className="text-teal-700 dark:text-teal-400 font-bold block text-sm">Fraud_v1</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Neural Fraud Detection</span>
              <span className="mt-2 inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                Remediated (91 Score)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10">
              <span className="text-teal-700 dark:text-teal-400 font-bold block text-sm">Rank_v3</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Deep Candidate Ranking</span>
              <span className="mt-2 inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                Remediated (89 Score)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10">
              <span className="text-teal-700 dark:text-teal-400 font-bold block text-sm">Triage_v2</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Clinical Triage Classifier</span>
              <span className="mt-2 inline-block px-2 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-semibold border border-teal-500/30">
                Compliant (DIR 0.96)
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (modalName === "Audits") {
      return (
        <div className="space-y-4 text-xs font-sans">
          <p className="text-slate-600 dark:text-slate-300">
            {t("modals.audits_desc", "Immutable ledger of autonomous and human-in-the-loop audit actions:")}
          </p>
          <div className="p-3.5 rounded-xl bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10 space-y-2 font-mono text-[11px]">
            <div className="text-emerald-700 dark:text-emerald-400 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              [2026-10-28 14:24] #D103 Gender Bias Remediated (DIR 0.91) • Kamiran-Calders Reweighting
            </div>
            <div className="text-emerald-700 dark:text-emerald-400 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              [2026-10-26 11:15] #D102 Age Bias Remediated (DIR 0.89) • Adversarial Debiasing
            </div>
            <div className="text-rose-700 dark:text-rose-400 p-2 rounded bg-rose-500/10 border border-rose-500/20">
              [2026-10-28 09:30] #D104 Race Disparity Flagged (DIR 0.82 &lt; 0.{complianceThreshold}) • Awaiting HITL
            </div>
          </div>

          {/* Persistent User Session Audit Trail */}
          <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
            <span className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                {t("modals.audit_trail_title", "Persistent User Session Audit Trail")}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {logs.length} {t("modals.events_localstorage", "events (localStorage)")}
              </span>
            </span>
            <div className="max-h-48 overflow-y-auto terminal-scroll space-y-1.5 pr-1">
              {logs.length === 0 ? (
                <p className="text-slate-400 italic font-mono text-[11px] p-2 bg-black/5 dark:bg-black/30 rounded-lg">
                  {t("modals.no_events", "No user actions recorded yet in this session.")}
                </p>
              ) : (
                logs.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-black/5 dark:bg-black/50 border border-black/5 dark:border-white/10 font-mono text-[10px] space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 font-bold">
                      <span>{item.action}</span>
                      <span className="text-slate-400 font-normal">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      {t("modals.operator", "Operator:")} <strong>{item.user}</strong>
                    </div>
                    {item.details && (
                      <div className="text-slate-500 dark:text-slate-400 truncate bg-black/5 dark:bg-black/40 px-1.5 py-0.5 rounded text-[9px]">
                        {JSON.stringify(item.details)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (modalName === "Help") {
      return <HelpModal />;
    }

    return null;
  };

  // Dashboard View
  return (
    <>
      <div className="min-h-screen w-full relative overflow-x-hidden flex flex-col bg-slate-50 text-slate-900 dark:bg-[#06030F] dark:text-slate-100 font-sans select-none selection:bg-teal-500/30 selection:text-teal-200">
        {/* High-Performance Interactive WebThreads Background */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-[#06030F] overflow-hidden">
          <WebThreads
            color1="#3000f1"
            color2="#08db01"
            color3="#fdc825"
            speed={0.25}
            threadCount={6}
            frequency={5.0}
            spread={0.18}
            taper={1.0}
            position={0.5}
            fanMode="center"
            glow={0.02}
            falloff={0.6}
            thickness={1.1}
            brightness={0.6}
            opacity={1.0}
            mirror={true}
            shimmer={true}
            grain={true}
            grainIntensity={0.05}
            mouseInteraction={true}
            mouseStrength={0.3}
            backgroundColor={isDark ? "#06030F" : "#F8FAFC"}
            lightMode={!isDark}
          />
          {/* Subtle radial vignette deepening edges for maximum card contrast */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#06030F_100%)] pointer-events-none opacity-60 dark:opacity-80" />
        </div>

        {/* Auth Modal (Accessible from Dashboard Header anytime) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthenticate={(name, email) => {
            handleAuthenticate(name, email);
          }}
        />

        {/* ==========================================
            1. GLOBAL DASHBOARD NAVIGATION (STICKY TOP FULL WIDTH)
           ========================================== */}
        <header className="w-full px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-black/40 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none z-50 sticky top-0">
          {/* Left: Logo & Navigation Tabs */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Origami Ribbon 'A' Logo with Enterprise Title */}
            <div
              onClick={() => setActiveNav("Dashboard")}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 3L4 26C4 26 8 29 16 29C24 29 28 26 28 26L16 3Z"
                  fill="url(#logo-grad)"
                  opacity="0.85"
                />
                <path
                  d="M16 7L8 23C11 25 15 25 16 25C17 25 21 25 24 23L16 7Z"
                  fill={isDark ? "#05050A" : "#f1f5f9"}
                />
                <path
                  d="M16 11L11 21C13 22 15 22 16 22C17 22 19 22 21 21L16 11Z"
                  fill="url(#logo-grad)"
                />
                <defs>
                  <linearGradient id="logo-grad" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2dd4bf" />
                    <stop offset="0.5" stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-lg sm:text-xl font-medium tracking-tight text-slate-900 dark:text-white font-sans">
                Aequitas
              </span>
            </div>

            {/* Navigation Pills */}
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { id: "Dashboard", label: t("nav.dashboard") },
                { id: "Datasets", label: t("nav.datasets") },
                { id: "Models", label: t("nav.models") },
                { id: "Audits", label: t("nav.audits") },
                { id: "Settings", label: t("nav.settings") },
                { id: "Help", label: t("nav.help") },
              ].map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                      if (item.id === "Dashboard") {
                        setActiveNavModal(null);
                        setModalConfig(null);
                      } else if (item.id === "Datasets") {
                        setIsDatasetModalOpen(true);
                        setActiveNavModal(null);
                        setModalConfig(null);
                      } else {
                        setActiveNavModal(item.id);
                        setModalConfig(null);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "bg-slate-200 text-slate-900 dark:bg-white/[0.08] dark:text-white border border-slate-300 dark:border-white/15 shadow-sm"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right-side Auth & Navigation Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher Dropdown */}
            <LanguageSwitcher />

            {/* Notification Bell with Badge */}
            <div ref={notificationBoxRef} className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition cursor-pointer ${
                  showNotifications
                    ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/30"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                title={t("nav.notifications")}
              >
                <Bell className="w-4 h-4" />
                {newNotificationsCount > 0 ? (
                  <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-teal-500 text-black flex items-center justify-center shadow-lg shadow-teal-500/50 ring-2 ring-white dark:ring-[#070b19] animate-pulse">
                    {newNotificationsCount > 99 ? "99+" : newNotificationsCount}
                  </span>
                ) : notifications.length > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 absolute top-1 right-1 ring-2 ring-white dark:ring-[#070b19]" />
                ) : null}
              </button>

              {/* Enhanced Rectangular Notification Box */}
              {showNotifications && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 top-12 w-[380px] sm:w-[460px] md:w-[500px] max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#0c1022]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/15 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] z-[100] text-xs font-sans overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {t("nav.security_alerts")}
                      </span>
                      {newNotificationsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                          {newNotificationsCount} NEW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/5">
                          {notifications.length} Total
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {newNotificationsCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          {t("nav.mark_all_read", "Mark all read")}
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-[11px] text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                        >
                          {t("nav.clear_all")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-white/5 bg-black/[0.02] dark:bg-black/20 text-[11px]">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setNotificationFilter("all")}
                        className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                          notificationFilter === "all"
                            ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        }`}
                      >
                        {t("nav.filter_all", "All")} ({notifications.length})
                      </button>
                      <button
                        onClick={() => setNotificationFilter("unread")}
                        className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                          notificationFilter === "unread"
                            ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        }`}
                      >
                        {t("nav.filter_unread", "Unread")} ({newNotificationsCount})
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                      {t("nav.telemetry_label", "Enterprise Telemetry")}
                    </span>
                  </div>

                  {/* Notification Items List */}
                  <div className="max-h-[340px] overflow-y-auto terminal-scroll p-3 space-y-2">
                    {(notificationFilter === "unread"
                      ? notifications.filter((n) => n.isNew)
                      : notifications
                    ).length === 0 ? (
                      <div className="py-8 text-center flex flex-col items-center justify-center space-y-2 text-slate-400 dark:text-slate-500">
                        <Bell className="w-8 h-8 opacity-30 text-teal-400" />
                        <p className="text-xs font-medium">
                          {notificationFilter === "unread"
                            ? t("nav.no_unread", "No new unread notifications.")
                            : t("nav.all_caught_up", "All caught up! No notifications.")}
                        </p>
                      </div>
                    ) : (
                      (notificationFilter === "unread"
                        ? notifications.filter((n) => n.isNew)
                        : notifications
                      ).map((note) => {
                        const isSuccess = note.type === "success";
                        const isWarning = note.type === "warning";
                        const isError = note.type === "error";

                        return (
                          <div
                            key={note.id}
                            onClick={() => {
                              if (note.isNew) {
                                setNotifications((prev) =>
                                  prev.map((n) =>
                                    n.id === note.id ? { ...n, isNew: false } : n
                                  )
                                );
                              }
                            }}
                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                              note.isNew
                                ? "bg-teal-500/[0.08] dark:bg-teal-950/30 border-teal-500/30 dark:border-teal-500/40 shadow-sm"
                                : "bg-black/[0.02] dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="shrink-0 mt-0.5">
                                {isSuccess ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                ) : isWarning ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                ) : isError ? (
                                  <X className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                                ) : (
                                  <Info className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 pr-4">
                                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium break-words">
                                  {note.text}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                                  <span className="text-slate-400 dark:text-slate-500 font-mono">
                                    {note.time}
                                  </span>
                                  {note.isNew && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-teal-500 text-black shadow-sm">
                                      NEW
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(note.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                                title="Dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2">
                    <button
                      onClick={() => {
                        addNotification(
                          `Live Telemetry [${new Date().toLocaleTimeString()}]: Monitored fairness parity across 14,250 rows. 0 violations.`,
                          "info"
                        );
                      }}
                      className="flex-1 py-1.5 bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold hover:bg-teal-500/30 transition cursor-pointer text-center"
                    >
                      {t("nav.trigger_alert")}
                    </button>
                    {newNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="py-1.5 px-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap"
                      >
                        {t("nav.dismiss_all_new", "Dismiss All New")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accessible Font-Size Scaling Toggle */}
            <div
              className="flex items-center bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-full p-0.5"
              role="group"
              aria-label="Font size selector"
            >
              {[
                { id: "normal" as const, label: "A", title: "Normal font size (100%)" },
                { id: "large" as const, label: "A+", title: "Large font size (115%)" },
                { id: "xlarge" as const, label: "A++", title: "Extra large font size (130%)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontSize(opt.id)}
                  aria-pressed={fontSize === opt.id}
                  aria-label={opt.title}
                  title={opt.title}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    fontSize === opt.id
                      ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Theme Toggle Pill */}
            <button
              type="button"
              onClick={toggleTheme}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-black/40 dark:hover:bg-black/60 border border-slate-200 dark:border-white/10 rounded-full px-2.5 py-1.5 flex items-center gap-1 text-xs transition cursor-pointer"
              title={t("nav.toggle_theme")}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Sun className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-amber-500"}`} />
              <Moon className={`w-3.5 h-3.5 ${isDark ? "text-indigo-400" : "text-slate-400"}`} />
            </button>

            {/* Header Divider */}
            <div className="h-5 w-px bg-slate-300 dark:bg-white/20 mx-1 sm:mx-2 hidden sm:block"></div>

            {/* Dynamic Authenticated User Badge & Account Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                onClick={() => {
                  if (username === "Guest") {
                    setIsAuthModalOpen(true);
                  }
                }}
                className={`flex items-center text-sm font-medium text-slate-800 dark:text-slate-200 ${
                  username === "Guest" ? "cursor-pointer hover:opacity-80" : ""
                }`}
                title={username === "Guest" ? t("nav.click_to_sign_in", "Click to Sign In") : t("nav.logged_in_as", { user: username, defaultValue: `Logged in as ${username}` })}
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-white/10 mr-1.5 sm:mr-2">
                  <span className="text-xs">👤</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white hidden sm:inline">
                  {username}
                </span>
              </div>

              {username === "Guest" ? (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded bg-teal-600 text-white dark:bg-teal-500 dark:text-black hover:bg-teal-500 dark:hover:bg-teal-400 transition-colors shadow-sm cursor-pointer"
                >
                  {t("nav.login")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    logAction("USER_LOGGED_OUT", { previousUser: username });
                    setUsername("Guest");
                    onUserChange?.("Guest");
                    triggerToast("Switched to Guest session.");
                  }}
                  className="px-2 sm:px-2.5 py-1 text-xs font-medium rounded border border-slate-300 dark:border-white/20 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Switch to Guest Session"
                >
                  {t("nav.switch")}
                </button>
              )}

              {/* Exit to Landing Page Button */}
              <button
                type="button"
                onClick={() => {
                  setView("landing");
                  triggerToast("Returned to Landing Page.");
                }}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded border border-slate-300 dark:border-white/20 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                title="Return to 3D Landing Page"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">{t("nav.exit")}</span>
              </button>
            </div>
          </div>
                </header>

        {/* ==========================================
            2. DASHBOARD MAIN CONTENT (3-ROW STRUCTURE)
           ========================================== */}
        <main className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 p-6 mt-4 relative z-10 flex-1">
          {/* Row 1: The 50/50 Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Left: CSV/Log Data Upload Card */}
            <div className="w-full h-full">
              <SpotlightCard className="w-full h-full bg-white/80 dark:bg-[#0A0A0A]/60 backdrop-blur-2xl rounded-2xl p-6 border border-slate-200 dark:border-white/[0.08] shadow-lg shadow-slate-900/5 dark:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/[0.02] hover:border-teal-500/30 dark:hover:border-white/[0.15] transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                {t("dashboard.upload_title")}
              </h3>
              {selectedFileName && (
                <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 truncate max-w-[200px]">
                  {selectedFileName}
                </span>
              )}
            </div>

            {/* Centered Dashed Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl flex-1 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all duration-200 group ${
                dragActive
                  ? "border-teal-500 bg-teal-500/10 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                  : "border-slate-300 dark:border-slate-600/70 hover:border-teal-500/80 bg-slate-50/70 dark:bg-black/20 hover:bg-slate-100/70 dark:hover:bg-black/35"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Upload Vector Icon matching reference */}
              <div className="w-10 h-10 mb-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:scale-110 transition-all duration-300">
                <ArrowUp className="w-5 h-5" />
              </div>

              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  {t("dashboard.upload_title")}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {t("dashboard.upload_drag")}{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-teal-600 dark:text-teal-400 underline underline-offset-2 hover:text-teal-700 dark:hover:text-teal-300 font-semibold cursor-pointer"
                  >
                    {t("dashboard.upload_browse")}
                  </button>
                </p>
              </div>

              {/* Quick Sample Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  processDataset(customerCreditV4Data, "Customer_Credit_V4.csv", "cloud");
                }}
                className="mt-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/25 transition flex items-center gap-1.5 text-[10px] font-semibold hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                <span>{t("dashboard.load_sample")}</span>
              </button>
            </div>
              </SpotlightCard>
            </div>

            {/* Right: AI Reasoning Stream Card */}
            <div className="w-full h-full">
              <SpotlightCard
                className={`w-full h-full bg-slate-950 backdrop-blur-2xl rounded-2xl p-0 border border-slate-800 shadow-xl ring-1 ring-slate-800/50 hover:border-slate-700 transition-all duration-300 relative overflow-hidden flex flex-col min-h-[260px] ${
                  isTerminalMinimized ? "h-[50px]" : isTerminalMaximized ? "h-[450px]" : "h-full"
                }`}
              >
                {/* Header with macOS Window Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0 select-none">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 mr-3">
                  <button onClick={() => { setTerminalLogs([]); triggerToast("Terminal logs cleared."); }} className="w-2.5 h-2.5 rounded-full bg-rose-500 hover:bg-rose-600 transition cursor-pointer" title="Clear Logs" />
                  <button onClick={() => setIsTerminalMinimized(!isTerminalMinimized)} className="w-2.5 h-2.5 rounded-full bg-amber-500 hover:bg-amber-600 transition cursor-pointer" title="Minimize" />
                  <button onClick={() => setIsTerminalMaximized(!isTerminalMaximized)} className="w-2.5 h-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 transition cursor-pointer" title="Maximize" />
                </div>
                <Terminal className="w-3.5 h-3.5 text-teal-400" />
                <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
                  {t("dashboard.terminal_title")}
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </div>

            {/* Inner Scrollable Console */}
            {!isTerminalMinimized && (
              <div
                ref={scrollTerminalRef}
                className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed text-slate-300 space-y-2 terminal-scroll bg-slate-950/80"
              >
                {terminalLogs.length === 0 ? (
                  <div className="h-full min-h-[140px] flex items-center justify-center text-slate-400 font-mono text-xs select-none">
                    <span className="text-teal-400 mr-2">[System Ready]</span>
                    <span>Awaiting dataset ingestion...</span>
                    <span className="animate-pulse text-teal-400 ml-1 font-bold">_</span>
                  </div>
                ) : (
                  <>
                    {terminalLogs.map((log, idx) => {
                      // Dynamically colorize BIASED and COMPLIANT
                      const parts = log.split(/(BIASED|COMPLIANT|\[HITL.*?\])/g);
                      
                      return (
                        <div key={idx} className="break-words font-mono text-xs">
                          {parts.map((part, i) => {
                            if (part === "BIASED") return <span key={i} className="text-rose-400 font-bold">{part}</span>;
                            if (part === "COMPLIANT") return <span key={i} className="text-emerald-400 font-bold">{part}</span>;
                            if (part.startsWith("[HITL")) return <span key={i} className="text-teal-400 font-bold">{part}</span>;
                            return <span key={i} className="text-slate-300">{part}</span>;
                          })}
                        </div>
                      );
                    })}
                    <div className="flex items-center space-x-1 pt-1">
                      <span className="animate-pulse text-teal-400">_</span>
                    </div>
                  </>
                )}
              </div>
            )}
              </SpotlightCard>
            </div>
          </div>

          {/* Real-Time Processing Transition Progress Card */}
          {isProcessing ? (
            <div className="w-full bg-slate-900/90 dark:bg-[#070b19]/90 backdrop-blur-2xl rounded-2xl border border-teal-500/40 p-8 sm:p-10 shadow-2xl ring-1 ring-teal-500/20 animate-fade-in flex flex-col items-center justify-center text-center space-y-4 my-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="w-3.5 h-3.5 rounded-full bg-teal-400 block animate-ping" />
                  <span className="w-3 h-3 rounded-full bg-teal-500 absolute inset-0" />
                </div>
                <span className="text-xs font-mono font-bold tracking-wider text-teal-400 uppercase">
                  Real-Time Telemetry Ingestion Engine
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {progress}%
                </span>
              </div>

              {/* Dynamic Status Message changing dynamically above progress bar */}
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight min-h-[28px] animate-pulse">
                {statusMessage}
              </h3>

              {/* Sleek, Glowing Progress Bar */}
              <div className="w-full max-w-xl bg-slate-800/90 rounded-full h-3.5 p-0.5 border border-teal-500/40 shadow-[0_0_20px_rgba(45,212,191,0.25)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-300 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(45,212,191,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                <span>WebSocket Stream Active</span>
                <span>•</span>
                <span>Calculating Intersectional Parity Matrices</span>
              </div>
            </div>
          ) : (
            <>
              {/* Row 2: Full Width Human-in-the-Loop */}
          <div className="w-full">
            {/* Human in the Loop Confirmation Card - Ensure its internal classes use w-full */}
            <div className="w-full bg-white/80 dark:bg-[#0A0A0A]/60 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-white/[0.08] p-6 shadow-lg shadow-slate-900/5 dark:shadow-2xl flex flex-col justify-between space-y-3.5">
              <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  {t("dashboard.hitl_title")}
                </h3>
                {hitlRemediationTarget && (
                  isRemediated ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 text-[10px] font-mono font-semibold">
                      {t("dashboard.hitl_remediated")}
                    </span>
                  ) : isRejected ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 text-[10px] font-mono font-semibold">
                      {t("dashboard.hitl_rejected")}
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )
                )}
              </div>

              {!hitlRemediationTarget ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/60 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-4 select-none">
                  <Sliders className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Awaiting System Analysis. Load a dataset to generate autonomous remediation proposals.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 space-y-2">
                  <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-600 dark:text-slate-400 font-mono">
                    {t("dashboard.hitl_approval_label")}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {hitlRemediationTarget.model} {t("dashboard.hitl_bias_remediation")}
                  </h4>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {t("dashboard.hitl_description", {
                      attribute: hitlRemediationTarget.attribute,
                      dataset: hitlRemediationTarget.dataset,
                    })}
                  </p>

                  {/* Before / After Progress Comparison Bars */}
                  <div className="pt-2 space-y-1.5 font-sans">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-400">
                      <span>{t("dashboard.hitl_before")}</span>
                      <span>{t("dashboard.hitl_after")}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Before Bar */}
                      <div className="flex-1 bg-slate-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-700 via-rose-600 to-rose-500"
                          style={{ width: `${Math.min(100, Math.round(hitlRemediationTarget.beforeDP * 100))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-slate-200">
                        {hitlRemediationTarget.beforeDP.toFixed(2)} DP
                      </span>

                      <span className="text-slate-500 dark:text-slate-400 font-bold px-1 text-xs">→</span>

                      {/* After Bar */}
                      <div className="flex-1 bg-slate-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                          style={{ width: `${Math.min(100, Math.round(hitlRemediationTarget.afterDP * 100))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {hitlRemediationTarget.afterDP.toFixed(2)} DP
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {hitlRemediationTarget && (
              <div className="space-y-2.5 pt-1">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleRejectRemediation}
                  disabled={isRemediated}
                  className={`px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600/80 bg-slate-100 hover:bg-rose-50 text-slate-800 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 dark:text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    isRemediated ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {t("dashboard.reject")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setModalConfig({
                      title: t("dashboard.disparity_metrics_title", "Disparity Metrics & Bias Breakdown"),
                      content: (
                        <div className="max-h-[500px] overflow-y-auto terminal-scroll pr-1">
                          <BiasCharts report={socketReport || SAMPLE_REPORT} />
                        </div>
                      ),
                    })
                  }
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600/80 bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                >
                  {t("dashboard.review_details")}
                </button>

                <button
                  type="button"
                  onClick={handleApproveRemediation}
                  disabled={isRemediated}
                  className={
                    isRemediated
                      ? "w-full sm:w-auto flex-1 px-6 py-2.5 bg-emerald-600/40 text-white dark:bg-emerald-500/50 dark:text-slate-900 font-bold text-xs uppercase tracking-wider rounded-lg cursor-default"
                      : "w-full sm:w-auto flex-1 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-teal-600/30 dark:shadow-[0_0_15px_rgba(20,184,166,0.4)] animate-pulse hover:animate-none cursor-pointer"
                  }
                >
                  {isRemediated ? t("dashboard.remediation_applied") : t("dashboard.approve")}
                </button>
              </div>

              {/* Export Official Audit Certificate (PDF) Button */}
              {isRemediated && (
                <button
                  type="button"
                  onClick={() => {
                    triggerToast("Generating Official Audit Certificate (PDF)...", "info");
                    generateAuditPDF("fairness-charts-container", {
                      datasetName: hitlRemediationTarget?.dataset || activeDataset?.name || "Customer_Credit_V4.csv",
                      appliedLaw: latestReport?.appliedLaw || "EU AI Act & Article 15",
                      beforeDP: hitlRemediationTarget?.beforeDP ?? 0.62,
                      afterDP: hitlRemediationTarget?.afterDP ?? 0.94,
                      modelName: hitlRemediationTarget?.model || "RiskNet_v3",
                      protectedAttribute: hitlRemediationTarget?.attribute || "Race / Gender",
                      auditorName: "Shounak Mondal - Lead AI Auditor",
                      totalRows: activeDataset?.rows || 14205,
                      fairnessScore: 94,
                    })
                      .then(() => {
                        triggerToast("Official Audit Certificate (PDF) downloaded successfully!", "success");
                        logAction("PDF_CERTIFICATE_EXPORTED", {
                          dataset: hitlRemediationTarget?.dataset,
                          status: "REMEDIATED",
                        });
                      })
                      .catch((err: any) => {
                        triggerToast(`PDF generation error: ${err?.message || "Unknown error"}`, "error");
                      });
                  }}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(45,212,191,0.35)] hover:shadow-[0_0_30px_rgba(45,212,191,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer animate-pulse"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export Official Audit Certificate (PDF)</span>
                </button>
              )}

              {/* Reset Option if Remediated */}
              {isRemediated && (
                <button
                  type="button"
                  onClick={handleResetDemonstration}
                  className="w-full py-1 text-center text-[10px] text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t("dashboard.reset_demo")}</span>
                </button>
              )}
              </div>
            )}

            {/* Subtle Helper Card underneath */}
            <button
              type="button"
              onClick={() =>
                setModalConfig({
                  title: t("dashboard.ongoing_checks", "Ongoing Fairness Checks"),
                  content: (
                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                      <div className="p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 space-y-1">
                        <span className="font-bold text-teal-700 dark:text-teal-400 block">EEOC 4/5ths Rule (Four-Fifths)</span>
                        <p>Ensures selection rates for any race, sex, or ethnic group are at least 80% of the highest selection rate.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 space-y-1">
                        <span className="font-bold text-teal-700 dark:text-teal-400 block">NYC Local Law 144</span>
                        <p>Requires annual independent bias audit of automated employment decision tools (AEDTs).</p>
                      </div>
                      <div className="p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 space-y-1">
                        <span className="font-bold text-teal-700 dark:text-teal-400 block">EU AI Act High-Risk Standard (Article 10)</span>
                        <p>Mandates data governance and technical bias mitigation prior to deployment in credit, employment, or biometric domains.</p>
                      </div>
                    </div>
                  ),
                })
              }
              className="w-full text-xs text-slate-700 dark:text-slate-400 bg-slate-100/80 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-center hover:border-teal-500/40 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              {t("dashboard.ongoing_checks")}
            </button>
            </div>
          </div>

          {/* Row 3: Full Width Projects & Vault Grouping */}
          <div className="w-full flex flex-col gap-6 bg-white/80 dark:bg-[#0A0A0A]/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/[0.08] p-6 shadow-lg shadow-slate-900/5 dark:shadow-2xl">
            {/* Audit Projects Card (Make this a subtle inner section without a heavy background) */}
            <div className="w-full pb-4 border-b border-slate-200 dark:border-white/[0.05]">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-300 mb-4">{t("projects.title")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-slate-100/90 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.05]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-medium">{t("projects.model_check")}</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-100/90 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.05]">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-medium">{t("projects.customer_data")}</span>
                </div>
              </div>
            </div>

            {/* Audit Vault Table */}
            <div className="w-full">
              {/* Table Header Controls */}
            <div className="flex items-center justify-between mb-4 z-10 shrink-0">
              <div className="flex items-center space-x-4">
                <h3 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  {t("vault.title")}
                </h3>

                {/* iOS Style Segmented Control: Records vs Charts */}
                <div className="flex p-1 space-x-1 bg-slate-200/80 dark:bg-white/[0.03] rounded-lg border border-slate-300 dark:border-white/[0.05]">
                  <button 
                    type="button"
                    onClick={() => setActiveVaultTab("Records")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      activeVaultTab === "Records"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-300/80 dark:bg-white/10 dark:text-white dark:border-white/[0.05]"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
                    }`}
                  >
                    {t("vault.records")}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveVaultTab("Charts")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      activeVaultTab === "Charts"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-300/80 dark:bg-white/10 dark:text-white dark:border-white/[0.05]"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>{t("vault.charts")}</span>
                  </button>
                </div>
              </div>

              {/* Table Options Button */}
              <button
                onClick={() =>
                  setModalConfig({
                    title: t("vault.options_title"),
                    content: (
                      <div className="space-y-3 text-xs font-sans">
                        <p className="text-slate-600 dark:text-slate-300">{t("vault.options_desc", "Export verified fairness records for external compliance submission:")}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              triggerToast("Exported 3 records to JSON compliance schema.");
                              setModalConfig(null);
                            }}
                            className="flex-1 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-500 cursor-pointer"
                          >
                            {t("vault.export_json")}
                          </button>
                          <button
                            onClick={() => {
                              triggerToast("Exported 3 records to CSV compliance schema.");
                              setModalConfig(null);
                            }}
                            className="flex-1 py-2 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-white/20 cursor-pointer"
                          >
                            {t("vault.export_csv")}
                          </button>
                        </div>
                      </div>
                    ),
                  })
                }
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition p-1 cursor-pointer"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Interactive Table or FairnessCharts */}
            {activeVaultTab === "Charts" ? (
              <div className="overflow-y-auto terminal-scroll z-10 flex-1 pr-1">
                <FairnessCharts report={latestReport} isDark={isDark} />
              </div>
            ) : (
              <div className="overflow-x-auto terminal-scroll z-10 flex-1">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.02] text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pb-2">
                      <th className="py-2.5 pr-2">{t("vault.th_id")}</th>
                      <th className="py-2.5 px-2">{t("vault.th_data")}</th>
                      <th className="py-2.5 px-2">{t("vault.th_date")}</th>
                      <th className="py-2.5 px-2">{t("vault.th_model")}</th>
                      <th className="py-2.5 px-2">{t("vault.th_attribute")}</th>
                      <th className="py-2.5 px-2 text-center">{t("vault.th_status")}</th>
                      <th className="py-2.5 pl-2 text-center">{t("vault.th_score")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-sans">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-xs font-mono text-slate-500 dark:text-slate-400 select-none"
                        >
                          No recent audits found in the active session.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                      const isSelected = selectedRowId === row.id;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedRowId(row.id);
                            setModalConfig({
                              title: `${t("vault.audit_details_prefix", "Audit Details:")} ${row.name}`,
                              content: (
                                <div className="space-y-3 text-xs font-sans">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
                                      <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-mono block">{t("vault.record_id", "Record ID")}</span>
                                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{row.id}</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
                                      <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-mono block">{t("vault.target_model", "Target Model")}</span>
                                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{row.model}</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
                                      <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-mono block">{t("vault.protected_attr", "Protected Attribute")}</span>
                                      <span className="font-semibold text-slate-900 dark:text-white">{row.attribute}</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
                                      <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-mono block">{t("vault.fairness_score", "Fairness Score")}</span>
                                      <span className="font-bold text-teal-600 dark:text-teal-400">{row.score} / 100</span>
                                    </div>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
                                    <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-mono block mb-1">{t("vault.status_verdict", "Status Verdict")}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border inline-block ${
                                      row.status === "biased"
                                        ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                                        : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                    }`}>
                                      {row.status === "biased" ? t("vault.status_biased") : t("vault.status_remediated")}
                                    </span>
                                  </div>
                                </div>
                              ),
                            });
                          }}
                          className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-200 dark:border-white/[0.03] last:border-0 cursor-pointer group ${
                            isSelected ? "bg-teal-50/60 dark:bg-white/[0.03]" : ""
                          }`}
                        >
                          {/* ID */}
                          <td className="py-3 pr-2 font-mono text-slate-600 dark:text-slate-400 text-xs font-medium">
                            {row.id}
                          </td>

                          {/* DATA NAME */}
                          <td className="py-3 px-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                              {row.name}
                            </span>
                          </td>

                          {/* DATE */}
                          <td className="py-3 px-2 text-slate-500 dark:text-slate-500 text-xs font-mono">
                            {row.date}
                          </td>

                          {/* MODEL */}
                          <td className="py-3 px-2 text-slate-800 dark:text-slate-300 font-mono text-xs font-medium">
                            {row.model}
                          </td>

                          {/* PROTECTED ATTRIBUTE */}
                          <td className="py-3 px-2">
                            {row.attributeColor === "rose" && (
                              <span className="bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 rounded-full px-3 py-0.5 text-xs font-semibold inline-block">
                                {row.attribute}
                              </span>
                            )}
                            {row.attributeColor === "cyan" && (
                              <span className="bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 rounded-full px-3 py-0.5 text-xs font-semibold inline-block">
                                {row.attribute}
                              </span>
                            )}
                            {row.attributeColor === "purple" && (
                              <span className="bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40 rounded-full px-3 py-0.5 text-xs font-semibold inline-block">
                                {row.attribute}
                              </span>
                            )}
                          </td>

                          {/* BIAS STATUS */}
                          <td className="py-3 px-2 text-center">
                            {row.status === "biased" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
                                {t("vault.status_biased")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                                {t("vault.status_remediated")}
                              </span>
                            )}
                          </td>

                          {/* SCORE CIRCLE */}
                          <td className="py-3 pl-2 text-center">
                            {row.score < 80 ? (
                              <div className="w-7 h-7 rounded-full border border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-400 text-xs font-bold flex items-center justify-center mx-auto shadow-sm">
                                {row.score}
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full border border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-bold flex items-center justify-center mx-auto shadow-sm">
                                {row.score}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </div>
          </>
        )}
        </main>

      {/* Dataset Repository Modal */}
      <DatasetModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        onSelectDataset={(name, rows) => {
          processDataset(rows, name, "cloud");
        }}
      />

      {/* Global Interactive Modal */}
      {(activeNavModal || modalConfig) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-white/95 dark:bg-[#0f1428]/95 border border-black/10 dark:border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-medium tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {modalConfig ? modalConfig.title : getModalTitle(activeNavModal)}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveNavModal(null);
                  setModalConfig(null);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto terminal-scroll">
              {modalConfig ? modalConfig.content : renderNavModalContent(activeNavModal)}
            </div>

            <div className="flex justify-end pt-2 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveNavModal(null);
                  setModalConfig(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white text-xs font-semibold transition cursor-pointer"
              >
                {t("modal.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export function App() {
  const [activeUser, setActiveUser] = useState<string>("Guest");

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <UserActivityProvider currentUser={activeUser}>
          <AppContent currentUser={activeUser} onUserChange={setActiveUser} />
        </UserActivityProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
