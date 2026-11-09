import { pool } from './db.js';
import mysql from 'mysql2/promise';
import * as XLSX from 'xlsx';
import path from 'path';

interface FacilityConfig {
  code: string;
  name: string;
  sheet: string;
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  db?: string;
  type: 'hosxp' | 'pcu';
}

const FACILITIES: FacilityConfig[] = [
  { code: '11101', name: 'รพ.โคกศรีสุพรรณ', sheet: 'รพ.โคกศรีสุพรรณ (11101)', type: 'hosxp' },
  { code: '05570', name: 'รพ.สต.โพนค้อ', sheet: 'รพ.สต.โพนค้อ (05570)', host: '209.15.96.29', port: 3306, user: 'root', pass: 'XMQ5s%wJ#m', db: 'hospcu05570', type: 'pcu' },
  { code: '05572', name: 'รพ.สต.โคกนาดี', sheet: 'รพ.สต.โคกนาดี (05572)', host: '209.15.96.27', port: 3306, user: 'root', pass: 'L&wFK5?V#m', db: 'hospcu05572', type: 'pcu' },
  { code: '05573', name: 'รพ.สต.โพนทอง', sheet: 'รพ.สต.โพนทอง (05573)', host: '209.15.96.25', port: 3306, user: 'root', pass: 'H$Tt8X#5#m', db: 'hospcu05573', type: 'pcu' },
  { code: '05571', name: 'รพ.สต.ม่วงไข่', sheet: 'รพ.สต.ม่วงไข่ (05571)', host: '202.139.215.221', port: 3306, user: 'root', pass: 'G7T?&qzV#m', db: 'hospcu05571', type: 'pcu' },
  { code: '05569', name: 'รพ.สต.ห้วยหีบ', sheet: 'รพ.สต.ห้วยหีบ (05569)', host: '202.139.215.223', port: 3306, user: 'root', pass: 'gHY+M9?5#m', db: 'hospcu05569', type: 'pcu' },
];

interface RiskGroup {
  id: number;
  name: string;
  icd_label: string;
  test: (diags: Set<string>, age: number) => boolean;
  note: string;
}

const RISK_GROUPS: RiskGroup[] = [
  {
    id: 1,
    name: '1. ผู้สัมผัสผู้ป่วยวัณโรคปอด (Z20.1)',
    icd_label: 'Z20.1',
    test: (d) => [...d].some((x) => x.startsWith('Z201')),
    note: 'ผู้สัมผัสร่วมบ้านหรือผู้สัมผัสใกล้ชิด',
  },
  {
    id: 2,
    name: '2. ผู้ต้องขังในเรือนจำ',
    icd_label: '-',
    test: () => false,
    note: 'ไม่มีข้อมูลในพื้นที่ / เว้นว่างไว้ตามข้อสั่งการ',
  },
  {
    id: 3,
    name: '3. ผู้ติดเชื้อเอชไอวี (HIV)',
    icd_label: 'B20-B24',
    test: (d) => [...d].some((x) => x.startsWith('B20') || x.startsWith('B24')),
    note: 'ผู้ติดเชื้อ HIV',
  },
  {
    id: 4,
    name: '4. ผู้ป่วยภูมิคุ้มกันลดลง (เบาหวาน/ไตเรื้อรัง)',
    icd_label: 'E11, N18',
    test: (d) => [...d].some((x) => x.startsWith('E11') || x.startsWith('N18')),
    note: 'ผู้ป่วยเบาหวาน หรือไตวายเรื้อรัง',
  },
  {
    id: 5,
    name: '5. ผู้สูงอายุ 65+ มี COPD หรือ เบาหวาน',
    icd_label: '65+ (J44, E11)',
    test: (d, age) => age >= 65 && [...d].some((x) => x.startsWith('J44') || x.startsWith('E11')),
    note: 'อายุตั้งแต่ 65 ปีขึ้นไป และมีโรค COPD หรือเบาหวาน',
  },
  {
    id: 6,
    name: '6. ผู้ใช้สารเสพติด',
    icd_label: 'F15, F11-F19',
    test: (d) => [...d].some((x) => x.startsWith('F15') || x.startsWith('F11') || x.startsWith('F12') || x.startsWith('F19')),
    note: 'ผู้มีประวัติใช้สารเสพติด',
  },
  {
    id: 7,
    name: '7. บุคลากรสาธารณสุข',
    icd_label: '-',
    test: () => false,
    note: 'ไม่มีข้อมูลในพื้นที่ / เว้นว่างไว้ตามข้อสั่งการ',
  },
  {
    id: 8,
    name: '8. ผู้ป่วยติดบ้านติดเตียง (Palliative care)',
    icd_label: 'Z51.5',
    test: (d) => [...d].some((x) => x.startsWith('Z515')),
    note: 'ผู้ป่วยระยะประคับประคอง / ติดบ้านติดเตียง',
  },
  {
    id: 9,
    name: '9. ผู้ที่เคยเป็นวัณโรค',
    icd_label: 'B90, Z86.1, A15-A16',
    test: (d) => [...d].some((x) => x.startsWith('B90') || x.startsWith('Z861') || x.startsWith('A15') || x.startsWith('A16')),
    note: 'ผู้มีประวัติเคยรักษาวัณโรค',
  },
];

interface FormattedRecord {
  hospcode: string;
  facility_name: string;
  hn: string;
  cid: string;
  fullname: string;
  age: number;
  gender: string;
  birthday: string;
  risk_group: string;
  diag_code: string;
  type_area: string;
  address: string;
  moo: string;
  subdistrict: string;
  district: string;
  province: string;
  tel: string;
  screen_status: string;
  screen_date: string;
  screen_diag: string;
}

const todayDate = new Date();
const calcAge = (birthdate: unknown): number => {
  if (!birthdate) return 0;
  const bd = new Date(String(birthdate));
  if (isNaN(bd.getTime())) return 0;
  let age = todayDate.getFullYear() - bd.getFullYear();
  const m = todayDate.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && todayDate.getDate() < bd.getDate())) age--;
  return Math.max(0, age);
};

export async function generateTbRiskExcel(outputPathTarget?: string) {
  console.log('Generating Multi-Facility TB High Risk Target Excel for CUP Khok Si Suphan...');

  // 1. Collect Screenings from HOSxP and all PCUs
  const screeningMap = new Map<string, { date: string; code: string }>();

  // A. HOSxP Screenings (Z11.1, Z01.6, Z00.0)
  try {
    const [hosScreens]: any = await pool.query(`
      SELECT p.cid, MAX(o.vstdate) as last_date, MAX(od.icd10) as screen_code
      FROM ovst o
      INNER JOIN ovstdiag od ON od.vn = o.vn
      INNER JOIN patient p ON p.hn = o.hn
      WHERE (od.icd10 LIKE 'Z111%' OR od.icd10 IN ('Z016', 'Z000'))
        AND o.vstdate >= '2024-10-01'
        AND p.cid IS NOT NULL AND p.cid != ''
      GROUP BY p.cid
    `);
    for (const r of hosScreens) {
      const dStr = String(r.last_date).split('T')[0];
      screeningMap.set(r.cid, { date: dStr, code: `ICD: ${r.screen_code}` });
    }
    console.log(`Hospital ovstdiag screenings: ${screeningMap.size}`);

    // B. HOSxP Chest X-ray (xray_report)
    const [xrayRows]: any = await pool.query(`
      SELECT p.cid, MAX(COALESCE(xr.examined_date, DATE(xr.order_datetime), xr.report_date)) as last_date
      FROM xray_report xr
      INNER JOIN patient p ON p.hn = xr.hn
      WHERE (xr.examined_date >= '2024-10-01' OR xr.order_datetime >= '2024-10-01' OR xr.report_date >= '2024-10-01')
        AND p.cid IS NOT NULL AND p.cid != ''
      GROUP BY p.cid
    `).catch(() => [[]]);
    for (const r of xrayRows) {
      if (r.cid && r.last_date) {
        const dStr = String(r.last_date).split('T')[0];
        const existing = screeningMap.get(r.cid);
        if (!existing || dStr > existing.date) {
          screeningMap.set(r.cid, { date: dStr, code: 'Chest X-ray (CXR)' });
        }
      }
    }
    console.log(`Hospital total screenings + CXR: ${screeningMap.size}`);
  } catch (err) {
    console.warn('Error fetching hospital screening:', err);
  }

  // C. PCU Screenings
  for (const fac of FACILITIES) {
    if (fac.type !== 'pcu' || !fac.host) continue;
    let pcuConn: mysql.Connection | null = null;
    try {
      pcuConn = await mysql.createConnection({
        host: fac.host, port: fac.port, user: fac.user, password: fac.pass, database: fac.db, connectTimeout: 5000,
      });
      const [pcuScreens]: any = await pcuConn.query(`
        SELECT p.cid, MAX(od.vstdate) as last_date, MAX(od.icd10) as screen_code
        FROM ovstdiag od
        INNER JOIN person p ON p.patient_hn = od.hn
        WHERE od.vstdate >= '2024-10-01'
          AND (od.icd10 LIKE 'Z111%' OR od.icd10 IN ('Z016', 'Z000'))
          AND p.cid IS NOT NULL AND p.cid != ''
        GROUP BY p.cid
      `);
      for (const r of pcuScreens) {
        const dStr = String(r.last_date).split('T')[0];
        const existing = screeningMap.get(r.cid);
        if (!existing || dStr > existing.date) {
          screeningMap.set(r.cid, { date: dStr, code: `PCU ${fac.code} (${r.screen_code})` });
        }
      }
      console.log(`Screening updated from PCU ${fac.code} ${fac.name}`);
    } catch (e: any) {
      console.warn(`Could not connect to PCU ${fac.code} for screening:`, e?.message);
    } finally {
      if (pcuConn) await pcuConn.end();
    }
  }

  const recordsByFacility = new Map<string, FormattedRecord[]>();
  FACILITIES.forEach((f) => recordsByFacility.set(f.code, []));
  const allMasterRecords: FormattedRecord[] = [];
  const capturedCidsFromPcu = new Set<string>();

  // 2. Process Each PCU Database
  for (const fac of FACILITIES) {
    if (fac.type !== 'pcu' || !fac.host) continue;
    let pcuConn: mysql.Connection | null = null;
    try {
      console.log(`\nProcessing PCU ${fac.code} ${fac.name}...`);
      pcuConn = await mysql.createConnection({
        host: fac.host, port: fac.port, user: fac.user, password: fac.pass, database: fac.db, connectTimeout: 5000,
      });

      // A. Living Persons Type 1, 3
      const [persons]: any = await pcuConn.query(`
        SELECT 
          p.person_id,
          p.patient_hn,
          p.cid,
          CONCAT(COALESCE(p.pname,''), p.fname, ' ', p.lname) as fullname,
          p.birthdate,
          p.sex,
          p.house_regist_type_id,
          p.hometel,
          p.mobile_phone,
          p.home_phone,
          h.address,
          v.village_moo,
          v.village_name
        FROM person p
        LEFT JOIN house h ON h.house_id = p.house_id
        LEFT JOIN village v ON v.village_id = COALESCE(p.village_id, h.village_id)
        WHERE p.house_regist_type_id IN (1, 3)
          AND (p.death IS NULL OR p.death != 'Y')
          AND (p.death_date IS NULL)
      `);
      console.log(`PCU ${fac.code} living persons (Type 1,3): ${persons.length}`);

      // B. Ovstdiag
      const [pcuDiags]: any = await pcuConn.query(`
        SELECT od.hn, od.icd10
        FROM ovstdiag od
        WHERE od.icd10 IS NOT NULL AND od.icd10 != ''
        GROUP BY od.hn, od.icd10
      `);
      const diagMap = new Map<string, Set<string>>();
      for (const r of pcuDiags) {
        const hn = String(r.hn || '');
        if (!diagMap.has(hn)) diagMap.set(hn, new Set());
        diagMap.get(hn)!.add(String(r.icd10 || '').replace(/\./g, '').toUpperCase());
      }

      // C. Person Chronic
      const [chronicDiags]: any = await pcuConn.query(`
        SELECT pc.person_id, pc.icd10
        FROM person_chronic pc
        WHERE (pc.discharge IS NULL OR pc.discharge != 'Y')
          AND pc.icd10 IS NOT NULL AND pc.icd10 != ''
      `);
      const chronicMap = new Map<number, Set<string>>();
      for (const r of chronicDiags) {
        const pid = Number(r.person_id);
        if (!chronicMap.has(pid)) chronicMap.set(pid, new Set());
        chronicMap.get(pid)!.add(String(r.icd10 || '').replace(/\./g, '').toUpperCase());
      }

      for (const p of persons) {
        const hn = String(p.patient_hn || '').trim();
        const pid = Number(p.person_id);
        const cid = String(p.cid || '').trim();
        const age = calcAge(p.birthdate);

        const diags = new Set<string>();
        if (hn && diagMap.has(hn)) {
          diagMap.get(hn)!.forEach((d) => diags.add(d));
        }
        if (chronicMap.has(pid)) {
          chronicMap.get(pid)!.forEach((d) => diags.add(d));
        }

        if (!diags.size) continue;

        for (const rg of RISK_GROUPS) {
          if (rg.test(diags, age)) {
            const isScreened = screeningMap.has(cid);
            const screenInfo = screeningMap.get(cid) || { date: '-', code: '-' };
            const phone = p.mobile_phone || p.hometel || p.home_phone || '-';
            const addr = p.address ? `บ้านเลขที่ ${p.address}` : '-';
            const moo = p.village_moo ? `หมู่ ${p.village_moo}` : '-';
            const vName = p.village_name || '-';

            const riskPrefixes = ['Z201', 'B20', 'B24', 'E11', 'N18', 'J44', 'F15', 'F11', 'F12', 'F19', 'Z515', 'B90', 'Z861', 'A15', 'A16'];
            const relevantDiags = [...diags].filter((d) => riskPrefixes.some((pre) => d.startsWith(pre))).sort().join(', ');

            const record: FormattedRecord = {
              hospcode: fac.code,
              facility_name: fac.name,
              hn: hn || '-',
              cid: cid || '-',
              fullname: p.fullname,
              age,
              gender: p.sex === '1' ? 'ชาย' : p.sex === '2' ? 'หญิง' : '-',
              birthday: p.birthdate ? String(p.birthdate).split('T')[0] : '-',
              risk_group: rg.name,
              diag_code: relevantDiags || '-',
              type_area: `Type ${p.house_regist_type_id}`,
              address: addr,
              moo,
              subdistrict: vName,
              district: 'อ.โคกศรีสุพรรณ',
              province: 'จ.สกลนคร',
              tel: phone,
              screen_status: isScreened ? 'คัดกรองแล้ว' : 'ยังไม่ได้รับการคัดกรอง (เป้าหมายติดตาม)',
              screen_date: screenInfo.date,
              screen_diag: screenInfo.code,
            };

            recordsByFacility.get(fac.code)!.push(record);
            allMasterRecords.push(record);
            if (cid) capturedCidsFromPcu.add(cid);
          }
        }
      }
      console.log(`PCU ${fac.code} risk records extracted: ${recordsByFacility.get(fac.code)!.length}`);
    } catch (e: any) {
      console.error(`Error in PCU ${fac.code}:`, e?.message);
    } finally {
      if (pcuConn) await pcuConn.end();
    }
  }

  // 3. Process Hospital HOSxP (11101)
  console.log(`\nProcessing Hospital HOSxP (11101)...`);
  const [hosPatients]: any = await pool.query(`
    SELECT 
      p.hn,
      p.cid,
      CONCAT(COALESCE(p.pname,''), p.fname, ' ', p.lname) as fullname,
      p.birthday,
      p.sex,
      p.type_area,
      p.addrpart,
      p.moopart,
      p.tmbpart,
      t.name as tambol_name,
      p.hometel
    FROM patient p
    LEFT JOIN thaiaddress t ON t.chwpart=p.chwpart AND t.amppart=p.amppart AND t.tmbpart=p.tmbpart
    WHERE p.chwpart = '47' AND p.amppart = '15'
      AND (p.death IS NULL OR p.death != 'Y')
      AND p.type_area IN ('1', '3')
  `);
  console.log(`HOSxP living patients in district: ${hosPatients.length}`);

  const [hosDiags]: any = await pool.query(`
    SELECT od.hn, od.icd10
    FROM ovstdiag od
    INNER JOIN patient p ON p.hn = od.hn
    WHERE p.chwpart = '47' AND p.amppart = '15'
      AND p.type_area IN ('1', '3')
      AND (p.death IS NULL OR p.death != 'Y')
      AND od.icd10 IS NOT NULL AND od.icd10 != ''
    GROUP BY od.hn, od.icd10
  `);
  const hosDiagMap = new Map<string, Set<string>>();
  for (const r of hosDiags) {
    const hn = String(r.hn || '');
    if (!hosDiagMap.has(hn)) hosDiagMap.set(hn, new Set());
    hosDiagMap.get(hn)!.add(String(r.icd10 || '').replace(/\./g, '').toUpperCase());
  }

  for (const p of hosPatients) {
    const hn = String(p.hn || '').trim();
    const cid = String(p.cid || '').trim();

    // Avoid duplicate if already covered in PCU
    if (cid && capturedCidsFromPcu.has(cid)) continue;

    const diags = hosDiagMap.get(hn);
    if (!diags || !diags.size) continue;

    const age = calcAge(p.birthday);
    const tmb = String(p.tmbpart || '').trim();
    const moo = String(p.moopart || '').trim();

    let assignedCode = '11101';
    if (tmb === '01') {
      assignedCode = ['3', '6', '11', '12', '17', '18'].includes(moo) ? '05569' : '11101';
    } else if (tmb === '02') {
      assignedCode = '05570';
    } else if (tmb === '03') {
      assignedCode = '05571';
    } else if (tmb === '04') {
      assignedCode = ['1', '5', '9', '10', '11', '12'].includes(moo) ? '05573' : '05572';
    }

    const facMeta = FACILITIES.find((f) => f.code === assignedCode) || FACILITIES[0];

    for (const rg of RISK_GROUPS) {
      if (rg.test(diags, age)) {
        const isScreened = screeningMap.has(cid);
        const screenInfo = screeningMap.get(cid) || { date: '-', code: '-' };

        const riskPrefixes = ['Z201', 'B20', 'B24', 'E11', 'N18', 'J44', 'F15', 'F11', 'F12', 'F19', 'Z515', 'B90', 'Z861', 'A15', 'A16'];
        const relevantDiags = [...diags].filter((d) => riskPrefixes.some((pre) => d.startsWith(pre))).sort().join(', ');

        const record: FormattedRecord = {
          hospcode: assignedCode,
          facility_name: facMeta.name,
          hn: hn || '-',
          cid: cid || '-',
          fullname: p.fullname,
          age,
          gender: p.sex === '1' ? 'ชาย' : p.sex === '2' ? 'หญิง' : '-',
          birthday: p.birthday ? String(p.birthday).split('T')[0] : '-',
          risk_group: rg.name,
          diag_code: relevantDiags || '-',
          type_area: `Type ${p.type_area}`,
          address: p.addrpart ? `บ้านเลขที่ ${p.addrpart}` : '-',
          moo: p.moopart ? `หมู่ ${p.moopart}` : '-',
          subdistrict: p.tambol_name ? `ต.${p.tambol_name}` : '-',
          district: 'อ.โคกศรีสุพรรณ',
          province: 'จ.สกลนคร',
          tel: p.hometel || '-',
          screen_status: isScreened ? 'คัดกรองแล้ว' : 'ยังไม่ได้รับการคัดกรอง (เป้าหมายติดตาม)',
          screen_date: screenInfo.date,
          screen_diag: screenInfo.code,
        };

        recordsByFacility.get(assignedCode)!.push(record);
        allMasterRecords.push(record);
      }
    }
  }

  console.log('\n--- Final Distribution by Facility ---');
  FACILITIES.forEach((f) => {
    console.log(`- ${f.code} ${f.name}: ${recordsByFacility.get(f.code)!.length} records`);
  });
  console.log(`Total Master Records across CUP: ${allMasterRecords.length}`);

  // 4. Build Excel Workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: สรุปภาพรวม 9 กลุ่มเสี่ยง
  const summaryRows = RISK_GROUPS.map((rg) => {
    const matched = allMasterRecords.filter((r) => r.risk_group === rg.name);
    const totalCup = matched.length;
    const screened = matched.filter((r) => r.screen_status === 'คัดกรองแล้ว').length;
    const unscreened = totalCup - screened;
    const covPct = totalCup > 0 ? `${((screened / totalCup) * 100).toFixed(1)}%` : '0.0%';

    return {
      'กลุ่มเป้าหมายความเสี่ยงสูง': rg.name,
      'รหัส ICD-10 กำหนด': rg.icd_label,
      'เป้าหมายรวมทั้ง CUP (คน)': totalCup,
      'ตรวจคัดกรองแล้ว (คน)': screened,
      'ยังไม่ได้คัดกรอง (คน)': unscreened,
      'ความครอบคลุม (%)': covPct,
      'รพ.โคกศรีสุพรรณ (11101)': matched.filter((r) => r.hospcode === '11101').length,
      'รพ.สต.โพนค้อ (05570)': matched.filter((r) => r.hospcode === '05570').length,
      'รพ.สต.โคกนาดี (05572)': matched.filter((r) => r.hospcode === '05572').length,
      'รพ.สต.โพนทอง (05573)': matched.filter((r) => r.hospcode === '05573').length,
      'รพ.สต.ม่วงไข่ (05571)': matched.filter((r) => r.hospcode === '05571').length,
      'รพ.สต.ห้วยหีบ (05569)': matched.filter((r) => r.hospcode === '05569').length,
      'คำอธิบายกลุ่มเป้าหมาย': rg.note,
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 38 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
    { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'สรุปภาพรวม 9 กลุ่มเสี่ยง');

  const formatList = (records: FormattedRecord[]) => records.map((r, idx) => ({
    'ลำดับ': idx + 1,
    'หน่วยบริการ / รพ.สต.': r.facility_name,
    'HN': r.hn,
    'เลขบัตรประชาชน': r.cid,
    'ชื่อ - สกุล': r.fullname,
    'อายุ (ปี)': r.age,
    'เพศ': r.gender,
    'วันเดือนปีเกิด': r.birthday,
    'กลุ่มเสี่ยงวัณโรค': r.risk_group,
    'รหัสโรคประจำตัว (ICD-10)': r.diag_code,
    'Type Area': r.type_area,
    'ที่อยู่': r.address,
    'หมู่ที่': r.moo,
    'ตำบล/หมู่บ้าน': r.subdistrict,
    'อำเภอ': r.district,
    'จังหวัด': r.province,
    'เบอร์โทรศัพท์': r.tel,
    'สถานะการตรวจ CXR': r.screen_status,
    'วันที่คัดกรองล่าสุด': r.screen_date,
    'การตรวจที่ได้รับ': r.screen_diag,
  }));

  const standardCols = [
    { wch: 6 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 24 }, { wch: 9 },
    { wch: 8 }, { wch: 14 }, { wch: 38 }, { wch: 25 }, { wch: 14 }, { wch: 18 },
    { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 28 },
    { wch: 16 }, { wch: 22 },
  ];

  // Sheets for each individual facility
  for (const fac of FACILITIES) {
    const list = formatList(recordsByFacility.get(fac.code)!);
    const ws = XLSX.utils.json_to_sheet(list);
    ws['!cols'] = standardCols;
    XLSX.utils.book_append_sheet(workbook, ws, fac.sheet);
  }

  // Combined master sheet
  const masterList = formatList(allMasterRecords);
  const wsMaster = XLSX.utils.json_to_sheet(masterList);
  wsMaster['!cols'] = standardCols;
  XLSX.utils.book_append_sheet(workbook, wsMaster, 'รายชื่อกลุ่มเสี่ยงรวมทั้ง CUP');

  // Save files
  const outputFileName = 'TB_HighRisk_Screening_Targets_KhokSiSuphan.xlsx';
  const outPath = outputPathTarget || path.resolve(process.cwd(), outputFileName);
  XLSX.writeFile(workbook, outPath);
  console.log(`\nWorkbook successfully written to: ${outPath}`);

  return { total: allMasterRecords.length, summaryRows, outPath };
}

if (process.argv[1] && process.argv[1].includes('generateTbRiskExcel')) {
  const targetPath = process.argv[2] || path.resolve(process.cwd(), 'TB_HighRisk_Screening_Targets_KhokSiSuphan.xlsx');
  generateTbRiskExcel(targetPath)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
