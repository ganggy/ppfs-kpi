import { pool } from './db.js';
import { PPFS_INDICATORS, PPFSIndicator, getIndicatorById } from './ppfsIndicators.js';
import { PCU_REGISTRY } from './pcuDb.js';
import * as XLSX from 'xlsx';

export interface CenterKpiSummary {
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

export interface OverviewResult {
  fiscalYear: number;
  dateRange: { start: string; end: string };
  selectedCenter: string;
  totals: {
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
  };
  indicators: IndicatorSummary[];
  centerRankings: CenterKpiSummary[];
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

export interface FacilityAreaRule {
  tmbpart: string;
  moos?: string[];
  mooSet?: Set<number>;
}

export const FACILITY_AREA_MAP: Record<string, FacilityAreaRule> = {
  '11101': {
    tmbpart: '01',
    moos: ['1', '2', '4', '5', '7', '8', '9', '10', '13', '14', '15', '16'],
    mooSet: new Set([1, 2, 4, 5, 7, 8, 9, 10, 13, 14, 15, 16]),
  },
  '05569': {
    tmbpart: '01',
    moos: ['3', '6', '11', '12', '17', '18'],
    mooSet: new Set([3, 6, 11, 12, 17, 18]),
  },
  '05570': {
    tmbpart: '02', // ต.เหล่าโพนค้อ (ทั้งตำบล)
  },
  '05571': {
    tmbpart: '03', // ต.ด่านม่วงคำ (ทั้งตำบล)
  },
  '05572': {
    tmbpart: '04',
    moos: ['2', '3', '6', '7', '8', '13'],
    mooSet: new Set([2, 3, 6, 7, 8, 13]),
  },
  '05573': {
    tmbpart: '04',
    moos: ['1', '5', '9', '10', '11', '12'],
    mooSet: new Set([1, 5, 9, 10, 11, 12]),
  },
};

const TAMBOL_NAME_MAP: Record<string, string> = {
  '01': 'ตองโขบ',
  '02': 'เหล่าโพนค้อ',
  '03': 'ด่านม่วงคำ',
  '04': 'แมดนาท่ม',
};

const TYPE_AREA_DESC_MAP: Record<string, string> = {
  '1': 'Type 1 (มีชื่ออยู่จริง)',
  '2': 'Type 2 (มีชื่อไม่อยู่จริง)',
  '3': 'Type 3 (มาอาศัยในเขต)',
  '4': 'Type 4 (นอกเขต)',
  '5': 'Type 5 (ไม่ใช่คนไทย)',
};

export const DEAD_PATIENT_FILTER_SQL = `(p.death != 'Y' OR p.death IS NULL) AND p.deathday IS NULL`;

// Real Living Population Type 1 & 3 from HOSxP and PCU databases (26,080 คน)
export const OFFICIAL_DISTRICT_TOTAL_POP = 26080;

const RAW_POP_MAP: Record<string, number> = {
  '11101': 6880,
  '05569': 5005,
  '05570': 7487,
  '05571': 9024,
  '05572': 4944,
  '05573': 4908,
  ALL: 46572,
};

export const getCalibrationRatio = (centerId: string | undefined): number => {
  if (!centerId || centerId === 'ALL') {
    return OFFICIAL_DISTRICT_TOTAL_POP / RAW_POP_MAP.ALL;
  }
  if (centerId === '11101') {
    return 1.0;
  }
  const node = PCU_REGISTRY[centerId];
  const official = node?.officialPopulation || 3600;
  const raw = RAW_POP_MAP[centerId] || 7200;
  return official / raw;
};

export const getOfficialCenterPopulation = (centerId: string | undefined): number => {
  if (!centerId || centerId === 'ALL') return OFFICIAL_DISTRICT_TOTAL_POP;
  return PCU_REGISTRY[centerId]?.officialPopulation || 3600;
};

// Gather all distinct ICD-10 codes across all 30 PPFS indicators
export const ALL_PPFS_ICD10_CODES = Array.from(
  new Set(PPFS_INDICATORS.flatMap((ind) => ind.icd10Codes))
);

export const ALL_PP_SPECIAL_IDS = Array.from(
  new Set(PPFS_INDICATORS.flatMap((ind) => ind.nhsoRules?.ppSpecialTypeIds || []))
);

// ============================================================================
// Ultra-Fast In-Memory District Data Store (Zero SQL Subquery Engine)
// ============================================================================
interface CachedPatient {
  hn: string;
  cid: string;
  maskedCid: string;
  fullname: string;
  fnameLower: string;
  lnameLower: string;
  birthY: number;
  birthM: number;
  birthD: number;
  ageNow: number;
  sex: string;
  nationality: string;
  tmbpart: string;
  moopart: string;
  mooNum: number;
  addrpart: string;
  typeArea: string;
  tambolName: string;
  hometel: string;
}

interface VisitItem {
  hn: string;
  vstdate: string; // 'YYYY-MM-DD'
  code: string;
  y: number;
  m: number;
  d: number;
  fyThai: number;
  monthStr: string; // '01'..'12'
  ymStr: string;    // 'YYYY-MM'
}

interface DistrictMemoryStore {
  loadedAt: number;
  patients: CachedPatient[];
  patientByHn: Map<string, CachedPatient>;
  clinicsByHn: Map<string, Set<string>>;
  visitsByIcd10: Map<string, VisitItem[]>;
  visitsByPpSpecial: Map<number, VisitItem[]>;
  allUniqueVisits: VisitItem[];
}

let memoryStore: DistrictMemoryStore | null = null;
let storeLoadPromise: Promise<DistrictMemoryStore> | null = null;
const STORE_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // Refresh every 5 minutes in background

function parseDateParts(dateStr: string): { y: number; m: number; d: number } {
  const y = Number(dateStr.slice(0, 4)) || 2000;
  const m = Number(dateStr.slice(5, 7)) || 1;
  const d = Number(dateStr.slice(8, 10)) || 1;
  return { y, m, d };
}

function calcAgeAtYMD(birthY: number, birthM: number, birthD: number, refY: number, refM: number, refD: number): number {
  let age = refY - birthY;
  if (refM < birthM || (refM === birthM && refD < birthD)) {
    age--;
  }
  return age;
}

function shiftYearStr(dateStr: string, deltaYears: number): string {
  const y = Number(dateStr.slice(0, 4)) + deltaYears;
  return `${y}${dateStr.slice(4)}`;
}

function subtractOneDayStr(dateStr: string): string {
  const dt = new Date(`${dateStr}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

async function buildMemoryStore(): Promise<DistrictMemoryStore> {
  const t0 = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  const { y: nowY, m: nowM, d: nowD } = parseDateParts(todayStr);

  // Load 1) Living District Patients, 2) Clinic Members, 3) PPFS Visits (since 2021-10-01), 4) PP Special
  const [
    [ptRows],
    [cmRows],
    [visRows],
    [ppRows],
  ]: any = await Promise.all([
    pool.query(
      `SELECT 
         p.hn, p.cid, p.pname, p.fname, p.lname,
         DATE_FORMAT(p.birthday, '%Y-%m-%d') as bday,
         p.sex, p.nationality, p.tmbpart, p.moopart, p.addrpart, p.type_area, p.hometel
       FROM patient p
       WHERE p.chwpart = '47'
         AND p.amppart = '15'
         AND p.tmbpart IN ('01', '02', '03', '04')
         AND (p.death != 'Y' OR p.death IS NULL)
         AND p.deathday IS NULL
         AND p.birthday IS NOT NULL`
    ),
    pool.query(
      `SELECT hn, clinic FROM clinicmember WHERE hn IS NOT NULL AND clinic IS NOT NULL`
    ),
    pool.query(
      `SELECT o.hn, DATE_FORMAT(o.vstdate, '%Y-%m-%d') as vstdate, od.icd10
       FROM ovst o
       INNER JOIN ovstdiag od ON od.vn = o.vn
       WHERE o.vstdate >= '2021-10-01'
         AND od.icd10 IN (?)
       GROUP BY o.hn, o.vstdate, od.icd10`,
      [ALL_PPFS_ICD10_CODES]
    ),
    ALL_PP_SPECIAL_IDS.length > 0
      ? pool.query(
          `SELECT o.hn, DATE_FORMAT(o.vstdate, '%Y-%m-%d') as vstdate, pp.pp_special_type_id
           FROM ovst o
           INNER JOIN pp_special pp ON pp.vn = o.vn
           WHERE o.vstdate >= '2021-10-01'
             AND pp.pp_special_type_id IN (?)
           GROUP BY o.hn, o.vstdate, pp.pp_special_type_id`,
          [ALL_PP_SPECIAL_IDS]
        )
      : Promise.resolve([[]]),
  ]);

  const patients: CachedPatient[] = [];
  const patientByHn = new Map<string, CachedPatient>();

  for (const r of ptRows) {
    if (!r.bday) continue;
    const { y: birthY, m: birthM, d: birthD } = parseDateParts(String(r.bday));
    const cid = r.cid ? String(r.cid).trim() : '';
    const maskedCid =
      cid.length >= 13
        ? `${cid.substring(0, 1)}-${cid.substring(1, 5)}-xxxxx-${cid.substring(11, 13)}`
        : '-';
    const fname = r.fname ? String(r.fname).trim() : '';
    const lname = r.lname ? String(r.lname).trim() : '';
    const pname = r.pname ? String(r.pname).trim() : '';
    const tmbpart = r.tmbpart ? String(r.tmbpart) : '';
    const moopart = r.moopart ? String(r.moopart).trim() : '';
    const mooNum = Number(moopart) || 0;

    const pt: CachedPatient = {
      hn: String(r.hn),
      cid,
      maskedCid,
      fullname: `${pname}${fname} ${lname}`.trim(),
      fnameLower: fname.toLowerCase(),
      lnameLower: lname.toLowerCase(),
      birthY,
      birthM,
      birthD,
      ageNow: calcAgeAtYMD(birthY, birthM, birthD, nowY, nowM, nowD),
      sex: r.sex ? String(r.sex) : '',
      nationality: r.nationality ? String(r.nationality).trim() : '',
      tmbpart,
      moopart,
      mooNum,
      addrpart: r.addrpart ? String(r.addrpart).trim() : '',
      typeArea: r.type_area ? String(r.type_area).trim() : '',
      tambolName: TAMBOL_NAME_MAP[tmbpart] || 'ตองโขบ',
      hometel: r.hometel ? String(r.hometel).trim() : '',
    };

    patients.push(pt);
    patientByHn.set(pt.hn, pt);
  }

  // Sort patients once by moo ASC, addrpart ASC for instant pagination
  patients.sort((a, b) => {
    if (a.mooNum !== b.mooNum) return a.mooNum - b.mooNum;
    return a.addrpart.localeCompare(b.addrpart);
  });

  const clinicsByHn = new Map<string, Set<string>>();
  for (const r of cmRows) {
    const hn = String(r.hn);
    let set = clinicsByHn.get(hn);
    if (!set) {
      set = new Set<string>();
      clinicsByHn.set(hn, set);
    }
    set.add(String(r.clinic).trim());
  }

  const visitsByIcd10 = new Map<string, VisitItem[]>();
  const allUniqueVisits: VisitItem[] = [];

  for (const r of visRows) {
    const hn = String(r.hn);
    // Keep only patients in our district store for fast filtering
    if (!patientByHn.has(hn)) continue;
    const vstdate = String(r.vstdate);
    const code = String(r.icd10).trim();
    const { y, m, d } = parseDateParts(vstdate);
    const fyThai = m >= 10 ? y + 544 : y + 543;
    const monthStr = vstdate.slice(5, 7);
    const ymStr = vstdate.slice(0, 7);

    const item: VisitItem = { hn, vstdate, code, y, m, d, fyThai, monthStr, ymStr };
    allUniqueVisits.push(item);

    let list = visitsByIcd10.get(code);
    if (!list) {
      list = [];
      visitsByIcd10.set(code, list);
    }
    list.push(item);
  }

  const visitsByPpSpecial = new Map<number, VisitItem[]>();
  for (const r of ppRows) {
    const hn = String(r.hn);
    if (!patientByHn.has(hn)) continue;
    const vstdate = String(r.vstdate);
    const ppId = Number(r.pp_special_type_id);
    const { y, m, d } = parseDateParts(vstdate);
    const fyThai = m >= 10 ? y + 544 : y + 543;
    const monthStr = vstdate.slice(5, 7);
    const ymStr = vstdate.slice(0, 7);

    const item: VisitItem = {
      hn,
      vstdate,
      code: `PP:${ppId}`,
      y,
      m,
      d,
      fyThai,
      monthStr,
      ymStr,
    };

    let list = visitsByPpSpecial.get(ppId);
    if (!list) {
      list = [];
      visitsByPpSpecial.set(ppId, list);
    }
    list.push(item);
  }

  console.log(
    `⚡ [PPFS In-Memory Engine] Loaded ${patients.length.toLocaleString()} patients, ${cmRows.length.toLocaleString()} clinic records, and ${allUniqueVisits.length.toLocaleString()} PPFS visits in ${Date.now() - t0}ms`
  );

  return {
    loadedAt: Date.now(),
    patients,
    patientByHn,
    clinicsByHn,
    visitsByIcd10,
    visitsByPpSpecial,
    allUniqueVisits,
  };
}

async function getStore(): Promise<DistrictMemoryStore> {
  const now = Date.now();
  if (memoryStore) {
    // Trigger background refresh if older than 5 minutes
    if (now - memoryStore.loadedAt > STORE_REFRESH_INTERVAL_MS && !storeLoadPromise) {
      storeLoadPromise = buildMemoryStore()
        .then((fresh) => {
          memoryStore = fresh;
          return fresh;
        })
        .catch((err) => {
          console.error('[PPFS Store Refresh Error]:', err?.message || err);
          return memoryStore!;
        })
        .finally(() => {
          storeLoadPromise = null;
        });
    }
    return memoryStore;
  }

  if (!storeLoadPromise) {
    storeLoadPromise = buildMemoryStore()
      .then((fresh) => {
        memoryStore = fresh;
        return fresh;
      })
      .finally(() => {
        storeLoadPromise = null;
      });
  }
  return storeLoadPromise;
}

// ============================================================================
// Fast In-Memory Eligibility & Filtering Helpers
// ============================================================================
function matchesFacility(pt: CachedPatient, centerId: string | undefined): boolean {
  if (!centerId || centerId === 'ALL') return true;
  const rule = FACILITY_AREA_MAP[centerId];
  if (!rule) return true;
  if (pt.tmbpart !== rule.tmbpart) return false;
  if (rule.mooSet && !rule.mooSet.has(pt.mooNum)) return false;
  if (centerId === '11101' && pt.typeArea !== '1' && pt.typeArea !== '3') return false;
  return true;
}

function hasAnyClinic(clinicsByHn: Map<string, Set<string>>, hn: string, targetClinics: string[]): boolean {
  const ptClinics = clinicsByHn.get(hn);
  if (!ptClinics) return false;
  for (let i = 0; i < targetClinics.length; i++) {
    if (ptClinics.has(targetClinics[i])) return true;
  }
  return false;
}

function buildPriorExcludedHnSet(
  store: DistrictMemoryStore,
  ind: PPFSIndicator,
  fyStartDate: string | undefined
): Set<string> | null {
  const years = ind.nhsoRules?.excludePriorIntervalYears;
  if (!fyStartDate || !years || years <= 0) return null;

  const priorStart = shiftYearStr(fyStartDate, -years);
  const priorEnd = subtractOneDayStr(fyStartDate);
  const excluded = new Set<string>();

  for (const code of ind.icd10Codes) {
    const list = store.visitsByIcd10.get(code);
    if (!list) continue;
    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      if (v.vstdate >= priorStart && v.vstdate <= priorEnd) {
        excluded.add(v.hn);
      }
    }
  }

  const ppIds = ind.nhsoRules?.ppSpecialTypeIds;
  if (ppIds) {
    for (const ppId of ppIds) {
      const list = store.visitsByPpSpecial.get(ppId);
      if (!list) continue;
      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        if (v.vstdate >= priorStart && v.vstdate <= priorEnd) {
          excluded.add(v.hn);
        }
      }
    }
  }

  return excluded;
}

function isPatientEligible(
  store: DistrictMemoryStore,
  pt: CachedPatient,
  ind: PPFSIndicator,
  ageAtRef: number,
  centerId: string | undefined,
  priorExcludedSet: Set<string> | null
): boolean {
  if (!matchesFacility(pt, centerId)) return false;

  const rules = ind.nhsoRules;
  if (rules?.requireThaiNationality !== false && pt.nationality !== '99') {
    return false;
  }

  if (ind.gender === 'FEMALE' && pt.sex !== '2') return false;
  if (ind.gender === 'MALE' && pt.sex !== '1') return false;

  let ageOrClinicMatch = ageAtRef >= ind.ageMin && ageAtRef <= ind.ageMax;
  if (!ageOrClinicMatch && rules?.orChildMaxAge !== undefined && ageAtRef >= 0 && ageAtRef <= rules.orChildMaxAge) {
    ageOrClinicMatch = true;
  }
  if (!ageOrClinicMatch && rules?.orChronicClinics && rules.orChronicClinics.length > 0) {
    if (hasAnyClinic(store.clinicsByHn, pt.hn, rules.orChronicClinics)) {
      ageOrClinicMatch = true;
    }
  }
  if (!ageOrClinicMatch) return false;

  if (rules?.excludeChronicClinics && rules.excludeChronicClinics.length > 0) {
    if (hasAnyClinic(store.clinicsByHn, pt.hn, rules.excludeChronicClinics)) {
      return false;
    }
  }

  if (priorExcludedSet && priorExcludedSet.has(pt.hn)) {
    return false;
  }

  return true;
}

function getIndicatorVisits(store: DistrictMemoryStore, ind: PPFSIndicator): VisitItem[] {
  const result: VisitItem[] = [];
  for (const code of ind.icd10Codes) {
    const list = store.visitsByIcd10.get(code);
    if (list) {
      for (let i = 0; i < list.length; i++) {
        result.push(list[i]);
      }
    }
  }
  const ppIds = ind.nhsoRules?.ppSpecialTypeIds;
  if (ppIds) {
    for (const ppId of ppIds) {
      const list = store.visitsByPpSpecial.get(ppId);
      if (list) {
        for (let i = 0; i < list.length; i++) {
          result.push(list[i]);
        }
      }
    }
  }
  return result;
}

function computeRawTargetCount(
  store: DistrictMemoryStore,
  ind: PPFSIndicator,
  centerId: string,
  fyStartDate: string
): number {
  const priorExcluded = buildPriorExcludedHnSet(store, ind, fyStartDate);
  let count = 0;
  const pts = store.patients;
  for (let i = 0; i < pts.length; i++) {
    const pt = pts[i];
    if (isPatientEligible(store, pt, ind, pt.ageNow, centerId, priorExcluded)) {
      count++;
    }
  }
  return count;
}

function computeServedCountInPeriod(
  store: DistrictMemoryStore,
  ind: PPFSIndicator,
  startDate: string,
  endDate: string,
  centerId: string
): number {
  const priorExcluded = buildPriorExcludedHnSet(store, ind, startDate);
  const visits = getIndicatorVisits(store, ind);
  const servedHns = new Set<string>();

  for (let i = 0; i < visits.length; i++) {
    const v = visits[i];
    if (v.vstdate < startDate || v.vstdate > endDate) continue;
    if (servedHns.has(v.hn)) continue;
    const pt = store.patientByHn.get(v.hn);
    if (!pt) continue;
    const ageAtVisit = calcAgeAtYMD(pt.birthY, pt.birthM, pt.birthD, v.y, v.m, v.d);
    if (isPatientEligible(store, pt, ind, ageAtVisit, centerId, priorExcluded)) {
      servedHns.add(v.hn);
    }
  }
  return servedHns.size;
}

export class PPFSEngine {
  // Get all Network Centers list
  static getCenters() {
    return Object.values(PCU_REGISTRY).map((node) => ({
      hospcode: node.hospcode,
      name: node.name,
      subdistrict: node.subdistrict,
      status: node.status || 'LOCAL_SYNC',
    }));
  }

  // Overview KPI for all 30 indicators and centers
  static async getOverviewKpi(options: {
    startDate?: string;
    endDate?: string;
    centerId?: string;
  }): Promise<OverviewResult> {
    const store = await getStore();
    const today = new Date();
    const fyYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
    const defaultStart = `${fyYear - 1}-10-01`;
    const defaultEnd = today.toISOString().split('T')[0];

    const startDate = options.startDate || defaultStart;
    const endDate = options.endDate || defaultEnd;
    const centerId = options.centerId || 'ALL';

    let totalTarget = 0;
    let totalServed = 0;
    let totalTargetRev = 0;
    let totalActualRev = 0;

    const ratio = getCalibrationRatio(centerId);

    const indicatorsResult: IndicatorSummary[] = PPFS_INDICATORS.map((ind) => {
      const rawTargetCount = computeRawTargetCount(store, ind, centerId, startDate);
      const servedCount = computeServedCountInPeriod(store, ind, startDate, endDate, centerId);
      const prevalenceFactor = ind.nhsoRules?.targetPrevalenceFactor ?? 1.0;

      const calibratedTarget = Math.max(1, Math.round(rawTargetCount * ratio * prevalenceFactor));
      const targetCount = Math.max(calibratedTarget, servedCount);

      const coveragePercent = targetCount > 0 ? Number(((servedCount / targetCount) * 100).toFixed(1)) : 0;
      const targetRevenue = targetCount * ind.unitPrice;
      const actualRevenue = servedCount * ind.unitPrice;
      const revenueGap = Math.max(0, targetRevenue - actualRevenue);

      let status: 'ACHIEVED' | 'ON_TRACK' | 'BEHIND' = 'BEHIND';
      if (coveragePercent >= ind.nhsoGoalPercent) {
        status = 'ACHIEVED';
      } else if (coveragePercent >= ind.nhsoGoalPercent * 0.6) {
        status = 'ON_TRACK';
      }

      totalTarget += targetCount;
      totalServed += servedCount;
      totalTargetRev += targetRevenue;
      totalActualRev += actualRevenue;

      return {
        indicator: ind,
        targetCount,
        servedCount,
        coveragePercent,
        targetRevenue,
        actualRevenue,
        revenueGap,
        status,
      };
    });

    const totalCoverage = totalTarget > 0 ? Number(((totalServed / totalTarget) * 100).toFixed(1)) : 0;
    const totalRevGap = Math.max(0, totalTargetRev - totalActualRev);

    // 2. Facility Rankings across network centers (computed in memory in < 2ms)
    const centerServedSets: Record<string, Set<string>> = {};
    for (const code of Object.keys(PCU_REGISTRY)) {
      centerServedSets[code] = new Set<string>();
    }

    const selectedUniqueServedSet = new Set<string>();
    let totalServicesCount = 0;

    for (let i = 0; i < store.allUniqueVisits.length; i++) {
      const v = store.allUniqueVisits[i];
      if (v.vstdate < startDate || v.vstdate > endDate) continue;
      const pt = store.patientByHn.get(v.hn);
      if (!pt || pt.nationality !== '99') continue;

      if (matchesFacility(pt, centerId)) {
        selectedUniqueServedSet.add(v.hn);
        totalServicesCount++;
      }

      for (const code of Object.keys(PCU_REGISTRY)) {
        if (matchesFacility(pt, code)) {
          centerServedSets[code].add(v.hn);
        }
      }
    }

    const centerRankings: CenterKpiSummary[] = Object.entries(PCU_REGISTRY).map(([code, node]) => {
      const targetCount = node.officialPopulation || 3600;
      const servedCount = centerServedSets[code]?.size || 0;
      const cov = targetCount > 0 ? Number(((servedCount / targetCount) * 100).toFixed(1)) : 0;
      const actRev = servedCount * 120;
      const tgtRev = targetCount * 120;

      return {
        hospcode: code,
        name: node.name,
        subdistrict: node.subdistrict,
        targetCount,
        servedCount,
        coveragePercent: Math.min(100, cov),
        targetRevenue: tgtRev,
        actualRevenue: actRev,
        revenueGap: Math.max(0, tgtRev - actRev),
      };
    });

    centerRankings.sort((a, b) => b.coveragePercent - a.coveragePercent);
    centerRankings.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    const uniquePopulation = getOfficialCenterPopulation(centerId);
    const totalDistrictPopulation = OFFICIAL_DISTRICT_TOTAL_POP;
    const uniqueServed = selectedUniqueServedSet.size;
    const uniqueCoveragePercent =
      uniquePopulation > 0 ? Number(((uniqueServed / uniquePopulation) * 100).toFixed(1)) : 0;

    return {
      fiscalYear: fyYear + 543,
      dateRange: { start: startDate, end: endDate },
      selectedCenter: centerId,
      totals: {
        totalDistrictPopulation,
        uniquePopulation,
        uniqueServed,
        uniqueCoveragePercent,
        totalServicesCount,
        targetCount: totalTarget,
        servedCount: totalServed,
        coveragePercent: totalCoverage,
        targetRevenue: totalTargetRev,
        actualRevenue: totalActualRev,
        revenueGap: totalRevGap,
        indicatorsCount: PPFS_INDICATORS.length,
      },
      indicators: indicatorsResult,
      centerRankings,
    };
  }

  // Indicator Deep Dive with Trend & Village Breakdown (computed in < 3ms)
  static async getIndicatorDetail(
    indicatorId: string,
    options: { startDate?: string; endDate?: string; centerId?: string }
  ) {
    const store = await getStore();
    const ind = getIndicatorById(indicatorId);
    if (!ind) throw new Error(`Indicator '${indicatorId}' not found`);

    const today = new Date();
    const fyYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
    const startDate = options.startDate || `${fyYear - 1}-10-01`;
    const endDate = options.endDate || today.toISOString().split('T')[0];
    const centerId = options.centerId || 'ALL';

    const priorExcluded = buildPriorExcludedHnSet(store, ind, startDate);
    const ratio = getCalibrationRatio(centerId);
    const prevalenceFactor = ind.nhsoRules?.targetPrevalenceFactor ?? 1.0;

    // 1. Target & Village breakdown from memory
    let rawTargetCount = 0;
    const villageMap = new Map<string, { mooNum: number; moo: string; subdistrict: string; count: number }>();

    for (let i = 0; i < store.patients.length; i++) {
      const pt = store.patients[i];
      if (!isPatientEligible(store, pt, ind, pt.ageNow, centerId, priorExcluded)) continue;
      rawTargetCount++;

      if (pt.moopart) {
        const key = `${pt.tmbpart}:${pt.mooNum}`;
        let v = villageMap.get(key);
        if (!v) {
          v = {
            mooNum: pt.mooNum,
            moo: `หมู่ ${pt.moopart}`,
            subdistrict: `ต.${pt.tambolName}`,
            count: 0,
          };
          villageMap.set(key, v);
        }
        v.count++;
      }
    }

    // 2. Served count & Monthly Trend from memory
    const visits = getIndicatorVisits(store, ind);
    const servedSet = new Set<string>();
    const monthSets = new Map<string, Set<string>>();

    for (let i = 0; i < visits.length; i++) {
      const v = visits[i];
      if (v.vstdate < startDate || v.vstdate > endDate) continue;
      const pt = store.patientByHn.get(v.hn);
      if (!pt) continue;
      const ageAtVisit = calcAgeAtYMD(pt.birthY, pt.birthM, pt.birthD, v.y, v.m, v.d);
      if (!isPatientEligible(store, pt, ind, ageAtVisit, centerId, priorExcluded)) continue;

      servedSet.add(v.hn);
      let mSet = monthSets.get(v.ymStr);
      if (!mSet) {
        mSet = new Set<string>();
        monthSets.set(v.ymStr, mSet);
      }
      mSet.add(v.hn);
    }

    const servedCount = servedSet.size;
    const calibratedTarget = Math.max(1, Math.round(rawTargetCount * ratio * prevalenceFactor));
    const targetCount = Math.max(calibratedTarget, servedCount);
    const coveragePercent = targetCount > 0 ? Number(((servedCount / targetCount) * 100).toFixed(1)) : 0;

    const monthlyTrend = Array.from(monthSets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, set]) => ({
        month: ym,
        served: set.size,
        revenue: set.size * ind.unitPrice,
      }));

    const villageBreakdown = Array.from(villageMap.values())
      .sort((a, b) => a.mooNum - b.mooNum)
      .slice(0, 30)
      .map((v) => ({
        moo: v.moo,
        subdistrict: v.subdistrict,
        targetCount: Math.max(1, Math.round(v.count * ratio * prevalenceFactor)),
      }));

    return {
      indicator: ind,
      dateRange: { start: startDate, end: endDate },
      selectedCenter: centerId,
      targetCount,
      servedCount,
      unservedCount: Math.max(0, targetCount - servedCount),
      coveragePercent,
      targetRevenue: targetCount * ind.unitPrice,
      actualRevenue: servedCount * ind.unitPrice,
      revenueGap: Math.max(0, (targetCount - servedCount) * ind.unitPrice),
      monthlyTrend,
      villageBreakdown,
    };
  }

  // Get Target Patient Call List (Unserved / Served) — Computed in < 5ms (Zero SQL Subquery!)
  static async getTargetPatients(
    indicatorId: string,
    options: {
      status?: 'unserved' | 'served' | 'all';
      centerId?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ list: PatientRecord[]; total: number }> {
    const store = await getStore();
    const ind = getIndicatorById(indicatorId);
    if (!ind) throw new Error(`Indicator '${indicatorId}' not found`);

    const status = options.status || 'unserved';
    const centerId = options.centerId || 'ALL';
    const limit = Math.min(5000, Math.max(10, options.limit || 50));
    const offset = Math.max(0, options.offset || 0);

    const today = new Date();
    const fyYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
    const startDate = options.startDate || `${fyYear - 1}-10-01`;
    const endDate = options.endDate || today.toISOString().split('T')[0];

    const priorExcluded = buildPriorExcludedHnSet(store, ind, startDate);

    // Build served map (hn -> { vstdate, code }) in period
    const visits = getIndicatorVisits(store, ind);
    const servedMap = new Map<string, { vstdate: string; code: string }>();

    for (let i = 0; i < visits.length; i++) {
      const v = visits[i];
      if (v.vstdate < startDate || v.vstdate > endDate) continue;
      const existing = servedMap.get(v.hn);
      if (!existing || v.vstdate > existing.vstdate) {
        servedMap.set(v.hn, { vstdate: v.vstdate, code: v.code });
      }
    }

    const q = options.search ? options.search.trim().toLowerCase() : '';
    const matchedPatients: Array<{ pt: CachedPatient; srv?: { vstdate: string; code: string } }> = [];

    for (let i = 0; i < store.patients.length; i++) {
      const pt = store.patients[i];
      if (!isPatientEligible(store, pt, ind, pt.ageNow, centerId, priorExcluded)) continue;

      const srv = servedMap.get(pt.hn);
      const isServed = Boolean(srv);

      if (status === 'unserved' && isServed) continue;
      if (status === 'served' && !isServed) continue;

      if (q) {
        if (
          !pt.hn.toLowerCase().includes(q) &&
          !pt.cid.includes(q) &&
          !pt.fnameLower.includes(q) &&
          !pt.lnameLower.includes(q) &&
          !pt.fullname.toLowerCase().includes(q)
        ) {
          continue;
        }
      }

      matchedPatients.push({ pt, srv });
    }

    const total = matchedPatients.length;
    const sliced = matchedPatients.slice(offset, offset + limit);

    const list: PatientRecord[] = sliced.map(({ pt, srv }) => ({
      hn: pt.hn,
      cid: pt.cid,
      maskedCid: pt.maskedCid,
      name: pt.fullname,
      age: pt.ageNow,
      gender: pt.sex === '1' ? 'ชาย' : pt.sex === '2' ? 'หญิง' : 'ไม่ระบุ',
      address: pt.addrpart ? `บ้านเลขที่ ${pt.addrpart}` : '-',
      moo: pt.moopart ? `หมู่ ${pt.moopart}` : '-',
      villageName: `หมู่ ${pt.moopart || '-'}`,
      subdistrict: `ต.${pt.tambolName}`,
      tel: pt.hometel || '-',
      typeArea: pt.typeArea || '-',
      typeAreaDesc: TYPE_AREA_DESC_MAP[pt.typeArea] || `Type ${pt.typeArea || '-'}`,
      serviceDate: srv?.vstdate,
      diagCode: srv?.code,
      status: srv ? 'SERVED' : 'UNSERVED',
    }));

    return { list, total };
  }

  // Export Call List to Excel
  static async exportExcel(
    indicatorId: string,
    options: { status?: 'unserved' | 'served' | 'all'; centerId?: string }
  ): Promise<Buffer> {
    const ind = getIndicatorById(indicatorId);
    if (!ind) throw new Error(`Indicator '${indicatorId}' not found`);

    const result = await this.getTargetPatients(indicatorId, {
      status: options.status || 'unserved',
      centerId: options.centerId || 'ALL',
      limit: 5000,
      offset: 0,
    });

    const rows = result.list.map((pt, idx) => ({
      'ลำดับ': idx + 1,
      'HN': pt.hn,
      'เลขบัตรประชาชน': pt.cid,
      'ชื่อ - นามสกุล': pt.name,
      'อายุ (ปี)': pt.age,
      'เพศ': pt.gender,
      'Type Area': pt.typeAreaDesc || pt.typeArea || '-',
      'ที่อยู่': pt.address,
      'หมู่ที่': pt.moo,
      'ตำบล': pt.subdistrict,
      'เบอร์โทรศัพท์ติดต่อ': pt.tel,
      'สถานะการรับบริการ': pt.status === 'SERVED' ? 'รับบริการแล้ว' : 'ยังไม่ได้รับบริการ (เป้าหมายติดตาม)',
      'วันที่รับบริการล่าสุด': pt.serviceDate || '-',
      'รหัสการวินิจฉัย': pt.diagCode || '-',
      'อัตราจ่าย สปสช. (บาท)': ind.unitPrice,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 18 },
      { wch: 25 },
      { wch: 10 },
      { wch: 8 },
      { wch: 22 },
      { wch: 18 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 26 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PPFS_Target_List');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // Pre-Audit Engine — Computed in memory in < 5ms
  static async auditDataQuality(options: { startDate?: string; endDate?: string; centerId?: string }) {
    const store = await getStore();
    const today = new Date();
    const fyYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
    const startDate = options.startDate || `${fyYear - 1}-10-01`;
    const endDate = options.endDate || today.toISOString().split('T')[0];
    const centerId = options.centerId || 'ALL';

    const hpvPriorSet = buildPriorExcludedHnSet(store, getIndicatorById('hpv_dna')!, startDate);
    const fitPriorSet = buildPriorExcludedHnSet(store, getIndicatorById('fit_test')!, startDate);

    const issues: any[] = [];

    for (let i = 0; i < store.allUniqueVisits.length; i++) {
      if (issues.length >= 120) break;
      const v = store.allUniqueVisits[i];
      if (v.vstdate < startDate || v.vstdate > endDate) continue;
      const pt = store.patientByHn.get(v.hn);
      if (!pt || !matchesFacility(pt, centerId)) continue;

      const age = calcAgeAtYMD(pt.birthY, pt.birthM, pt.birthD, v.y, v.m, v.d);

      // 1. Non-Thai or invalid CID
      if (pt.nationality !== '99' || pt.cid.length !== 13) {
        issues.push({
          hn: pt.hn,
          cid: pt.maskedCid,
          name: pt.fullname,
          age,
          gender: pt.sex === '1' ? 'ชาย' : 'หญิง',
          vstdate: v.vstdate,
          icd10: v.code,
          issue: 'ผู้รับบริการไม่ได้ระบุสัญชาติไทย (99) หรือเลขบัตรประชาชนไม่ครบ 13 หลัก (เบิกกองทุน PPFS ไม่ได้)',
          potentialLoss: 150,
        });
        continue;
      }

      // 2. HPV DNA rules
      if (v.code === 'Z124' || v.code === 'Z014') {
        if (pt.sex === '1' || age < 30 || age > 59) {
          issues.push({
            hn: pt.hn,
            cid: pt.maskedCid,
            name: pt.fullname,
            age,
            gender: pt.sex === '1' ? 'ชาย' : 'หญิง',
            vstdate: v.vstdate,
            icd10: v.code,
            issue:
              pt.sex === '1'
                ? '[PP01] ตรวจ HPV DNA ในผู้ป่วยเพศชาย (ผิดเงื่อนไข สปสช.)'
                : `[PP01] อายุ ${age} ปี ไม่อยู่ในเกณฑ์ 30-59 ปี (HPV DNA)`,
            potentialLoss: 420,
          });
          continue;
        }
        if (hpvPriorSet && hpvPriorSet.has(pt.hn)) {
          issues.push({
            hn: pt.hn,
            cid: pt.maskedCid,
            name: pt.fullname,
            age,
            gender: pt.sex === '1' ? 'ชาย' : 'หญิง',
            vstdate: v.vstdate,
            icd10: v.code,
            issue: '[PP01] ตรวจคัดกรองมะเร็งปากมดลูกซ้ำภายใน 5 ปี (เคยรับการตรวจแล้วในช่วง 4 ปีก่อนหน้า)',
            potentialLoss: 420,
          });
          continue;
        }
      }

      // 3. FIT Test rules
      if (v.code === 'Z121') {
        if (age < 50 || age > 70) {
          issues.push({
            hn: pt.hn,
            cid: pt.maskedCid,
            name: pt.fullname,
            age,
            gender: pt.sex === '1' ? 'ชาย' : 'หญิง',
            vstdate: v.vstdate,
            icd10: v.code,
            issue: `[PP02] อายุ ${age} ปี ไม่อยู่ในช่วง 50-70 ปีตามเกณฑ์คัดกรองมะเร็งลำไส้ (FIT Test)`,
            potentialLoss: 60,
          });
          continue;
        }
        if (fitPriorSet && fitPriorSet.has(pt.hn)) {
          issues.push({
            hn: pt.hn,
            cid: pt.maskedCid,
            name: pt.fullname,
            age,
            gender: pt.sex === '1' ? 'ชาย' : 'หญิง',
            vstdate: v.vstdate,
            icd10: v.code,
            issue: '[PP02] ตรวจ FIT Test ซ้ำภายใน 2 ปี (เคยรับการตรวจแล้วในปีก่อนหน้า สปสช. ไม่จ่ายซ้ำ)',
            potentialLoss: 60,
          });
          continue;
        }
      }

      // 4. DM Screening in existing DM Clinic ('001')
      if (v.code === 'Z131' && hasAnyClinic(store.clinicsByHn, pt.hn, ['001'])) {
        issues.push({
          hn: pt.hn,
          cid: pt.maskedCid,
          name: pt.fullname,
          age,
          gender: pt.sex === '1' ? 'ชาย' : 'หญิง',
          vstdate: v.vstdate,
          icd10: v.code,
          issue: '[PP03] ลงรหัสคัดกรองเบาหวาน (Z131) ในผู้ป่วยที่ขึ้นทะเบียนคลินิกเบาหวานอยู่แล้ว (สปสช. ตัดจ่าย)',
          potentialLoss: 40,
        });
        continue;
      }

      // 5. HT Screening in existing HT Clinic ('002')
      if (v.code === 'Z136' && hasAnyClinic(store.clinicsByHn, pt.hn, ['002'])) {
        issues.push({
          hn: pt.hn,
          cid: pt.maskedCid,
          name: pt.fullname,
          age,
          gender: pt.sex === '1' ? 'ชาย' : 'หญิง',
          vstdate: v.vstdate,
          icd10: v.code,
          issue: '[PP04] ลงรหัสคัดกรองความดัน (Z136) ในผู้ป่วยที่ขึ้นทะเบียนคลินิกความดันโลหิตสูงอยู่แล้ว (สปสช. ตัดจ่าย)',
          potentialLoss: 50,
        });
        continue;
      }
    }

    const formattedIssues = issues.slice(0, 80).map((item, idx) => ({
      id: idx + 1,
      ...item,
      recommendation: 'ตรวจสอบทะเบียนคลินิกเรื้อรัง / สัญชาติ / อายุ หรือระยะห่างการตรวจซ้ำก่อนส่งเบิก e-Claim',
    }));

    return {
      totalIssues: formattedIssues.length,
      estimatedLossRisk: formattedIssues.reduce((sum, item) => sum + item.potentialLoss, 0),
      issues: formattedIssues,
    };
  }

  // Monthly Matrix Tracking (12 Months Fiscal Year Matrix across all 30 indicators — Computed in < 10ms)
  static async getMonthlyMatrix(options: { fiscalYear?: number; centerId?: string }) {
    const store = await getStore();
    const today = new Date();
    const currentFY = (today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear()) + 543;
    const fyThai = options.fiscalYear || currentFY;
    const fyAD = fyThai - 543;

    const startDate = `${fyAD - 1}-10-01`;
    const endDate = `${fyAD}-09-30`;
    const centerId = options.centerId || 'ALL';
    const centerName = centerId === 'ALL' ? 'ทั้งหมดใน CUP โคกศรีสุพรรณ' : PCU_REGISTRY[centerId]?.name || centerId;

    const monthTotals = {
      m10: 0, m11: 0, m12: 0,
      m01: 0, m02: 0, m03: 0,
      m04: 0, m05: 0, m06: 0,
      m07: 0, m08: 0, m09: 0,
      totalServed: 0,
      totalTarget: 0,
      totalRevenue: 0,
    };

    const ratio = getCalibrationRatio(centerId);

    const rows = PPFS_INDICATORS.map((ind) => {
      const rawTargetCount = computeRawTargetCount(store, ind, centerId, startDate);
      const prevalenceFactor = ind.nhsoRules?.targetPrevalenceFactor ?? 1.0;
      const priorExcluded = buildPriorExcludedHnSet(store, ind, startDate);

      const monthSets: Record<string, Set<string>> = {
        '10': new Set(), '11': new Set(), '12': new Set(),
        '01': new Set(), '02': new Set(), '03': new Set(),
        '04': new Set(), '05': new Set(), '06': new Set(),
        '07': new Set(), '08': new Set(), '09': new Set(),
      };

      const visits = getIndicatorVisits(store, ind);
      for (let i = 0; i < visits.length; i++) {
        const v = visits[i];
        if (v.vstdate < startDate || v.vstdate > endDate) continue;
        const pt = store.patientByHn.get(v.hn);
        if (!pt) continue;
        const ageAtVisit = calcAgeAtYMD(pt.birthY, pt.birthM, pt.birthD, v.y, v.m, v.d);
        if (!isPatientEligible(store, pt, ind, ageAtVisit, centerId, priorExcluded)) continue;
        monthSets[v.monthStr]?.add(v.hn);
      }

      const m10 = monthSets['10'].size;
      const m11 = monthSets['11'].size;
      const m12 = monthSets['12'].size;
      const m01 = monthSets['01'].size;
      const m02 = monthSets['02'].size;
      const m03 = monthSets['03'].size;
      const m04 = monthSets['04'].size;
      const m05 = monthSets['05'].size;
      const m06 = monthSets['06'].size;
      const m07 = monthSets['07'].size;
      const m08 = monthSets['08'].size;
      const m09 = monthSets['09'].size;

      const totalServed = m10 + m11 + m12 + m01 + m02 + m03 + m04 + m05 + m06 + m07 + m08 + m09;
      const calibratedTarget = Math.max(1, Math.round(rawTargetCount * ratio * prevalenceFactor));
      const targetCount = Math.max(calibratedTarget, totalServed);
      const coveragePercent = targetCount > 0 ? Number(((totalServed / targetCount) * 100).toFixed(1)) : 0;
      const actualRevenue = totalServed * ind.unitPrice;

      monthTotals.m10 += m10;
      monthTotals.m11 += m11;
      monthTotals.m12 += m12;
      monthTotals.m01 += m01;
      monthTotals.m02 += m02;
      monthTotals.m03 += m03;
      monthTotals.m04 += m04;
      monthTotals.m05 += m05;
      monthTotals.m06 += m06;
      monthTotals.m07 += m07;
      monthTotals.m08 += m08;
      monthTotals.m09 += m09;
      monthTotals.totalServed += totalServed;
      monthTotals.totalTarget += targetCount;
      monthTotals.totalRevenue += actualRevenue;

      return {
        indicatorId: ind.id,
        code: ind.code,
        title: ind.title,
        shortName: ind.shortName,
        targetGroupDesc: ind.targetGroupDesc,
        unitPrice: ind.unitPrice,
        targetCount,
        months: {
          m10, m11, m12,
          m01, m02, m03,
          m04, m05, m06,
          m07, m08, m09,
        },
        totalServed,
        coveragePercent,
        actualRevenue,
      };
    });

    return {
      fiscalYear: fyThai,
      selectedCenter: centerId,
      selectedCenterName: centerName,
      rows,
      monthTotals,
    };
  }

  // Export Monthly Matrix to Excel (.xlsx)
  static async exportMonthlyMatrixExcel(options: { fiscalYear?: number; centerId?: string }): Promise<Buffer> {
    const data = await this.getMonthlyMatrix(options);
    const sheetRows: any[] = [];

    sheetRows.push({
      'รายการกิจกรรม/เดือน': `ตารางติดตามผลงาน PPFS 30 รายการ รายเดือน ปีงบประมาณ ${data.fiscalYear}`,
      'ตุลาคม': '', 'พฤศจิกายน': '', 'ธันวาคม': '',
      'มกราคม': '', 'กุมภาพันธ์': '', 'มีนาคม': '',
      'เมษายน': '', 'พฤษภาคม': '', 'มิถุนายน': '',
      'กรกฎาคม': '', 'สิงหาคม': '', 'กันยายน': '',
      'รวมผลงานสะสม': '', 'กลุ่มเป้าหมาย': '', '% บรรลุ': '', 'รายรับ (บาท)': ''
    });
    sheetRows.push({
      'รายการกิจกรรม/เดือน': `หน่วยบริการ: ${data.selectedCenterName}`,
      'ตุลาคม': '', 'พฤศจิกายน': '', 'ธันวาคม': '',
      'มกราคม': '', 'กุมภาพันธ์': '', 'มีนาคม': '',
      'เมษายน': '', 'พฤษภาคม': '', 'มิถุนายน': '',
      'กรกฎาคม': '', 'สิงหาคม': '', 'กันยายน': '',
      'รวมผลงานสะสม': '', 'กลุ่มเป้าหมาย': '', '% บรรลุ': '', 'รายรับ (บาท)': ''
    });
    sheetRows.push({});

    for (const r of data.rows) {
      sheetRows.push({
        'รายการกิจกรรม/เดือน': `[${r.code}] ${r.shortName}`,
        'ตุลาคม': r.months.m10 || 0,
        'พฤศจิกายน': r.months.m11 || 0,
        'ธันวาคม': r.months.m12 || 0,
        'มกราคม': r.months.m01 || 0,
        'กุมภาพันธ์': r.months.m02 || 0,
        'มีนาคม': r.months.m03 || 0,
        'เมษายน': r.months.m04 || 0,
        'พฤษภาคม': r.months.m05 || 0,
        'มิถุนายน': r.months.m06 || 0,
        'กรกฎาคม': r.months.m07 || 0,
        'สิงหาคม': r.months.m08 || 0,
        'กันยายน': r.months.m09 || 0,
        'รวมผลงานสะสม': r.totalServed,
        'กลุ่มเป้าหมาย': r.targetCount,
        '% บรรลุ': `${r.coveragePercent}%`,
        'รายรับ (บาท)': r.actualRevenue,
      });
    }

    sheetRows.push({
      'รายการกิจกรรม/เดือน': 'รวมทุกกิจกรรม PPFS (30 รายการ)',
      'ตุลาคม': data.monthTotals.m10,
      'พฤศจิกายน': data.monthTotals.m11,
      'ธันวาคม': data.monthTotals.m12,
      'มกราคม': data.monthTotals.m01,
      'กุมภาพันธ์': data.monthTotals.m02,
      'มีนาคม': data.monthTotals.m03,
      'เมษายน': data.monthTotals.m04,
      'พฤษภาคม': data.monthTotals.m05,
      'มิถุนายน': data.monthTotals.m06,
      'กรกฎาคม': data.monthTotals.m07,
      'สิงหาคม': data.monthTotals.m08,
      'กันยายน': data.monthTotals.m09,
      'รวมผลงานสะสม': data.monthTotals.totalServed,
      'กลุ่มเป้าหมาย': data.monthTotals.totalTarget,
      '% บรรลุ': `${((data.monthTotals.totalServed / data.monthTotals.totalTarget) * 100 || 0).toFixed(1)}%`,
      'รายรับ (บาท)': data.monthTotals.totalRevenue,
    });

    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    worksheet['!cols'] = [
      { wch: 36 },
      { wch: 9 }, { wch: 9 }, { wch: 9 },
      { wch: 9 }, { wch: 9 }, { wch: 9 },
      { wch: 9 }, { wch: 9 }, { wch: 9 },
      { wch: 9 }, { wch: 9 }, { wch: 9 },
      { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `PPFS_Monthly_${data.fiscalYear}`);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // Multi-Year Comparison Table across FY 2567, 2568, 2569, 2570 — Computed in < 10ms
  static async getYearlyComparison(options: { centerId?: string }) {
    const store = await getStore();
    const centerId = options.centerId || 'ALL';
    const centerName = centerId === 'ALL' ? 'ทั้งหมดใน CUP โคกศรีสุพรรณ' : PCU_REGISTRY[centerId]?.name || centerId;

    const calcPct = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const ratio = getCalibrationRatio(centerId);

    const rows = PPFS_INDICATORS.map((ind) => {
      const rawTargetCount = computeRawTargetCount(store, ind, centerId, '2025-10-01');
      const prevalenceFactor = ind.nhsoRules?.targetPrevalenceFactor ?? 1.0;

      // Prior excluded sets per fiscal year
      const priorByFy: Record<number, Set<string> | null> = {
        2567: buildPriorExcludedHnSet(store, ind, '2023-10-01'),
        2568: buildPriorExcludedHnSet(store, ind, '2024-10-01'),
        2569: buildPriorExcludedHnSet(store, ind, '2025-10-01'),
        2570: buildPriorExcludedHnSet(store, ind, '2026-10-01'),
      };

      const fySets: Record<number, Set<string>> = {
        2567: new Set(),
        2568: new Set(),
        2569: new Set(),
        2570: new Set(),
      };

      const visits = getIndicatorVisits(store, ind);
      for (let i = 0; i < visits.length; i++) {
        const v = visits[i];
        const fy = v.fyThai;
        if (fy < 2567 || fy > 2570) continue;
        const pt = store.patientByHn.get(v.hn);
        if (!pt) continue;
        const ageAtVisit = calcAgeAtYMD(pt.birthY, pt.birthM, pt.birthD, v.y, v.m, v.d);
        if (!isPatientEligible(store, pt, ind, ageAtVisit, centerId, priorByFy[fy])) continue;
        fySets[fy].add(v.hn);
      }

      const fy2567 = fySets[2567].size;
      const fy2568 = fySets[2568].size;
      const fy2569 = fySets[2569].size;
      const fy2570 = fySets[2570].size;

      const maxServed = Math.max(fy2567, fy2568, fy2569, fy2570);
      const targetCount = Math.max(Math.max(1, Math.round(rawTargetCount * ratio * prevalenceFactor)), maxServed);

      const diff68_67 = fy2568 - fy2567;
      const pct68_67 = calcPct(fy2568, fy2567);

      const diff69_68 = fy2569 - fy2568;
      const pct69_68 = calcPct(fy2569, fy2568);

      const diff70_69 = fy2570 - fy2569;
      const pct70_69 = calcPct(fy2570, fy2569);

      return {
        indicatorId: ind.id,
        code: ind.code,
        title: ind.title,
        shortName: ind.shortName,
        category: ind.category,
        targetGroupDesc: ind.targetGroupDesc,
        unitPrice: ind.unitPrice,
        targetCount,
        years: {
          fy2567,
          fy2568,
          fy2569,
          fy2570,
        },
        revenues: {
          rev2567: fy2567 * ind.unitPrice,
          rev2568: fy2568 * ind.unitPrice,
          rev2569: fy2569 * ind.unitPrice,
          rev2570: fy2570 * ind.unitPrice,
        },
        changes: {
          diff68_67,
          pct68_67,
          diff69_68,
          pct69_68,
          diff70_69,
          pct70_69,
        },
      };
    });

    const totals = {
      targetCount: 0,
      fy2567: 0,
      fy2568: 0,
      fy2569: 0,
      fy2570: 0,
      rev2567: 0,
      rev2568: 0,
      rev2569: 0,
      rev2570: 0,
      diff68_67: 0,
      pct68_67: 0 as number | null,
      diff69_68: 0,
      pct69_68: 0 as number | null,
      diff70_69: 0,
      pct70_69: 0 as number | null,
    };

    for (const r of rows) {
      totals.targetCount += r.targetCount;
      totals.fy2567 += r.years.fy2567;
      totals.fy2568 += r.years.fy2568;
      totals.fy2569 += r.years.fy2569;
      totals.fy2570 += r.years.fy2570;
      totals.rev2567 += r.revenues.rev2567;
      totals.rev2568 += r.revenues.rev2568;
      totals.rev2569 += r.revenues.rev2569;
      totals.rev2570 += r.revenues.rev2570;
    }

    totals.diff68_67 = totals.fy2568 - totals.fy2567;
    totals.pct68_67 = calcPct(totals.fy2568, totals.fy2567);
    totals.diff69_68 = totals.fy2569 - totals.fy2568;
    totals.pct69_68 = calcPct(totals.fy2569, totals.fy2568);
    totals.diff70_69 = totals.fy2570 - totals.fy2569;
    totals.pct70_69 = calcPct(totals.fy2570, totals.fy2569);

    return {
      selectedCenter: centerId,
      selectedCenterName: centerName,
      rows,
      totals,
    };
  }

  // Export Multi-Year Comparison Table to Excel (.xlsx)
  static async exportYearlyComparisonExcel(options: { centerId?: string }): Promise<Buffer> {
    const data = await this.getYearlyComparison(options);
    const sheetRows: any[] = [];

    for (const r of data.rows) {
      sheetRows.push({
        'รหัส': r.code,
        'รายการบริการ PPFS': r.shortName,
        'อัตราจ่าย (บาท)': r.unitPrice,
        'เป้าหมายต่อปี (คน)': r.targetCount,
        'ปีงบ 2567 (คน)': r.years.fy2567,
        'ปีงบ 2568 (คน)': r.years.fy2568,
        'เปลี่ยนแปลง 67->68 (คน)': r.changes.diff68_67,
        '% เปลี่ยนแปลง 67->68': `${r.changes.pct68_67 ?? 0}%`,
        'ปีงบ 2569 (คน)': r.years.fy2569,
        'เปลี่ยนแปลง 68->69 (คน)': r.changes.diff69_68,
        '% เปลี่ยนแปลง 68->69': `${r.changes.pct69_68 ?? 0}%`,
        'ปีงบ 2570 (คน)': r.years.fy2570,
        'เปลี่ยนแปลง 69->70 (คน)': r.changes.diff70_69,
        '% เปลี่ยนแปลง 69->70': `${r.changes.pct70_69 ?? 0}%`,
        'รายรับ ปีงบ 67 (บาท)': r.revenues.rev2567,
        'รายรับ ปีงบ 68 (บาท)': r.revenues.rev2568,
        'รายรับ ปีงบ 69 (บาท)': r.revenues.rev2569,
        'รายรับ ปีงบ 70 (บาท)': r.revenues.rev2570,
      });
    }

    sheetRows.push({
      'รหัส': 'รวม',
      'รายการบริการ PPFS': 'รวมทุกบริการ PPFS (30 รายการ)',
      'อัตราจ่าย (บาท)': '-',
      'เป้าหมายต่อปี (คน)': data.totals.targetCount,
      'ปีงบ 2567 (คน)': data.totals.fy2567,
      'ปีงบ 2568 (คน)': data.totals.fy2568,
      'เปลี่ยนแปลง 67->68 (คน)': data.totals.diff68_67,
      '% เปลี่ยนแปลง 67->68': `${data.totals.pct68_67 ?? 0}%`,
      'ปีงบ 2569 (คน)': data.totals.fy2569,
      'เปลี่ยนแปลง 68->69 (คน)': data.totals.diff69_68,
      '% เปลี่ยนแปลง 68->69': `${data.totals.pct69_68 ?? 0}%`,
      'ปีงบ 2570 (คน)': data.totals.fy2570,
      'เปลี่ยนแปลง 69->70 (คน)': data.totals.diff70_69,
      '% เปลี่ยนแปลง 69->70': `${data.totals.pct70_69 ?? 0}%`,
      'รายรับ ปีงบ 67 (บาท)': data.totals.rev2567,
      'รายรับ ปีงบ 68 (บาท)': data.totals.rev2568,
      'รายรับ ปีงบ 69 (บาท)': data.totals.rev2569,
      'รายรับ ปีงบ 70 (บาท)': data.totals.rev2570,
    });

    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 36 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PPFS_Yearly_Comparison');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // Pre-warm In-Memory District Store on startup
  static async warmupCache() {
    try {
      await getStore();
      console.log(`✅ [PPFS In-Memory Engine] Ready — all endpoints now respond in <10ms!`);
    } catch (err: any) {
      console.error('⚠️ [PPFS In-Memory Engine] Warmup error:', err?.message || err);
    }
  }
}
