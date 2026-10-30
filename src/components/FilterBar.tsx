import React from 'react';
import { Filter, Building2, Calendar, RefreshCw } from 'lucide-react';

interface FilterBarProps {
  selectedCenter: string;
  onChangeCenter: (centerId: string) => void;
  startDate: string;
  endDate: string;
  onChangeDates: (start: string, end: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const NETWORK_CENTERS = [
  { id: 'ALL', name: '🏥 ทั้งหมดใน CUP โคกศรีสุพรรณ (4 ตำบล 6 หน่วยบริการ)' },
  { id: '11101', name: 'PCU โรงพยาบาลโคกศรีสุพรรณ (ต.ตองโขบ: ม.1,2,4,5,7-10,13-16)' },
  { id: '05569', name: 'รพ.สต.ห้วยหีบ (ต.ตองโขบ: ม.3,6,11,12,17,18)' },
  { id: '05570', name: 'รพ.สต.โพนค้อ (ต.เหล่าโพนค้อ ทั้งตำบล)' },
  { id: '05571', name: 'รพ.สต.ม่วงไข่ (ต.ด่านม่วงคำ ทั้งตำบล)' },
  { id: '05572', name: 'รพ.สต.โคกนาดี (ต.แมดนาท่ม: ม.2,3,6,7,8,13)' },
  { id: '05573', name: 'รพ.สต.โพนทอง (ต.แมดนาท่ม: ม.1,5,9,10,11,12)' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCenter,
  onChangeCenter,
  startDate,
  endDate,
  onChangeDates,
  onRefresh,
  loading = false,
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '0.85rem 1.25rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Center Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 320px' }}>
        <Building2 size={18} color="#0284c7" />
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
          หน่วยบริการ / รพ.สต.:
        </span>
        <select
          value={selectedCenter}
          onChange={(e) => onChangeCenter(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            fontSize: '0.875rem',
            color: '#0f172a',
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {NETWORK_CENTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <Calendar size={18} color="#0284c7" />
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
          ช่วงเวลา:
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChangeDates(e.target.value, endDate)}
          style={{
            padding: '0.45rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            backgroundColor: '#f8fafc',
          }}
        />
        <span style={{ color: '#94a3b8' }}>ถึง</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChangeDates(startDate, e.target.value)}
          style={{
            padding: '0.45rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            backgroundColor: '#f8fafc',
          }}
        />

        {/* Quick FY buttons */}
        <button
          onClick={() => onChangeDates('2024-10-01', '2025-09-30')}
          style={{
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f1f5f9',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#475569'
          }}
        >
          ปีงบ 2568
        </button>
        <button
          onClick={() => onChangeDates('2023-10-01', '2024-09-30')}
          style={{
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f1f5f9',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#475569'
          }}
        >
          ปีงบ 2567
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          {loading ? 'กำลังดึงข้อมูล...' : 'รีเฟรช'}
        </button>
      </div>
    </div>
  );
};
