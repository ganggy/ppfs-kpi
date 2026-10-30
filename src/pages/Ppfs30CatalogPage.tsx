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
  isNewOrModified?: boolean;
  notes?: string;
  cancelIn2570?: boolean;
}

export const PPFS_30_CATALOG: BenefitItem[] = [
  {
    id: 1,
    title: 'บริการการทดสอบการตั้งครรภ์',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงวัยเจริญพันธุ์ที่มีข้อบ่งชี้หรือสงสัยตั้งครรภ์',
    notes: 'ชุดตรวจ Pregnancy Test เพื่อวินิจฉัยการตั้งครรภ์ตั้งแต่ระยะแรก',
  },
  {
    id: 2,
    title: 'บริการฝากครรภ์',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงตั้งครรภ์ทุกราย',
    notes: 'ดูแลครรภ์คุณภาพครบตามเกณฑ์มาตรฐาน สปสช. (ANC)',
  },
  {
    id: 3,
    title: 'บริการป้องกันและควบคุมโรคโลหิตจางธาลัสซีเมีย ในหญิงตั้งครรภ์',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงตั้งครรภ์ที่มาฝากครรภ์ครั้งแรก',
    notes: 'ตรวจคัดกรอง OF/DCIP และ Hb typing',
  },
  {
    id: 4,
    title: 'บริการป้องกันและควบคุมกลุ่มอาการดาวน์ในหญิงตั้งครรภ์',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงตั้งครรภ์ทุกช่วงวัย (คัดกรอง Quadruple test / NIPT ในกลุ่มเสี่ยง)',
    notes: 'ตรวจคัดกรองความผิดปกติของโครโมโซมทารกในครรภ์',
  },
  {
    id: 5,
    title: 'บริการคัดกรองธาลัสซีเมียในสามีหรือคู่ของหญิงตั้งครรภ์และบริการคัดกรองโรคซิฟิลิส',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'สามีหรือคู่ของหญิงตั้งครรภ์',
    notes: 'ตรวจคู่เพื่อประเมินความเสี่ยงทารกเป็นโรคธาลัสซีเมียชนิดรุนแรงและป้องกันซิฟิลิสแต่กำเนิด',
  },
  {
    id: 6,
    title: 'การตรวจหลังคลอด',
    category: 'อนามัยแม่และเด็ก (MCH)',
    targetGroup: 'หญิงหลังคลอดและทารกแรกเกิด',
    notes: 'ตรวจสุขภาพมารดาหลังคลอด ประเมินภาวะซึมเศร้า และการเลี้ยงลูกด้วยนมแม่',
  },
  {
    id: 7,
    title: 'บริการป้องกันและควบคุมภาวะพร่องฮอร์โมนไทรอยด์ (TSH)',
    category: 'เด็กแรกเกิด & ทารก',
    targetGroup: 'ทารกแรกเกิดทุกราย',
    notes: 'เจาะเลือดส้นเท้าตรวจภาวะพร่องฮอร์โมนต่อมไทรอยด์แต่กำเนิด ป้องกันภาวะปัญญาอ่อน',
  },
  {
    id: 8,
    title: 'บริการตรวจคัดกรองผู้ป่วยโรคพันธุกรรมเมตาบอลิก ด้วยเครื่อง Tandem mass spectrometry (TMS)',
    category: 'เด็กแรกเกิด & ทารก',
    targetGroup: 'ทารกแรกเกิดทุกราย',
    notes: 'ตรวจคัดกรองโรคทางพันธุกรรมเมตาบอลิก 40 โรคด้วยหยดเลือดแห้ง',
  },
  {
    id: 9,
    title: 'บริการวางแผนครอบครัวและการป้องกันการตั้งครรภ์ไม่พึงประสงค์',
    category: 'วัยเจริญพันธุ์',
    targetGroup: 'ประชาชนวัยเจริญพันธุ์',
    notes: 'บริการยาเม็ดคุมกำเนิด, ถุงยางอนามัย, ยาฉีดคุมกำเนิด, ห่วงอนามัย, ยาฝังคุมกำเนิด และการทำหมัน',
  },
  {
    id: 10,
    title: 'บริการป้องกันการยุติการตั้งครรภ์ที่ไม่ปลอดภัย',
    category: 'วัยเจริญพันธุ์',
    targetGroup: 'หญิงตั้งครรภ์ไม่พร้อม',
    notes: 'ให้คำปรึกษาและบริการทางการแพทย์ตามกฎหมายเพื่อความปลอดภัย',
  },
  {
    id: 11,
    title: 'บริการแว่นตาเด็กที่มีสายตาผิดปกติ',
    category: 'เด็กวัยเรียน',
    targetGroup: 'เด็กนักเรียนชั้น ป.1 และเด็กที่มีความผิดปกติด้านสายตา',
    notes: 'ตรวจวัดสายตาและสนับสนุนแว่นตาเพื่อส่งเสริมการเรียนรู้',
  },
  {
    id: 12,
    title: 'บริการตรวจคัดกรองมะเร็งปากมดลูก',
    category: 'คัดกรองมะเร็ง',
    targetGroup: 'สตรีไทย อายุ 30 - 59 ปี',
    notes: 'ตรวจด้วยวิธี HPV DNA testing ทุก 5 ปี หรือตรวจทางเซลล์วิทยา (Pap smear)',
  },
  {
    id: 13,
    title: 'บริการคัดกรองรอยโรคเสี่ยงมะเร็งและมะเร็งช่องปาก (CA Oral Screening)',
    category: 'คัดกรองมะเร็ง',
    targetGroup: 'ประชาชนอายุ 40 ปีขึ้นไป',
    notes: 'ตรวจช่องปากโดยทันตบุคลากรเพื่อหารอยโรคเสี่ยงก่อนมะเร็ง',
  },
  {
    id: 14,
    title: 'บริการตรวจคัดกรองและค้นหาวัณโรคในกลุ่มเสี่ยงสูง',
    category: 'ควบคุมโรคติดต่อ',
    targetGroup: 'ผู้สัมผัสร่วมบ้านผู้ป่วยวัณโรค, ผู้สูงอายุมีโรคร่วม, ผู้ต้องขัง, บุคลากรสาธารณสุข',
    notes: 'คัดกรองอาการและเอกซเรย์ปอด (Chest X-ray)',
  },
  {
    id: 15,
    title: 'บริการคัดกรองเบาหวานและไขมันในเลือด',
    category: 'โรคไม่ติดต่อเรื้อรัง (NCD)',
    targetGroup: 'ประชาชนอายุ 35 ปีขึ้นไป',
    notes: 'ตรวจระดับน้ำตาลในเลือด (FPG) และระดับไขมันในเลือดสำหรับกลุ่มเสี่ยง',
  },
  {
    id: 16,
    title: 'บริการตรวจยีน BRCA1/BRCA2 ในกลุ่มผู้ป่วยมะเร็งเต้านมที่มีความเสี่ยงสูงและญาติสายตรงที่มี ประวัติครอบครัวตรวจพบยีนกลายพันธุ์',
    category: 'คัดกรองพันธุกรรมมะเร็ง',
    targetGroup: 'ผู้ป่วยมะเร็งเต้านมกลุ่มเสี่ยงสูงและญาติสายตรง',
    notes: 'ตรวจหายีนกลายพันธุ์เพื่อวางแผนการรักษาและป้องกันในเครือญาติ',
  },
  {
    id: 17,
    title: 'บริการคัดกรองโลหิตจางจากการขาดธาตุเหล็ก',
    category: 'โภชนาการ & เลือด',
    targetGroup: 'เด็กอายุ 6 เดือน - 5 ปี และเด็กวัยเรียน',
    notes: 'ตรวจระดับฮีโมโกลบิน / ฮีมาโตคริตเพื่อป้องกันภาวะซีด',
  },
  {
    id: 18,
    title: 'บริการยาเม็ดเสริมธาตุเหล็ก',
    category: 'โภชนาการ & ยา',
    targetGroup: 'เด็กปฐมวัย, เด็กวัยเรียน และหญิงวัยเจริญพันธุ์',
    notes: 'จ่ายยาน้ำ/ยาเม็ดเสริมธาตุเหล็กและกรดโฟลิกประจำสัปดาห์',
  },
  {
    id: 19,
    title: 'บริการเคลือบฟลูออไรด์',
    category: 'ทันตสาธารณสุข',
    targetGroup: 'เด็กอายุ 9 เดือน - 5 ปี และกลุ่มเสี่ยง',
    notes: 'ทาฟลูออไรด์วานิชหรือเจลเพื่อป้องกันฟันผุในเด็กปฐมวัย',
  },
  {
    id: 20,
    title: 'บริการตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (Fit test)',
    category: 'คัดกรองมะเร็ง',
    targetGroup: 'ประชาชนไทย อายุ 50 - 70 ปี',
    notes: 'ตรวจหาเลือดแฝงในอุจจาระด้วยชุดตรวจ FIT test ทุก 2 ปี หากผลบวกส่งตรวจส่องกล้อง Colonoscopy',
  },
  {
    id: 21,
    title: 'การตรวจคัดกรองโรคไวรัสตับอักเสบ บี',
    category: 'ควบคุมโรคติดต่อ',
    targetGroup: 'ผู้ที่เกิดก่อนปี 2535 และกลุ่มเสี่ยง',
    notes: 'ตรวจ HBsAg เพื่อค้นหาผู้ติดเชื้อและส่งต่อรับการรักษาป้องกันตับแข็ง/มะเร็งตับ',
  },
  {
    id: 22,
    title: 'การตรวจคัดกรองไวรัสตับอักเสบ ซี',
    category: 'ควบคุมโรคติดต่อ',
    targetGroup: 'ประชาชนอายุ 30 ปีขึ้นไปที่มีปัจจัยเสี่ยง และผู้ติดเชื้อ HIV/ผู้ใช้สารเสพติด',
    notes: 'ตรวจ Anti-HCV เพื่อค้นหาและให้ยารักษาหายขาด (Sofosbuvir/Velpatasvir)',
  },
  {
    id: 23,
    title: 'บริการตรวจคัดกรองพยาธิใบไม้ในตับด้วยการตรวจปัสสาวะ',
    category: 'ควบคุมโรคติดต่อเขตร้อน',
    targetGroup: 'ประชาชนอายุ 15 ปีขึ้นไปในพื้นที่เสี่ยง (ภาคอีสานและเหนือ)',
    notes: 'ตรวจแอนติเจนพยาธิใบไม้ตับในปัสสาวะ (OV-RDT) เพื่อกำจัดพยาธิใบไม้ในตับและป้องกันมะเร็งท่อน้ำดี',
  },
  {
    id: 24,
    title: 'บริการตรวจคัดกรองมะเร็งเต้านมด้วยเครื่องแมมโมแกรมและอัลตราซาวด์',
    category: 'คัดกรองมะเร็ง',
    targetGroup: 'หญิงไทย อายุ 40 ปีขึ้นไปที่มีประวัติเสี่ยงสูงหรือญาติสายตรงเป็นมะเร็งเต้านม',
    notes: 'ตรวจยืนยันด้วย Mammogram และ Ultrasound เต้านม',
  },
  {
    id: 25,
    title: 'ค่าบริการให้วัคซีนป้องกันโรค',
    category: 'สร้างเสริมภูมิคุ้มกัน',
    targetGroup: 'เด็กตามเกณฑ์ EPI, ผู้สูงอายุ และกลุ่มเสี่ยง',
    notes: 'ฉีดวัคซีนพื้นฐานและวัคซีนไข้หวัดใหญ่',
    cancelIn2570: true,
  },
  {
    id: 26,
    title: 'บริการคัดกรองวัณโรคระยะแฝง (Latent TB Infection)*',
    category: 'ควบคุมโรคติดต่อ',
    targetGroup: 'ผู้สัมผัสร่วมบ้านผู้ป่วยวัณโรค และผู้ติดเชื้อ HIV',
    isNewOrModified: true,
    notes: 'ตรวจ IGRA หรือ Tuberculin skin test เพื่อให้ยาป้องกันการกำเริบเป็นวัณโรคระยะลุกลาม',
  },
  {
    id: 27,
    title: 'บริการคัดกรองภาวะโลหิตจางจากการขาดธาตุเหล็ก *',
    category: 'โภชนาการ & เลือด',
    targetGroup: 'หญิงตั้งครรภ์, เด็กปฐมวัย และกลุ่มเปราะบาง',
    isNewOrModified: true,
    notes: 'ขยายเกณฑ์การตรวจคัดกรองภาวะซีดในกลุ่มเป้าหมายเชิงรุก',
  },
  {
    id: 28,
    title: 'บริการยาเสริมธาตุเหล็กเพื่อป้องกันโลหิตจางจากการขาดธาตุเหล็ก *',
    category: 'โภชนาการ & ยา',
    targetGroup: 'กลุ่มวัยเรียน, หญิงวัยเจริญพันธุ์ และผู้มีภาวะเสี่ยง',
    isNewOrModified: true,
    notes: 'สนับสนุนยาเม็ดธาตุเหล็กสูตรมาตรฐานระดับหน่วยบริการปฐมภูมิ',
  },
  {
    id: 29,
    title: 'บริการฮอร์โมนเพื่อการยืนยันเพศสภาพ *',
    category: 'ความหลากหลายทางเพศ & สุขภาพจิต',
    targetGroup: 'กลุ่มบุคคลที่มีความหลากหลายทางเพศ (LGBTQIA+)',
    isNewOrModified: true,
    notes: 'บริการให้คำปรึกษา ตรวจประเมินสุขภาพ และให้ฮอร์โมนเพื่อการยืนยันเพศสภาพอย่างปลอดภัยโดยแพทย์เฉพาะทาง',
  },
  {
    id: 30,
    title: 'บริการคัดกรองโรคกระดูกพรุนในสตรีวัยหมดประจำเดือน *',
    category: 'ผู้สูงอายุ & วัยหมดประจำเดือน',
    targetGroup: 'สตรีวัยหมดประจำเดือน และผู้สูงอายุที่มีความเสี่ยงสูง',
    isNewOrModified: true,
    notes: 'ประเมินความเสี่ยงด้วย OSTA score และตรวจความหนาแน่นมวลกระดูก (BMD) เพื่อป้องกันกระดูกหัก',
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
              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>กลุ่มเป้าหมาย:</span> {item.targetGroup}
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
