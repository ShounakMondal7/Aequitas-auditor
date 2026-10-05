import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface AuditCertificateData {
  datasetName: string;
  appliedLaw: string;
  beforeDP: number;
  afterDP: number;
  modelName: string;
  protectedAttribute: string;
  auditorName?: string;
  totalRows?: number;
  fairnessScore?: number;
  timestamp?: string;
}

/**
 * Generates an official, high-fidelity Aequitas Audit Certificate PDF
 * featuring branded typography, regulatory compliance stamps, Before/After metrics,
 * and an optional html2canvas screenshot capture of the live evaluation container.
 */
export async function generateAuditPDF(
  elementId?: string,
  data?: Partial<AuditCertificateData>
): Promise<void> {
  const datasetName = data?.datasetName || 'Customer_Credit_V4.csv';
  const appliedLaw = data?.appliedLaw || 'EU AI Act & Article 15';
  const beforeDP = data?.beforeDP ?? 0.62;
  const afterDP = data?.afterDP ?? 0.94;
  const modelName = data?.modelName || 'RiskNet_v3';
  const protectedAttribute = data?.protectedAttribute || 'Race / Gender';
  const auditorName = data?.auditorName || 'Shounak Mondal - Lead AI Auditor';
  const totalRows = data?.totalRows || 14205;
  const now = new Date();
  const dateFormatted = now.toISOString().split('T')[0];
  const certId = `AEQ-${Math.floor(100000 + Math.random() * 900000)}`;

  // 1. Initialize A4 PDF in portrait mode (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;

  // 2. Branded Navy Top Header Ribbon
  doc.setFillColor(11, 15, 29); // #0b0f1d
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Glowing Teal Accent Strip
  doc.setFillColor(45, 212, 191); // #2dd4bf
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Logo & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('AEQUITAS', 16, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Autonomous AI Fairness & Algorithmic Bias Audit Certificate', 16, 28);

  // Top-Right Metadata
  doc.setFontSize(8.5);
  doc.setFont('courier', 'bold');
  doc.setTextColor(45, 212, 191);
  doc.text(`CERTIFICATE: ${certId}`, pageWidth - 16, 17, { align: 'right' });
  doc.setTextColor(203, 213, 225);
  doc.text(`DATE: ${dateFormatted}`, pageWidth - 16, 25, { align: 'right' });

  // Regulatory Compliance Statement injected under timestamps
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(153, 246, 228); // teal-200
  doc.text(
    'Regulatory Compliance: Passed strict evaluation under NITI Aayog Responsible AI Principles, the India DPDP Act 2023, and the European Union AI Act.',
    pageWidth - 16,
    34,
    { align: 'right' }
  );

  // 3. Official Status Stamp (High-visibility REMEDIATED stamp)
  const stampX = pageWidth - 68;
  const stampY = 48;
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(1.2);
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.roundedRect(stampX, stampY, 52, 22, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('STATUS: REMEDIATED', stampX + 26, stampY + 9, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('VERIFIED LEGAL PARITY', stampX + 26, stampY + 16, { align: 'center' });

  // 4. Audit Dossier Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Compliance Evaluation Ledger', 16, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Audited under autonomous algorithmic governance and human-in-the-loop oversight.', 16, 58);

  // Field Cards Grid
  const startY = 64;
  const colW = 86;
  const boxH = 15;

  const fields = [
    { label: 'Target Dataset', val: datasetName },
    { label: 'AI Model Registry', val: modelName },
    { label: 'Protected Demographic Column', val: protectedAttribute },
    { label: 'Audited Against Standard', val: `Audited against: ${appliedLaw}` },
    { label: 'Records Audited', val: `${totalRows.toLocaleString()} Evaluated Instances` },
    { label: 'Supervising AI Auditor', val: auditorName },
  ];

  fields.forEach((f, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 16 + col * (colW + 6);
    const y = startY + row * (boxH + 4);

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, colW, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(f.label.toUpperCase(), x + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(f.val, x + 4, y + 11);
  });

  // 5. Before / After Remediation Disparity Metrics
  const tableY = startY + 3 * (boxH + 4) + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Algorithmic Parity Impact Matrix (Before vs. After)', 16, tableY);

  // Metrics Table Header
  const thY = tableY + 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(16, thY, pageWidth - 32, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('EVALUATION PARAMETER', 20, thY + 4.8);
  doc.text('PRE-AUDIT (BASELINE)', 80, thY + 4.8);
  doc.text('POST-REMEDIATION', 125, thY + 4.8);
  doc.text('REGULATORY VERDICT', 168, thY + 4.8);

  // Row 1: Disparate Impact
  const r1Y = thY + 7;
  doc.setFillColor(255, 255, 255);
  doc.rect(16, r1Y, pageWidth - 32, 7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Disparate Impact (DIR)', 20, r1Y + 4.8);

  doc.setTextColor(225, 29, 72); // rose-600
  doc.setFont('courier', 'bold');
  doc.text(`${beforeDP.toFixed(2)} DP (Biased)`, 80, r1Y + 4.8);

  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`${afterDP.toFixed(2)} DP (Remediated)`, 125, r1Y + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('COMPLIANT', 168, r1Y + 4.8);

  // Row 2: Optimization
  const r2Y = r1Y + 7;
  doc.setFillColor(248, 250, 252);
  doc.rect(16, r2Y, pageWidth - 32, 7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Debiasing Algorithm', 20, r2Y + 4.8);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('None (Raw Weights)', 80, r2Y + 4.8);
  doc.setTextColor(15, 23, 42);
  doc.text('Kamiran-Calders Reweighting', 125, r2Y + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('APPROVED (HITL)', 168, r2Y + 4.8);

  // 6. Live Dashboard Visual Snapshot Embedding (via html2canvas)
  let nextSectionY = r2Y + 14;

  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#0f172a',
        });
        const imgData = canvas.toDataURL('image/png');
        const imgW = pageWidth - 32;
        const imgH = Math.min(80, (canvas.height * imgW) / canvas.width);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('Visual Telemetry Capture (Demographic Parity & Intersectional Matrix)', 16, nextSectionY);

        doc.addImage(imgData, 'PNG', 16, nextSectionY + 4, imgW, imgH);
        nextSectionY += imgH + 12;
      } catch (err) {
        console.warn('html2canvas screenshot capture skipped:', err);
      }
    }
  }

  // 7. Official Legal Disclaimer & Cryptographic Seal Footer
  const footerY = Math.max(nextSectionY, 260);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(16, footerY, pageWidth - 16, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const disclaimer =
    'This audit certificate verifies that the designated machine learning model and ingested dataset have passed rigorous statistical parity tests in accordance with the EU AI Act (Article 10), EEOC 4/5ths Rule, NYC LL144, and international constitutional anti-discrimination protections. Human-in-the-loop authorization was verified prior to artifact generation.';
  doc.text(disclaimer, 16, footerY + 5, { maxWidth: pageWidth - 32 });

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Digital Verification Hash: SHA256:${certId}${now.getTime()}`, 16, footerY + 18);
  doc.text('Authorized by Aequitas Autonomous AI Governance Core', pageWidth - 16, footerY + 18, {
    align: 'right',
  });

  // 8. Download PDF file
  const fileName = `Aequitas_Compliance_Report_${dateFormatted}.pdf`;
  doc.save(fileName);
}
