import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditReport, AuditIssue } from '../types/ppfs';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ShieldCheck, 
  FileText,
  AlertOctagon
} from 'lucide-react';

interface DataAuditPageProps {
  selectedCenter: string;
  startDate: string;
  endDate: string;
}

export const DataAuditPage: React.FC<DataAuditPageProps> = ({
  selectedCenter,
  startDate,
  endDate,
}) => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAudit = () => {
    setLoading(true);
    api.getAuditReport({ selectedCenter, startDate, endDate } as any)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAudit();
  }, [selectedCenter, startDate, endDate]);

  return (
    <div className="fade-in">
      {/* Header and Risk Cards */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={22} color="#ef4444" />
              ระบบตรวจสอบความถูกต้องของข้อมูลก่อนส่งเบิก (PPFS Pre-Audit Engine)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
              ตรวจจับรายการบริการที่อาจถูก สปสช. ปฏิเสธการจ่าย (Denial Risk) เช่น อายุผิดเกณฑ์, เพศไม่ตรง, หรือบันทึกบริการซ้ำซ้อน
            </p>
          </div>

          <button
            onClick={fetchAudit}
            disabled={loading}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            {loading ? 'กำลังสแกน...' : 'สแกนตรวจสอบใหม่'}
          </button>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                รายการที่พบข้อผิดพลาด / ผิดเงื่อนไข
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>
                {report?.totalIssues.toLocaleString() || 0} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>รายการ</span>
              </h3>
            </div>
            <div style={{ backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '10px' }}>
              <AlertTriangle size={22} color="#ef4444" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            ควรแก้ไขรหัสวินิจฉัยหรือข้อมูลก่อนส่ง e-Claim
          </p>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                ความเสี่ยงเงินชดเชยที่อาจถูกตัดจ่าย (Loss Risk)
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>
                ฿{report?.estimatedLossRisk.toLocaleString() || 0}
              </h3>
            </div>
            <div style={{ backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '10px' }}>
              <AlertOctagon size={22} color="#f59e0b" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            มูลค่าความเสียหายที่ป้องกันได้หากแก้ไขล่วงหน้า
          </p>
        </div>
      </div>

      {/* Issues Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          รายการที่ต้องตรวจสอบและแก้ไข (Audit Issues)
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
          แสดงรายชื่อผู้รับบริการที่พบความผิดปกติพร้อมคำแนะนำการแก้ไข
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            กำลังประมวลผลข้อผิดพลาด...
          </div>
        ) : !report || report.issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#10b981' }}>
            <CheckCircle size={40} style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>ยอดเยี่ยม! ไม่พบข้อผิดพลาดตามเงื่อนไข สปสช. ในช่วงเวลานี้</div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>ข้อมูลทั้งหมดผ่านเกณฑ์ความถูกต้องพร้อมส่งเบิก</p>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>ลำดับ</th>
                  <th>HN</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th style={{ textAlign: 'center' }}>อายุ / เพศ</th>
                  <th>วันที่รับบริการ</th>
                  <th>รหัสโรคที่ลง</th>
                  <th>ข้อผิดพลาดที่พบ</th>
                  <th style={{ textAlign: 'right' }}>มูลค่าเสี่ยงตัด</th>
                  <th>คำแนะนำการแก้ไข</th>
                </tr>
              </thead>
              <tbody>
                {report.issues.map((iss) => (
                  <tr key={iss.id}>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>{iss.id}</td>
                    <td style={{ fontWeight: 600, color: '#0284c7' }}>{iss.hn}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{iss.name}</td>
                    <td style={{ textAlign: 'center' }}>{iss.age} ปี ({iss.gender})</td>
                    <td style={{ color: '#475569' }}>{iss.vstdate}</td>
                    <td>
                      <span className="badge badge-purple">{iss.icd10}</span>
                    </td>
                    <td>
                      <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertTriangle size={14} /> {iss.issue}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                      ฿{iss.potentialLoss}
                    </td>
                    <td style={{ color: '#047857', fontSize: '0.8rem' }}>
                      {iss.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
