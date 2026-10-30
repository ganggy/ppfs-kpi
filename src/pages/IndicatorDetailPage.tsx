import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PPFSIndicator } from '../types/ppfs';
import { 
  Target, 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin, 
  CheckCircle2, 
  FileSpreadsheet, 
  ChevronRight,
  Info
} from 'lucide-react';

interface IndicatorDetailPageProps {
  indicatorId: string;
  onChangeIndicator: (id: string) => void;
  selectedCenter: string;
  startDate: string;
  endDate: string;
  onNavigateToOutreach: (indicatorId: string) => void;
}

export const IndicatorDetailPage: React.FC<IndicatorDetailPageProps> = ({
  indicatorId,
  onChangeIndicator,
  selectedCenter,
  startDate,
  endDate,
  onNavigateToOutreach,
}) => {
  const [indicators, setIndicators] = useState<PPFSIndicator[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getIndicators().then(setIndicators).catch(console.error);
  }, []);

  useEffect(() => {
    if (!indicatorId) return;
    setLoading(true);
    api.getIndicatorDetail(indicatorId, { startDate, endDate, centerId: selectedCenter })
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [indicatorId, selectedCenter, startDate, endDate]);

  const currentInd = indicators.find((i) => i.id === indicatorId) || detail?.indicator;

  return (
    <div className="fade-in">
      {/* Top Selector Bar */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 360px' }}>
          <Target size={20} color="#0284c7" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155', whiteSpace: 'nowrap' }}>
            เลือกตัวชี้วัด PPFS:
          </span>
          <select
            value={indicatorId}
            onChange={(e) => onChangeIndicator(e.target.value)}
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
            {indicators.map((ind) => (
              <option key={ind.id} value={ind.id}>
                [{ind.code}] {ind.shortName}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onNavigateToOutreach(indicatorId)}
          className="btn btn-primary"
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <FileSpreadsheet size={16} />
          เปิดบัญชีรายชื่อคนไข้ (Call List)
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
          กำลังประมวลผลข้อมูลตัวชี้วัด...
        </div>
      ) : detail ? (
        <div>
          {/* Indicator Info Header Card */}
          <div className="kpi-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span className="badge badge-blue">{currentInd?.code}</span>
                  <span className="badge badge-purple">{currentInd?.category}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    เกณฑ์ สปสช. ขั้นต่ำ {currentInd?.nhsoGoalPercent}%
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>
                  {currentInd?.title}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#475569', maxWidth: '800px', lineHeight: '1.5' }}>
                  {currentInd?.description}
                </p>
              </div>

              {/* Badges Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '220px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>เกณฑ์ประชากรเป้าหมาย</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    {currentInd?.targetGroupDesc}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>อัตราจ่ายชดเชย Fee Schedule</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669' }}>
                    ฿{currentInd?.unitPrice} บาท / ราย
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>กลุ่มเป้าหมาย (คน)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                {detail.targetCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                ประมาณการรายรับเต็มศักยภาพ ฿{detail.targetRevenue.toLocaleString()}
              </div>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ได้รับบริการแล้ว (คน)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#059669', marginTop: '0.2rem' }}>
                {detail.servedCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                คิดเป็นความครอบคลุม <strong>{detail.coveragePercent}%</strong>
              </div>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ยังไม่ได้รับบริการ (เป้าหมายตามงาน)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#d97706', marginTop: '0.2rem' }}>
                {detail.unservedCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                คนไข้ที่ต้องติดตามลงพื้นที่
              </div>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>รายรับตกหล่น (Revenue Gap)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#7c3aed', marginTop: '0.2rem' }}>
                ฿{detail.revenueGap.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                ได้รับแล้ว ฿{detail.actualRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Breakdown Section: Monthly Trend & Village Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
            
            {/* Monthly Trend Table & Bars */}
            <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                📅 ความคืบหน้ารายเดือน (Monthly Performance)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                จำนวนคนไข้ที่ได้รับบริการและรายรับตามรอบเดือน
              </p>

              {detail.monthlyTrend?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  ยังไม่มีการบันทึกบริการในช่วงเวลานี้
                </div>
              ) : (
                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>เดือน</th>
                        <th style={{ textAlign: 'right' }}>จำนวนผู้รับบริการ (คน)</th>
                        <th style={{ textAlign: 'right' }}>รายรับ (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.monthlyTrend.map((t: any) => (
                        <tr key={t.month}>
                          <td style={{ fontWeight: 600 }}>{t.month}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                            {t.served.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#7c3aed' }}>
                            ฿{t.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Village Breakdown */}
            <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  🏡 การกระจายตัวตามหมู่บ้าน (Village Breakdown)
                </h3>
                <MapPin size={18} color="#0284c7" />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                จำนวนกลุ่มเป้าหมายจริงในแต่ละหมู่บ้าน
              </p>

              <div className="custom-table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>หมู่ที่</th>
                      <th>ตำบล</th>
                      <th style={{ textAlign: 'right' }}>กลุ่มเป้าหมาย (คน)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.villageBreakdown.map((v: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{v.moo}</td>
                        <td style={{ color: '#475569' }}>{v.subdistrict}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#0284c7' }}>
                          {v.targetCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      ) : null}
    </div>
  );
};
