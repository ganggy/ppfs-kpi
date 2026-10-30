import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MonthlyMatrixData } from '../types/ppfs';
import { 
  CalendarDays, 
  Download, 
  Building2, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface MonthlyMatrixPageProps {
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

export const MonthlyMatrixPage: React.FC<MonthlyMatrixPageProps> = ({ onNavigateToOutreach }) => {
  const [selectedCenter, setSelectedCenter] = useState<string>('ALL');
  const [fiscalYear, setFiscalYear] = useState<number>(2568);
  const [matrixData, setMatrixData] = useState<MonthlyMatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMatrix = () => {
    setLoading(true);
    api.getMonthlyMatrix({ fiscalYear, centerId: selectedCenter })
      .then(setMatrixData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMatrix();
  }, [fiscalYear, selectedCenter]);

  const handleExportExcel = () => {
    const url = api.getExportMonthlyMatrixUrl(fiscalYear, selectedCenter);
    window.open(url, '_blank');
  };

  return (
    <div className="fade-in">
      {/* Control bar */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={22} color="#0284c7" />
              ตารางแทร็กกิ้งผลงาน PPFS รายเดือน (12 เดือน ปีงบประมาณ)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
              ติดตามความก้าวหน้ารายกิจกรรมเปรียบเทียบแต่ละเดือน (ตุลาคม - กันยายน) แยกตามหน่วยบริการ / รพ.สต.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="btn btn-success"
            style={{ fontSize: '0.875rem', padding: '0.6rem 1.2rem', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)' }}
          >
            <Download size={16} />
            ดาวน์โหลดตาราง Matrix Excel (.xlsx)
          </button>
        </div>

        {/* Filter selects */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          
          {/* Health Facility Select */}
          <div style={{ flex: '1 1 360px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              สถานบริการ / รพ.สต.:
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
                  outline: 'none',
                  cursor: 'pointer'
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

          {/* Fiscal Year Select */}
          <div style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              ปีงบประมาณ:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#0284c7" />
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={2569}>ปีงบประมาณ 2569</option>
                <option value={2568}>ปีงบประมาณ 2568</option>
                <option value={2567}>ปีงบประมาณ 2567</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Main Matrix Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              📊 ผลงานรายกิจกรรม PPFS ประจำปีงบประมาณ {fiscalYear}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              พื้นที่: <strong>{matrixData?.selectedCenterName}</strong> (คลิกที่ชื่อกิจกรรมเพื่อเปิดบัญชีรายชื่อคนไข้ติดตาม)
            </p>
          </div>

          {matrixData && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="badge badge-achieved" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                ผลงานรวมสะสม: {matrixData.monthTotals.totalServed.toLocaleString()} คน-ครั้ง
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                ประมาณการรายรับรวม: ฿{matrixData.monthTotals.totalRevenue.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>กำลังประมวลผลตารางรายเดือนจากฐานข้อมูล HOSxP...</div>
            <p style={{ fontSize: '0.85rem' }}>ประมวลผล 12 เดือน ครบทั้ง 30 กิจกรรม PPFS</p>
          </div>
        ) : !matrixData ? null : (
          <div className="custom-table-container">
            <table className="custom-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                  <th style={{ backgroundColor: '#0f172a', color: 'white', position: 'sticky', left: 0, zIndex: 10, minWidth: '220px' }}>
                    รายการกิจกรรม/เดือน
                  </th>
                  <th style={{ backgroundColor: '#1e293b', color: '#38bdf8', textAlign: 'center' }}>ต.ค.</th>
                  <th style={{ backgroundColor: '#1e293b', color: '#38bdf8', textAlign: 'center' }}>พ.ย.</th>
                  <th style={{ backgroundColor: '#1e293b', color: '#38bdf8', textAlign: 'center' }}>ธ.ค.</th>
                  <th style={{ backgroundColor: '#0f172a', color: '#93c5fd', textAlign: 'center' }}>ม.ค.</th>
                  <th style={{ backgroundColor: '#0f172a', color: '#93c5fd', textAlign: 'center' }}>ก.พ.</th>
                  <th style={{ backgroundColor: '#0f172a', color: '#93c5fd', textAlign: 'center' }}>มี.ค.</th>
                  <th style={{ backgroundColor: '#1e293b', color: '#cbd5e1', textAlign: 'center' }}>เม.ย.</th>
                  <th style={{ backgroundColor: '#1e293b', color: '#cbd5e1', textAlign: 'center' }}>พ.ค.</th>
                  <th style={{ backgroundColor: '#1e293b', color: '#cbd5e1', textAlign: 'center' }}>มิ.ย.</th>
                  <th style={{ backgroundColor: '#0f172a', color: '#cbd5e1', textAlign: 'center' }}>ก.ค.</th>
                  <th style={{ backgroundColor: '#0f172a', color: '#cbd5e1', textAlign: 'center' }}>ส.ค.</th>
                  <th style={{ backgroundColor: '#0f172a', color: '#cbd5e1', textAlign: 'center' }}>ก.ย.</th>
                  <th style={{ backgroundColor: '#064e3b', color: '#a7f3d0', textAlign: 'right' }}>รวมสะสม</th>
                  <th style={{ backgroundColor: '#0f172a', color: '#cbd5e1', textAlign: 'right' }}>เป้าหมาย</th>
                  <th style={{ backgroundColor: '#0f172a', color: '#cbd5e1', textAlign: 'center' }}>% บรรลุ</th>
                  <th style={{ backgroundColor: '#4c1d95', color: '#ddd6fe', textAlign: 'right' }}>รายรับ (฿)</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.rows.map((r, idx) => {
                  const isEven = idx % 2 === 0;
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
                          boxShadow: '2px 0 5px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            {r.code}
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {r.shortName}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                          ฿{r.unitPrice}/คน • {r.targetGroupDesc}
                        </div>
                      </td>

                      {/* 12 Months Cells */}
                      <td style={{ textAlign: 'center', fontWeight: r.months.m10 > 0 ? 600 : 400, color: r.months.m10 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m10 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m11 > 0 ? 600 : 400, color: r.months.m11 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m11 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m12 > 0 ? 600 : 400, color: r.months.m12 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m12 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m01 > 0 ? 600 : 400, color: r.months.m01 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m01 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m02 > 0 ? 600 : 400, color: r.months.m02 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m02 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m03 > 0 ? 600 : 400, color: r.months.m03 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m03 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m04 > 0 ? 600 : 400, color: r.months.m04 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m04 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m05 > 0 ? 600 : 400, color: r.months.m05 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m05 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m06 > 0 ? 600 : 400, color: r.months.m06 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m06 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m07 > 0 ? 600 : 400, color: r.months.m07 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m07 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m08 > 0 ? 600 : 400, color: r.months.m08 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m08 || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: r.months.m09 > 0 ? 600 : 400, color: r.months.m09 > 0 ? '#059669' : '#cbd5e1' }}>
                        {r.months.m09 || '-'}
                      </td>

                      {/* Cumulative Total */}
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', backgroundColor: '#f0fdf4' }}>
                        {r.totalServed.toLocaleString()}
                      </td>

                      {/* Target */}
                      <td style={{ textAlign: 'right', fontWeight: 500, color: '#475569' }}>
                        {r.targetCount.toLocaleString()}
                      </td>

                      {/* % Coverage */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${r.coveragePercent >= 50 ? 'badge-achieved' : r.coveragePercent >= 20 ? 'badge-on-track' : 'badge-behind'}`}>
                          {r.coveragePercent}%
                        </span>
                      </td>

                      {/* Actual Revenue */}
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed', backgroundColor: '#faf5ff' }}>
                        ฿{r.actualRevenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {/* Summary Row */}
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                  <td style={{ position: 'sticky', left: 0, backgroundColor: '#f1f5f9', zIndex: 5, color: '#0f172a' }}>
                    🌟 รวมทุกกิจกรรม PPFS
                  </td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m10 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m11 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m12 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m01 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m02 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m03 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m04 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m05 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m06 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m07 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m08 || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>{matrixData.monthTotals.m09 || '-'}</td>
                  <td style={{ textAlign: 'right', color: '#059669', fontSize: '0.9rem', backgroundColor: '#dcfce7' }}>
                    {matrixData.monthTotals.totalServed.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', color: '#334155' }}>
                    {matrixData.monthTotals.totalTarget.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-achieved">
                      {((matrixData.monthTotals.totalServed / matrixData.monthTotals.totalTarget) * 100 || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#7c3aed', fontSize: '0.9rem', backgroundColor: '#f3e8ff' }}>
                    ฿{matrixData.monthTotals.totalRevenue.toLocaleString()}
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
