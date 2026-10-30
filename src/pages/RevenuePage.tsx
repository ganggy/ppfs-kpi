import React from 'react';
import { OverviewData } from '../types/ppfs';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  AlertCircle, 
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface RevenuePageProps {
  data: OverviewData | null;
  onSelectIndicator: (indicatorId: string) => void;
  onNavigateToOutreach: (indicatorId: string) => void;
}

export const RevenuePage: React.FC<RevenuePageProps> = ({
  data,
  onSelectIndicator,
  onNavigateToOutreach,
}) => {
  if (!data) return null;

  const { totals, indicators, centerRankings } = data;

  // Sort indicators by potential revenue gap (highest opportunity first)
  const sortedByOpportunity = [...indicators].sort((a, b) => b.revenueGap - a.revenueGap);

  return (
    <div className="fade-in">
      {/* Financial Overview Header */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
            ประมาณการรายรับเต็มศักยภาพ
          </p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            ฿{totals.targetRevenue.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            คำนวณจากประชากรเป้าหมาย 100%
          </p>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
            รายรับที่สร้างได้จริงแล้ว
          </p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: '0.25rem' }}>
            ฿{totals.actualRevenue.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            คิดเป็น {((totals.actualRevenue / totals.targetRevenue) * 100 || 0).toFixed(1)}% ของเป้าหมาย
          </p>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
            รายรับตกหล่นที่เร่งเก็บได้ (Revenue Gap)
          </p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>
            ฿{totals.revenueGap.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            โอกาสสร้างรายได้เพิ่มให้ CUP
          </p>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
            อัตราผลตอบแทนเฉลี่ยต่อหัว
          </p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7c3aed', marginTop: '0.25rem' }}>
            ฿{Math.round(totals.targetRevenue / (totals.targetCount || 1))}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            เฉลี่ยต่อผู้รับบริการ 1 คน
          </p>
        </div>
      </div>

      {/* Strategic Revenue Opportunity Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              💎 วิเคราะห์โอกาสสร้างรายรับเรียงตามความคุ้มค่า (Revenue Opportunity Ranking)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              เรียงลำดับตัวชี้วัดที่มีรายรับค้างจัดเก็บสูงสุด เพื่อให้ทีมวางแผนกระจายทรัพยากรได้อย่างคุ้มค่าที่สุด
            </p>
          </div>
          <Sparkles size={22} color="#f59e0b" />
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>ลำดับ</th>
                <th>ตัวชี้วัด PPFS</th>
                <th style={{ textAlign: 'center' }}>อัตราจ่าย (บาท/คน)</th>
                <th style={{ textAlign: 'right' }}>เป้าหมาย (คน)</th>
                <th style={{ textAlign: 'right' }}>ผลงาน (คน)</th>
                <th style={{ textAlign: 'right' }}>รายรับที่ได้แล้ว</th>
                <th style={{ textAlign: 'right' }}>รายรับที่ยังจัดเก็บได้ (Gap)</th>
                <th style={{ textAlign: 'center' }}>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedByOpportunity.map((item, idx) => {
                const ind = item.indicator;
                return (
                  <tr key={ind.id}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        [{ind.code}] {ind.shortName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        กลุ่มเป้าหมาย: {ind.targetGroupDesc}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                      ฿{ind.unitPrice}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {item.targetCount.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                      {item.servedCount.toLocaleString()} ({item.coveragePercent}%)
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                      ฿{item.actualRevenue.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626', fontSize: '0.95rem' }}>
                      ฿{item.revenueGap.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onNavigateToOutreach(ind.id)}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        ดึง Call List
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leadership Action Insights */}
      <div style={{ 
        backgroundColor: '#f0fdf4', 
        borderRadius: '12px', 
        border: '1px solid #bbf7d0', 
        padding: '1.25rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start'
      }}>
        <div style={{ backgroundColor: '#dcfce7', padding: '0.6rem', borderRadius: '10px' }}>
          <CheckCircle2 size={24} color="#16a34a" />
        </div>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', marginBottom: '0.4rem' }}>
            กลยุทธ์เพิ่มรายรับ PPFS เข้าโรงพยาบาลและเครือข่าย CUP โคกศรีสุพรรณ
          </h4>
          <ul style={{ fontSize: '0.85rem', color: '#15803d', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
            <li>
              <strong>HPV DNA Test (฿400/ราย):</strong> เป็นตัวชี้วัดที่มีมูลค่าชดเชยสูงที่สุด ควรประสาน รพ.สต. และ อสม. จัดตรวจคัดกรองเชิงรุกตามหมู่บ้านในรอบ 5 ปี
            </li>
            <li>
              <strong>FIT Test (฿100/ราย):</strong> แจกชุดตรวจอุจจาระให้กลุ่มอายุ 50-70 ปีพร้อมบันทึกส่งตรวจแล็บ จะช่วยสร้างรายรับได้อย่างต่อเนื่อง
            </li>
            <li>
              <strong>คัดกรองเบาหวาน & ความดัน (฿50-100/ราย):</strong> ทำร่วมกับกิจกรรมสำรวจสุขภาพประจำปีของ รพ.สต. เพื่อเก็บข้อมูลประชากร 35+ ทุกหลังคาเรือน
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
