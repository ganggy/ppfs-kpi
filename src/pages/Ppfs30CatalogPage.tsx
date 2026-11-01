import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';

interface BenefitItem {
  id: number;
  title: string;
  category: string;
  targetGroup: string;
  feeRate: string;
  isNewOrModified?: boolean;
  notes?: string;
  cancelIn2570?: boolean;
}

export const PPFS_30_CATALOG: BenefitItem[] = [
  {
    id: 1,
    title: 'บริการการทดสอบการตั้งครรภ์ (UPT)',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงไทยวัยเจริญพันธุ์ที่สงสัยตั้งครรภ์หรือประจำเดือนขาด',
    feeRate: '75 บาท/ครั้ง (ไม่เกิน 4 ครั้ง/ปี)',
    notes: 'ชุดตรวจ Urine Pregnancy Test (UPT) เพื่อวินิจฉัยการตั้งครรภ์ตั้งแต่ระยะแรก',
  },
  {
    id: 2,
    title: 'บริการฝากครรภ์ (ANC)',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงไทยตั้งครรภ์ทุกราย',
    feeRate: 'ฝากครรภ์ 360 บาท/ครั้ง | แล็บครบชุด 600 บาท | อัลตราซาวด์ 400 บาท | ทันตกรรม 500 บาท',
    notes: 'ดูแลครรภ์คุณภาพครบตามเกณฑ์มาตรฐาน สปสช. พร้อมยาเสริมธาตุเหล็กและไอโอดีน',
  },
  {
    id: 3,
    title: 'บริการป้องกันและควบคุมโรคโลหิตจางธาลัสซีเมียในหญิงตั้งครรภ์',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงไทยตั้งครรภ์ที่มาฝากครรภ์ครั้งแรก',
    feeRate: 'คัดกรอง (CBC/MCV+DCIP) 120 บาท | ตรวจยืนยัน Hb typing 250 บาท',
    notes: 'ตรวจคัดกรอง OF/MCV และ DCIP หากผลบวกตรวจยืนยันชนิดฮีโมโกลบิน (Hb typing)',
  },
  {
    id: 4,
    title: 'บริการป้องกันและควบคุมกลุ่มอาการดาวน์ในหญิงตั้งครรภ์',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงไทยตั้งครรภ์ทุกช่วงวัย (อายุครรภ์ 14-20 สัปดาห์)',
    feeRate: 'Quadruple Test 500 บาท (ค่าเก็บส่ง 100 + แล็บ 400) | NIPT 2,700 บาท',
    notes: 'ตรวจคัดกรองความผิดปกติของโครโมโซมทารกในครรภ์ หากผลเสี่ยงสูงส่งเจาะน้ำคร่ำตรวจโครโมโซม (2,500 บาท)',
  },
  {
    id: 5,
    title: 'บริการคัดกรองธาลัสซีเมียและซิฟิลิสในสามีหรือคู่ของหญิงตั้งครรภ์',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'สามีหรือคู่ของหญิงตั้งครรภ์',
    feeRate: 'ซิฟิลิส+HIV 190 บาท | คัดกรองธาลัสซีเมีย 120 บาท (Hb typing 250 บาท)',
    notes: 'ตรวจคู่เพื่อประเมินความเสี่ยงทารกเป็นโรคธาลัสซีเมียชนิดรุนแรงและป้องกันซิฟิลิสแต่กำเนิด',
  },
  {
    id: 6,
    title: 'การตรวจสุขภาพมารดาหลังคลอด',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงไทยหลังคลอด (ภายใน 6 สัปดาห์หลังคลอด)',
    feeRate: 'ตรวจดูแลหลังคลอด 150 บาท/ครั้ง (ไม่เกิน 3 ครั้ง) | ยาเสริมธาตุเหล็ก/ไอโอดีน 135 บาท/ครั้ง',
    notes: 'ตรวจสุขภาพมารดาหลังคลอด ประเมินภาวะซึมเศร้า และการเลี้ยงลูกด้วยนมแม่',
  },
  {
    id: 7,
    title: 'บริการป้องกันและควบคุมภาวะพร่องฮอร์โมนไทรอยด์ (TSH & PKU)',
    category: 'เด็กแรกเกิด & ทารก',
    targetGroup: 'ทารกไทยแรกเกิดทุกราย (อายุ 48-72 ชั่วโมง)',
    feeRate: 'คัดกรองกระดาษซับเลือด 135 บาท/คน | ตรวจยืนยันไทรอยด์ผิดปกติ 350 บาท',
    notes: 'เจาะเลือดส้นเท้าตรวจภาวะพร่องฮอร์โมนต่อมไทรอยด์แต่กำเนิดและโรค PKU ป้องกันภาวะปัญญาอ่อน',
  },
  {
    id: 8,
    title: 'บริการตรวจคัดกรองโรคพันธุกรรมเมตาบอลิกด้วยเครื่อง TMS (40 โรค)',
    category: 'เด็กแรกเกิด & ทารก',
    targetGroup: 'ทารกไทยแรกเกิดทุกราย',
    feeRate: '500 บาท/คน (รวมค่าเก็บตัวอย่างและขนส่ง)',
    notes: 'ตรวจคัดกรองโรคทางพันธุกรรมเมตาบอลิกชนิดรุนแรง 40 โรคด้วย Tandem Mass Spectrometry (TMS)',
  },
  {
    id: 9,
    title: 'บริการวางแผนครอบครัวและการป้องกันการตั้งครรภ์ไม่พึงประสงค์',
    category: 'วัยเจริญพันธุ์',
    targetGroup: 'ประชาชนไทยวัยเจริญพันธุ์',
    feeRate: 'ยาฉีด 60 บาท/ครั้ง | ยาเม็ดรวม 40 บาท | ยาเม็ดเดี่ยว 80 บาท | ยาฉุกเฉิน 50 บาท | ถุงยาง 10 บาท',
    notes: 'บริการคุมกำเนิดชั่วคราวสำหรับหญิงไทยวัยเจริญพันธุ์และประชาชนทุกสิทธิ',
  },
  {
    id: 10,
    title: 'บริการคุมกำเนิดกึ่งถาวรและป้องกันการยุติการตั้งครรภ์ที่ไม่ปลอดภัย',
    category: 'วัยเจริญพันธุ์',
    targetGroup: 'หญิงไทยวัยเจริญพันธุ์ / วัยรุ่น / หลังคลอดหรือหลังแท้ง',
    feeRate: 'ฝังยาคุมกำเนิด 2,150 บาท | ถอดยาฝัง 350 บาท | ใส่ห่วงอนามัย (IUD) 800 บาท | ยุติตั้งครรภ์ด้วยยา 3,000 บาท',
    notes: 'บริการคุมกำเนิดกึ่งถาวร (Subdermal Implant / IUD) และบริการป้องกันการยุติการตั้งครรภ์ที่ไม่ปลอดภัยตามกฎหมาย',
  },
  {
    id: 11,
    title: 'บริการแว่นตาเด็กที่มีสายตาผิดปกติ',
    category: 'เด็กวัยเรียน',
    targetGroup: 'เด็กไทยอายุ 3 - 12 ปี (อนุบาล - ป.6) ที่มีสายตาผิดปกติ',
    feeRate: 'เลนส์ Stock 800 บาท/คน/ปี | เลนส์สั่งตัดพิเศษ (Lab) 1,000 บาท/คน/ปี',
    notes: 'ตรวจวัดสายตาและตัดแว่นตาสำหรับเด็กที่มีสายตาผิดปกติ ไม่เกิน 1 อัน/คน/ปี',
  },
  {
    id: 12,
    title: 'บริการตรวจคัดกรองมะเร็งปากมดลูก (HPV DNA Test)',
    category: 'คัดกรองมะเร็ง',
    targetGroup: 'สตรีไทย อายุ 30 - 59 ปี (ทุก 5 ปี)',
    feeRate: 'HPV DNA 420 บาท/ครั้ง (เก็บตัวอย่าง 50 + แล็บ 14 สายพันธุ์ 370) | Pap/VIA 250 บาท',
    notes: 'ตรวจด้วยวิธี HPV DNA Test (รวม HPV Self-Sampling) ทุก 5 ปีงบประมาณ',
  },
  {
    id: 13,
    title: 'บริการคัดกรองรอยโรคเสี่ยงมะเร็งและมะเร็งช่องปาก (CA Oral Screening)',
    category: 'คัดกรองมะเร็ง',
    targetGroup: 'ประชาชนไทย อายุ 40 ปีขึ้นไป (ปีละ 1 ครั้ง)',
    feeRate: 'คัดกรองช่องปาก 50 บาท/ครั้ง | ตัดชิ้นเนื้อส่งตรวจ (Biopsy) 600 บาท',
    notes: 'ตรวจคัดกรองเนื้อเยื่อในช่องปากโดยทันตแพทย์หรือทันตาภิบาลเพื่อหารอยโรคเสี่ยงก่อนมะเร็ง',
  },
  {
    id: 14,
    title: 'บริการตรวจคัดกรองและค้นหาวัณโรคในกลุ่มเสี่ยงสูง (Chest X-ray)',
    category: 'ควบคุมโรคติดต่อ',
    targetGroup: 'ผู้สัมผัสร่วมบ้านผู้ป่วยวัณโรค, ผู้สูงอายุมีโรคร่วม, ผู้ป่วยเบาหวาน/CKD/HIV',
    feeRate: 'CXR 100 บาท/ครั้ง | TB-LAMP 200 บาท | Xpert MTB/RIF 500 บาท',
    notes: 'คัดกรองอาการและถ่ายภาพรังสีทรวงอก (Chest X-ray) ปีละ 1 ครั้งใน 7 กลุ่มเสี่ยงสูง',
  },
  {
    id: 15,
    title: 'บริการคัดกรองเบาหวานและไขมันในเลือด (DM & Lipid Profile)',
    category: 'โรคไม่ติดต่อเรื้อรัง (NCD)',
    targetGroup: 'ประชาชนไทย อายุ 35 ปีขึ้นไป (ไม่เป็นผู้ป่วยเบาหวาน)',
    feeRate: 'คัดกรองเบาหวาน (FPG) 40 บาท/ครั้ง | ตรวจไขมัน (อายุ 45-70 ปี) 160 บาท/ครั้ง',
    notes: 'ซักประวัติ ประเมินความเสี่ยง และเจาะตรวจน้ำตาลในเลือดหลังอดอาหาร (FPG) ปีละ 1 ครั้ง',
  },
  {
    id: 16,
    title: 'บริการตรวจยีน BRCA1/BRCA2 ในกลุ่มผู้ป่วยมะเร็งเต้านมเสี่ยงสูงและญาติสายตรง',
    category: 'คัดกรองพันธุกรรมมะเร็ง',
    targetGroup: 'ผู้ป่วยมะเร็งเต้านมกลุ่มเสี่ยงสูงและญาติสายตรง (อายุ 18 ปีขึ้นไป)',
    feeRate: 'ให้คำปรึกษา+เก็บสิ่งส่งตรวจ 500 บาท | ตรวจยีนญาติสายตรง 2,500 บาท | ผู้ป่วยมะเร็งเต้านม 10,000 บาท',
    notes: 'ตรวจหายีนกลายพันธุ์ BRCA1/BRCA2 เพื่อวางแผนการรักษาและเฝ้าระวังมะเร็งในเครือญาติสายตรง',
  },
  {
    id: 17,
    title: 'บริการคัดกรองโลหิตจางจากการขาดธาตุเหล็ก (Hct / Hb)',
    category: 'โภชนาการ & เลือด',
    targetGroup: 'เด็กอายุ 6 เดือน - 12 ปี และหญิงวัยเจริญพันธุ์',
    feeRate: 'Hct/Hb 40 บาท/ครั้ง | CBC 90 บาท/ครั้ง',
    notes: 'เจาะเลือดตรวจระดับฮีมาโตคริต (Hct) หรือฮีโมโกลบิน (Hb) เพื่อค้นหาภาวะโลหิตจาง',
  },
  {
    id: 18,
    title: 'บริการยาเม็ด/ยาน้ำเสริมธาตุเหล็กและกรดโฟลิก',
    category: 'โภชนาการ & ยา',
    targetGroup: 'เด็กอายุ 6 เดือน - 12 ปี และหญิงไทยวัยเจริญพันธุ์ (13 - 45 ปี)',
    feeRate: '30 บาท/ครั้ง',
    notes: 'จ่ายยาน้ำเสริมธาตุเหล็กในเด็กเล็ก หรือยาเม็ดเสริมธาตุเหล็กและกรดโฟลิก (Ferrofolic) สัปดาห์ละ 1 ครั้ง',
  },
  {
    id: 19,
    title: 'บริการเคลือบฟลูออไรด์วาร์นิชและเคลือบหลุมร่องฟัน',
    category: 'ทันตสาธารณสุข',
    targetGroup: 'เด็กไทยอายุ 9 เดือน - 12 ปี และกลุ่มเสี่ยงฟันผุ',
    feeRate: 'เคลือบฟลูออไรด์ 100 บาท/ครั้ง (ไม่เกิน 2 ครั้ง/ปี) | เคลือบหลุมร่องฟัน 250 บาท/ซี่',
    notes: 'ทาฟลูออไรด์วาร์นิชหรือเจลป้องกันฟันผุในเด็กปฐมวัยและวัยเรียน',
  },
  {
    id: 20,
    title: 'บริการตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (FIT Test)',
    category: 'คัดกรองมะเร็ง',
    targetGroup: 'ประชาชนไทย อายุ 50 - 70 ปี (ทุก 2 ปี)',
    feeRate: 'FIT Test 60 บาท/ครั้ง (ทุก 2 ปี)',
    notes: 'เหมาจ่ายรวมค่าชุดตรวจ Quantitative FIT Test ค่าตรวจทางห้องปฏิบัติการ และการให้คำแนะนำ',
  },
  {
    id: 21,
    title: 'การตรวจคัดกรองโรคไวรัสตับอักเสบ บี (HBsAg)',
    category: 'ควบคุมโรคติดต่อ',
    targetGroup: 'ประชาชนไทยที่เกิดก่อน พ.ศ. 2535 (1 ครั้งตลอดชีวิต) และกลุ่มเสี่ยง',
    feeRate: '50 บาท/ครั้ง (ชุดตรวจ Rapid Test / Lab HBsAg)',
    notes: 'ตรวจคัดกรอง HBsAg เพื่อค้นหาผู้ติดเชื้อไวรัสตับอักเสบบีเรื้อรังและส่งต่อรักษาป้องกันตับแข็ง/มะเร็งตับ',
  },
  {
    id: 22,
    title: 'การตรวจคัดกรองโรคไวรัสตับอักเสบ ซี (Anti-HCV)',
    category: 'ควบคุมโรคติดต่อ',
    targetGroup: 'ประชาชนไทยที่เกิดก่อน พ.ศ. 2535 (1 ครั้งตลอดชีวิต) และ 5 กลุ่มเสี่ยง',
    feeRate: 'คัดกรอง Anti-HCV 50 บาท/ครั้ง | ตรวจยืนยัน HCV Core Ag 400 บาท / HCV RNA 1,690 บาท',
    notes: 'ตรวจคัดกรอง Anti-HCV เพื่อค้นหาผู้ติดเชื้อและรับยาต้านไวรัส (Sofosbuvir/Velpatasvir) รักษาหายขาด',
  },
  {
    id: 23,
    title: 'บริการตรวจคัดกรองพยาธิใบไม้ตับด้วยการตรวจปัสสาวะ (OV-RDT)',
    category: 'ควบคุมโรคติดต่อเขตร้อน',
    targetGroup: 'ประชาชนไทยอายุ 15 ปีขึ้นไปที่มีประวัติเสี่ยง (กินปลาน้ำจืดเกล็ดขาวดิบ)',
    feeRate: '150 บาท/คน/ปี (ไม่เกิน 1 ครั้ง/ปี)',
    notes: 'ตรวจหาแอนติเจนพยาธิใบไม้ตับในปัสสาวะด้วยชุดตรวจ Urine OV-RDT เพื่อป้องกันมะเร็งท่อน้ำดี (CCA)',
  },
  {
    id: 24,
    title: 'บริการตรวจคัดกรองมะเร็งเต้านมด้วยเครื่องแมมโมแกรมและอัลตราซาวด์',
    category: 'คัดกรองมะเร็ง',
    targetGroup: 'หญิงไทย อายุ 40 ปีขึ้นไปที่มีญาติสายตรงเป็นมะเร็งเต้านม',
    feeRate: '2,400 บาท/ครั้ง (Mammogram & Ultrasound)',
    notes: 'ตรวจคัดกรองมะเร็งเต้านมด้วยเครื่อง Mammogram และ Ultrasound ในสตรีกลุ่มเสี่ยงสูง',
  },
  {
    id: 25,
    title: 'ค่าบริการฉีดวัคซีนป้องกันโรค (EPI & วัคซีนไข้หวัดใหญ่)',
    category: 'สร้างเสริมภูมิคุ้มกัน',
    targetGroup: 'เด็กตามเกณฑ์ EPI, ผู้สูงอายุ 65 ปีขึ้นไป และ 7 กลุ่มเสี่ยง',
    feeRate: 'ค่าบริการฉีดวัคซีน 20 บาท/ครั้ง (โดส)',
    notes: 'ค่าบริการฉีดวัคซีนไข้หวัดใหญ่ตามฤดูกาลและวัคซีนพื้นฐาน (สปสช. จัดสรรวัคซีนให้หน่วยบริการ)',
    cancelIn2570: true,
  },
  {
    id: 26,
    title: 'บริการคัดกรองวัณโรคระยะแฝง (Latent TB Infection - IGRA)*',
    category: 'ควบคุมโรคติดต่อ',
    targetGroup: 'ผู้สัมผัสร่วมบ้านผู้ป่วยวัณโรคปอด และกลุ่มเสี่ยงตามเกณฑ์กรมควบคุมโรค',
    feeRate: '850 บาท/ครั้ง (เจาะเลือด/ให้คำปรึกษา 100 + จัดส่ง 100 + แล็บ IGRA 650)',
    isNewOrModified: true,
    notes: 'ตรวจเลือดด้วยวิธี IGRA (Interferon-Gamma Release Assay) เพื่อให้ยากินป้องกันวัณโรคระยะแฝง (TPT)',
  },
  {
    id: 27,
    title: 'บริการคัดกรองความดันโลหิตสูงและโรคหัวใจหลอดเลือด (HT Screening)*',
    category: 'โรคไม่ติดต่อเรื้อรัง (NCD)',
    targetGroup: 'ประชาชนไทย อายุ 35 ปีขึ้นไป (ไม่เป็นผู้ป่วยความดันโลหิตสูง)',
    feeRate: '50 บาท/ครั้ง (ปีละ 1 ครั้ง)',
    isNewOrModified: true,
    notes: 'ตรวจวัดความดันโลหิตและประเมินความเสี่ยงโรคหัวใจและหลอดเลือด (Thai CV Risk Score)',
  },
  {
    id: 28,
    title: 'บริการคัดกรองพัฒนาการเด็กปฐมวัย (DSPM / DAIM)*',
    category: 'เด็กปฐมวัย',
    targetGroup: 'เด็กไทยอายุ 9, 18, 30, 42 และ 60 เดือน',
    feeRate: 'คัดกรองพัฒนาการ 100 บาท/ครั้ง | กระตุ้นพัฒนาการ (TEDA4I) 250 บาท/ครั้ง',
    isNewOrModified: true,
    notes: 'ตรวจประเมินพัฒนาการเด็กปฐมวัย 5 ช่วงวัย และกระตุ้นพัฒนาการกรณีพบพัฒนาการสงสัยล่าช้า',
  },
  {
    id: 29,
    title: 'บริการคัดกรองสุขภาพผู้สูงอายุ 9 ด้าน (9 ด้าน / Barthel ADL) & ซึมเศร้า 2Q/9Q*',
    category: 'ผู้สูงอายุ & สุขภาพจิต',
    targetGroup: 'ผู้สูงอายุไทย 60 ปีขึ้นไป และประชาชนกลุ่มเสี่ยงสุขภาพจิต',
    feeRate: 'คัดกรองผู้สูงอายุ 9 ด้าน 100 บาท/ปี | คัดกรองซึมเศร้า 2Q/9Q 50 บาท/ครั้ง',
    isNewOrModified: true,
    notes: 'ประเมินความถดถอยของร่างกาย 9 ด้าน (Comprehensive Geriatric Assessment) และคัดกรองโรคซึมเศร้า',
  },
  {
    id: 30,
    title: 'บริการคัดกรองโรคกระดูกพรุนในสตรีวัยหมดประจำเดือน *',
    category: 'ผู้สูงอายุ & วัยหมดประจำเดือน',
    targetGroup: 'สตรีไทยวัยหมดประจำเดือน และผู้สูงอายุอายุ 60 ปีขึ้นไป',
    feeRate: '250 บาท/ครั้ง',
    isNewOrModified: true,
    notes: 'ประเมินความเสี่ยงด้วย OSTA Index / FRAX score และตรวจคัดกรองภาวะกระดูกพรุนเพื่อป้องกันกระดูกหัก',
  },
];

export const Ppfs30CatalogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(PPFS_30_CATALOG.map((item) => item.category)))];

  const filteredItems = PPFS_30_CATALOG.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.targetGroup.toLowerCase().includes(search.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(search.toLowerCase())) ||
      String(item.id).includes(search);
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="fade-in">
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 15px rgba(2, 132, 199, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Sparkles size={14} /> สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              รายการ PPFS ที่มีการเปลี่ยนแปลง / เพิ่มเติม ปีงบ 2569 - 2570
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#e0f2fe', marginTop: '0.4rem', maxWidth: '750px' }}>
              คู่มือสิทธิประโยชน์บริการสร้างเสริมสุขภาพและป้องกันโรค (PPFS) ครบทั้ง <strong>30 รายการ</strong> สำหรับเครือข่าย CUP โรงพยาบาลโคกศรีสุพรรณ และ รพ.สต. ในสังกัด
            </p>
          </div>

          <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '0.8rem', color: '#bae6fd' }}>จำนวนสิทธิประโยชน์</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>30 <span style={{ fontSize: '1rem', fontWeight: 500 }}>รายการ</span></div>
          </div>
        </div>
      </div>

      {/* Policy Change Notice for 2570 */}
      <div
        style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}
      >
        <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
            📌 สรุปสาระสำคัญการเปลี่ยนแปลง ปีงบประมาณ 2569 - 2570
          </h4>
          <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, fontSize: '0.825rem', color: '#78350f', lineHeight: 1.5 }}>
            <li>
              <strong>รายการที่มีการเพิ่มเติม (*) จำนวน 5 รายการ:</strong> ลำดับที่ 26 (วัณโรคแฝง LTBI), ลำดับที่ 27 (คัดกรองโลหิตจางขาดธาตุเหล็ก), ลำดับที่ 28 (ยาเสริมธาตุเหล็ก), ลำดับที่ 29 (ฮอร์โมนยืนยันเพศสภาพ), และลำดับที่ 30 (คัดกรองกระดูกพรุนในสตรีวัยทอง)
            </li>
            <li>
              <strong>รายการที่ยกเลิกในปี 2570:</strong> รายการที่ 25 (บริการวัคซีนป้องกันโรค) จะถูกยกเลิกการเบิกแบบ Fee Schedule โดยปรับไปรวมอยู่ใน <strong>งบเหมาจ่ายรายหัว (PPB)</strong> แทน
            </li>
          </ul>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="ค้นหาชื่อบริการ, กลุ่มเป้าหมาย หรือคำสำคัญ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.4rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Category Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#334155',
              backgroundColor: '#f8fafc',
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'หมวดหมู่ทั้งหมด' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1rem' }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: item.isNewOrModified ? '2px solid #38bdf8' : '1px solid #e2e8f0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: item.isNewOrModified ? '0 4px 12px rgba(56, 189, 248, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
              position: 'relative',
              transition: 'transform 0.15s ease',
            }}
          >
            <div>
              {/* Top Row: Index Badge & Status Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: item.isNewOrModified ? '#0284c7' : '#0f172a',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                  }}
                >
                  {item.id}
                </span>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    {item.category}
                  </span>

                  {item.isNewOrModified && (
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Sparkles size={11} /> เพิ่มเติมใหม่ (*)
                    </span>
                  )}

                  {item.cancelIn2570 && (
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      ยกเลิกปี 2570 (ไปงบ PPB)
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.4rem 0', lineHeight: 1.4 }}>
                {item.title}
              </h3>

              {/* Target Group */}
              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>กลุ่มเป้าหมาย:</span> {item.targetGroup}
              </div>

              {/* Official NHSO Reimbursement Rate */}
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#047857',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                }}
              >
                💰 อัตราชดเชย สปสช.: {item.feeRate}
              </div>

              {/* Notes */}
              {item.notes && (
                <div style={{ fontSize: '0.775rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                  💡 {item.notes}
                </div>
              )}
            </div>

            <div style={{ marginTop: '0.85rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>เกณฑ์ สปสช. ปีงบ 2569-2570</span>
              <span style={{ fontWeight: 600, color: '#0284c7' }}>สิทธิบัตรทอง / ประชาชนไทย</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
