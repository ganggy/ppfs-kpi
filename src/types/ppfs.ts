export type PPFSCategory =
  | 'CANCER'
  | 'NCD'
  | 'ELDERLY'
  | 'MCH'
  | 'DENTAL'
  | 'VACCINE'
  | 'MENTAL'
  | 'INFECTIOUS'
  | 'NUTRITION';

export interface NHSOEligibilityRules {
  requireThaiNationality?: boolean;
  excludeChronicClinics?: string[];
  orChronicClinics?: string[];
  orChildMaxAge?: number;
  excludePriorIntervalYears?: number;
  ppSpecialTypeIds?: number[];
  targetPrevalenceFactor?: number;
}

export interface PPFSIndicator {
  id: string;
  code: string;
  title: string;
  shortName: string;
  category: PPFSCategory;
  targetGroupDesc: string;
  ageMin: number;
  ageMax: number;
  gender: 'ALL' | 'MALE' | 'FEMALE';
  intervalMonths: number;
  unitPrice: number;
  nhsoGoalPercent: number;
  icd10Codes: string[];
  icd9Codes?: string[];
  description: string;
  isNew2569?: boolean;
  cancelIn2570?: boolean;
  nhsoRules?: NHSOEligibilityRules;
  auditRules: {
    minAge?: number;
    maxAge?: number;
    requireGender?: '1' | '2';
    warningMessage?: string;
  };
}

export interface IndicatorSummary {
  indicator: PPFSIndicator;
  targetCount: number;
  servedCount: number;
  coveragePercent: number;
  targetRevenue: number;
  actualRevenue: number;
  revenueGap: number;
  status: 'ACHIEVED' | 'ON_TRACK' | 'BEHIND';
}

export interface CenterRanking {
  hospcode: string;
  name: string;
  subdistrict: string;
  targetCount: number;
  servedCount: number;
  coveragePercent: number;
  targetRevenue: number;
  actualRevenue: number;
  revenueGap: number;
  rank?: number;
}

export interface OverviewTotals {
  totalDistrictPopulation: number;
  uniquePopulation: number;
  uniqueServed: number;
  uniqueCoveragePercent: number;
  totalServicesCount: number;
  targetCount: number;
  servedCount: number;
  coveragePercent: number;
  targetRevenue: number;
  actualRevenue: number;
  revenueGap: number;
  indicatorsCount: number;
}

export interface OverviewData {
  fiscalYear: number;
  dateRange: { start: string; end: string };
  selectedCenter: string;
  totals: OverviewTotals;
  indicators: IndicatorSummary[];
  centerRankings: CenterRanking[];
}

export interface PatientRecord {
  hn: string;
  cid: string;
  maskedCid: string;
  name: string;
  age: number;
  gender: string;
  address: string;
  moo: string;
  villageName: string;
  subdistrict: string;
  tel: string;
  typeArea?: string;
  typeAreaDesc?: string;
  serviceDate?: string;
  diagCode?: string;
  status: 'SERVED' | 'UNSERVED';
}

export interface PcuNode {
  hospcode: string;
  name: string;
  subdistrict: string;
  moos?: string[];
  gdccId?: string;
  host?: string;
  port?: number;
  user?: string;
  database?: string;
  status: 'ONLINE' | 'OFFLINE' | 'LOCAL_SYNC';
  lastChecked?: string;
  error?: string;
}

export interface AuditIssue {
  id: number;
  hn: string;
  cid: string;
  name: string;
  age: number;
  gender: string;
  vstdate: string;
  icd10: string;
  issue: string;
  potentialLoss: number;
  recommendation: string;
}

export interface AuditReport {
  totalIssues: number;
  estimatedLossRisk: number;
  issues: AuditIssue[];
}

export interface MonthlyMatrixMonths {
  m10: number;
  m11: number;
  m12: number;
  m01: number;
  m02: number;
  m03: number;
  m04: number;
  m05: number;
  m06: number;
  m07: number;
  m08: number;
  m09: number;
}

export interface MonthlyMatrixRow {
  indicatorId: string;
  code: string;
  title: string;
  shortName: string;
  targetGroupDesc: string;
  unitPrice: number;
  targetCount: number;
  months: MonthlyMatrixMonths;
  totalServed: number;
  coveragePercent: number;
  actualRevenue: number;
}

export interface MonthlyMatrixData {
  fiscalYear: number;
  selectedCenter: string;
  selectedCenterName: string;
  rows: MonthlyMatrixRow[];
  monthTotals: MonthlyMatrixMonths & {
    totalServed: number;
    totalTarget: number;
    totalRevenue: number;
  };
}
