// Enterprise Benchmark Datasets for Autonomous AI Fairness Auditing

export const sampleCreditData = [
  ...Array.from({ length: 120 }, () => ({ age: '>=25', gender: 'Male', ethnicity: 'Group_A', approved: '1' })),
  ...Array.from({ length: 40 }, () => ({ age: '>=25', gender: 'Male', ethnicity: 'Group_A', approved: '0' })),
  ...Array.from({ length: 45 }, () => ({ age: '<25', gender: 'Female', ethnicity: 'Group_B', approved: '1' })),
  ...Array.from({ length: 95 }, () => ({ age: '<25', gender: 'Female', ethnicity: 'Group_B', approved: '0' })),
];

// 1. Q3_Loan_Applications.csv (Protected Attribute: Race, Secondary: Gender, 1,250 rows)
// Demonstrates Disparate Impact under US EEOC 4/5ths Rule & Intersectional Bias
export const q3LoanApplicationsData = [
  // White: 650 applicants, 520 approved (80.0%), 130 denied (20.0%)
  ...Array.from({ length: 520 }, (_, i) => ({
    applicant_id: `APP-W-${1000 + i}`,
    race: 'White',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    credit_score: 720 + (i % 80),
    income: 85000 + (i % 25000),
    loan_amount: 320000,
    approved: '1',
  })),
  ...Array.from({ length: 130 }, (_, i) => ({
    applicant_id: `APP-W-${2000 + i}`,
    race: 'White',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    credit_score: 640 + (i % 60),
    income: 62000 + (i % 15000),
    loan_amount: 280000,
    approved: '0',
  })),
  // Black: 300 applicants, 150 approved (50.0%), 150 denied (50.0%) -> 50% vs 80% = DIR 0.625 (Violation)
  // Intersectional: Black Female: 160 total (58 approved = 36.2% -> severe compound disparity vs White Male 81%)
  ...Array.from({ length: 150 }, (_, i) => ({
    applicant_id: `APP-B-${3000 + i}`,
    race: 'Black',
    gender: i < 58 ? 'Female' : 'Male',
    credit_score: 690 + (i % 70),
    income: 78000 + (i % 20000),
    loan_amount: 300000,
    approved: '1',
  })),
  ...Array.from({ length: 150 }, (_, i) => ({
    applicant_id: `APP-B-${4000 + i}`,
    race: 'Black',
    gender: i < 102 ? 'Female' : 'Male',
    credit_score: 630 + (i % 60),
    income: 59000 + (i % 18000),
    loan_amount: 260000,
    approved: '0',
  })),
  // Hispanic: 200 applicants, 110 approved (55.0%), 90 denied (45.0%)
  ...Array.from({ length: 110 }, (_, i) => ({
    applicant_id: `APP-H-${5000 + i}`,
    race: 'Hispanic',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    credit_score: 700 + (i % 70),
    income: 80000 + (i % 22000),
    loan_amount: 310000,
    approved: '1',
  })),
  ...Array.from({ length: 90 }, (_, i) => ({
    applicant_id: `APP-H-${6000 + i}`,
    race: 'Hispanic',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    credit_score: 635 + (i % 55),
    income: 61000 + (i % 16000),
    loan_amount: 270000,
    approved: '0',
  })),
  // Asian: 100 applicants, 78 approved (78.0%), 22 denied (22.0%)
  ...Array.from({ length: 78 }, (_, i) => ({
    applicant_id: `APP-A-${7000 + i}`,
    race: 'Asian',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    credit_score: 730 + (i % 70),
    income: 92000 + (i % 30000),
    loan_amount: 350000,
    approved: '1',
  })),
  ...Array.from({ length: 22 }, (_, i) => ({
    applicant_id: `APP-A-${8000 + i}`,
    race: 'Asian',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    credit_score: 645 + (i % 50),
    income: 64000 + (i % 14000),
    loan_amount: 290000,
    approved: '0',
  })),
];

// 2. 2025_Tech_Hiring_Pipeline.csv (Protected Attribute: Gender, Secondary: Age, 850 rows)
// Demonstrates NYC Local Law 144 / EEOC gender disparity & Intersectional Age x Gender
export const techHiringPipelineData = [
  // Male: 500 candidates, 340 hired (68.0%), 160 rejected (32.0%)
  ...Array.from({ length: 340 }, (_, i) => ({
    candidate_id: `CAND-M-${1000 + i}`,
    gender: 'Male',
    age: i % 3 === 0 ? '>50' : '<=50',
    years_experience: 3 + (i % 10),
    technical_assessment_score: 78 + (i % 22),
    role: 'Senior Software Engineer',
    hired: '1',
  })),
  ...Array.from({ length: 160 }, (_, i) => ({
    candidate_id: `CAND-M-${2000 + i}`,
    gender: 'Male',
    age: i % 3 === 0 ? '>50' : '<=50',
    years_experience: 2 + (i % 8),
    technical_assessment_score: 65 + (i % 20),
    role: 'Fullstack Engineer',
    hired: '0',
  })),
  // Female: 300 candidates, 120 hired (40.0%), 180 rejected (60.0%) -> 40% vs 68% = DIR 0.588 (Violation)
  // Subgroup [Female + >50]: e.g., 100 total, 32 hired = 32% (Severe compound bias 0.44 DP vs Male <=50 at 72%)
  ...Array.from({ length: 120 }, (_, i) => ({
    candidate_id: `CAND-F-${3000 + i}`,
    gender: 'Female',
    age: i < 32 ? '>50' : '<=50',
    years_experience: 4 + (i % 10),
    technical_assessment_score: 82 + (i % 18),
    role: 'Machine Learning Specialist',
    hired: '1',
  })),
  ...Array.from({ length: 180 }, (_, i) => ({
    candidate_id: `CAND-F-${4000 + i}`,
    gender: 'Female',
    age: i < 68 ? '>50' : '<=50',
    years_experience: 2 + (i % 7),
    technical_assessment_score: 68 + (i % 18),
    role: 'Frontend Architect',
    hired: '0',
  })),
  // Non-binary: 50 candidates, 21 hired (42.0%), 29 rejected (58.0%)
  ...Array.from({ length: 21 }, (_, i) => ({
    candidate_id: `CAND-NB-${5000 + i}`,
    gender: 'Non-binary',
    age: i % 2 === 0 ? '>50' : '<=50',
    years_experience: 3 + (i % 8),
    technical_assessment_score: 79 + (i % 20),
    role: 'DevOps Engineer',
    hired: '1',
  })),
  ...Array.from({ length: 29 }, (_, i) => ({
    candidate_id: `CAND-NB-${6000 + i}`,
    gender: 'Non-binary',
    age: i % 2 === 0 ? '>50' : '<=50',
    years_experience: 2 + (i % 6),
    technical_assessment_score: 66 + (i % 18),
    role: 'QA Automation Engineer',
    hired: '0',
  })),
];

// 3. Customer_Credit_V4.csv (Protected Attribute: Age, Secondary: Gender, 600 rows)
// Demonstrates EU AI Act Article 10 age disparity & Intersectional Age x Gender
export const customerCreditV4Data = [
  // Age >=25: 400 records, 320 approved (80.0%), 80 denied (20.0%)
  ...Array.from({ length: 320 }, (_, i) => ({
    customer_id: `CUST-O-${1000 + i}`,
    age: '>=25',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    debt_to_income: 0.18 + ((i % 15) / 100),
    credit_history_years: 6 + (i % 12),
    approved: '1',
  })),
  ...Array.from({ length: 80 }, (_, i) => ({
    customer_id: `CUST-O-${2000 + i}`,
    age: '>=25',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    debt_to_income: 0.35 + ((i % 20) / 100),
    credit_history_years: 4 + (i % 8),
    approved: '0',
  })),
  // Age <25: 200 records, 102 approved (51.0%), 98 denied (49.0%) -> 51% vs 80% = DIR 0.6375 (Violation)
  // Compound [<25 + Female]: 110 total, 42 approved = 38.1% (Severe compound bias 0.46 DP vs >=25 + Male at 82%)
  ...Array.from({ length: 102 }, (_, i) => ({
    customer_id: `CUST-Y-${3000 + i}`,
    age: '<25',
    gender: i < 42 ? 'Female' : 'Male',
    debt_to_income: 0.22 + ((i % 16) / 100),
    credit_history_years: 2 + (i % 4),
    approved: '1',
  })),
  ...Array.from({ length: 98 }, (_, i) => ({
    customer_id: `CUST-Y-${4000 + i}`,
    age: '<25',
    gender: i < 68 ? 'Female' : 'Male',
    debt_to_income: 0.40 + ((i % 22) / 100),
    credit_history_years: 1 + (i % 3),
    approved: '0',
  })),
];

export interface EnterpriseDatasetMeta {
  id: string;
  name: string;
  protectedAttribute: string;
  rowCount: string;
  numericRows: number;
  biasRisk: "High" | "Medium" | "Low";
  targetColumn: string;
  description: string;
  data: Record<string, any>[];
}

export const ENTERPRISE_REPOSITORY_DATASETS: EnterpriseDatasetMeta[] = [
  {
    id: "repo-loan",
    name: "Q3_Loan_Applications.csv",
    protectedAttribute: "Race",
    rowCount: "1,250 rows",
    numericRows: 1250,
    biasRisk: "High",
    targetColumn: "approved",
    description: "Retail banking mortgage loan decisions with demographic parity evaluation on applicant race.",
    data: q3LoanApplicationsData,
  },
  {
    id: "repo-hiring",
    name: "2025_Tech_Hiring_Pipeline.csv",
    protectedAttribute: "Gender",
    rowCount: "850 rows",
    numericRows: 850,
    biasRisk: "High",
    targetColumn: "hired",
    description: "Automated resume parsing and interview conversion outcomes under NYC Local Law 144 AEDT standards.",
    data: techHiringPipelineData,
  },
  {
    id: "repo-credit",
    name: "Customer_Credit_V4.csv",
    protectedAttribute: "Age",
    rowCount: "600 rows",
    numericRows: 600,
    biasRisk: "Medium",
    targetColumn: "approved",
    description: "Credit line scoring under EU AI Act Article 10 age-discrimination compliance safeguards.",
    data: customerCreditV4Data,
  },
];
