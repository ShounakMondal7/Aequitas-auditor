export interface IntersectionalSubgroup {
  subgroup: string; // e.g. "[Black + Female]" or "[Age > 50 + Female]"
  attribute1: string;
  value1: string;
  attribute2: string;
  value2: string;
  selectionRate: number;
  total: number;
  favorable: number;
  disparateImpactRatio: number;
  isBiased: boolean;
  severity: "severe" | "moderate" | "compliant";
  warningText?: string;
}

export interface IntersectionalMatrix {
  pair: [string, string]; // [Attr1, Attr2], e.g. ["race", "gender"]
  privilegedSubgroup: string;
  privilegedRate: number;
  subgroups: IntersectionalSubgroup[];
  severeBiasedCount: number;
}

export interface FairnessReport {
  datasetName: string;
  totalRows: number;
  protectedAttribute: string;
  privilegedGroup: string;
  unprivilegedGroup: string;
  privilegedSelectionRate: number;
  unprivilegedSelectionRate: number;
  disparateImpactRatio: number; // unprivileged_rate / privileged_rate
  isBiased: boolean; // true if DIR < complianceThreshold
  score: number; // 0 - 100 fairness score
  timestamp: string;
  appliedLaw: string;
  intersectionalMetrics?: IntersectionalMatrix;
}

export const GLOBAL_PROTECTED_ATTRIBUTES = [
  'gender',
  'sex',
  'race',
  'ethnicity',
  'age',
  'caste',
  'religion',
  'disability',
  'nationality',
  'marital_status',
  'place_of_birth',
];

export function detectProtectedColumn(fields: string[]): string | undefined {
  const normalized = fields.map((f) => f.trim().toLowerCase());
  // 1. Exact match
  for (const attr of GLOBAL_PROTECTED_ATTRIBUTES) {
    const idx = normalized.indexOf(attr);
    if (idx !== -1) return fields[idx];
  }
  // 2. Regex / prefix match
  const pattern = new RegExp(`^(${GLOBAL_PROTECTED_ATTRIBUTES.join('|')})`, 'i');
  return fields.find((f) => pattern.test(f.trim()));
}

export function detectAllProtectedColumns(fields: string[]): string[] {
  const normalized = fields.map((f) => f.trim().toLowerCase());
  const detected: string[] = [];

  for (let i = 0; i < fields.length; i++) {
    const raw = fields[i];
    const norm = normalized[i];
    const isProtected = GLOBAL_PROTECTED_ATTRIBUTES.some(
      (attr) => norm === attr || new RegExp(`^(${attr})`, 'i').test(norm)
    );
    if (isProtected && !detected.includes(raw)) {
      detected.push(raw);
    }
  }

  return detected;
}

export function evaluateFairness(
  data: Record<string, any>[],
  protectedCol: string,
  favorableCol: string,
  threshold: number = 0.80,
  datasetName: string = 'Custom_Audit.csv'
): FairnessReport {
  const groups: Record<string, { total: number; favorable: number }> = {};

  data.forEach((row) => {
    const rawGroup = String(row[protectedCol] ?? 'Unknown').trim();
    const rawOutcome = String(row[favorableCol] ?? '').trim().toLowerCase();

    // Normalize favorable outcomes (1, true, approved, yes, pass, hired)
    const isFavorable = ['1', 'true', 'approved', 'yes', 'pass', 'hired'].includes(rawOutcome);

    if (!groups[rawGroup]) {
      groups[rawGroup] = { total: 0, favorable: 0 };
    }
    groups[rawGroup].total += 1;
    if (isFavorable) {
      groups[rawGroup].favorable += 1;
    }
  });

  const groupKeys = Object.keys(groups);
  if (groupKeys.length < 2) {
    throw new Error('The selected protected attribute column requires at least two distinct groups.');
  }

  // Calculate selection rates
  const rates = groupKeys.map((group) => ({
    group,
    rate: groups[group].total > 0 ? groups[group].favorable / groups[group].total : 0,
    count: groups[group].total,
  }));

  // Identify highest selection rate (privileged) and lowest (unprivileged)
  rates.sort((a, b) => b.rate - a.rate);
  const privileged = rates[0];
  const unprivileged = rates[rates.length - 1];

  const disparateImpactRatio = privileged.rate > 0 ? unprivileged.rate / privileged.rate : 1.0;

  // Define the mathematical thresholds based on global regulatory frameworks
  let complianceThreshold = 0.80; // Default: US EEOC 4/5ths Rule
  let appliedLaw = "US EEOC Guidelines";

  const attribute = protectedCol.toLowerCase();

  // Strict Indian Constitutional & NITI Aayog Principles
  // Caste, religion, sex, and place of birth require near-absolute parity under Article 15.
  if (['caste', 'religion', 'sex', 'gender', 'place_of_birth', 'nationality'].includes(attribute)) {
    complianceThreshold = 0.95; 
    appliedLaw = "Article 15 (India) & NITI Aayog Responsible AI";
  } 
  // EU AI Act & India DPDP Act automated decision thresholds
  else if (['age', 'marital_status', 'disability'].includes(attribute)) {
    complianceThreshold = 0.90;
    appliedLaw = "India DPDP Act 2023 / EU AI Act";
  }

  // Evaluate bias against the dynamically selected threshold
  const isBiased = disparateImpactRatio < complianceThreshold;
  const score = Math.min(100, Math.round(disparateImpactRatio * 100));

  // ==============================================================
  // INTERSECTIONAL BIAS MATRIX EVALUATION
  // Detect overlapping pairs of demographic attributes (e.g., Race x Gender)
  // ==============================================================
  let intersectionalMetrics: IntersectionalMatrix | undefined = undefined;

  const allProtected = detectAllProtectedColumns(Object.keys(data[0] || {}));
  // Find a secondary protected attribute distinct from the primary one
  const secondaryAttr = allProtected.find((col) => col.toLowerCase() !== protectedCol.toLowerCase());

  if (secondaryAttr) {
    const compoundGroups: Record<string, { total: number; favorable: number; val1: string; val2: string }> = {};

    data.forEach((row) => {
      const v1 = String(row[protectedCol] ?? 'Unknown').trim();
      const v2 = String(row[secondaryAttr] ?? 'Unknown').trim();
      const rawOutcome = String(row[favorableCol] ?? '').trim().toLowerCase();
      const isFavorable = ['1', 'true', 'approved', 'yes', 'pass', 'hired'].includes(rawOutcome);

      const key = `[${v1} + ${v2}]`;
      if (!compoundGroups[key]) {
        compoundGroups[key] = { total: 0, favorable: 0, val1: v1, val2: v2 };
      }
      compoundGroups[key].total += 1;
      if (isFavorable) {
        compoundGroups[key].favorable += 1;
      }
    });

    const compoundEntries = Object.entries(compoundGroups)
      .filter(([_, stats]) => stats.total >= 5) // Minimum sample threshold
      .map(([key, stats]) => ({
        key,
        val1: stats.val1,
        val2: stats.val2,
        total: stats.total,
        favorable: stats.favorable,
        rate: stats.total > 0 ? stats.favorable / stats.total : 0,
      }));

    if (compoundEntries.length >= 2) {
      compoundEntries.sort((a, b) => b.rate - a.rate);
      const privilegedCompound = compoundEntries[0];
      const privilegedCompoundRate = privilegedCompound.rate > 0 ? privilegedCompound.rate : 1.0;

      let severeBiasedCount = 0;
      const subgroups: IntersectionalSubgroup[] = compoundEntries.map((item) => {
        const dir = parseFloat((item.rate / privilegedCompoundRate).toFixed(3));
        const itemBiased = dir < complianceThreshold;
        const severity: "severe" | "moderate" | "compliant" = 
          dir < 0.65 ? "severe" : dir < complianceThreshold ? "moderate" : "compliant";

        if (severity === "severe") severeBiasedCount += 1;

        let warningText: string | undefined = undefined;
        if (itemBiased) {
          warningText = `Warning: ${severity === "severe" ? "Severe" : "Moderate"} bias detected for subgroup ${item.key} (${dir.toFixed(2)} DP)`;
        }

        return {
          subgroup: item.key,
          attribute1: protectedCol,
          value1: item.val1,
          attribute2: secondaryAttr,
          value2: item.val2,
          selectionRate: parseFloat((item.rate * 100).toFixed(1)),
          total: item.total,
          favorable: item.favorable,
          disparateImpactRatio: dir,
          isBiased: itemBiased,
          severity,
          warningText,
        };
      });

      intersectionalMetrics = {
        pair: [protectedCol, secondaryAttr],
        privilegedSubgroup: privilegedCompound.key,
        privilegedRate: parseFloat((privilegedCompound.rate * 100).toFixed(1)),
        subgroups,
        severeBiasedCount,
      };
    }
  }

  return {
    datasetName,
    totalRows: data.length,
    protectedAttribute: protectedCol,
    privilegedGroup: `${privileged.group} (${(privileged.rate * 100).toFixed(1)}%)`,
    unprivilegedGroup: `${unprivileged.group} (${(unprivileged.rate * 100).toFixed(1)}%)`,
    privilegedSelectionRate: privileged.rate,
    unprivilegedSelectionRate: unprivileged.rate,
    disparateImpactRatio: parseFloat(disparateImpactRatio.toFixed(3)),
    isBiased,
    score,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    appliedLaw,
    intersectionalMetrics,
  };
}
