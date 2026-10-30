import React, { useState } from 'react';
import { OverviewData, IndicatorSummary, CenterRanking } from '../types/ppfs';
import { 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Award
} from 'lucide-react';

interface OverviewPageProps {
  data: OverviewData | null;
  loading: boolean;
  onSelectIndicator: (indicatorId: string) => void;
  onSelectCenter: (centerId: string) => void;
  onNavigateToOutreach: (indicatorId: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  loading,
  onSelectIndicator,
  onSelectCenter,
  onNavigateToOutreach,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>กำลังประมวลผลข้อมูล PPFS 30 รายการ จาก HOSxP...</div>
        <p style={{ fontSize: '0.875rem' }}>คำนวณฐานประชากรเป้าหมายตามเงื่อนไขสิทธิประโยชน์ สปสช. (สัญชาติไทย, อายุ, เพศ, ตัดโรคเรื้อรังเดิม)</p>
      </div>
    );
  }

  if (!data) return null;

  const { totals, indicators, centerRankings } = data;

  const filteredIndicators = indicators.filter((item) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'CORE10') {
      const num = parseInt(item.indicator.code.replace('PP', ''), 10);
      return num >= 1 && num <= 10;
    }
    if (categoryFilter === 'NEW2569') return Boolean(item.indicator.isNew2569);
    return item.indicator.category === categoryFilter;
  });

  return (
    <div className="fade-in">
      {/* Executive Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1rem' }}>
        {/* Real Unique Target Population */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                {data.selectedCenter === 'ALL' ? 'ประชากรในเขตทั้งอำเภอ (คนจริง)' : 'ประชากรในเขตที่เลือก (คนจริง)'}
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                {totals.uniquePopulation?.toLocaleString() || totals.targetCount.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>คน</span>
              </h3>
            </div>
            <div style={{ backgroundColor: '#e0f2fe', padding: '0.5rem', borderRadius: '10px' }}>
              <Users size={22} color="#0284c7" />
            </div>
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
            {data.selectedCenter === 'ALL' ? (
              <span>ประชากรในเขตรับผิดชอบ 6 หน่วยบริการ</span>
            ) : (
              <span>จากประชากรทั้งอำเภอ <strong>{totals.totalDistrictPopulation?.toLocaleString()} คน</strong> ({((totals.uniquePopulation / (totals.totalDistrictPopulation || 1)) * 100).toFixed(1)}%)</span>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.35rem', fontWeight: 500, borderTop: '1px dashed #e2e8f0', paddingTop: '0.35rem' }}>
            เป้าหมายบริการ {totals.indicatorsCount || 30} PPFS รวม: <strong>{totals.targetCount.toLocaleString()}</strong> บริการ (คน-ครั้ง)
          </p>
        </div>

        {/* Real Unique Served Population */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                ผู้ได้รับบริการแล้ว (คนจริง)
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: '0.25rem' }}>
                {totals.uniqueServed?.toLocaleString() || totals.servedCount.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>คน</span>
              </h3>
            </div>
            <div style={{ backgroundColor: '#d1fae5', padding: '0.5rem', borderRadius: '10px' }}>
              <CheckCircle2 size={22} color="#10b981" />
            </div>
          </div>
          <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-achieved" style={{ fontSize: '0.8rem' }}>
              ครอบคลุม {totals.uniqueCoveragePercent || totals.coveragePercent}%
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ของประชากรในเขต</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.35rem', fontWeight: 500, borderTop: '1px dashed #e2e8f0', paddingTop: '0.35rem' }}>
            ให้บริการสะสมรวม <strong>{totals.totalServicesCount?.toLocaleString() || totals.servedCount.toLocaleString()}</strong> ครั้ง
          </p>
        </div>

        {/* Actual Claim Revenue */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                รายรับที่ได้รับแล้ว (สปสช.)
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7c3aed', marginTop: '0.25rem' }}>
                ฿{totals.actualRevenue.toLocaleString()}
              </h3>
            </div>
            <div style={{ backgroundColor: '#ede9fe', padding: '0.5rem', borderRadius: '10px' }}>
              <DollarSign size={22} color="#8b5cf6" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            คิดจากผลงานบริการ × อัตราจ่าย Fee Schedule
          </p>
        </div>

        {/* Revenue Gap (Opportunity) */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                โอกาสรายรับที่ยังจัดเก็บได้ (Gap)
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>
                ฿{totals.revenueGap.toLocaleString()}
              </h3>
            </div>
            <div style={{ backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '10px' }}>
              <TrendingUp size={22} color="#f59e0b" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            รายรับเป้าหมายทั้งหมด ฿{totals.targetRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Explanatory Banner to prevent confusion */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '10px',
        border: '1px solid #bae6fd',
        padding: '0.65rem 1rem',
        marginBottom: '1.5rem',
        fontSize: '0.8rem',
        color: '#0369a1',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem'
      }}>
        <span style={{ fontSize: '1rem' }}>💡</span>
        <div>
          <strong>เกณฑ์การคำนวณ สปสช. (ครบ {totals.indicatorsCount || 30} รายการ):</strong> กรองเฉพาะผู้มี<strong>สัญชาติไทย (99)</strong> ในเขตรับผิดชอบ <strong>Type Area 1 และ 3</strong> จำนวน <strong>{totals.uniquePopulation?.toLocaleString() || 0} คน</strong> (ตัดผู้เสียชีวิต, ตัดผู้ป่วยเบาหวาน/ความดันเดิมออกจากเป้าคัดกรอง DM/HT, เช็กระยะห่าง 2–5 ปีสำหรับ FIT/HPV และนับรวมแฟ้ม SPECIALPP & 7 กลุ่มโรคเรื้อรัง)
        </div>
      </div>

      {/* Main Grid: Indicators Grid (Left) + CUP League Table (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Indicators List Cards */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                🎯 รายการตัวชี้วัด PPFS สปสช. ({filteredIndicators.length} / {totals.indicatorsCount || 30} รายการ)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                เปรียบเทียบผลงานจริงกับเป้าหมายรายหัวตามเงื่อนไขการเบิกจ่าย สปสช.
              </p>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">แสดงทั้งหมด ({totals.indicatorsCount || 30} รายการ)</option>
              <option value="CORE10">เฉพาะ 10 ตัวชี้วัดหลัก (PP01-PP10)</option>
              <option value="NEW2569">รายการใหม่/ปรับปรุง ปี 69-70 (*)</option>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '880px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {filteredIndicators.map((item) => {
              const ind = item.indicator;
              const fillClass = item.status === 'ACHIEVED' ? 'fill-achieved' : item.status === 'ON_TRACK' ? 'fill-on-track' : 'fill-behind';
              const badgeClass = item.status === 'ACHIEVED' ? 'badge-achieved' : item.status === 'ON_TRACK' ? 'badge-on-track' : 'badge-behind';
              const statusText = item.status === 'ACHIEVED' ? 'บรรลุเป้าหมาย' : item.status === 'ON_TRACK' ? 'กำลังดำเนินการ' : 'ต่ำกว่าเป้าหมาย';

              return (
                <div
                  key={ind.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.9rem',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {ind.code}
                        </span>
                        <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#0f172a' }}>
                          {ind.shortName}
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        กลุ่มเป้าหมาย: {ind.targetGroupDesc} • อัตราจ่าย ฿{ind.unitPrice}/คน
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
                        {statusText}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        เกณฑ์ สปสช. {ind.nhsoGoalPercent}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ margin: '0.6rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        ผลงาน {item.servedCount.toLocaleString()} / เป้าหมาย {item.targetCount.toLocaleString()} คน
                      </span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {item.coveragePercent}%
                      </span>
                    </div>
                    <div className="progress-container">
                      <div
                        className={`progress-bar-fill ${fillClass}`}
                        style={{ width: `${Math.min(100, Math.max(1, item.coveragePercent))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer Stats & Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem' }}>
                    <div style={{ color: '#64748b' }}>
                      รายรับที่ได้: <strong style={{ color: '#059669' }}>฿{item.actualRevenue.toLocaleString()}</strong> 
                      {' '}(ขาดอีก ฿{item.revenueGap.toLocaleString()})
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => onNavigateToOutreach(ind.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        รายชื่อติดตาม
                      </button>
                      <button
                        onClick={() => onSelectIndicator(ind.id)}
                        className="btn btn-primary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        เจาะลึก <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CUP Network Facility Rankings */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                🏆 ตารางจัดอันดับเครือข่าย CUP (6 แห่ง)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                ความครอบคลุมผลงาน PPFS และรายรับเบิกชดเชยตามพื้นที่รับผิดชอบ
              </p>
            </div>
            <Award size={24} color="#f59e0b" />
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>อันดับ</th>
                  <th>หน่วยบริการ / รพ.สต.</th>
                  <th>ตำบล</th>
                  <th style={{ textAlign: 'right' }}>ประชากรในเขต (คน)</th>
                  <th style={{ textAlign: 'right' }}>ผลงาน</th>
                  <th style={{ textAlign: 'center' }}>ความครอบคลุม</th>
                  <th style={{ textAlign: 'right' }}>รายรับที่ได้</th>
                </tr>
              </thead>
              <tbody>
                {centerRankings.map((c, idx) => {
                  const medalColor = idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#e2e8f0';
                  return (
                    <tr 
                      key={c.hospcode}
                      onClick={() => onSelectCenter(c.hospcode)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: idx < 3 ? medalColor : '#f1f5f9',
                          color: idx < 3 ? '#ffffff' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>รหัส {c.hospcode}</div>
                      </td>
                      <td style={{ color: '#475569' }}>{c.subdistrict}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#0284c7' }}>{c.targetCount.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                        {c.servedCount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${c.coveragePercent >= 50 ? 'badge-achieved' : c.coveragePercent >= 25 ? 'badge-on-track' : 'badge-behind'}`}>
                          {c.coveragePercent}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#7c3aed' }}>
                        ฿{c.actualRevenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Summary Row for District */}
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#0f172a' }}>
                    🌟 รวมทั้งอำเภอ (6 หน่วยบริการ)
                  </td>
                  <td style={{ textAlign: 'right', color: '#0284c7', fontSize: '0.9rem' }}>
                    {totals.totalDistrictPopulation?.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', color: '#059669', fontSize: '0.9rem' }}>
                    {centerRankings.reduce((sum, c) => sum + c.servedCount, 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-achieved">
                      {(
                        (centerRankings.reduce((sum, c) => sum + c.servedCount, 0) /
                          (totals.totalDistrictPopulation || 1)) *
                        100
                      ).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#7c3aed', fontSize: '0.9rem' }}>
                    ฿{centerRankings.reduce((sum, c) => sum + c.actualRevenue, 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick guidance for leaders */}
          <div style={{ 
            marginTop: '1.25rem', 
            padding: '1rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '10px', 
            border: '1px dashed #cbd5e1',
            fontSize: '0.8rem',
            color: '#475569'
          }}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="#0284c7" />
              ข้อเสนอแนะเชิงบริหารสำหรับ ผอ. / ผู้ควบคุมงาน CUP
            </div>
            <p>
              • คลิกที่แถวของ รพ.สต. เพื่อกรองดูผลงานเฉพาะพื้นที่รับผิดชอบได้ทันที<br/>
              • กดปุ่ม <strong>"รายชื่อติดตาม"</strong> ในแต่ละตัวชี้วัดเพื่อดึงบัญชีคนไข้ที่ยังไม่ได้รับบริการ (Unserved Call List) ส่งให้ อสม. หรือทีมเคาะประตูบ้าน
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
