import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PPFSIndicator, PatientRecord } from '../types/ppfs';
import { 
  Users, 
  Search, 
  Download, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';

interface OutreachPageProps {
  indicatorId: string;
  onChangeIndicator: (id: string) => void;
  selectedCenter: string;
  startDate: string;
  endDate: string;
}

export const OutreachPage: React.FC<OutreachPageProps> = ({
  indicatorId,
  onChangeIndicator,
  selectedCenter,
  startDate,
  endDate,
}) => {
  const [indicators, setIndicators] = useState<PPFSIndicator[]>([]);
  const [status, setStatus] = useState<'unserved' | 'served' | 'all'>('unserved');
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Load indicators catalog
  useEffect(() => {
    api.getIndicators().then(setIndicators).catch(console.error);
  }, []);

  // Fetch patients for a specific page
  const fetchList = (targetPage: number = page) => {
    if (!indicatorId) return;
    setLoading(true);
    api.getPatients({
      indicatorId,
      status,
      centerId: selectedCenter,
      search,
      startDate,
      endDate,
      limit: pageSize,
      offset: (targetPage - 1) * pageSize,
    })
      .then((res) => {
        setPatients(res.list);
        setTotalCount(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    fetchList(1);
  }, [indicatorId, status, selectedCenter, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchList(newPage);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchList(1);
  };

  const handleExportExcel = () => {
    const url = api.getExportExcelUrl(indicatorId, status, selectedCenter);
    window.open(url, '_blank');
  };

  const currentInd = indicators.find((i) => i.id === indicatorId);

  return (
    <div className="fade-in">
      {/* Header controls card */}
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
              <Users size={22} color="#0284c7" />
              บัญชีรายชื่อคนไข้กลุ่มเป้าหมาย (Outreach & Call List)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
              ตัวชี้วัด: <strong>[{currentInd?.code}] {currentInd?.title}</strong> • เกณฑ์: {currentInd?.targetGroupDesc}
            </p>
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="btn btn-success"
            style={{ fontSize: '0.875rem', padding: '0.6rem 1.2rem', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)' }}
          >
            <Download size={16} />
            ดาวน์โหลด Excel (.xlsx) เพื่อลงพื้นที่
          </button>
        </div>

        {/* Filters and search row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          
          {/* Indicator Select */}
          <div style={{ minWidth: '260px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              เลือกตัวชี้วัด PPFS:
            </label>
            <select
              value={indicatorId}
              onChange={(e) => onChangeIndicator(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {indicators.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  [{ind.code}] {ind.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs: Unserved vs Served vs All */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              สถานะการบริการ:
            </label>
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setStatus('unserved')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: status === 'unserved' ? '#ef4444' : 'transparent',
                  color: status === 'unserved' ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                ยังไม่ได้รับบริการ (เป้าหมายติดตาม)
              </button>
              <button
                onClick={() => setStatus('served')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: status === 'served' ? '#10b981' : 'transparent',
                  color: status === 'served' ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                รับบริการแล้ว
              </button>
              <button
                onClick={() => setStatus('all')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: status === 'all' ? '#0284c7' : 'transparent',
                  color: status === 'all' ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                ทั้งหมด
              </button>
            </div>
          </div>

          {/* Search box */}
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              ค้นหาด้วยชื่อ / HN / เลขบัตร:
            </label>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                placeholder="พิมพ์ชื่อ, นามสกุล หรือ HN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                }}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
                <Search size={15} />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Patient List Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              รายชื่อคนไข้ในระบบ ({totalCount.toLocaleString()} รายการ)
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              แสดงหน้า {page} (แสดง {patients.length} รายการต่อหน้า)
            </p>
          </div>

          {/* Pagination Controls */}
          {totalCount > pageSize && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                ก่อนหน้า
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                หน้า {page} / {Math.ceil(totalCount / pageSize)}
              </span>
              <button
                disabled={page >= Math.ceil(totalCount / pageSize)}
                onClick={() => handlePageChange(page + 1)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            กำลังค้นหาและดึงรายชื่อคนไข้...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            ไม่พบรายชื่อคนไข้ตามเงื่อนไขที่เลือก
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>ลำดับ</th>
                  <th>HN</th>
                  <th>เลขบัตร ปชช.</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th style={{ textAlign: 'center' }}>อายุ / เพศ</th>
                  <th>หมู่ที่</th>
                  <th>ตำบล</th>
                  <th style={{ textAlign: 'center' }}>Type Area</th>
                  <th>เบอร์โทรศัพท์</th>
                  <th style={{ textAlign: 'center' }}>สถานะ</th>
                  <th>วันที่รับบริการ</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((pt, idx) => (
                  <tr key={pt.hn}>
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0284c7' }}>{pt.hn}</td>
                    <td style={{ fontFamily: 'monospace', color: '#475569' }}>{pt.maskedCid}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{pt.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      {pt.age} ปี ({pt.gender})
                    </td>
                    <td style={{ color: '#475569' }}>{pt.moo}</td>
                    <td style={{ color: '#475569' }}>{pt.subdistrict}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.725rem', 
                        fontWeight: 600, 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px',
                        backgroundColor: pt.typeArea === '1' ? '#ecfdf5' : pt.typeArea === '3' ? '#eff6ff' : '#f1f5f9',
                        color: pt.typeArea === '1' ? '#047857' : pt.typeArea === '3' ? '#1d4ed8' : '#64748b',
                        border: '1px solid ' + (pt.typeArea === '1' ? '#a7f3d0' : pt.typeArea === '3' ? '#bfdbfe' : '#e2e8f0'),
                      }}>
                        {pt.typeArea === '1' ? 'Type 1 (ในเขต)' : pt.typeArea === '3' ? 'Type 3 (อาศัย)' : `Type ${pt.typeArea || '-'}`}
                      </span>
                    </td>
                    <td>
                      {pt.tel !== '-' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0284c7', fontWeight: 500 }}>
                          <Phone size={13} /> {pt.tel}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${pt.status === 'SERVED' ? 'badge-achieved' : 'badge-behind'}`}>
                        {pt.status === 'SERVED' ? 'รับบริการแล้ว' : 'ยังไม่ได้รับ'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {pt.serviceDate || '-'}
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
