import { GoogleGenerativeAI } from '@google/generative-ai';
import { FairnessReport } from '../utils/fairnessMetrics';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');

export const generateFairnessAnalysis = async (report: FairnessReport): Promise<string[]> => {
  if (!API_KEY) {
    return [
      "[SYSTEM ERROR]: Missing VITE_GEMINI_API_KEY.",
      `> Fallback Analysis: Disparate Impact Ratio is ${report.disparateImpactRatio}.`,
    ];
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are the core intelligence of "Aequitas", an enterprise AI fairness auditing platform.
      Analyze the following dataset evaluation and provide a highly technical, concise, 3-bullet-point reasoning log suitable for a terminal output.

      Context: 
      - If the attribute is Race/Gender/Age in the US, reference EEOC 4/5ths Rule.
      - If the attribute is Caste/Religion, reference Constitutional anti-discrimination principles (e.g., Article 15) and ethical AI RAG frameworks.
      - If analyzing European data, reference the EU AI Act (Article 10).

      Dataset: ${report.datasetName}
      Protected Attribute: ${report.protectedAttribute}
      Privileged Group Rate: ${report.privilegedGroup}
      Unprivileged Group Rate: ${report.unprivilegedGroup}
      Disparate Impact Ratio: ${report.disparateImpactRatio}
      Status: ${report.isBiased ? 'BIASED (Fails Compliance Threshold)' : 'COMPLIANT'}
      Enforced Global Regulatory Standard: ${report.appliedLaw}

      Format strictly as 3 terminal log lines without markdown bolding (**).
      Example:
      [ANALYSIS] Disparate impact detected in ${report.protectedAttribute} selection rates...
      [COMPLIANCE] Flagged for potential violation of [Insert Relevant Global Law/Framework]...
      [RECOMMENDATION] Initiate Kamiran-Calders reweighting protocol...
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Split by newlines and clean up empty lines
    return text.split('\n').filter((line) => line.trim().length > 0);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return ["[SYSTEM ERROR]: Failed to connect to Aequitas reasoning engine. Check API key limits."];
  }
};
