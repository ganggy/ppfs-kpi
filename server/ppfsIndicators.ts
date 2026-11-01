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
  /** บังคับเฉพาะสัญชาติไทย (nationality = '99') และมีเลขบัตรประชาชน 13 หลัก */
  requireThaiNationality?: boolean;
  /** ตัดผู้ป่วยที่ขึ้นทะเบียนในคลินิกโรคเรื้อรังเหล่านี้ออก (เช่น '001' เบาหวาน, '002' ความดัน) */
  excludeChronicClinics?: string[];
  /** รวมผู้ป่วยในคลินิกโรคเรื้อรังเหล่านี้เป็นกลุ่มเป้าหมายด้วยแม้ไม่ถึงเกณฑ์อายุผู้สูงอายุ (เช่น วัคซีนไข้หวัดใหญ่ 7 กลุ่มเสี่ยง, คัดกรองวัณโรค) */
  orChronicClinics?: string[];
  /** รวมเด็กเล็กอายุไม่เกิน X ปีเข้าในกลุ่มเป้าหมายด้วย (เช่น วัคซีนไข้หวัดใหญ่ในเด็ก 0-2 ปี) */
  orChildMaxAge?: number;
  /** หักลบผู้ที่เคยตรวจไปแล้วในช่วง X ปีก่อนหน้า (สำหรับรายการที่ตรวจทุก 2 ปี หรือ 5 ปี) */
  excludePriorIntervalYears?: number;
  /** รหัสตาราง pp_special_type_id ใน HOSxP ที่นับเป็นผลงานได้ด้วย */
  ppSpecialTypeIds?: number[];
  /** สัดส่วนความชุกของกลุ่มเป้าหมายเฉพาะ (เช่น หญิงตั้งครรภ์ ~5% ของหญิงวัยเจริญพันธุ์, กลุ่มเสี่ยงสูง) */
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
  unitPrice: number; // บาทต่อราย (Fee Schedule)
  nhsoGoalPercent: number; // เป้าหมาย สปสช. ขั้นต่ำ (%)
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

export const PPFS_INDICATORS: PPFSIndicator[] = [
  // ============================================================================
  // 10 ตัวชี้วัดหลัก (Core PPFS Indicators PP01 - PP10) พร้อมเงื่อนไข สปสช. ครบถ้วน
  // ============================================================================
  {
    id: 'hpv_dna',
    code: 'PP01',
    title: 'บริการตรวจคัดกรองมะเร็งปากมดลูก (HPV DNA Test / Pap smear)',
    shortName: 'HPV DNA Test (มะเร็งปากมดลูก)',
    category: 'CANCER',
    targetGroupDesc: 'สตรีไทย อายุ 30 - 59 ปี (ทุก 5 ปี)',
    ageMin: 30,
    ageMax: 59,
    gender: 'FEMALE',
    intervalMonths: 60, // 5 ปี
    unitPrice: 420,
    nhsoGoalPercent: 60,
    icd10Codes: ['Z124', 'Z014'],
    icd9Codes: ['91.46'],
    description: 'ตรวจคัดกรองมะเร็งปากมดลูกด้วยวิธี HPV DNA testing สำหรับสตรีไทยอายุ 30-59 ปี ทุก 5 ปี (อัตราจ่าย สปสช. ค่าเก็บสิ่งส่งตรวจ 50 บ. + ค่าตรวจแล็บ 14 สายพันธุ์ 370 บ. = 420 บ./ครั้ง)',
    nhsoRules: {
      requireThaiNationality: true,
      excludePriorIntervalYears: 4,
    },
    auditRules: {
      minAge: 30,
      maxAge: 59,
      requireGender: '2',
      warningMessage: 'ผู้รับบริการต้องเป็นเพศหญิง สัญชาติไทย อายุ 30-59 ปี และไม่ตรวจซ้ำภายใน 5 ปี',
    },
  },
  {
    id: 'fit_test',
    code: 'PP02',
    title: 'บริการตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (FIT Test)',
    shortName: 'FIT Test (มะเร็งลำไส้ใหญ่)',
    category: 'CANCER',
    targetGroupDesc: 'ประชาชนไทย อายุ 50 - 70 ปี (ทุก 2 ปี)',
    ageMin: 50,
    ageMax: 70,
    gender: 'ALL',
    intervalMonths: 24, // 2 ปี
    unitPrice: 60,
    nhsoGoalPercent: 70,
    icd10Codes: ['Z121'],
    icd9Codes: ['90.99'],
    description: 'ตรวจคัดกรองหาเลือดแฝงในอุจจาระด้วยชุดตรวจ FIT Test ในประชากรไทยอายุ 50-70 ปี ทุก 2 ปี (อัตราจ่ายเหมาจ่าย สปสช. 60 บาท/ครั้ง รวมค่าชุดตรวจและให้คำแนะนำ)',
    nhsoRules: {
      requireThaiNationality: true,
      excludePriorIntervalYears: 1,
      ppSpecialTypeIds: [262, 263],
    },
    auditRules: {
      minAge: 50,
      maxAge: 70,
      warningMessage: 'ผู้รับบริการต้องมีอายุ 50-70 ปี สัญชาติไทย และเว้นระยะตรวจอย่างน้อย 2 ปี',
    },
  },
  {
    id: 'dm_screening',
    code: 'PP03',
    title: 'บริการคัดกรองโรคเบาหวานและไขมันในเลือด (FPG / Capillary Blood Glucose)',
    shortName: 'คัดกรองเบาหวาน & ไขมัน (DM)',
    category: 'NCD',
    targetGroupDesc: 'ประชาชนไทย อายุ 35 ปีขึ้นไป (ที่ยังไม่เป็นผู้ป่วยเบาหวาน)',
    ageMin: 35,
    ageMax: 120,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 40,
    nhsoGoalPercent: 85,
    icd10Codes: ['Z131'],
    description: 'ตรวจระดับน้ำตาลในเลือด (FPG อัตราจ่าย สปสช. 40 บาท/ครั้ง; กรณีตรวจไขมัน Total Cholesterol & HDL อายุ 45-70 ปี เบิกเพิ่ม 160 บาท/ครั้ง) โดยตัดผู้ป่วยคลินิกเบาหวาน (Clinic 001) ออก',
    nhsoRules: {
      requireThaiNationality: true,
      excludeChronicClinics: ['001'],
    },
    auditRules: {
      minAge: 35,
      warningMessage: 'ต้องเป็นผู้มีสัญชาติไทย อายุ 35 ปีขึ้นไป และยังไม่เคยขึ้นทะเบียนเป็นผู้ป่วยเบาหวาน (Non-DM)',
    },
  },
  {
    id: 'ht_screening',
    code: 'PP04',
    title: 'บริการคัดกรองความเสี่ยงโรคความดันโลหิตสูงและโรคหัวใจหลอดเลือด',
    shortName: 'คัดกรองความดันโลหิต (HT)',
    category: 'NCD',
    targetGroupDesc: 'ประชาชนไทย อายุ 35 ปีขึ้นไป (ที่ยังไม่เป็นผู้ป่วยความดัน)',
    ageMin: 35,
    ageMax: 120,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 50,
    nhsoGoalPercent: 85,
    icd10Codes: ['Z136'],
    description: 'ตรวจวัดระดับความดันโลหิตและประเมินความเสี่ยงโรคหลอดเลือดหัวใจในกลุ่มอายุ 35 ปีขึ้นไป โดยตัดผู้ป่วยคลินิกความดันโลหิตสูง (Clinic 002) ออก',
    nhsoRules: {
      requireThaiNationality: true,
      excludeChronicClinics: ['002'],
    },
    auditRules: {
      minAge: 35,
      warningMessage: 'ต้องเป็นผู้มีสัญชาติไทย อายุ 35 ปีขึ้นไป และยังไม่เคยขึ้นทะเบียนเป็นผู้ป่วยความดันโลหิตสูง (Non-HT)',
    },
  },
  {
    id: 'elderly_assessment',
    code: 'PP05',
    title: 'ประเมินภาวะสุขภาพและคัดกรองผู้สูงอายุ 9 ด้าน (ADL/สมองเสื่อม/หกล้ม/สายตา/ช่องปาก)',
    shortName: 'คัดกรองผู้สูงอายุ 9 ด้าน (60+)',
    category: 'ELDERLY',
    targetGroupDesc: 'ผู้สูงอายุไทย 60 ปีขึ้นไป',
    ageMin: 60,
    ageMax: 120,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 100,
    nhsoGoalPercent: 80,
    icd10Codes: ['Z000', 'Z010', 'Z138'],
    description: 'การประเมินสุขภาพผู้สูงอายุครบวงจร 9 ด้าน ได้แก่ การมองเห็น การได้ยิน สุขภาพช่องปาก ความเสี่ยงหกล้ม ภาวะสมองเสื่อม (AMT) และความสามารถในการทำกิจวัตร (ADL) (อัตราชดเชย 100 บาท/ครั้ง)',
    nhsoRules: {
      requireThaiNationality: true,
      ppSpecialTypeIds: [73, 78, 86, 93, 96, 101, 104, 107, 112, 116, 119, 124, 291, 332, 334, 336, 338],
    },
    auditRules: {
      minAge: 60,
      warningMessage: 'ต้องมีอายุ 60 ปีบริบูรณ์ขึ้นไป และบันทึกผลประเมินในแฟ้ม SPECIALPP (1B12xx)',
    },
  },
  {
    id: 'dspm_screening',
    code: 'PP06',
    title: 'บริการคัดกรองและประเมินพัฒนาการเด็กปฐมวัย (DSPM)',
    shortName: 'คัดกรองพัฒนาการเด็ก (DSPM)',
    category: 'MCH',
    targetGroupDesc: 'เด็กไทยอายุ 0 - 5 ปี (9, 18, 30, 42 และ 60 เดือน)',
    ageMin: 0,
    ageMax: 5,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 100,
    nhsoGoalPercent: 90,
    icd10Codes: ['Z001', 'Z134'],
    description: 'เฝ้าระวังและคัดกรองพัฒนาการเด็กปฐมวัยตามคู่มือ DSPM ในช่วงอายุสำคัญ 5 ช่วงวัย (อัตราชดเชย 100 บาท/ครั้ง นับรวมรหัส Z001, Z134 และ Special PP 1B260/1B261)',
    nhsoRules: {
      requireThaiNationality: true,
      ppSpecialTypeIds: [238, 239],
    },
    auditRules: {
      maxAge: 5,
      warningMessage: 'กลุ่มเป้าหมายต้องเป็นเด็กไทยแรกเกิดถึง 5 ปี (60 เดือน)',
    },
  },
  {
    id: 'dental_fluoride',
    code: 'PP07',
    title: 'บริการตรวจสุขภาพช่องปากและเคลือบฟลูออไรด์ (Fluoride Varnish / Gel)',
    shortName: 'เคลือบฟลูออไรด์ & ตรวจฟันเด็ก',
    category: 'DENTAL',
    targetGroupDesc: 'เด็กปฐมวัยและวัยเรียน อายุ 1 - 12 ปี',
    ageMin: 1,
    ageMax: 12,
    gender: 'ALL',
    intervalMonths: 6,
    unitPrice: 100,
    nhsoGoalPercent: 75,
    icd10Codes: ['Z012'],
    icd9Codes: ['99.71', '23.0', '24.99'],
    description: 'ตรวจสุขภาพช่องปากและทาฟลูออไรด์วานิชชนิดเข้มข้นสูงเฉพาะที่เพื่อป้องกันฟันผุในเด็ก (อัตราจ่าย สปสช. 100 บาท/ครั้ง ไม่เกิน 2 ครั้ง/คน/ปี)',
    nhsoRules: {
      requireThaiNationality: true,
    },
    auditRules: {
      maxAge: 12,
      warningMessage: 'เคลือบฟลูออไรด์ในเด็กอายุ 1-12 ปี ปีละไม่เกิน 2 ครั้ง (ห่างกันอย่างน้อย 6 เดือน)',
    },
  },
  {
    id: 'flu_vaccine',
    code: 'PP08',
    title: 'บริการวัคซีนป้องกันโรคไข้หวัดใหญ่ตามฤดูกาล (ผู้สูงอายุ 65+ & 7 กลุ่มโรคเรื้อรัง)',
    shortName: 'วัคซีนไข้หวัดใหญ่ (7 กลุ่มเสี่ยง/65+)',
    category: 'VACCINE',
    targetGroupDesc: 'ผู้สูงอายุ 65 ปีขึ้นไป, เด็ก 0-2 ปี และผู้ป่วย 7 กลุ่มโรคเรื้อรังทุกช่วงวัย',
    ageMin: 65,
    ageMax: 120,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 20,
    nhsoGoalPercent: 65,
    icd10Codes: ['Z251', 'Z23', 'Z258'],
    description: 'ค่าบริการฉีดวัคซีนป้องกันโรคไข้หวัดใหญ่ตามฤดูกาลและวัคซีนพื้นฐาน (อัตราจ่ายค่าบริการฉีด สปสช. 20 บาท/โดส/ครั้ง โดย สปสช. สนับสนุนวัคซีนให้หน่วยบริการ)',
    cancelIn2570: true,
    nhsoRules: {
      requireThaiNationality: true,
      orChildMaxAge: 2,
      orChronicClinics: ['001', '002', '003', '005', '114', '121', '122', '123', '127'],
    },
    auditRules: {
      minAge: 0,
      warningMessage: 'ผู้รับบริการต้องอยู่ในกลุ่มผู้สูงอายุ 65+, เด็กเล็ก หรือขึ้นทะเบียน 7 กลุ่มโรคเรื้อรัง ปีละ 1 เข็ม',
    },
  },
  {
    id: 'depression_2q9q',
    code: 'PP09',
    title: 'บริการคัดกรองภาวะซึมเศร้าและความเสี่ยงต่อสุขภาพจิต (2Q / 9Q / 8Q)',
    shortName: 'คัดกรองซึมเศร้า 2Q/9Q',
    category: 'MENTAL',
    targetGroupDesc: 'ประชาชนไทย อายุ 15 ปีขึ้นไป',
    ageMin: 15,
    ageMax: 120,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 50,
    nhsoGoalPercent: 80,
    icd10Codes: ['Z133'],
    description: 'คัดกรองสุขภาพจิตด้วยแบบประเมิน 2Q หากผลบวกประเมินต่อด้วย 9Q และ 8Q (นับรวมรหัส Z133 และ Special PP 1B0210, 1B0280, 1B130, 1B150)',
    nhsoRules: {
      requireThaiNationality: true,
      ppSpecialTypeIds: [33, 130, 144, 325],
    },
    auditRules: {
      minAge: 15,
      warningMessage: 'ผู้รับบริการต้องมีอายุตั้งแต่ 15 ปีขึ้นไป และบันทึกผลประเมิน 2Q/9Q',
    },
  },
  {
    id: 'anc_quality',
    code: 'PP10',
    title: 'บริการฝากครรภ์คุณภาพตามเกณฑ์มาตรฐาน สปสช. (ANC)',
    shortName: 'ฝากครรภ์คุณภาพ (ANC)',
    category: 'MCH',
    targetGroupDesc: 'หญิงไทยตั้งครรภ์ทุกรายในเขตรับผิดชอบ (อายุ 12 - 50 ปี)',
    ageMin: 12,
    ageMax: 50,
    gender: 'FEMALE',
    intervalMonths: 10,
    unitPrice: 360,
    nhsoGoalPercent: 85,
    icd10Codes: ['Z34', 'Z340', 'Z348', 'Z349', 'Z35', 'Z358', 'Z359'],
    description: 'บริการดูแลการฝากครรภ์ ซักประวัติ ตรวจร่างกาย ให้คำปรึกษา พร้อมยาเสริมธาตุเหล็ก กรดโฟลิก ไอโอดีน (อัตราจ่าย สปสช. 360 บ./ครั้ง; ค่าแล็บฝากครรภ์ครั้งแรกครบชุด 600 บ., อัลตราซาวด์ 400 บ., ทันตกรรม 500 บ.)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.05, // ประมาณการหญิงตั้งครรภ์ ~5% ของหญิงวัยเจริญพันธุ์
    },
    auditRules: {
      requireGender: '2',
      minAge: 12,
      maxAge: 50,
      warningMessage: 'การฝากครรภ์เฉพาะหญิงตั้งครรภ์ พร้อมบันทึกข้อมูลอายุครรภ์ (GA) และผลแล็บในแฟ้ม ANC',
    },
  },

  // ============================================================================
  // รายการสิทธิประโยชน์ PPFS สปสช. เพิ่มเติมให้ครบทั้ง 30 รายการ (PP11 - PP30)
  // ============================================================================
  {
    id: 'preg_test',
    code: 'PP11',
    title: 'บริการการทดสอบการตั้งครรภ์ (Urine Pregnancy Test)',
    shortName: 'ทดสอบการตั้งครรภ์ (UPT)',
    category: 'MCH',
    targetGroupDesc: 'หญิงไทยวัยเจริญพันธุ์ อายุ 13 - 49 ปี ที่มีข้อบ่งชี้หรือสงสัยตั้งครรภ์',
    ageMin: 13,
    ageMax: 49,
    gender: 'FEMALE',
    intervalMonths: 12,
    unitPrice: 75,
    nhsoGoalPercent: 75,
    icd10Codes: ['Z320', 'Z321'],
    description: 'บริการตรวจปัสสาวะทดสอบการตั้งครรภ์ (Urine Pregnancy Test) สำหรับสตรีวัยเจริญพันธุ์ที่ประจำเดือนขาดหรือสงสัยตั้งครรภ์ (อัตราจ่าย สปสช. 75 บาท/ครั้ง ไม่เกิน 4 ครั้ง/คน/ปี)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.06,
    },
    auditRules: {
      requireGender: '2',
      minAge: 13,
      maxAge: 49,
      warningMessage: 'เบิกได้เฉพาะเพศหญิงวัยเจริญพันธุ์ที่มีประวัติสงสัยตั้งครรภ์ พร้อมผลตรวจ UPT',
    },
  },
  {
    id: 'thalassemia_anc',
    code: 'PP12',
    title: 'บริการป้องกันและควบคุมโรคโลหิตจางธาลัสซีเมียในหญิงตั้งครรภ์ (OF/DCIP/Hb typing)',
    shortName: 'คัดกรองธาลัสซีเมียหญิงตั้งครรภ์',
    category: 'MCH',
    targetGroupDesc: 'หญิงตั้งครรภ์ที่มาฝากครรภ์ (อายุ 13 - 49 ปี)',
    ageMin: 13,
    ageMax: 49,
    gender: 'FEMALE',
    intervalMonths: 12,
    unitPrice: 120,
    nhsoGoalPercent: 85,
    icd10Codes: ['Z130', 'Z368', 'D560', 'D561', 'D562', 'D563', 'D569'],
    description: 'ตรวจคัดกรองพาหะธาลัสซีเมียด้วย CBC+MCV และ/หรือ DCIP/Hb E screening ในหญิงตั้งครรภ์ (อัตราจ่ายคัดกรอง สปสช. 120 บาท/ครั้ง; กรณีตรวจยืนยัน Hb typing 250 บาท)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.05,
    },
    auditRules: {
      requireGender: '2',
      minAge: 13,
      maxAge: 49,
      warningMessage: 'ต้องมีผลตรวจทางห้องปฏิบัติการคัดกรองธาลัสซีเมีย (OF/DCIP หรือ Hb typing)',
    },
  },
  {
    id: 'down_syndrome',
    code: 'PP13',
    title: 'บริการป้องกันและควบคุมกลุ่มอาการดาวน์ในหญิงตั้งครรภ์ (Quadruple Test / NIPT)',
    shortName: 'คัดกรองดาวน์ซินโดรมในครรภ์',
    category: 'MCH',
    targetGroupDesc: 'หญิงตั้งครรภ์ทุกช่วงวัย (อายุครรภ์ 12 - 20 สัปดาห์)',
    ageMin: 13,
    ageMax: 49,
    gender: 'FEMALE',
    intervalMonths: 12,
    unitPrice: 500,
    nhsoGoalPercent: 75,
    icd10Codes: ['Z360', 'Z369'],
    description: 'ตรวจเลือดคัดกรองความเสี่ยงกลุ่มอาการดาวน์ด้วยวิธี Quadruple test (อัตราจ่าย สปสช. ค่าเก็บส่งตรวจ 100 บ. + ค่าแล็บ 400 บ. = 500 บ./ครั้ง; กรณีตรวจ NIPT 2,700 บ.)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.05,
    },
    auditRules: {
      requireGender: '2',
      minAge: 13,
      maxAge: 49,
      warningMessage: 'ตรวจในหญิงตั้งครรภ์ช่วงอายุครรภ์ที่กำหนด พร้อมบันทึกผลตรวจคัดกรองดาวน์ซินโดรม',
    },
  },
  {
    id: 'syphilis_couple',
    code: 'PP14',
    title: 'บริการคัดกรองธาลัสซีเมียและโรคซิฟิลิสในสามีหรือคู่ของหญิงตั้งครรภ์',
    shortName: 'คัดกรองธาลัสซีเมีย & ซิฟิลิสคู่สมรส',
    category: 'MCH',
    targetGroupDesc: 'หญิงตั้งครรภ์และสามี/คู่สมรส (อายุ 15 - 49 ปี)',
    ageMin: 15,
    ageMax: 49,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 190,
    nhsoGoalPercent: 80,
    icd10Codes: ['Z113', 'Z114', 'Z202'],
    description: 'บริการตรวจคัดกรองโรคซิฟิลิสและเอชไอวี (VDRL + HIV อัตราจ่าย สปสช. 190 บาท/ครั้ง) และคัดกรองธาลัสซีเมีย (120 บาท) ในสามีหรือคู่ของหญิงตั้งครรภ์',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.05,
    },
    auditRules: {
      minAge: 15,
      maxAge: 49,
      warningMessage: 'ต้องมีผลตรวจทางห้องปฏิบัติการซิฟิลิส (VDRL/RPR) หรือผลตรวจเลือดคู่สมรส',
    },
  },
  {
    id: 'postpartum_care',
    code: 'PP15',
    title: 'บริการตรวจสุขภาพและดูแลมารดาหลังคลอด (Postpartum Care)',
    shortName: 'ตรวจสุขภาพมารดาหลังคลอด',
    category: 'MCH',
    targetGroupDesc: 'หญิงหลังคลอดทุกราย (อายุ 13 - 49 ปี)',
    ageMin: 13,
    ageMax: 49,
    gender: 'FEMALE',
    intervalMonths: 12,
    unitPrice: 150,
    nhsoGoalPercent: 80,
    icd10Codes: ['Z390', 'Z391', 'Z392'],
    description: 'การตรวจดูแลสุขภาพมารดาหลังคลอด (อัตราจ่าย สปสช. ค่าตรวจหลังคลอด 150 บาท/ครั้ง ไม่เกิน 3 ครั้ง + ค่ายาเสริมธาตุเหล็ก/ไอโอดีนหลังคลอด 135 บาท/ครั้ง ไม่เกิน 2 ครั้ง)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.05,
    },
    auditRules: {
      requireGender: '2',
      minAge: 13,
      maxAge: 49,
      warningMessage: 'บันทึกข้อมูลการดูแลหลังคลอดในแฟ้ม POSTNATAL พร้อมวันคลอด',
    },
  },
  {
    id: 'newborn_tsh',
    code: 'PP16',
    title: 'บริการป้องกันและควบคุมภาวะพร่องฮอร์โมนไทรอยด์แต่กำเนิด (Newborn TSH)',
    shortName: 'คัดกรองไทรอยด์ทารกแรกเกิด (TSH)',
    category: 'MCH',
    targetGroupDesc: 'ทารกไทยแรกเกิดทุกราย (อายุ 0 - 1 ปี)',
    ageMin: 0,
    ageMax: 1,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 135,
    nhsoGoalPercent: 95,
    icd10Codes: ['Z380', 'Z381', 'Z132', 'Z001'],
    description: 'เจาะเลือดส้นเท้าทารกแรกเกิดตรวจคัดกรอง TSH และ PKU (อัตราจ่ายเหมาจ่าย สปสช. 135 บาท/คน รวมค่าจัดส่งสิ่งส่งตรวจ; กรณีติดตามตรวจยืนยัน TSH ผิดปกติ 350 บาท)',
    nhsoRules: {
      requireThaiNationality: true,
    },
    auditRules: {
      maxAge: 1,
      warningMessage: 'เฉพาะทารกแรกเกิดอายุไม่เกิน 1 ปี',
    },
  },
  {
    id: 'newborn_tms',
    code: 'PP17',
    title: 'บริการตรวจคัดกรองโรคพันธุกรรมเมตาบอลิกทารกแรกเกิดด้วยเครื่อง TMS (40 โรค)',
    shortName: 'คัดกรองเมตาบอลิกทารกแรกเกิด (TMS)',
    category: 'MCH',
    targetGroupDesc: 'ทารกไทยแรกเกิดทุกราย (อายุ 0 - 1 ปี)',
    ageMin: 0,
    ageMax: 1,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 500,
    nhsoGoalPercent: 90,
    icd10Codes: ['Z380', 'Z138', 'Z132'],
    description: 'ตรวจคัดกรองโรคพันธุกรรมเมตาบอลิกแต่กำเนิด 40 โรคด้วยเครื่อง Tandem Mass Spectrometry (TMS) (อัตราจ่ายเหมาจ่าย สปสช. 500 บาท/ครั้ง รวมค่าขนส่งสิ่งส่งตรวจ)',
    nhsoRules: {
      requireThaiNationality: true,
    },
    auditRules: {
      maxAge: 1,
      warningMessage: 'เฉพาะทารกแรกเกิดและส่งตรวจกระดาษซับเลือด TMS ไปยังศูนย์ตรวจ',
    },
  },
  {
    id: 'family_planning',
    code: 'PP18',
    title: 'บริการวางแผนครอบครัวและการป้องกันการตั้งครรภ์ไม่พึงประสงค์',
    shortName: 'วางแผนครอบครัว & คุมกำเนิด',
    category: 'MCH',
    targetGroupDesc: 'สตรีและประชาชนไทยวัยเจริญพันธุ์ อายุ 13 - 49 ปี',
    ageMin: 13,
    ageMax: 49,
    gender: 'FEMALE',
    intervalMonths: 12,
    unitPrice: 60,
    nhsoGoalPercent: 75,
    icd10Codes: ['Z300', 'Z301', 'Z304', 'Z305', 'Z308', 'Z309'],
    description: 'บริการวางแผนครอบครัว (อัตราจ่าย สปสช. ยาฉีดคุมกำเนิด 60 บ./ครั้ง, ยาเม็ดฮอร์โมนรวม 40 บ./ครั้ง, ฮอร์โมนเดี่ยว 80 บ./ครั้ง, ยาเม็ดฉุกเฉิน 50 บ./ครั้ง, ถุงยางอนามัย 10 บ./ครั้ง)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.20, // ประมาณการวัยเจริญพันธุ์ที่มารับบริการคุมกำเนิดในหน่วยบริการภาครัฐ
    },
    auditRules: {
      minAge: 13,
      maxAge: 49,
      warningMessage: 'ต้องบันทึกรหัสวิธีคุมกำเนิดและจำนวนเวชภัณฑ์ในแฟ้ม FP',
    },
  },
  {
    id: 'unsafe_abortion_prev',
    code: 'PP19',
    title: 'บริการให้คำปรึกษาและป้องกันการยุติการตั้งครรภ์ที่ไม่ปลอดภัย (ยาฝังคุมกำเนิด/ห่วงอนามัย)',
    shortName: 'ยาฝังคุมกำเนิด & ห่วงอนามัยกึ่งถาวร',
    category: 'MCH',
    targetGroupDesc: 'หญิงวัยเจริญพันธุ์ที่มีภาวะตั้งครรภ์ไม่พร้อมหรือกลุ่มเสี่ยง (อายุ 13 - 49 ปี)',
    ageMin: 13,
    ageMax: 49,
    gender: 'FEMALE',
    intervalMonths: 12,
    unitPrice: 2150,
    nhsoGoalPercent: 70,
    icd10Codes: ['Z718', 'Z303', 'Z640', 'Z641'],
    description: 'บริการป้องกันการยุติการตั้งครรภ์ที่ไม่ปลอดภัยและคุมกำเนิดกึ่งถาวร (อัตราจ่าย สปสช. ฝังยาคุมกำเนิด 2,150 บาท/ครั้ง, ถอดยาฝัง 350 บาท/ครั้ง, ใส่ห่วงอนามัย IUD 800 บาท/ครั้ง)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.03,
    },
    auditRules: {
      requireGender: '2',
      minAge: 13,
      maxAge: 49,
      warningMessage: 'บันทึกประวัติการให้คำปรึกษาหรือหัตถการตามเกณฑ์ สปสช.',
    },
  },
  {
    id: 'child_glasses',
    code: 'PP20',
    title: 'บริการตรวจคัดกรองสายตาและแว่นตาเด็กที่มีสายตาผิดปกติ',
    shortName: 'คัดกรองสายตา & แว่นตาเด็กวัยเรียน',
    category: 'MCH',
    targetGroupDesc: 'เด็กไทยวัยอนุบาลและประถมศึกษา อายุ 3 - 12 ปี',
    ageMin: 3,
    ageMax: 12,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 800,
    nhsoGoalPercent: 80,
    icd10Codes: ['Z010', 'Z002', 'Z460', 'H520', 'H521', 'H522'],
    description: 'ตรวจวัดสายตา (VA) ในเด็กอายุ 3-12 ปี และตัดแว่นตาสำหรับเด็กสายตาผิดปกติ (อัตราจ่ายเหมาจ่าย สปสช. เลนส์ทั่วไป Stock lens 800 บาท/คน/ปี, เลนส์สั่งตัดพิเศษ Lab lens 1,000 บาท/คน/ปี)',
    nhsoRules: {
      requireThaiNationality: true,
      ppSpecialTypeIds: [332, 333],
      targetPrevalenceFactor: 0.15, // สัดส่วนนักเรียนชั้น ป.1 และเด็กที่มีปัญหาสายตา
    },
    auditRules: {
      minAge: 3,
      maxAge: 12,
      warningMessage: 'ผู้รับบริการต้องเป็นเด็กอายุ 3-12 ปี และบันทึกผลการตรวจวัดสายตา (VA)',
    },
  },
  {
    id: 'oral_cancer',
    code: 'PP21',
    title: 'บริการคัดกรองรอยโรคเสี่ยงมะเร็งและมะเร็งช่องปาก (CA Oral Screening)',
    shortName: 'คัดกรองมะเร็งช่องปาก (40+)',
    category: 'CANCER',
    targetGroupDesc: 'ประชาชนไทย อายุ 40 ปีขึ้นไป',
    ageMin: 40,
    ageMax: 120,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 50,
    nhsoGoalPercent: 70,
    icd10Codes: ['Z128', 'Z012'],
    description: 'การตรวจเนื้อเยื่อในช่องปากเพื่อค้นหารอยโรคเสี่ยงก่อนมะเร็งช่องปากในผู้มีอายุ 40 ปีขึ้นไป (คัดกรองพื้นฐาน 50 บาท; กรณีตัดชิ้นเนื้อส่งตรวจยืนยันทางพยาธิวิทยา Biopsy เหมาจ่าย 600 บาท/เคส)',
    nhsoRules: {
      requireThaiNationality: true,
    },
    auditRules: {
      minAge: 40,
      warningMessage: 'ผู้รับบริการต้องมีอายุตั้งแต่ 40 ปีขึ้นไป สัญชาติไทย',
    },
  },
  {
    id: 'tb_screening',
    code: 'PP22',
    title: 'บริการตรวจคัดกรองและค้นหาวัณโรคในกลุ่มเสี่ยงสูง (Chest X-ray / คัดกรองอาการ)',
    shortName: 'คัดกรองวัณโรคกลุ่มเสี่ยงสูง (TB)',
    category: 'INFECTIOUS',
    targetGroupDesc: 'ผู้สูงอายุ 60 ปีขึ้นไปมีโรคร่วม, ผู้ป่วยเบาหวาน/COPD/CKD และผู้สัมผัสร่วมบ้าน',
    ageMin: 60,
    ageMax: 120,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 100,
    nhsoGoalPercent: 80,
    icd10Codes: ['Z111'],
    description: 'การถ่ายภาพรังสีทรวงอก (Chest X-ray : CXR) คัดกรองวัณโรคใน 7 กลุ่มเสี่ยงสูง (อัตราจ่าย สปสช. CXR 100 บาท/ครั้ง; กรณีตรวจ Molecular TB-LAMP 200 บาท, Xpert MTB/RIF 500 บาท)',
    nhsoRules: {
      requireThaiNationality: true,
      excludeChronicClinics: ['009'],
      orChronicClinics: ['001', '114', '121', '123'],
    },
    auditRules: {
      minAge: 15,
      warningMessage: 'ต้องอยู่ใน 7 กลุ่มเสี่ยงวัณโรค และยังไม่เป็นผู้ป่วยวัณโรคที่กำลังรักษาอยู่',
    },
  },
  {
    id: 'brca_mammo',
    code: 'PP23',
    title: 'บริการคัดกรองมะเร็งเต้านมด้วยเครื่องแมมโมแกรม/อัลตราซาวด์ และตรวจยีน BRCA1/BRCA2',
    shortName: 'คัดกรองมะเร็งเต้านม (Mammogram/BRCA)',
    category: 'CANCER',
    targetGroupDesc: 'สตรีไทยอายุ 30 - 70 ปี ที่มีประวัติเสี่ยงสูงหรือญาติสายตรงเป็นมะเร็งเต้านม',
    ageMin: 30,
    ageMax: 70,
    gender: 'FEMALE',
    intervalMonths: 24,
    unitPrice: 2400,
    nhsoGoalPercent: 70,
    icd10Codes: ['Z123', 'Z803', 'Z150'],
    description: 'ตรวจคัดกรองมะเร็งเต้านมด้วยเครื่อง Mammogram & Ultrasound (อัตราจ่ายตามจริง สปสช. ไม่เกิน 2,400 บ./ครั้ง; ค่าให้คำปรึกษาและเก็บส่งตรวจยีน BRCA1/2 500 บ., ค่าตรวจยีนญาติสายตรง 2,500 บ. / ผู้ป่วยเสี่ยงสูง 10,000 บ.)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.05, // สัดส่วนสตรีกลุ่มเสี่ยงสูงที่มีประวัติครอบครัว
    },
    auditRules: {
      requireGender: '2',
      minAge: 30,
      maxAge: 70,
      warningMessage: 'เบิกได้เฉพาะผู้ที่มีเกณฑ์ความเสี่ยงสูงตามแนวทางมะเร็งเต้านม สปสช.',
    },
  },
  {
    id: 'anemia_screening',
    code: 'PP24',
    title: 'บริการคัดกรองภาวะโลหิตจางจากการขาดธาตุเหล็ก (Hct / Hb) (*)',
    shortName: 'คัดกรองภาวะโลหิตจางในเด็ก (Hct/Hb)',
    category: 'NUTRITION',
    targetGroupDesc: 'เด็กไทยปฐมวัยและวัยเรียน อายุ 6 เดือน - 12 ปี (* ขยายเกณฑ์ปี 69-70)',
    ageMin: 0,
    ageMax: 12,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 40,
    nhsoGoalPercent: 80,
    icd10Codes: ['Z130', 'D509', 'D649'],
    description: 'ตรวจระดับความเข้มข้นของเลือด (Hct / Hb อัตราจ่าย สปสช. 40 บาท/ครั้ง หรือ CBC 90 บาท/ครั้ง) เพื่อค้นหาและแก้ไขภาวะโลหิตจางจากการขาดธาตุเหล็กในเด็กปฐมวัยและวัยเรียน',
    isNew2569: true,
    nhsoRules: {
      requireThaiNationality: true,
    },
    auditRules: {
      maxAge: 12,
      warningMessage: 'ต้องมีผลตรวจทางห้องปฏิบัติการ Hct หรือ Hb บันทึกในระบบ',
    },
  },
  {
    id: 'iron_supplement',
    code: 'PP25',
    title: 'บริการยาเสริมธาตุเหล็กเพื่อป้องกันโลหิตจางจากการขาดธาตุเหล็ก (*)',
    shortName: 'บริการยาเสริมธาตุเหล็ก (Ferrous/Folic)',
    category: 'NUTRITION',
    targetGroupDesc: 'เด็กปฐมวัย, เด็กวัยเรียน และหญิงวัยเจริญพันธุ์ อายุ 1 - 45 ปี (*)',
    ageMin: 1,
    ageMax: 45,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 30,
    nhsoGoalPercent: 75,
    icd10Codes: ['Z298', 'Z299'],
    description: 'การจ่ายยาน้ำเสริมธาตุเหล็กในเด็กเล็ก และยาเม็ดเสริมธาตุเหล็กผสมกรดโฟลิก (Ferrous / Weekly Iron Folic Acid อัตราชดเชยเฉลี่ย 30 บาท/ครั้ง) ในเด็กวัยเรียนและหญิงวัยเจริญพันธุ์',
    isNew2569: true,
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.25,
    },
    auditRules: {
      maxAge: 49,
      warningMessage: 'ต้องมีการสั่งจ่ายเวชภัณฑ์ยาน้ำหรือยาเม็ดธาตุเหล็กตามรหัสมาตรฐาน 24 หลัก',
    },
  },
  {
    id: 'hbv_screening',
    code: 'PP26',
    title: 'การตรวจคัดกรองโรคไวรัสตับอักเสบ บี (HBsAg)',
    shortName: 'คัดกรองไวรัสตับอักเสบ บี (HBsAg)',
    category: 'INFECTIOUS',
    targetGroupDesc: 'ประชาชนไทยที่เกิดก่อนปี พ.ศ. 2535 (อายุ 34 - 75 ปี)',
    ageMin: 34,
    ageMax: 75,
    gender: 'ALL',
    intervalMonths: 60,
    unitPrice: 50,
    nhsoGoalPercent: 75,
    icd10Codes: ['Z115', 'B181', 'Z225'],
    description: 'ตรวจคัดกรองการติดเชื้อไวรัสตับอักเสบบีด้วยชุดตรวจ HBsAg สำหรับประชาชนไทยที่เกิดก่อน พ.ศ. 2535 จำนวน 1 ครั้งตลอดชีวิต (อัตราจ่าย สปสช. 50 บาท/ครั้ง)',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.30, // เป้าหมายคัดกรองรายปีจากประชากรที่เกิดก่อนปี 2535
    },
    auditRules: {
      minAge: 34,
      warningMessage: 'ผู้รับบริการต้องเกิดก่อนปี พ.ศ. 2535 (หรือกลุ่มเสี่ยงตามเกณฑ์) และบันทึกผลแล็บ HBsAg',
    },
  },
  {
    id: 'hcv_screening',
    code: 'PP27',
    title: 'การตรวจคัดกรองโรคไวรัสตับอักเสบ ซี (Anti-HCV)',
    shortName: 'คัดกรองไวรัสตับอักเสบ ซี (Anti-HCV)',
    category: 'INFECTIOUS',
    targetGroupDesc: 'ประชาชนไทยที่เกิดก่อนปี พ.ศ. 2535 (อายุ 34 - 75 ปี) และกลุ่มเสี่ยง',
    ageMin: 34,
    ageMax: 75,
    gender: 'ALL',
    intervalMonths: 60,
    unitPrice: 50,
    nhsoGoalPercent: 75,
    icd10Codes: ['Z115', 'B182'],
    description: 'ตรวจคัดกรองภูมิคุ้มกันไวรัสตับอักเสบซี (Anti-HCV อัตราจ่าย สปสช. 50 บาท/ครั้ง; กรณีตรวจยืนยัน HCV core Ag 400 บาท หรือ HCV RNA 1,690 บาท) สำหรับผู้เกิดก่อน พ.ศ. 2535 และกลุ่มเสี่ยง',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.30,
    },
    auditRules: {
      minAge: 18,
      warningMessage: 'บันทึกผลตรวจคัดกรอง Anti-HCV ในระบบ เพื่อเบิกจ่ายตามเกณฑ์ Krungthai/e-Claim',
    },
  },
  {
    id: 'ov_rdt_liver_fluke',
    code: 'PP28',
    title: 'บริการตรวจคัดกรองพยาธิใบไม้ในตับด้วยการตรวจปัสสาวะ (OV-RDT)',
    shortName: 'คัดกรองพยาธิใบไม้ตับ & มะเร็งท่อน้ำดี (OV-RDT)',
    category: 'CANCER',
    targetGroupDesc: 'ประชาชนไทยอายุ 15 - 80 ปี ในพื้นที่เสี่ยงภาคตะวันออกเฉียงเหนือ',
    ageMin: 15,
    ageMax: 80,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 150,
    nhsoGoalPercent: 75,
    icd10Codes: ['Z116', 'B660'],
    description: 'ตรวจหาแอนติเจนพยาธิใบไม้ตับในปัสสาวะด้วยชุดตรวจสำเร็จรูปชนิดเร็ว (Urine OV-RDT อัตราจ่ายเหมาจ่าย สปสช. 150 บาท/คน/ปีงบประมาณ) เพื่อป้องกันมะเร็งท่อน้ำดี',
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.25, // สัดส่วนกลุ่มเป้าหมายเสี่ยงต่อปีในพื้นที่
    },
    auditRules: {
      minAge: 15,
      warningMessage: 'ผู้รับบริการต้องมีอายุ 15 ปีขึ้นไป และมีประวัติเสี่ยงต่อโรคพยาธิใบไม้ตับ',
    },
  },
  {
    id: 'ltbi_screening',
    code: 'PP29',
    title: 'บริการคัดกรองวัณโรคระยะแฝง (Latent TB Infection - IGRA / TST) (*)',
    shortName: 'คัดกรองวัณโรคระยะแฝง (LTBI) (*)',
    category: 'INFECTIOUS',
    targetGroupDesc: 'ผู้สัมผัสร่วมบ้านผู้ป่วยวัณโรคปอด และผู้ติดเชื้อ HIV ทุกช่วงวัย (*)',
    ageMin: 0,
    ageMax: 100,
    gender: 'ALL',
    intervalMonths: 12,
    unitPrice: 850,
    nhsoGoalPercent: 80,
    icd10Codes: ['Z201', 'R761'],
    description: 'ตรวจคัดกรองวัณโรคระยะแฝงด้วยวิธี IGRA (อัตราจ่ายเหมาจ่าย สปสช. ค่าเจาะเลือด/ให้คำปรึกษา 100 บ. + ค่าจัดส่ง 100 บ. + ค่าตรวจทางห้องปฏิบัติการ IGRA 650 บ. = รวม 850 บาท/ครั้ง)',
    isNew2569: true,
    nhsoRules: {
      requireThaiNationality: true,
      excludeChronicClinics: ['009'],
      targetPrevalenceFactor: 0.02, // สัดส่วนผู้สัมผัสร่วมบ้านและกลุ่มเสี่ยงเฉพาะ
    },
    auditRules: {
      minAge: 0,
      warningMessage: 'เบิกได้ในกลุ่มผู้สัมผัสร่วมบ้านผู้ป่วยวัณโรคปอด หรือผู้มีภูมิคุ้มกันบกพร่อง',
    },
  },
  {
    id: 'osteoporosis_menopause',
    code: 'PP30',
    title: 'บริการคัดกรองโรคกระดูกพรุนในสตรีวัยหมดประจำเดือนและผู้สูงอายุ (*)',
    shortName: 'คัดกรองโรคกระดูกพรุนสตรีวัยทอง (*)',
    category: 'ELDERLY',
    targetGroupDesc: 'สตรีไทยวัยหมดประจำเดือนและผู้สูงอายุ อายุ 50 - 85 ปี (*)',
    ageMin: 50,
    ageMax: 85,
    gender: 'FEMALE',
    intervalMonths: 24,
    unitPrice: 250,
    nhsoGoalPercent: 70,
    icd10Codes: ['Z138', 'Z139', 'M810', 'M819'],
    description: 'บริการสิทธิประโยชน์ใหม่ปี 2569-2570: ประเมินความเสี่ยงโรคกระดูกพรุนด้วยเกณฑ์ OSTA score / FRAX และตรวจความหนาแน่นมวลกระดูก (BMD) ในสตรีวัยหมดประจำเดือนเพื่อป้องกันกระดูกหัก',
    isNew2569: true,
    nhsoRules: {
      requireThaiNationality: true,
      targetPrevalenceFactor: 0.25,
    },
    auditRules: {
      requireGender: '2',
      minAge: 50,
      warningMessage: 'ผู้รับบริการต้องเป็นสตรีวัยหมดประจำเดือน (50 ปีขึ้นไป) ที่มีความเสี่ยงตามเกณฑ์ OSTA',
    },
  },
];

export const getIndicatorById = (id: string): PPFSIndicator | undefined => {
  return PPFS_INDICATORS.find((ind) => ind.id === id);
};
