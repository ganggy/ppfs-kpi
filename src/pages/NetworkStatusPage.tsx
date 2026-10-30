import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PcuNode } from '../types/ppfs';
import { 
  Network, 
  Server, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Database, 
  Globe, 
  Layers,
  ShieldCheck
} from 'lucide-react';

export const NetworkStatusPage: React.FC = () => {
  const [nodes, setNodes] = useState<PcuNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    api.getNetworkStatus()
      .then(setNodes)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="fade-in">
      {/* Header */}
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
              <Network size={22} color="#0284c7" />
              สถานะการเชื่อมต่อฐานข้อมูลเครือข่าย รพ.สต. (Network Nodes Monitor)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
              มอนิเตอร์การเชื่อมโยงฐานข้อมูลภายนอก (GDCC Cloud / HOSxP_PCU) ทั้ง 6 แห่งในเครือข่าย CUP โคกศรีสุพรรณ
            </p>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสัญญาณทุกโหนด'}
          </button>
        </div>
      </div>

      {/* Node Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {nodes.map((node) => {
          const isOnline = node.status === 'ONLINE' || node.status === 'LOCAL_SYNC';
          const statusText = node.status === 'ONLINE' ? 'เชื่อมต่อตรง (ONLINE)' : node.status === 'LOCAL_SYNC' ? 'ซิงค์ข้อมูลผ่าน HOSxP ศูนย์แม่ข่าย' : 'ออฟไลน์ (OFFLINE)';
          const badgeClass = node.status === 'ONLINE' ? 'badge-achieved' : node.status === 'LOCAL_SYNC' ? 'badge-blue' : 'badge-behind';

          return (
            <div
              key={node.hospcode}
              className="kpi-card"
              style={{
                borderLeft: `4px solid ${node.status === 'ONLINE' ? '#10b981' : node.status === 'LOCAL_SYNC' ? '#0284c7' : '#ef4444'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-purple" style={{ marginBottom: '0.3rem' }}>
                      รหัส {node.hospcode}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      {node.name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{node.subdistrict}</p>
                  </div>

                  {node.status === 'ONLINE' ? (
                    <CheckCircle2 size={22} color="#10b981" />
                  ) : node.status === 'LOCAL_SYNC' ? (
                    <Database size={22} color="#0284c7" />
                  ) : (
                    <XCircle size={22} color="#ef4444" />
                  )}
                </div>

                {/* Connection details */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>ประเภทการเชื่อมต่อ:</span>
                    <strong style={{ color: '#0f172a' }}>{node.host ? 'GDCC Cloud MySQL' : 'HOSxP Unified Hub'}</strong>
                  </div>
                  {node.gdccId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>GDCC ID:</span>
                      <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{node.gdccId}</span>
                    </div>
                  )}
                  {node.moos && node.moos.length > 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>หมู่ที่รับผิดชอบ:</span>
                      <strong style={{ color: '#0369a1' }}>หมู่ {node.moos.join(', ')}</strong>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>เขตพื้นที่:</span>
                      <strong style={{ color: '#0369a1' }}>ทั้งตำบล{node.subdistrict.replace('ต.', '')}</strong>
                    </div>
                  )}
                  {node.host && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>เซิร์ฟเวอร์ IP:</span>
                      <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{node.host}:{node.port || 3306}</span>
                    </div>
                  )}
                  {node.database && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>ฐานข้อมูล:</span>
                      <span style={{ fontFamily: 'monospace', color: '#475569' }}>{node.database}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <span className={`badge ${badgeClass}`}>
                  {statusText}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {node.lastChecked ? new Date(node.lastChecked).toLocaleTimeString('th-TH') : 'เรียลไทม์'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Network Explanation for Administrators */}
      <div style={{
        marginTop: '1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        padding: '1.25rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start'
      }}>
        <div style={{ backgroundColor: '#e0f2fe', padding: '0.6rem', borderRadius: '10px' }}>
          <Server size={24} color="#0284c7" />
        </div>
        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>
            สถาปัตยกรรม Hybrid Data Architecture ของ CUP โคกศรีสุพรรณ
          </h4>
          <p>
            ระบบรองรับทั้งการเชื่อมต่อตรงไปยัง <strong>GDCC Cloud PCU Database</strong> ของแต่ละ รพ.สต. 
            และการดึงผลงานบูรณาการจาก <strong>ฐานข้อมูลแม่ข่าย HOSxP (Unified Hub)</strong> 
            ทำให้มั่นใจได้ว่าระบบสามารถคำนวณตัวชี้วัดและติดตามคนไข้ได้อย่างต่อเนื่อง 100% แม้ระบบเครือข่ายอินเทอร์เน็ตของบางหน่วยบริการจะขัดข้องชั่วคราว
          </p>
        </div>
      </div>
    </div>
  );
};
