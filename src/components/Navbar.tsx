import React from 'react';
import { 
  BarChart3, 
  Target, 
  Users, 
  DollarSign, 
  ShieldAlert, 
  Network, 
  Activity,
  Layers,
  CalendarDays
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onlineCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onlineCount = 10 }) => {
  const navItems = [
    { id: 'overview', label: 'ภาพรวมและเป้าหมาย', icon: BarChart3 },
    { id: 'matrix', label: 'ตารางแทร็กกิ้ง 12 เดือน', icon: CalendarDays },
    { id: 'indicator', label: 'เจาะลึกตัวชี้วัด', icon: Target },
    { id: 'catalog30', label: 'สิทธิประโยชน์ 30 รายการ (2569-2570)', icon: Layers },
    { id: 'outreach', label: 'บัญชีรายชื่อคนไข้ (Call List)', icon: Users },
    { id: 'revenue', label: 'ประมาณการรายรับ สปสช.', icon: DollarSign },
    { id: 'audit', label: 'ตรวจข้อมูลก่อนส่งเบิก', icon: ShieldAlert },
    { id: 'network', label: 'เครือข่าย รพ.สต.', icon: Network },
  ];

  return (
    <header style={{ backgroundColor: '#0f172a', color: 'white', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      {/* Top Banner */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '0.65rem 1.5rem' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              backgroundColor: '#0284c7', 
              padding: '0.5rem', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)' 
            }}>
              <Activity size={22} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>PPFS KPI Platform</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>CUP 11101</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                ระบบติดตามตัวชี้วัดบริการส่งเสริมสุขภาพป้องกันโรค & เครือข่าย รพ.สต. โคกศรีสุพรรณ
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Live Status Badge */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              backgroundColor: '#1e293b', 
              padding: '0.35rem 0.75rem', 
              borderRadius: '9999px',
              fontSize: '0.8rem',
              border: '1px solid #334155'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
              <span style={{ color: '#cbd5e1' }}>HOSxP เชื่อมต่อแล้ว</span>
              <span style={{ color: '#64748b' }}>|</span>
              <span style={{ color: '#38bdf8' }}>เครือข่าย 6 แห่ง</span>
              <span style={{ color: '#64748b' }}>|</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>ประชากรในเขต (Type 1&3): 26,080 คน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ padding: '0 1.5rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                borderBottom: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
