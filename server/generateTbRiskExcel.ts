import { pool } from './db.js';
import { DEAD_PATIENT_FILTER_SQL } from './ppfsEngine.js';
import * as XLSX from 'xlsx';
import path from 'path';

async function generateTbRiskExcel() {
  try {
    console.log('Generating TB High Risk Target Excel file...');

    const baseWhere = `
      p.chwpart = '47' AND p.amppart = '15'
      AND ${DEAD_PATIENT_FILTER_SQL}
      AND p.type_area IN ('1', '3')
    `;

    // Subquery for CXR or TB screening in FY 2568-2569 (since 2024-10-01)
    const [screenedRows]: any = await pool.query(`
      SELECT DISTINCT o.hn, MAX(o.vstdate) as last_screen_date, MAX(od.icd10) as screen_icd10
      FROM ovst o
      INNER JOIN ovstdiag od ON od.vn = o.vn
      WHERE (od.icd10 LIKE 'Z111%' OR od.icd10 IN ('Z016', 'Z000'))
        AND o.vstdate >= '2024-10-01'
      GROUP BY o.hn
    `);
    const screenedMap = new Map<string, { date: string; icd10: string }>();
    for (const r of screenedRows) {
      screenedMap.set(r.hn, {
        date: String(r.last_screen_date).split('T')[0],
        icd10: r.screen_icd10,
      });
    }

    // Also check xray_report for Chest X-ray
    const [xrayRows]: any = await pool.query(`
      SELECT xr.hn, MAX(xr.order_date) as last_xray_date
      FROM xray_report xr
      WHERE xr.order_date >= '2024-10-01'
      GROUP BY xr.hn
    `).catch(() => [[]]);
    for (const r of xrayRows) {
      if (r.hn) {
        const existing = screenedMap.get(r.hn);
        const xDate = String(r.last_xray_date).split('T')[0];
        if (!existing || xDate > existing.date) {
          screenedMap.set(r.hn, { date: xDate, icd10: 'Chest X-ray (CXR)' });
        }
      }
    }

    // Define 9 target groups query
    const targetQueries = [
      {
        groupId: 1,
        groupName: '1. ผู้สัมผัสผู้ป่วยวัณโรคปอด (Z20.1)',
        cond: `od.icd10 LIKE 'Z201%'`,
      },
      {
        groupId: 2,
        groupName: '2. ผู้ต้องขังในเรือนจำ',
        cond: `1=0`, // ว่างไว้ตามคำสั่ง
      },
      {
        groupId: 3,
        groupName: '3. ผู้ติดเชื้อเอชไอวี (HIV)',
        cond: `(od.icd10 LIKE 'B20%' OR od.icd10 LIKE 'B24%')`,
      },
      {
        groupId: 4,
        groupName: '4. ผู้ป่วยภูมิคุ้มกันลดลง (เบาหวาน/ไตเรื้อรัง)',
        cond: `(od.icd10 LIKE 'E11%' OR od.icd10 LIKE 'N18%')`,
      },
      {
        groupId: 5,
        groupName: '5. ผู้สูงอายุ 65+ มี COPD หรือ เบาหวาน',
        cond: `TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) >= 65 AND (od.icd10 LIKE 'J44%' OR od.icd10 LIKE 'E11%')`,
      },
      {
        groupId: 6,
        groupName: '6. ผู้ใช้สารเสพติด',
        cond: `(od.icd10 LIKE 'F15%' OR od.icd10 LIKE 'F11%' OR od.icd10 LIKE 'F12%' OR od.icd10 LIKE 'F19%')`,
      },
      {
        groupId: 7,
        groupName: '7. บุคลากรสาธารณสุข',
        cond: `1=0`, // ว่างไว้ตามคำสั่ง
      },
      {
        groupId: 8,
        groupName: '8. ผู้ป่วยติดบ้านติดเตียง (Palliative care)',
        cond: `od.icd10 LIKE 'Z515%'`,
      },
      {
        groupId: 9,
        groupName: '9. ผู้ที่เคยเป็นวัณโรค',
        cond: `(od.icd10 LIKE 'B90%' OR od.icd10 LIKE 'Z861%' OR od.icd10 LIKE 'A15%' OR od.icd10 LIKE 'A16%')`,
      },
    ];

    const allGroupRecords: any[] = [];
    const groupSummaries: any[] = [];
    const seenPatientGroups = new Set<string>();

    for (const g of targetQueries) {
      if (g.cond === '1=0') {
        groupSummaries.push({
          'กลุ่มเป้าหมายความเสี่ยงสูง': g.groupName,
          'รหัส ICD-10 กำหนด': '-',
          'จำนวนกลุ่มเป้าหมาย (คน)': 0,
          'ตรวจคัดกรองแล้ว (คน)': 0,
          'ยังไม่ได้คัดกรอง (คน)': 0,
          'ความครอบคลุม (%)': '0.0%',
          'หมายเหตุ': 'ไม่มีข้อมูลในพื้นที่ / เว้นว่างไว้ตามข้อสั่งการ',
        });
        continue;
      }

      const [rows]: any = await pool.query(`
        SELECT 
          p.hn,
          p.cid,
          CONCAT(COALESCE(p.pname,''), p.fname, ' ', p.lname) as fullname,
          TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) as age,
          p.sex,
          DATE_FORMAT(p.birthday, '%Y-%m-%d') as birthday,
          p.type_area,
          p.addrpart,
          p.moopart,
          p.tmbpart,
          t.name as tambol_name,
          p.hometel,
          MAX(od.vstdate) as last_diag_date,
          GROUP_CONCAT(DISTINCT od.icd10 SEPARATOR ', ') as diag_icd10
        FROM patient p
        INNER JOIN ovstdiag od ON od.hn = p.hn
        LEFT JOIN thaiaddress t ON t.chwpart=p.chwpart AND t.amppart=p.amppart AND t.tmbpart=p.tmbpart
        WHERE ${baseWhere} AND ${g.cond}
        GROUP BY p.hn, p.cid, p.pname, p.fname, p.lname, p.birthday, p.sex, p.type_area, p.addrpart, p.moopart, p.tmbpart, t.name, p.hometel
        ORDER BY CAST(p.tmbpart AS UNSIGNED), CAST(p.moopart AS UNSIGNED), p.addrpart
      `);

      let screenedCount = 0;
      const formattedRows = rows.map((r: any) => {
        const isScreened = screenedMap.has(r.hn);
        if (isScreened) screenedCount++;
        const screenInfo = screenedMap.get(r.hn);

        const recKey = `${r.hn}_${g.groupId}`;
        seenPatientGroups.add(recKey);

        return {
          hn: r.hn,
          cid: r.cid || '-',
          fullname: r.fullname,
          age: Number(r.age || 0),
          gender: r.sex === '1' ? 'ชาย' : r.sex === '2' ? 'หญิง' : '-',
          birthday: r.birthday || '-',
          typeArea: r.type_area === '1' ? 'Type 1 (ในเขตอยู่จริง)' : r.type_area === '3' ? 'Type 3 (อาศัยในเขต)' : `Type ${r.type_area}`,
          riskGroup: g.groupName,
          diagCode: r.diag_icd10 || '-',
          address: r.addrpart ? `บ้านเลขที่ ${r.addrpart}` : '-',
          moo: r.moopart ? `หมู่ ${r.moopart}` : '-',
          subdistrict: r.tambol_name ? `ต.${r.tambol_name}` : '-',
          district: 'อ.โคกศรีสุพรรณ',
          province: 'จ.สกลนคร',
          tel: r.hometel || '-',
          screenStatus: isScreened ? 'คัดกรองแล้ว' : 'ยังไม่ได้รับการคัดกรอง (เป้าหมายติดตาม)',
          screenDate: screenInfo?.date || '-',
          screenDiag: screenInfo?.icd10 || '-',
        };
      });

      allGroupRecords.push(...formattedRows);

      const targetTotal = rows.length;
      const unservedTotal = Math.max(0, targetTotal - screenedCount);
      const covPct = targetTotal > 0 ? ((screenedCount / targetTotal) * 100).toFixed(1) : '0.0';

      groupSummaries.push({
        'กลุ่มเป้าหมายความเสี่ยงสูง': g.groupName,
        'รหัส ICD-10 กำหนด': g.groupId === 1 ? 'Z20.1' : g.groupId === 3 ? 'B20-B24' : g.groupId === 4 ? 'E11, N18' : g.groupId === 5 ? '65+ (J44, E11)' : g.groupId === 6 ? 'F15, F11-F19' : g.groupId === 8 ? 'Z51.5' : 'B90.9, Z86.1, A15-A16',
        'จำนวนกลุ่มเป้าหมาย (คน)': targetTotal,
        'ตรวจคัดกรองแล้ว (คน)': screenedCount,
        'ยังไม่ได้คัดกรอง (คน)': unservedTotal,
        'ความครอบคลุม (%)': `${covPct}%`,
        'หมายเหตุ': targetTotal > 0 ? 'ดึงจากฐาน HOSxP รพ.โคกศรีสุพรรณ Type 1 และ 3' : '-',
      });
    }

    // Build Excel Workbook
    const workbook = XLSX.utils.book_new();

    // 1. Summary Sheet
    const wsSummary = XLSX.utils.json_to_sheet(groupSummaries);
    wsSummary['!cols'] = [
      { wch: 42 }, // กลุ่มเป้าหมาย
      { wch: 22 }, // ICD-10
      { wch: 22 }, // เป้าหมาย
      { wch: 20 }, // คัดกรองแล้ว
      { wch: 20 }, // ยังไม่ได้คัดกรอง
      { wch: 18 }, // ครอบคลุม
      { wch: 38 }, // หมายเหตุ
    ];
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'สรุปภาพรวม 9 กลุ่มเสี่ยง');

    // 2. All Patients Sheet
    const allRowsFormatted = allGroupRecords.map((r, idx) => ({
      'ลำดับ': idx + 1,
      'HN': r.hn,
      'เลขบัตรประชาชน': r.cid,
      'ชื่อ - นามสกุล': r.fullname,
      'อายุ (ปี)': r.age,
      'เพศ': r.gender,
      'วันเดือนปีเกิด': r.birthday,
      'กลุ่มเสี่ยงวัณโรค': r.riskGroup,
      'รหัสโรคประจำตัว (ICD-10)': r.diagCode,
      'Type Area': r.typeArea,
      'ที่อยู่': r.address,
      'หมู่ที่': r.moo,
      'ตำบล': r.subdistrict,
      'อำเภอ': r.district,
      'จังหวัด': r.province,
      'เบอร์โทรศัพท์': r.tel,
      'สถานะการตรวจ CXR': r.screenStatus,
      'วันที่คัดกรองล่าสุด': r.screenDate,
      'การตรวจที่ได้รับ': r.screenDiag,
    }));

    const wsAll = XLSX.utils.json_to_sheet(allRowsFormatted);
    wsAll['!cols'] = [
      { wch: 6 },  // ลำดับ
      { wch: 12 }, // HN
      { wch: 18 }, // CID
      { wch: 24 }, // ชื่อ-สกุล
      { wch: 9 },  // อายุ
      { wch: 8 },  // เพศ
      { wch: 14 }, // วันเกิด
      { wch: 38 }, // กลุ่มเสี่ยง
      { wch: 25 }, // ICD-10
      { wch: 22 }, // Type Area
      { wch: 18 }, // ที่อยู่
      { wch: 10 }, // หมู่
      { wch: 14 }, // ตำบล
      { wch: 16 }, // อำเภอ
      { wch: 12 }, // จังหวัด
      { wch: 16 }, // เบอร์โทร
      { wch: 28 }, // สถานะ
      { wch: 16 }, // วันที่
      { wch: 22 }, // การตรวจ
    ];
    XLSX.utils.book_append_sheet(workbook, wsAll, 'รายชื่อกลุ่มเสี่ยงทั้งหมด');

    // Write file to artifact and project directory
    const outputFileName = `TB_HighRisk_Screening_Targets_KhokSiSuphan.xlsx`;
    const outputPath = path.resolve('d:/ppfs-kpi', outputFileName);
    XLSX.writeFile(workbook, outputPath);

    // Also write to conversation artifact directory so user can download directly
    const artifactPath = path.resolve(
      'C:/Users/Admin/.gemini/antigravity/brain/ae4aa078-b365-4866-b446-01fa78cace88',
      outputFileName
    );
    XLSX.writeFile(workbook, artifactPath);

    console.log(`Excel file created successfully:`);
    console.log(`1. Project Path: ${outputPath}`);
    console.log(`2. Artifact Path: ${artifactPath}`);
    console.log(`Total target patients across all risk groups: ${allGroupRecords.length}`);

    process.exit(0);
  } catch (err) {
    console.error('Error generating Excel:', err);
    process.exit(1);
  }
}

generateTbRiskExcel();
