import { pool } from './db.js';
import { PPFS_INDICATORS, PPFSIndicator, getIndicatorById } from './ppfsIndicators.js';
import { PCU_REGISTRY, PcuNode, getPcuPool } from './pcuDb.js';
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

// Facility mapping with specific subdistrict and moos from CUP sticker
export interface FacilityAreaRule {
  tmbpart: string;
  moos?: string[]; // Empty means all moos in this tambol
}

export const FACILITY_AREA_MAP: Record<string, FacilityAreaRule> = {
  '11101': {
    tmbpart: '01',
    moos: ['1', '2', '4', '5', '7', '8', '9', '10', '13', '14', '15', '16'],
  },
  '05569': {
    tmbpart: '01',
    moos: ['3', '6', '11', '12', '17', '18'],
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
  },
  '05573': {
    tmbpart: '04',
    moos: ['1', '5', '9', '10', '11', '12'],
  },
};

// Dead filter condition excluding all deceased patients
export const DEAD_PATIENT_FILTER_SQL = `(p.death != 'Y' OR p.death IS NULL) AND p.deathday IS NULL AND p.hn NOT IN (SELECT hn FROM death WHERE death_date IS NOT NULL)`;

function applyFacilityFilter(centerId: string | undefined, conditions: string[], params: any[]) {
  if (centerId && centerId !== 'ALL' && FACILITY_AREA_MAP[centerId]) {
    const rule = FACILITY_AREA_MAP[centerId];
    conditions.push(`p.tmbpart = ?`);
    params.push(rule.tmbpart);
    if (rule.moos && rule.moos.length > 0) {
      const mooPlaceholders = rule.moos.map(() => '?').join(',');
      conditions.push(`CAST(p.moopart AS UNSIGNED) IN (${mooPlaceholders})`);
      params.push(...rule.moos.map((m) => Number(m)));
    }
    // กรองเฉพาะประชากรในเขตรับผิดชอบ Type Area 1 (มีชื่ออยู่จริง) และ 3 (ตัวอยู่จริงในเขต)
    if (centerId === '11101') {
      conditions.push(`p.type_area IN ('1', '3')`);
    }
  } else {
    conditions.push(`p.tmbpart IN ('01', '02', '03', '04')`);
  }
}

// Helper to apply NHSO eligibility criteria (Age / 7 Chronic Diseases / Thai Nationality / Non-Chronic / Interval)
function applyNhsoEligibilityConditions(
  indicator: PPFSIndicator,
  dateExpr: string,
  conditions: string[],
  params: any[],
  options?: { isDenominator?: boolean; startDate?: string }
) {
  const rules = indicator.nhsoRules;

  // 1. สัญชาติไทย (nationality = '99') ตามหลักเกณฑ์กองทุน PPFS สปสช.
  if (rules?.requireThaiNationality !== false) {
    conditions.push(`p.nationality = '99'`);
  }

  // 2. เพศตามเกณฑ์
  if (indicator.gender === 'FEMALE') {
    conditions.push(`p.sex = '2'`);
  } else if (indicator.gender === 'MALE') {
    conditions.push(`p.sex = '1'`);
  }

  // 3. เกณฑ์อายุ หรือ 7 กลุ่มโรคเรื้อรัง / เด็กเล็ก (เช่น วัคซีนไข้หวัดใหญ่ PP08, คัดกรองวัณโรค PP22)
  const orSubConditions: string[] = [
    `TIMESTAMPDIFF(YEAR, p.birthday, ${dateExpr}) BETWEEN ? AND ?`,
  ];
  params.push(indicator.ageMin, indicator.ageMax);

  if (rules?.orChildMaxAge !== undefined) {
    orSubConditions.push(`TIMESTAMPDIFF(YEAR, p.birthday, ${dateExpr}) BETWEEN 0 AND ?`);
    params.push(rules.orChildMaxAge);
  }

  if (rules?.orChronicClinics && rules.orChronicClinics.length > 0) {
    const clinicPlaceholders = rules.orChronicClinics.map(() => '?').join(',');
    orSubConditions.push(
      `p.hn IN (SELECT cm.hn FROM clinicmember cm WHERE cm.clinic IN (${clinicPlaceholders}) AND cm.hn IS NOT NULL)`
    );
    params.push(...rules.orChronicClinics);
  }

  if (orSubConditions.length === 1) {
    conditions.push(orSubConditions[0]);
  } else {
    conditions.push(`(${orSubConditions.join(' OR ')})`);
  }

  // 4. ตัดผู้ป่วยที่ขึ้นทะเบียนโรคเรื้อรังเดิมออก (เช่น คัดกรองเบาหวาน PP03 ต้องตัดคลินิก 001, ความดัน PP04 ตัดคลินิก 002)
  if (rules?.excludeChronicClinics && rules.excludeChronicClinics.length > 0) {
    const exPlaceholders = rules.excludeChronicClinics.map(() => '?').join(',');
    conditions.push(
      `p.hn NOT IN (SELECT cm.hn FROM clinicmember cm WHERE cm.clinic IN (${exPlaceholders}) AND cm.hn IS NOT NULL)`
    );
    params.push(...rules.excludeChronicClinics);
  }

  // 5. เช็คระยะห่างการตรวจซ้ำข้ามปีงบประมาณ (เช่น HPV DNA ทุก 5 ปี หักผู้ที่ตรวจไปแล้วใน 4 ปีก่อนหน้า, FIT Test ทุก 2 ปี)
  if (options?.isDenominator && options.startDate && rules?.excludePriorIntervalYears && rules.excludePriorIntervalYears > 0) {
    const icdPlaceholders = indicator.icd10Codes.map(() => '?').join(',');
    conditions.push(
      `p.hn NOT IN (
        SELECT o2.hn FROM ovst o2
        INNER JOIN ovstdiag od2 ON od2.vn = o2.vn
        WHERE o2.vstdate BETWEEN DATE_SUB(?, INTERVAL ? YEAR) AND DATE_SUB(?, INTERVAL 1 DAY)
          AND od2.icd10 IN (${icdPlaceholders})
      )`
    );
    params.push(options.startDate, rules.excludePriorIntervalYears, options.startDate, ...indicator.icd10Codes);
  }
}

// Build WHERE condition for target population (Denominator)
function buildDenominatorWhere(
  indicator: PPFSIndicator,
  centerId?: string,
  startDate?: string
): { whereSql: string; params: any[] } {
  const conditions: string[] = [
    `p.chwpart = '47'`,
    `p.amppart = '15'`,
    DEAD_PATIENT_FILTER_SQL,
    `p.birthday IS NOT NULL`,
  ];
  const params: any[] = [];

  applyNhsoEligibilityConditions(indicator, 'CURDATE()', conditions, params, {
    isDenominator: true,
    startDate,
  });

  applyFacilityFilter(centerId, conditions, params);

  return {
    whereSql: conditions.join(' AND '),
    params,
  };
}

// Build WHERE condition for service recipients (Numerator)
function buildNumeratorWhere(
  indicator: PPFSIndicator,
  startDate: string,
  endDate: string,
  centerId?: string
): { whereSql: string; params: any[]; baseWhereSql: string; baseParams: any[] } {
  const baseConditions: string[] = [
    `o.vstdate BETWEEN ? AND ?`,
    `p.chwpart = '47'`,
    `p.amppart = '15'`,
    DEAD_PATIENT_FILTER_SQL,
  ];
  const baseParams: any[] = [startDate, endDate];

  applyNhsoEligibilityConditions(indicator, 'o.vstdate', baseConditions, baseParams, {
    isDenominator: false,
  });

  applyFacilityFilter(centerId, baseConditions, baseParams);

  const conditions = [...baseConditions];
  const params = [...baseParams];

  // ICD-10 condition
  const icdPlaceholders = indicator.icd10Codes.map(() => '?').join(',');
  conditions.push(`od.icd10 IN (${icdPlaceholders})`);
  params.push(...indicator.icd10Codes);

  return {
    whereSql: conditions.join(' AND '),
    params,
    baseWhereSql: baseConditions.join(' AND '),
    baseParams,
  };
}

// Helper to query distinct served patient count (supporting both ovstdiag ICD-10 and pp_special)
async function queryIndicatorServedCount(
  indicator: PPFSIndicator,
  startDate: string,
  endDate: string,
  centerId?: string
): Promise<number> {
  const num = buildNumeratorWhere(indicator, startDate, endDate, centerId);
  const ppIds = indicator.nhsoRules?.ppSpecialTypeIds;

  if (ppIds && ppIds.length > 0) {
    const ppPlaceholders = ppIds.map(() => '?').join(',');
    const [rows]: any = await pool.query(
      `SELECT COUNT(DISTINCT hn) as served_count FROM (
         SELECT o.hn
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         WHERE ${num.whereSql}
         UNION
         SELECT o.hn
         FROM ovst o
         INNER JOIN pp_special pp ON pp.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         WHERE ${num.baseWhereSql} AND pp.pp_special_type_id IN (${ppPlaceholders})
       ) combined_srv`,
      [...num.params, ...num.baseParams, ...ppIds]
    );
    return Number(rows[0]?.served_count || 0);
  }

  const [servedRows]: any = await pool.query(
    `SELECT COUNT(DISTINCT p.hn) as served_count 
     FROM ovst o 
     INNER JOIN ovstdiag od ON od.vn = o.vn 
     INNER JOIN patient p ON p.hn = o.hn 
     WHERE ${num.whereSql}`,
    num.params
  );
  return Number(servedRows[0]?.served_count || 0);
}

// Real Living Population Type 1 & 3 from HOSxP and PCU databases (26,080 คน)
export const OFFICIAL_DISTRICT_TOTAL_POP = 26080;

// Raw historical card counts in HOSxP patient table
const RAW_POP_MAP: Record<string, number> = {
  '11101': 6880, // Denominator uses type_area IN ('1', '3') directly
  '05569': 5005,
  '05570': 7487,
  '05571': 9024,
  '05572': 4944,
  '05573': 5148,
  'ALL': 43434,
};

export const getCalibrationRatio = (centerId: string | undefined): number => {
  if (centerId === '11101') return 1.0;
  if (!centerId || centerId === 'ALL') {
    return OFFICIAL_DISTRICT_TOTAL_POP / RAW_POP_MAP['ALL']; // ~0.60
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

// Helper to run async tasks in parallel batches to avoid overwhelming DB connection pool
async function runInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// Gather all distinct ICD-10 codes across all 30 PPFS indicators
export const ALL_PPFS_ICD10_CODES = Array.from(
  new Set(PPFS_INDICATORS.flatMap((ind) => ind.icd10Codes))
);

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
    const today = new Date();
    // Default to current fiscal year
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

    // 1. Calculate all 30 indicators in parallel batches of 6
    const indicatorsResult = await runInBatches(PPFS_INDICATORS, 6, async (ind): Promise<IndicatorSummary> => {
      const denom = buildDenominatorWhere(ind, centerId, startDate);
      const [targetRows]: any = await pool.query(
        `SELECT COUNT(DISTINCT p.hn) as target_count FROM patient p WHERE ${denom.whereSql}`,
        denom.params
      );
      const rawTargetCount = Number(targetRows[0]?.target_count || 0);
      const ratio = getCalibrationRatio(centerId);
      const prevalenceFactor = ind.nhsoRules?.targetPrevalenceFactor ?? 1.0;

      const servedCount = await queryIndicatorServedCount(ind, startDate, endDate, centerId);
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

    for (const item of indicatorsResult) {
      totalTarget += item.targetCount;
      totalServed += item.servedCount;
      totalTargetRev += item.targetRevenue;
      totalActualRev += item.actualRevenue;
    }

    const totalCoverage = totalTarget > 0 ? Number(((totalServed / totalTarget) * 100).toFixed(1)) : 0;
    const totalRevGap = Math.max(0, totalTargetRev - totalActualRev);

    // 2. Calculate Facility Rankings across network centers
    const icdPlaceholdersAll = ALL_PPFS_ICD10_CODES.map(() => '?').join(',');
    const centerRankings: CenterKpiSummary[] = [];

    for (const [code, node] of Object.entries(PCU_REGISTRY)) {
      const rule = FACILITY_AREA_MAP[code];
      const targetCount = node.officialPopulation || 3600;

      const numConditions = [
        `o.vstdate BETWEEN ? AND ?`,
        `p.chwpart = '47'`,
        `p.amppart = '15'`,
        `p.nationality = '99'`,
        DEAD_PATIENT_FILTER_SQL,
      ];
      const numParams: any[] = [startDate, endDate];
      if (rule) {
        numConditions.push(`p.tmbpart = ?`);
        numParams.push(rule.tmbpart);
        if (rule.moos && rule.moos.length > 0) {
          const mooPlaceholders = rule.moos.map(() => '?').join(',');
          numConditions.push(`CAST(p.moopart AS UNSIGNED) IN (${mooPlaceholders})`);
          numParams.push(...rule.moos.map((m) => Number(m)));
        }
      }
      numConditions.push(`od.icd10 IN (${icdPlaceholdersAll})`);
      numParams.push(...ALL_PPFS_ICD10_CODES);

      let servedCount = 0;
      // Direct query to PCU GDCC Database for real Sub-district health center services
      if (code !== '11101') {
        try {
          const pcuPool = getPcuPool(code);
          if (pcuPool) {
            const [pcuSrv]: any = await pcuPool.query(
              `SELECT COUNT(DISTINCT o.hn) as cnt 
               FROM ovst o 
               INNER JOIN ovstdiag od ON od.vn = o.vn 
               INNER JOIN patient p ON p.hn = o.hn 
               WHERE o.vstdate BETWEEN ? AND ?
                 AND od.icd10 IN (${icdPlaceholdersAll})
                 AND (p.death != 'Y' OR p.death IS NULL) AND p.deathday IS NULL
                 AND p.type_area IN ('1', '3')`,
              [startDate, endDate, ...ALL_PPFS_ICD10_CODES]
            );
            servedCount = Number(pcuSrv[0]?.cnt || 0);
          }
        } catch {
          // Fallback gracefully
        }
      }

      if (servedCount === 0) {
        const [cServed]: any = await pool.query(
          `SELECT COUNT(DISTINCT o.hn) as cnt 
           FROM ovst o 
           INNER JOIN ovstdiag od ON od.vn = o.vn 
           INNER JOIN patient p ON p.hn = o.hn 
           WHERE ${numConditions.join(' AND ')}`,
          numParams
        );
        servedCount = Number(cServed[0]?.cnt || 0);
      }
      const cov = targetCount > 0 ? Number(((servedCount / targetCount) * 100).toFixed(1)) : 0;
      const actRev = servedCount * 120;
      const tgtRev = targetCount * 120;

      centerRankings.push({
        hospcode: code,
        name: node.name,
        subdistrict: node.subdistrict,
        targetCount,
        servedCount,
        coveragePercent: Math.min(100, cov),
        targetRevenue: tgtRev,
        actualRevenue: actRev,
        revenueGap: Math.max(0, tgtRev - actRev),
      });
    }

    // Sort rankings by coverage percent desc
    centerRankings.sort((a, b) => b.coveragePercent - a.coveragePercent);
    centerRankings.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    // 3. Official Living Population for Center & District
    const uniquePopulation = getOfficialCenterPopulation(centerId);
    const totalDistrictPopulation = OFFICIAL_DISTRICT_TOTAL_POP;

    const popConditions: string[] = [
      `p.chwpart = '47'`,
      `p.amppart = '15'`,
      `p.nationality = '99'`,
      DEAD_PATIENT_FILTER_SQL,
    ];
    const popParams: any[] = [];
    applyFacilityFilter(centerId, popConditions, popParams);

    const [uniqueServedRows]: any = await pool.query(
      `SELECT COUNT(DISTINCT o.hn) as served_unique, COUNT(*) as total_services
       FROM ovst o
       INNER JOIN ovstdiag od ON od.vn = o.vn
       INNER JOIN patient p ON p.hn = o.hn
       WHERE o.vstdate BETWEEN ? AND ?
         AND ${popConditions.join(' AND ')}
         AND od.icd10 IN (${icdPlaceholdersAll})`,
      [startDate, endDate, ...popParams, ...ALL_PPFS_ICD10_CODES]
    );
    const uniqueServed = Number(uniqueServedRows[0]?.served_unique || 0);
    const totalServicesCount = Number(uniqueServedRows[0]?.total_services || 0);
    const uniqueCoveragePercent = uniquePopulation > 0 ? Number(((uniqueServed / uniquePopulation) * 100).toFixed(1)) : 0;

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

  // Indicator Deep Dive with Trend & Village Breakdown
  static async getIndicatorDetail(
    indicatorId: string,
    options: { startDate?: string; endDate?: string; centerId?: string }
  ) {
    const ind = getIndicatorById(indicatorId);
    if (!ind) throw new Error(`Indicator '${indicatorId}' not found`);

    const today = new Date();
    const fyYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
    const startDate = options.startDate || `${fyYear - 1}-10-01`;
    const endDate = options.endDate || today.toISOString().split('T')[0];
    const centerId = options.centerId || 'ALL';

    // Denominator & Numerator overall with calibration ratio & prevalence factor
    const denom = buildDenominatorWhere(ind, centerId, startDate);
    const [tgtRows]: any = await pool.query(
      `SELECT COUNT(DISTINCT p.hn) as target_count FROM patient p WHERE ${denom.whereSql}`,
      denom.params
    );
    const rawTargetCount = Number(tgtRows[0]?.target_count || 0);
    const ratio = getCalibrationRatio(centerId);
    const prevalenceFactor = ind.nhsoRules?.targetPrevalenceFactor ?? 1.0;

    const servedCount = await queryIndicatorServedCount(ind, startDate, endDate, centerId);
    const calibratedTarget = Math.max(1, Math.round(rawTargetCount * ratio * prevalenceFactor));
    const targetCount = Math.max(calibratedTarget, servedCount);
    const coveragePercent = targetCount > 0 ? Number(((servedCount / targetCount) * 100).toFixed(1)) : 0;

    const num = buildNumeratorWhere(ind, startDate, endDate, centerId);

    // Monthly Trend
    const [trendRows]: any = await pool.query(
      `SELECT 
         DATE_FORMAT(o.vstdate, '%Y-%m') as ym,
         COUNT(DISTINCT p.hn) as served_count
       FROM ovst o
       INNER JOIN ovstdiag od ON od.vn = o.vn
       INNER JOIN patient p ON p.hn = o.hn
       WHERE ${num.whereSql}
       GROUP BY DATE_FORMAT(o.vstdate, '%Y-%m')
       ORDER BY ym ASC`,
      num.params
    );

    // Village Breakdown
    const [villageRows]: any = await pool.query(
      `SELECT 
         p.moopart as moo,
         t.name as tambol_name,
         COUNT(DISTINCT p.hn) as target_count
       FROM patient p
       LEFT JOIN thaiaddress t ON t.chwpart=p.chwpart AND t.amppart=p.amppart AND t.tmbpart=p.tmbpart
       WHERE ${denom.whereSql} AND p.moopart IS NOT NULL AND p.moopart != ''
       GROUP BY p.moopart, t.name
       ORDER BY CAST(p.moopart AS UNSIGNED) ASC
       LIMIT 30`,
      denom.params
    );

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
      monthlyTrend: trendRows.map((r: any) => ({
        month: r.ym,
        served: Number(r.served_count || 0),
        revenue: Number(r.served_count || 0) * ind.unitPrice,
      })),
      villageBreakdown: villageRows.map((v: any) => ({
        moo: `หมู่ ${v.moo}`,
        subdistrict: v.tambol_name || 'ต.ตองโขบ',
        targetCount: Math.max(1, Math.round(Number(v.target_count || 0) * ratio * prevalenceFactor)),
      })),
    };
  }

  // Get Target Patient Call List (Unserved / Served)
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
    const ind = getIndicatorById(indicatorId);
    if (!ind) throw new Error(`Indicator '${indicatorId}' not found`);

    const status = options.status || 'unserved';
    const centerId = options.centerId || 'ALL';
    const limit = Math.min(100, Math.max(10, options.limit || 50));
    const offset = Math.max(0, options.offset || 0);

    const today = new Date();
    const fyYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
    const startDate = options.startDate || `${fyYear - 1}-10-01`;
    const endDate = options.endDate || today.toISOString().split('T')[0];

    const denom = buildDenominatorWhere(ind, centerId, startDate);

    // If searching
    let searchSql = '';
    const searchParams: any[] = [];
    if (options.search && options.search.trim()) {
      const q = `%${options.search.trim()}%`;
      searchSql = ` AND (p.hn LIKE ? OR p.cid LIKE ? OR p.fname LIKE ? OR p.lname LIKE ?)`;
      searchParams.push(q, q, q, q);
    }

    // Subquery for served HNs in period
    const icdPlaceholders = ind.icd10Codes.map(() => '?').join(',');
    const servedSubquery = `
      SELECT DISTINCT o.hn 
      FROM ovst o 
      INNER JOIN ovstdiag od ON od.vn = o.vn 
      WHERE o.vstdate BETWEEN ? AND ? AND od.icd10 IN (${icdPlaceholders})
    `;
    const servedParams = [startDate, endDate, ...ind.icd10Codes];

    let filterStatusSql = '';
    if (status === 'unserved') {
      filterStatusSql = ` AND p.hn NOT IN (${servedSubquery})`;
    } else if (status === 'served') {
      filterStatusSql = ` AND p.hn IN (${servedSubquery})`;
    }

    const allParams = [...denom.params, ...searchParams];
    if (status !== 'all') {
      allParams.push(...servedParams);
    }

    // Total count query
    const [countRows]: any = await pool.query(
      `SELECT COUNT(DISTINCT p.hn) as total
       FROM patient p
       WHERE ${denom.whereSql} ${searchSql} ${filterStatusSql}`,
      allParams
    );
    const total = Number(countRows[0]?.total || 0);

    // List query
    const [rows]: any = await pool.query(
      `SELECT 
         p.hn,
         p.cid,
         CONCAT(COALESCE(p.pname,''), p.fname, ' ', p.lname) as fullname,
         TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) as age,
         p.sex,
         p.addrpart,
         p.moopart,
         p.type_area,
         t.name as tambol_name,
         p.hometel,
         serv.vstdate as last_service_date,
         serv.icd10 as last_icd10
       FROM patient p
       LEFT JOIN thaiaddress t ON t.chwpart=p.chwpart AND t.amppart=p.amppart AND t.tmbpart=p.tmbpart
       LEFT JOIN (
         SELECT o.hn, MAX(o.vstdate) as vstdate, MAX(od.icd10) as icd10
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         WHERE o.vstdate BETWEEN ? AND ? AND od.icd10 IN (${icdPlaceholders})
         GROUP BY o.hn
       ) serv ON serv.hn = p.hn
       WHERE ${denom.whereSql} ${searchSql} ${filterStatusSql}
       ORDER BY CAST(p.moopart AS UNSIGNED) ASC, p.addrpart ASC
       LIMIT ? OFFSET ?`,
      [startDate, endDate, ...ind.icd10Codes, ...allParams, limit, offset]
    );

    const typeAreaDescMap: Record<string, string> = {
      '1': 'Type 1 (มีชื่ออยู่จริง)',
      '2': 'Type 2 (มีชื่อไม่อยู่จริง)',
      '3': 'Type 3 (มาอาศัยในเขต)',
      '4': 'Type 4 (นอกเขต)',
      '5': 'Type 5 (ไม่ใช่คนไทย)',
    };

    const list: PatientRecord[] = rows.map((r: any) => ({
      hn: r.hn,
      cid: r.cid || '',
      maskedCid: r.cid ? `${r.cid.substring(0, 1)}-${r.cid.substring(1, 5)}-xxxxx-${r.cid.substring(11, 13)}` : '-',
      name: r.fullname,
      age: Number(r.age || 0),
      gender: r.sex === '1' ? 'ชาย' : r.sex === '2' ? 'หญิง' : 'ไม่ระบุ',
      address: r.addrpart ? `บ้านเลขที่ ${r.addrpart}` : '-',
      moo: r.moopart ? `หมู่ ${r.moopart}` : '-',
      villageName: `หมู่ ${r.moopart || '-'}`,
      subdistrict: r.tambol_name ? `ต.${r.tambol_name}` : '-',
      tel: r.hometel || '-',
      typeArea: r.type_area || '-',
      typeAreaDesc: typeAreaDescMap[r.type_area] || `Type ${r.type_area || '-'}`,
      serviceDate: r.last_service_date ? String(r.last_service_date).split('T')[0] : undefined,
      diagCode: r.last_icd10 || undefined,
      status: r.last_service_date ? 'SERVED' : 'UNSERVED',
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
      { wch: 6 },  // ลำดับ
      { wch: 12 }, // HN
      { wch: 18 }, // CID
      { wch: 25 }, // ชื่อ-สกุล
      { wch: 10 }, // อายุ
      { wch: 8 },  // เพศ
      { wch: 18 }, // ที่อยู่
      { wch: 10 }, // หมู่
      { wch: 14 }, // ตำบล
      { wch: 16 }, // เบอร์โทร
      { wch: 26 }, // สถานะ
      { wch: 16 }, // วันที่
      { wch: 14 }, // รหัส
      { wch: 18 }, // อัตราจ่าย
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PPFS_Target_List');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  // Pre-Audit Engine (ตรวจเช็คข้อมูลลงข้อมูลถูกต้องตามเงื่อนไขการเบิกจ่าย สปสช. หรือไม่)
  static async auditDataQuality(options: { startDate?: string; endDate?: string; centerId?: string }) {
    const today = new Date();
    const fyYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
    const startDate = options.startDate || `${fyYear - 1}-10-01`;
    const endDate = options.endDate || today.toISOString().split('T')[0];

    const [
      [hpvViolations],
      [fitViolations],
      [dmInChronicViolations],
      [htInChronicViolations],
      [nonThaiViolations],
      [dupFit],
    ]: any = await Promise.all([
      // 1. Audit HPV DNA: Male or age < 30 or age > 59
      pool.query(
        `SELECT 
           o.hn, p.cid, CONCAT(p.fname, ' ', p.lname) as pt_name,
           p.sex, TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) as age,
           o.vstdate, od.icd10,
           CASE 
             WHEN p.sex = '1' THEN '[PP01] ตรวจ HPV DNA ในผู้ป่วยเพศชาย (ผิดเงื่อนไข สปสช.)'
             WHEN TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) < 30 THEN '[PP01] อายุต่ำกว่าเกณฑ์ 30 ปี (HPV DNA)'
             WHEN TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) > 59 THEN '[PP01] อายุเกินเกณฑ์ 59 ปี (HPV DNA)'
             ELSE '[PP01] ผิดเงื่อนไขกลุ่มเป้าหมาย'
           END as issue_reason,
           400 as potential_loss
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         WHERE o.vstdate BETWEEN ? AND ?
           AND od.icd10 IN ('Z124', 'Z014')
           AND (p.sex = '1' OR TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) < 30 OR TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) > 59)
         LIMIT 25`,
        [startDate, endDate]
      ),

      // 2. Audit FIT Test: Age < 50 or > 70
      pool.query(
        `SELECT 
           o.hn, p.cid, CONCAT(p.fname, ' ', p.lname) as pt_name,
           p.sex, TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) as age,
           o.vstdate, od.icd10,
           '[PP02] อายุไม่อยู่ในช่วง 50 - 70 ปีตามเกณฑ์คัดกรองมะเร็งลำไส้ (FIT Test)' as issue_reason,
           100 as potential_loss
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         WHERE o.vstdate BETWEEN ? AND ?
           AND od.icd10 = 'Z121'
           AND (TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) < 50 OR TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) > 70)
         LIMIT 25`,
        [startDate, endDate]
      ),

      // 3. Audit DM Screening (Z131) in patients already registered in DM Clinic ('001')
      pool.query(
        `SELECT 
           o.hn, p.cid, CONCAT(p.fname, ' ', p.lname) as pt_name,
           p.sex, TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) as age,
           o.vstdate, od.icd10,
           '[PP03] ลงรหัสคัดกรองเบาหวาน (Z131) ในผู้ป่วยที่ขึ้นทะเบียนคลินิกเบาหวานอยู่แล้ว (สปสช. ตัดจ่าย)' as issue_reason,
           100 as potential_loss
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         INNER JOIN clinicmember cm ON cm.hn = o.hn AND cm.clinic = '001'
         WHERE o.vstdate BETWEEN ? AND ?
           AND od.icd10 = 'Z131'
         LIMIT 25`,
        [startDate, endDate]
      ),

      // 4. Audit HT Screening (Z136) in patients already registered in HT Clinic ('002')
      pool.query(
        `SELECT 
           o.hn, p.cid, CONCAT(p.fname, ' ', p.lname) as pt_name,
           p.sex, TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) as age,
           o.vstdate, od.icd10,
           '[PP04] ลงรหัสคัดกรองความดัน (Z136) ในผู้ป่วยที่ขึ้นทะเบียนคลินิกความดันโลหิตสูงอยู่แล้ว (สปสช. ตัดจ่าย)' as issue_reason,
           50 as potential_loss
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         INNER JOIN clinicmember cm ON cm.hn = o.hn AND cm.clinic = '002'
         WHERE o.vstdate BETWEEN ? AND ?
           AND od.icd10 = 'Z136'
         LIMIT 25`,
        [startDate, endDate]
      ),

      // 5. Audit Non-Thai nationality or invalid 13-digit CID in PPFS claims
      pool.query(
        `SELECT 
           o.hn, p.cid, CONCAT(p.fname, ' ', p.lname) as pt_name,
           p.sex, TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) as age,
           o.vstdate, od.icd10,
           'ผู้รับบริการไม่ได้ระบุสัญชาติไทย (99) หรือเลขบัตรประชาชนไม่ครบ 13 หลัก (เบิกกองทุน PPFS ไม่ได้)' as issue_reason,
           150 as potential_loss
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         WHERE o.vstdate BETWEEN ? AND ?
           AND od.icd10 IN ('Z124','Z121','Z131','Z136','Z111','Z115','Z116','Z340','Z348')
           AND (p.nationality != '99' OR p.nationality IS NULL OR p.cid IS NULL OR CHAR_LENGTH(TRIM(p.cid)) != 13)
         LIMIT 25`,
        [startDate, endDate]
      ),

      // 6. Duplicate checks within interval
      pool.query(
        `SELECT 
           o.hn, p.cid, CONCAT(p.fname, ' ', p.lname) as pt_name,
           p.sex, TIMESTAMPDIFF(YEAR, p.birthday, o.vstdate) as age,
           o.vstdate, od.icd10,
           'บันทึกบริการคัดกรองซ้ำซ้อนภายในระยะเวลาที่ไม่ถึงเกณฑ์' as issue_reason,
           100 as potential_loss
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         WHERE o.vstdate BETWEEN ? AND ? AND od.icd10 IN ('Z121', 'Z124')
         GROUP BY o.hn, o.vstdate, p.cid, p.fname, p.lname, p.sex, p.birthday, od.icd10
         HAVING COUNT(*) > 1
         LIMIT 20`,
        [startDate, endDate]
      ),
    ]);

    const allIssues = [
      ...hpvViolations,
      ...fitViolations,
      ...dmInChronicViolations,
      ...htInChronicViolations,
      ...nonThaiViolations,
      ...dupFit,
    ].map((row, idx) => ({
      id: idx + 1,
      hn: row.hn,
      cid: row.cid ? `${row.cid.substring(0, 1)}-${row.cid.substring(1, 5)}-xxxxx-${row.cid.substring(11, 13)}` : '-',
      name: row.pt_name,
      age: row.age,
      gender: row.sex === '1' ? 'ชาย' : 'หญิง',
      vstdate: String(row.vstdate).split('T')[0],
      icd10: row.icd10,
      issue: row.issue_reason,
      potentialLoss: Number(row.potential_loss || 0),
      recommendation: 'ตรวจสอบทะเบียนคลินิกเรื้อรัง / สัญชาติ / อายุ หรือแก้ไขรหัสวินิจฉัยก่อนส่งเบิก e-Claim',
    }));

    return {
      totalIssues: allIssues.length,
      estimatedLossRisk: allIssues.reduce((sum, item) => sum + item.potentialLoss, 0),
      issues: allIssues,
    };
  }

  // Monthly Matrix Tracking (12 Months Fiscal Year Matrix by Center across all 30 indicators)
  static async getMonthlyMatrix(options: { fiscalYear?: number; centerId?: string }) {
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

    const rows = await runInBatches(PPFS_INDICATORS, 6, async (ind) => {
      // 1. Target Denominator with calibration ratio & prevalence factor
      const denom = buildDenominatorWhere(ind, centerId, startDate);
      const [targetRows]: any = await pool.query(
        `SELECT COUNT(DISTINCT p.hn) as target_count FROM patient p WHERE ${denom.whereSql}`,
        denom.params
      );
      const rawTargetCount = Number(targetRows[0]?.target_count || 0);
      const ratio = getCalibrationRatio(centerId);
      const prevalenceFactor = ind.nhsoRules?.targetPrevalenceFactor ?? 1.0;

      // 2. Monthly Numerator
      const num = buildNumeratorWhere(ind, startDate, endDate, centerId);
      const [mRows]: any = await pool.query(
        `SELECT 
           DATE_FORMAT(o.vstdate, '%m') as m,
           COUNT(DISTINCT p.hn) as pt_count
         FROM ovst o
         INNER JOIN ovstdiag od ON od.vn = o.vn
         INNER JOIN patient p ON p.hn = o.hn
         WHERE ${num.whereSql}
         GROUP BY DATE_FORMAT(o.vstdate, '%m')`,
        num.params
      );

      const monthMap: Record<string, number> = {};
      for (const r of mRows) {
        monthMap[r.m] = Number(r.pt_count || 0);
      }

      const m10 = monthMap['10'] || 0;
      const m11 = monthMap['11'] || 0;
      const m12 = monthMap['12'] || 0;
      const m01 = monthMap['01'] || 0;
      const m02 = monthMap['02'] || 0;
      const m03 = monthMap['03'] || 0;
      const m04 = monthMap['04'] || 0;
      const m05 = monthMap['05'] || 0;
      const m06 = monthMap['06'] || 0;
      const m07 = monthMap['07'] || 0;
      const m08 = monthMap['08'] || 0;
      const m09 = monthMap['09'] || 0;

      const totalServed = m10 + m11 + m12 + m01 + m02 + m03 + m04 + m05 + m06 + m07 + m08 + m09;
      const calibratedTarget = Math.max(1, Math.round(rawTargetCount * ratio * prevalenceFactor));
      const targetCount = Math.max(calibratedTarget, totalServed);
      const coveragePercent = targetCount > 0 ? Number(((totalServed / targetCount) * 100).toFixed(1)) : 0;
      const actualRevenue = totalServed * ind.unitPrice;

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

    for (const r of rows) {
      monthTotals.m10 += r.months.m10;
      monthTotals.m11 += r.months.m11;
      monthTotals.m12 += r.months.m12;
      monthTotals.m01 += r.months.m01;
      monthTotals.m02 += r.months.m02;
      monthTotals.m03 += r.months.m03;
      monthTotals.m04 += r.months.m04;
      monthTotals.m05 += r.months.m05;
      monthTotals.m06 += r.months.m06;
      monthTotals.m07 += r.months.m07;
      monthTotals.m08 += r.months.m08;
      monthTotals.m09 += r.months.m09;
      monthTotals.totalServed += r.totalServed;
      monthTotals.totalTarget += r.targetCount;
      monthTotals.totalRevenue += r.actualRevenue;
    }

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

    // Header info
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
    sheetRows.push({}); // empty row

    // Data rows
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

    // Total summary row
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
      { wch: 36 }, // รายการกิจกรรม
      { wch: 9 },  // ต.ค.
      { wch: 9 },  // พ.ย.
      { wch: 9 },  // ธ.ค.
      { wch: 9 },  // ม.ค.
      { wch: 9 },  // ก.พ.
      { wch: 9 },  // มี.ค.
      { wch: 9 },  // เม.ย.
      { wch: 9 },  // พ.ค.
      { wch: 9 },  // มิ.ย.
      { wch: 9 },  // ก.ค.
      { wch: 9 },  // ส.ค.
      { wch: 9 },  // ก.ย.
      { wch: 14 }, // รวมสะสม
      { wch: 14 }, // เป้าหมาย
      { wch: 10 }, // % บรรลุ
      { wch: 16 }, // รายรับ
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `PPFS_Monthly_${data.fiscalYear}`);
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  // Multi-Year Comparison Table across FY 2567, 2568, 2569, 2570 for all 30 PPFS services
  static async getYearlyComparison(options: { centerId?: string }) {
    const centerId = options.centerId || 'ALL';
    const centerName = centerId === 'ALL' ? 'ทั้งหมดใน CUP โคกศรีสุพรรณ' : PCU_REGISTRY[centerId]?.name || centerId;

    const startDate = '2023-10-01'; // Start of FY 2567
    const endDate = '2027-09-30';   // End of FY 2570

    const calcPct = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const rows = await runInBatches(PPFS_INDICATORS, 6, async (ind) => {
      // 1. Target count
      const denom = buildDenominatorWhere(ind, centerId, '2025-10-01');
      const [targetRows]: any = await pool.query(
        `SELECT COUNT(DISTINCT p.hn) as target_count FROM patient p WHERE ${denom.whereSql}`,
        denom.params
      );
      const rawTargetCount = Number(targetRows[0]?.target_count || 0);
      const ratio = getCalibrationRatio(centerId);
      const prevalenceFactor = ind.nhsoRules?.targetPrevalenceFactor ?? 1.0;

      // 2. Served counts grouped by Fiscal Year (2567, 2568, 2569, 2570)
      const num = buildNumeratorWhere(ind, startDate, endDate, centerId);
      const ppIds = ind.nhsoRules?.ppSpecialTypeIds;

      let fyRows: any[] = [];
      if (ppIds && ppIds.length > 0) {
        const ppPlaceholders = ppIds.map(() => '?').join(',');
        const [r]: any = await pool.query(
          `SELECT fy_thai, COUNT(DISTINCT hn) as pt_count FROM (
             SELECT 
               CASE WHEN MONTH(o.vstdate) >= 10 THEN YEAR(o.vstdate) + 544 ELSE YEAR(o.vstdate) + 543 END as fy_thai,
               o.hn
             FROM ovst o
             INNER JOIN ovstdiag od ON od.vn = o.vn
             INNER JOIN patient p ON p.hn = o.hn
             WHERE ${num.whereSql}
             UNION
             SELECT 
               CASE WHEN MONTH(o.vstdate) >= 10 THEN YEAR(o.vstdate) + 544 ELSE YEAR(o.vstdate) + 543 END as fy_thai,
               o.hn
             FROM ovst o
             INNER JOIN pp_special pp ON pp.vn = o.vn
             INNER JOIN patient p ON p.hn = o.hn
             WHERE ${num.baseWhereSql} AND pp.pp_special_type_id IN (${ppPlaceholders})
           ) combined_fy
           GROUP BY fy_thai`,
          [...num.params, ...num.baseParams, ...ppIds]
        );
        fyRows = r;
      } else {
        const [r]: any = await pool.query(
          `SELECT 
             CASE WHEN MONTH(o.vstdate) >= 10 THEN YEAR(o.vstdate) + 544 ELSE YEAR(o.vstdate) + 543 END as fy_thai,
             COUNT(DISTINCT p.hn) as pt_count
           FROM ovst o
           INNER JOIN ovstdiag od ON od.vn = o.vn
           INNER JOIN patient p ON p.hn = o.hn
           WHERE ${num.whereSql}
           GROUP BY fy_thai`,
          num.params
        );
        fyRows = r;
      }

      const fyMap: Record<number, number> = {};
      for (const r of fyRows) {
        fyMap[Number(r.fy_thai)] = Number(r.pt_count || 0);
      }

      const fy2567 = fyMap[2567] || 0;
      const fy2568 = fyMap[2568] || 0;
      const fy2569 = fyMap[2569] || 0;
      const fy2570 = fyMap[2570] || 0;

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
}
