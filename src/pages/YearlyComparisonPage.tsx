import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { YearlyComparisonData, YearlyComparisonRow } from '../types/ppfs';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Building2,
  Filter,
  BarChart3,
  DollarSign,
  Users,
} from 'lucide-react';

interface YearlyComparisonPageProps {
  onNavigateToOutreach: (indicatorId: string) => void;
}

const NETWORK_CENTERS = [
  { id: 'ALL', name: '🏥 ทั้งหมดใน CUP โคกศรีสุพรรณ (ภาพรวมทั้งอำเภอ)' },
  { id: '11101', name: 'PCU โรงพยาบาลโคกศรีสุพรรณ (ต.ตองโขบ: ม.1,2,4,5,7-10,13-16)' },
  { id: '05569', name: 'รพ.สต.ห้วยหีบ (ต.ตองโขบ: ม.3,6,11,12,17,18)' },
  { id: '05570', name: 'รพ.สต.โพนค้อ (ต.เหล่าโพนค้อ ทั้งตำบล)' },
  { id: '05571', name: 'รพ.สต.ม่วงไข่ (ต.ด่านม่วงคำ ทั้งตำบล)' },
  { id: '05572', name: 'รพ.สต.โคกนาดี (ต.แมดนาท่ม: ม.2,3,6,7,8,13)' },
  { id: '05573', name: 'รพ.สต.โพนทอง (ต.แมดนาท่ม: ม.1,5,9,10,11,12)' },
];

export const YearlyComparisonPage: React.FC<YearlyComparisonPageProps> = ({
  onNavigateToOutreach,
}) => {
  const [selectedCenter, setSelectedCenter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'count' | 'revenue'>('count');
  const [data, setData] = useState<YearlyComparisonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api
      .getYearlyComparison({ centerId: selectedCenter })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCenter]);

  const handleExportExcel = () => {
    const url = api.getExportYearlyComparisonUrl(selectedCenter);
    window.open(url, '_blank');
  };

  const renderDiffBadge = (diff: number, pct: number | null, unitPrice = 1) => {
    const displayVal = viewMode === 'revenue' ? diff * unitPrice : diff;
    const prefix = viewMode === 'revenue' ? '฿' : '';

    if (diff > 0) {
      return (
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#ecfdf5',
            color: '#047857',
            border: '1px solid #a7f3d0',
            borderRadius: '6px',
            padding: '0.2rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            minWidth: '82px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingUp size={12} /> +{prefix}
            {displayVal.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#059669' }}>
            (+{pct ?? 0}%)
          </span>
        </div>
      );
    }

    if (diff < 0) {
      return (
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '0.2rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            minWidth: '82px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingDown size={12} /> -
            {prefix}
            {Math.abs(displayVal).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#dc2626' }}>
            ({pct ?? 0}%)
          </span>
        </div>
      );
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem',
          color: '#94a3b8',
          fontSize: '0.75rem',
          fontWeight: 500,
        }}
      >
        <Minus size={12} /> คงที่ (0%)
      </span>
    );
  };

  const filteredRows: YearlyComparisonRow[] = (data?.rows || []).filter((r) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'CORE10') {
      const num = parseInt(r.code.replace('PP', ''), 10);
      return num >= 1 && num <= 10;
    }
    return r.category === categoryFilter;
  });

  return (
    <div className="fade-in">
      {/* Top Control Card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <BarChart3 size={22} color="#0284c7" />
              ตารางเปรียบเทียบผลงานและรายรับ PPFS รายปีงบประมาณ (ปีงบ 2567 – 2570)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
              วิเคราะห์แนวโน้มการเพิ่มขึ้น / ลดลง (Year-over-Year) แยกรายบริการทั้ง 30 รายการ และแยกตาม รพ.สต.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Toggle Count vs Revenue */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f1f5f9',
                padding: '0.25rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                onClick={() => setViewMode('count')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'count' ? '#0284c7' : 'transparent',
                  color: viewMode === 'count' ? 'white' : '#64748b',
                }}
              >
                <Users size={14} /> จำนวนผู้รับบริการ (คน)
              </button>
              <button
                onClick={() => setViewMode('revenue')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'revenue' ? '#7c3aed' : 'transparent',
                  color: viewMode === 'revenue' ? 'white' : '#64748b',
                }}
              >
                <DollarSign size={14} /> รายรับชดเชย (บาท)
              </button>
            </div>

            <button
              onClick={handleExportExcel}
              className="btn btn-success"
              style={{
                fontSize: '0.85rem',
                padding: '0.55rem 1rem',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Download size={16} />
              ดาวน์โหลด Excel เปรียบเทียบรายปี (.xlsx)
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 360px' }}>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              เลือกหน่วยบริการ / รพ.สต.:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="#0284c7" />
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                {NETWORK_CENTERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ minWidth: '240px' }}>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              หมวดหมู่บริการ PPFS:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} color="#0284c7" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">ทั้งหมด 30 รายการ</option>
                <option value="CORE10">เฉพาะ 10 ตัวชี้วัดหลัก (PP01-PP10)</option>
                <option value="CANCER">หมวดคัดกรองมะเร็ง (CANCER)</option>
                <option value="MCH">หมวดอนามัยแม่และเด็ก (MCH)</option>
                <option value="NCD">หมวดโรคไม่ติดต่อเรื้อรัง (NCD)</option>
                <option value="INFECTIOUS">หมวดควบคุมโรคติดต่อ (TB/HBV/HCV)</option>
                <option value="ELDERLY">หมวดผู้สูงอายุ & วัยทอง (ELDERLY)</option>
                <option value="NUTRITION">หมวดโภชนาการ & โลหิตจาง (NUTRITION)</option>
                <option value="DENTAL">หมวดทันตสาธารณสุข (DENTAL)</option>
                <option value="VACCINE">หมวดวัคซีนป้องกันโรค (VACCINE)</option>
                <option value="MENTAL">หมวดสุขภาพจิต (MENTAL)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Fiscal Year Executive Summary Cards */}
      {data && (
        <div className="grid-cols-4" style={{ marginBottom: '1.25rem' }}>
          {/* FY 2567 */}
          <div className="kpi-card" style={{ borderLeft: '4px solid #64748b' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
              ปีงบประมาณ 2567 (ฐานเปรียบเทียบ)
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {data.totals.fy2567.toLocaleString()}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>คน-ครั้ง</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.35rem' }}>
              รายรับรวม: ฿{data.totals.rev2567.toLocaleString()}
            </div>
          </div>

          {/* FY 2568 */}
          <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>ปีงบประมาณ 2568</span>
              {renderDiffBadge(data.totals.diff68_67, data.totals.pct68_67)}
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {data.totals.fy2568.toLocaleString()}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>คน-ครั้ง</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.35rem' }}>
              รายรับรวม: ฿{data.totals.rev2568.toLocaleString()} (
              {data.totals.rev2568 - data.totals.rev2567 >= 0 ? '+' : '-'}฿
              {Math.abs(data.totals.rev2568 - data.totals.rev2567).toLocaleString()})
            </div>
          </div>

          {/* FY 2569 */}
          <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857' }}>ปีงบประมาณ 2569</span>
              {renderDiffBadge(data.totals.diff69_68, data.totals.pct69_68)}
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
              {data.totals.fy2569.toLocaleString()}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>คน-ครั้ง</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.35rem' }}>
              รายรับรวม: ฿{data.totals.rev2569.toLocaleString()} (
              {data.totals.rev2569 - data.totals.rev2568 >= 0 ? '+' : '-'}฿
              {Math.abs(data.totals.rev2569 - data.totals.rev2568).toLocaleString()})
            </div>
          </div>

          {/* FY 2570 */}
          <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9' }}>
                ปีงบประมาณ 2570 (กำลังดำเนินการ)
              </span>
              {renderDiffBadge(data.totals.diff70_69, data.totals.pct70_69)}
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.2rem' }}>
              {data.totals.fy2570.toLocaleString()}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>คน-ครั้ง</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: '0.35rem' }}>
              รายรับสะสมต้นปีงบ: ฿{data.totals.rev2570.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Main Comparison Table */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              📈 ตารางเปรียบเทียบผลงานแต่ละปีงบประมาณ แยกรายบริการ ({filteredRows.length} รายการ)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              หน่วยบริการ: <strong>{data?.selectedCenterName}</strong> • แสดงผลในรูปแบบ:{' '}
              <strong style={{ color: '#0284c7' }}>
                {viewMode === 'count' ? 'จำนวนผู้รับบริการ (คน)' : 'มูลค่ารายรับชดเชย (บาท)'}
              </strong>{' '}
              (คลิกที่ชื่อบริการเพื่อดูรายชื่อคนไข้ Call List)
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              กำลังประมวลผลข้อมูลเปรียบเทียบย้อนหลัง 4 ปีงบประมาณ (2567 – 2570)...
            </div>
            <p style={{ fontSize: '0.85rem' }}>คำนวณส่วนต่างการเพิ่มขึ้น/ลดลงของทั้ง 30 บริการ PPFS</p>
          </div>
        ) : !data ? null : (
          <div className="custom-table-container">
            <table className="custom-table" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                  <th
                    style={{
                      backgroundColor: '#0f172a',
                      color: 'white',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      minWidth: '250px',
                    }}
                  >
                    รายการบริการ PPFS
                  </th>
                  <th style={{ backgroundColor: '#1e293b', color: '#cbd5e1', textAlign: 'right' }}>
                    เป้าหมาย/ปี
                  </th>
                  <th style={{ backgroundColor: '#334155', color: '#f8fafc', textAlign: 'right' }}>
                    ปีงบ 2567
                  </th>
                  <th style={{ backgroundColor: '#1e3a8a', color: '#bfdbfe', textAlign: 'right' }}>
                    ปีงบ 2568
                  </th>
                  <th style={{ backgroundColor: '#1e293b', color: '#93c5fd', textAlign: 'center' }}>
                    เทียบ 67 ➔ 68
                    <div style={{ fontSize: '0.68rem', fontWeight: 400 }}>(เพิ่มขึ้น / ลดลง)</div>
                  </th>
                  <th style={{ backgroundColor: '#064e3b', color: '#a7f3d0', textAlign: 'right' }}>
                    ปีงบ 2569
                  </th>
                  <th style={{ backgroundColor: '#1e293b', color: '#6ee7b7', textAlign: 'center' }}>
                    เทียบ 68 ➔ 69
                    <div style={{ fontSize: '0.68rem', fontWeight: 400 }}>(เพิ่มขึ้น / ลดลง)</div>
                  </th>
                  <th style={{ backgroundColor: '#4c1d95', color: '#ddd6fe', textAlign: 'right' }}>
                    ปีงบ 2570
                    <div style={{ fontSize: '0.68rem', fontWeight: 400 }}>(ต.ค. 69 - ปัจจุบัน)</div>
                  </th>
                  <th style={{ backgroundColor: '#1e293b', color: '#c4b5fd', textAlign: 'center' }}>
                    เทียบ 69 ➔ 70
                    <div style={{ fontSize: '0.68rem', fontWeight: 400 }}>(เพิ่มขึ้น / ลดลง)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, idx) => {
                  const isEven = idx % 2 === 0;
                  const val67 = viewMode === 'revenue' ? r.revenues.rev2567 : r.years.fy2567;
                  const val68 = viewMode === 'revenue' ? r.revenues.rev2568 : r.years.fy2568;
                  const val69 = viewMode === 'revenue' ? r.revenues.rev2569 : r.years.fy2569;
                  const val70 = viewMode === 'revenue' ? r.revenues.rev2570 : r.years.fy2570;
                  const tgtVal = viewMode === 'revenue' ? r.targetCount * r.unitPrice : r.targetCount;
                  const prefix = viewMode === 'revenue' ? '฿' : '';

                  return (
                    <tr
                      key={r.indicatorId}
                      style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc' }}
                    >
                      <td
                        onClick={() => onNavigateToOutreach(r.indicatorId)}
                        style={{
                          position: 'sticky',
                          left: 0,
                          backgroundColor: isEven ? '#ffffff' : '#f8fafc',
                          zIndex: 5,
                          cursor: 'pointer',
                          boxShadow: '2px 0 5px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#0284c7',
                              backgroundColor: '#e0f2fe',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                            }}
                          >
                            {r.code}
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.shortName}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                          อัตราจ่าย ฿{r.unitPrice}/คน • {r.targetGroupDesc}
                        </div>
                      </td>

                      {/* Target */}
                      <td style={{ textAlign: 'right', color: '#64748b', fontWeight: 500 }}>
                        {prefix}
                        {tgtVal.toLocaleString()}
                      </td>

                      {/* FY 2567 */}
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                        {prefix}
                        {val67.toLocaleString()}
                      </td>

                      {/* FY 2568 */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: '#1d4ed8',
                          backgroundColor: '#eff6ff',
                        }}
                      >
                        {prefix}
                        {val68.toLocaleString()}
                      </td>

                      {/* Change 67 -> 68 */}
                      <td style={{ textAlign: 'center' }}>
                        {renderDiffBadge(r.changes.diff68_67, r.changes.pct68_67, r.unitPrice)}
                      </td>

                      {/* FY 2569 */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: '#047857',
                          backgroundColor: '#f0fdf4',
                        }}
                      >
                        {prefix}
                        {val69.toLocaleString()}
                      </td>

                      {/* Change 68 -> 69 */}
                      <td style={{ textAlign: 'center' }}>
                        {renderDiffBadge(r.changes.diff69_68, r.changes.pct69_68, r.unitPrice)}
                      </td>

                      {/* FY 2570 */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: '#6d28d9',
                          backgroundColor: '#faf5ff',
                        }}
                      >
                        {prefix}
                        {val70.toLocaleString()}
                      </td>

                      {/* Change 69 -> 70 */}
                      <td style={{ textAlign: 'center' }}>
                        {renderDiffBadge(r.changes.diff70_69, r.changes.pct70_69, r.unitPrice)}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Summary Row */}
                <tr
                  style={{
                    backgroundColor: '#f1f5f9',
                    fontWeight: 800,
                    borderTop: '2px solid #cbd5e1',
                  }}
                >
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 5,
                      color: '#0f172a',
                    }}
                  >
                    🌟 รวมทุกบริการ PPFS (30 รายการ)
                  </td>
                  <td style={{ textAlign: 'right', color: '#334155' }}>
                    {viewMode === 'count' ? data.totals.targetCount.toLocaleString() : '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: '#334155' }}>
                    {viewMode === 'revenue'
                      ? `฿${data.totals.rev2567.toLocaleString()}`
                      : data.totals.fy2567.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', color: '#1d4ed8', backgroundColor: '#dbeafe' }}>
                    {viewMode === 'revenue'
                      ? `฿${data.totals.rev2568.toLocaleString()}`
                      : data.totals.fy2568.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {viewMode === 'revenue'
                      ? renderDiffBadge(
                          data.totals.rev2568 - data.totals.rev2567,
                          data.totals.rev2567 > 0
                            ? Number(
                                (
                                  ((data.totals.rev2568 - data.totals.rev2567) /
                                    data.totals.rev2567) *
                                  100
                                ).toFixed(1)
                              )
                            : 0,
                          1
                        )
                      : renderDiffBadge(data.totals.diff68_67, data.totals.pct68_67, 1)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#047857', backgroundColor: '#dcfce7' }}>
                    {viewMode === 'revenue'
                      ? `฿${data.totals.rev2569.toLocaleString()}`
                      : data.totals.fy2569.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {viewMode === 'revenue'
                      ? renderDiffBadge(
                          data.totals.rev2569 - data.totals.rev2568,
                          data.totals.rev2568 > 0
                            ? Number(
                                (
                                  ((data.totals.rev2569 - data.totals.rev2568) /
                                    data.totals.rev2568) *
                                  100
                                ).toFixed(1)
                              )
                            : 0,
                          1
                        )
                      : renderDiffBadge(data.totals.diff69_68, data.totals.pct69_68, 1)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#6d28d9', backgroundColor: '#f3e8ff' }}>
                    {viewMode === 'revenue'
                      ? `฿${data.totals.rev2570.toLocaleString()}`
                      : data.totals.fy2570.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {viewMode === 'revenue'
                      ? renderDiffBadge(
                          data.totals.rev2570 - data.totals.rev2569,
                          data.totals.rev2569 > 0
                            ? Number(
                                (
                                  ((data.totals.rev2570 - data.totals.rev2569) /
                                    data.totals.rev2569) *
                                  100
                                ).toFixed(1)
                              )
                            : 0,
                          1
                        )
                      : renderDiffBadge(data.totals.diff70_69, data.totals.pct70_69, 1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
