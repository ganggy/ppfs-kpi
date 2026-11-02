import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  ShieldAlert,
  Info,
  Check,
  Building2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api } from '../services/api';
import { IndicatorConfig } from '../types/ppfs';

interface SettingsPageProps {
  onSettingsSaved?: () => void;
}

const COMMON_DISABLED_REASONS = [
  'โรงพยาบาลมีศักยภาพไม่เพียงพอ',
  'ไม่มีเครื่องมือ / อุปกรณ์ตรวจเฉพาะทาง',
  'ไม่มีแพทย์เฉพาะทางในการวินิจฉัย',
  'เป็นบริการส่งต่อ รพ.ศูนย์/รพ.ทั่วไป (ไม่อยู่ใน CUP)',
  'ยกเลิกการเบิกแบบ Fee Schedule ในปีงบ 2570',
  'อื่นๆ (ระบุเอง)',
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsSaved }) => {
  const [settingsList, setSettingsList] = useState<IndicatorConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED' | 'PRICE_MODIFIED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modified state tracking
  const [modifiedMap, setModifiedMap] = useState<Record<string, { enabled?: boolean; disabledReason?: string; unitPrice?: number }>>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      setSettingsList(res.list || []);
      setModifiedMap({});
    } catch (err: any) {
      console.error(err);
      setErrorMsg('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleEnabled = (id: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setModifiedMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        enabled: newVal,
        disabledReason: newVal ? '' : prev[id]?.disabledReason || 'โรงพยาบาลมีศักยภาพไม่เพียงพอ',
      },
    }));

    setSettingsList((prev) =>
      prev.map((item) =>
        item.indicatorId === id
          ? {
              ...item,
              enabled: newVal,
              disabledReason: newVal ? '' : item.disabledReason || 'โรงพยาบาลมีศักยภาพไม่เพียงพอ',
            }
          : item
      )
    );
  };

  const handleReasonChange = (id: string, reason: string) => {
    setModifiedMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        disabledReason: reason,
      },
    }));

    setSettingsList((prev) =>
      prev.map((item) => (item.indicatorId === id ? { ...item, disabledReason: reason } : item))
    );
  };

  const handlePriceChange = (id: string, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;

    setModifiedMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        unitPrice: num,
      },
    }));

    setSettingsList((prev) =>
      prev.map((item) => (item.indicatorId === id ? { ...item, unitPrice: num } : item))
    );
  };

  const handleResetSinglePrice = (id: string, defaultPrice: number) => {
    setModifiedMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        unitPrice: defaultPrice,
      },
    }));

    setSettingsList((prev) =>
      prev.map((item) => (item.indicatorId === id ? { ...item, unitPrice: defaultPrice } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(null);
    setErrorMsg(null);
    try {
      // Build payload for all items in list
      const payload: Record<string, any> = {};
      settingsList.forEach((item) => {
        payload[item.indicatorId] = {
          enabled: item.enabled,
          disabledReason: item.disabledReason || '',
          unitPrice: item.unitPrice,
        };
      });

      await api.saveSettings(payload);
      setSaveSuccess('บันทึกการตั้งค่ากองทุนและอัตราการชดเชยเรียบร้อยแล้ว! ระบบคำนวณทั้งหมดจะใช้ข้อมูลใหม่ทันที');
      setModifiedMap({});
      if (onSettingsSaved) onSettingsSaved();
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึก: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('คุณต้องการรีเซ็ตอัตราการชดเชยและสถานะเปิด/ปิดทั้งหมด กลับเป็นค่าเริ่มต้นตามประกาศ สปสช. หรือไม่?')) {
      return;
    }
    setSaving(true);
    setSaveSuccess(null);
    setErrorMsg(null);
    try {
      const res = await api.resetSettings();
      setSettingsList(res.list || []);
      setModifiedMap({});
      setSaveSuccess('รีเซ็ตอัตราการชดเชยเป็นค่ามาตรฐาน สปสช. เรียบร้อยแล้ว');
      if (onSettingsSaved) onSettingsSaved();
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการรีเซ็ต: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Quick preset: Mark tertiary / high-tech services as disabled if community hospital has limited capacity
  const handlePresetTertiaryDisabled = () => {
    const tertiaryIds = ['brca_testing', 'nipt_screening', 'tms_newborn', 'mammogram_breast_cancer'];
    setSettingsList((prev) =>
      prev.map((item) => {
        if (tertiaryIds.includes(item.indicatorId)) {
          return {
            ...item,
            enabled: false,
            disabledReason: 'โรงพยาบาลมีศักยภาพไม่เพียงพอ (ส่งต่อตรวจ รพ.ศูนย์)',
          };
        }
        return item;
      })
    );
    setModifiedMap((prev) => {
      const copy = { ...prev };
      tertiaryIds.forEach((id) => {
        copy[id] = {
          enabled: false,
          disabledReason: 'โรงพยาบาลมีศักยภาพไม่เพียงพอ (ส่งต่อตรวจ รพ.ศูนย์)',
        };
      });
      return copy;
    });
  };

  // Filter items
  const categories = ['ALL', ...Array.from(new Set(settingsList.map((i) => i.category)))];

  const filteredList = settingsList.filter((item) => {
    const matchSearch =
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.shortName.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    let matchStatus = true;
    if (statusFilter === 'ENABLED') matchStatus = item.enabled;
    if (statusFilter === 'DISABLED') matchStatus = !item.enabled;
    if (statusFilter === 'PRICE_MODIFIED') matchStatus = item.unitPrice !== item.defaultUnitPrice;

    return matchSearch && matchCategory && matchStatus;
  });

  const enabledCount = settingsList.filter((i) => i.enabled).length;
  const disabledCount = settingsList.filter((i) => !i.enabled).length;
  const modifiedPriceCount = settingsList.filter((i) => i.unitPrice !== i.defaultUnitPrice).length;
  const hasUnsavedChanges = Object.keys(modifiedMap).length > 0;

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 15px rgba(15, 23, 42, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#334155', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <Sliders size={14} color="#38bdf8" /> การบริหารจัดการและตั้งค่าระบบ
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            ตั้งค่ากองทุน PPFS & แก้ไขอัตราการชดเชย
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.35rem', maxWidth: '750px', lineHeight: 1.5 }}>
            เปิด-ปิดการแสดงผลกองทุนกรณีที่ <strong>โรงพยาบาลมีศักยภาพไม่เพียงพอ</strong> หรือไม่ได้เปิดให้บริการ และ <strong>แก้ไขอัตราจ่ายชดเชย (Fee Schedule)</strong> ได้ทันทีเมื่อ สปสช. มีการปรับปรุงประกาศ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetAll}
            disabled={saving || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} /> รีเซ็ตค่าเริ่มต้น สปสช.
          </button>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: hasUnsavedChanges ? '#10b981' : '#0284c7',
              color: 'white',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: hasUnsavedChanges ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Save size={18} /> {saving ? 'กำลังบันทึก...' : hasUnsavedChanges ? '💾 บันทึกการเปลี่ยนแปลง (*)' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle2 size={20} color="#059669" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertTriangle size={20} color="#dc2626" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{errorMsg}</span>
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>กองทุนเปิดใช้งาน (Active)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
            {enabledCount} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {settingsList.length} รายการ</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>
            คำนวณเป้าหมายและรายรับในระบบปกติ
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ปิดการแสดงผล (ศักยภาพไม่เพียงพอ)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: disabledCount > 0 ? '#d97706' : '#64748b', marginTop: '0.25rem' }}>
            {disabledCount} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>รายการ</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.2rem' }}>
            ไม่รวมในเป้าหมายรวมและรายงานผลงานของ CUP
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>รายการที่มีการปรับอัตราจ่ายเอง</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: modifiedPriceCount > 0 ? '#0284c7' : '#64748b', marginTop: '0.25rem' }}>
            {modifiedPriceCount} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>รายการ</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.2rem' }}>
            อัตราค่าบริการต่างจากประกาศเดิมของ สปสช.
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>สถานะการแก้ไขในหน้านี้</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasUnsavedChanges ? '#ef4444' : '#10b981', marginTop: '0.4rem' }}>
            {hasUnsavedChanges ? '⚠️ มีข้อมูลยังไม่ได้บันทึก' : '✓ เป็นปัจจุบันแล้ว'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            {hasUnsavedChanges ? 'คลิกปุ่มบันทึกด้านบนเพื่ออัปเดต' : 'บันทึกลงไฟล์เซิร์ฟเวอร์แล้ว'}
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flex: '1 1 360px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อบริการ เช่น FIT, HPV, เบาหวาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', fontSize: '0.8rem' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '0.35rem 0.75rem',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ALL' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ALL' ? '#0f172a' : '#64748b',
                boxShadow: statusFilter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              ทั้งหมด ({settingsList.length})
            </button>
            <button
              onClick={() => setStatusFilter('ENABLED')}
              style={{
                padding: '0.35rem 0.75rem',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ENABLED' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ENABLED' ? '#059669' : '#64748b',
                boxShadow: statusFilter === 'ENABLED' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              เปิดใช้งาน ({enabledCount})
            </button>
            <button
              onClick={() => setStatusFilter('DISABLED')}
              style={{
                padding: '0.35rem 0.75rem',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'DISABLED' ? '#ffffff' : 'transparent',
                color: statusFilter === 'DISABLED' ? '#d97706' : '#64748b',
                boxShadow: statusFilter === 'DISABLED' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              ปิดใช้งาน ({disabledCount})
            </button>
            <button
              onClick={() => setStatusFilter('PRICE_MODIFIED')}
              style={{
                padding: '0.35rem 0.75rem',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'PRICE_MODIFIED' ? '#ffffff' : 'transparent',
                color: statusFilter === 'PRICE_MODIFIED' ? '#0284c7' : '#64748b',
                boxShadow: statusFilter === 'PRICE_MODIFIED' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              แก้ไขราคา ({modifiedPriceCount})
            </button>
          </div>

          {/* Quick preset */}
          <button
            onClick={handlePresetTertiaryDisabled}
            title="ปิดบริการเฉพาะทางขั้นสูงที่ รพ.ชุมชน ไม่มีศักยภาพ (BRCA, NIPT, TMS, แมมโมแกรม)"
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              borderRadius: '8px',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⚡ ปิดบริการเกินศักยภาพ รพช.
          </button>
        </div>
      </div>

      {/* Main Settings Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1rem', width: '90px' }}>รหัส</th>
                <th style={{ padding: '0.85rem 1rem' }}>รายการบริการ PPFS</th>
                <th style={{ padding: '0.85rem 1rem', width: '140px' }}>หมวดหมู่</th>
                <th style={{ padding: '0.85rem 1rem', width: '160px', textAlign: 'center' }}>สถานะเปิด/ปิด</th>
                <th style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>เหตุผลกรณีปิดใช้งาน</th>
                <th style={{ padding: '0.85rem 1rem', width: '160px', textAlign: 'right' }}>อัตราจ่าย (บาท)</th>
                <th style={{ padding: '0.85rem 1rem', width: '120px', textAlign: 'right' }}>มาตรฐาน สปสช.</th>
                <th style={{ padding: '0.85rem 1rem', width: '90px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    กำลังโหลดข้อมูลการตั้งค่า...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    ไม่พบรายการบริการที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isModifiedPrice = item.unitPrice !== item.defaultUnitPrice;
                  return (
                    <tr
                      key={item.indicatorId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: !item.enabled ? '#fafaf9' : isModifiedPrice ? '#f0f9ff' : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* Code */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: !item.enabled ? '#e2e8f0' : '#0284c7',
                            color: !item.enabled ? '#64748b' : 'white',
                            fontSize: '0.75rem',
                          }}
                        >
                          {item.code}
                        </span>
                      </td>

                      {/* Title & ShortName */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: !item.enabled ? '#94a3b8' : '#0f172a' }}>
                          {item.shortName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {item.title}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.775rem' }}>
                        {item.category}
                      </td>

                      {/* Enabled / Disabled Toggle */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleEnabled(item.indicatorId, item.enabled)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            border: item.enabled ? '1px solid #a7f3d0' : '1px solid #fde68a',
                            backgroundColor: item.enabled ? '#ecfdf5' : '#fffbeb',
                            color: item.enabled ? '#059669' : '#b45309',
                            fontWeight: 700,
                            fontSize: '0.775rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {item.enabled ? (
                            <>
                              <Check size={14} /> เปิดใช้งาน
                            </>
                          ) : (
                            <>
                              <ShieldAlert size={14} /> ปิดใช้งาน
                            </>
                          )}
                        </button>
                      </td>

                      {/* Disabled Reason Dropdown / Input */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {!item.enabled ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <select
                              value={
                                COMMON_DISABLED_REASONS.includes(item.disabledReason || '')
                                  ? item.disabledReason
                                  : 'อื่นๆ (ระบุเอง)'
                              }
                              onChange={(e) => {
                                const selected = e.target.value;
                                if (selected !== 'อื่นๆ (ระบุเอง)') {
                                  handleReasonChange(item.indicatorId, selected);
                                }
                              }}
                              style={{
                                padding: '0.35rem 0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #fcd34d',
                                backgroundColor: '#fffbeb',
                                fontSize: '0.75rem',
                                color: '#92400e',
                                fontWeight: 600,
                              }}
                            >
                              {COMMON_DISABLED_REASONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            {(!COMMON_DISABLED_REASONS.includes(item.disabledReason || '') ||
                              item.disabledReason === 'อื่นๆ (ระบุเอง)') && (
                              <input
                                type="text"
                                placeholder="ระบุเหตุผล เช่น ไม่มีแล็บเฉพาะทาง..."
                                value={item.disabledReason || ''}
                                onChange={(e) => handleReasonChange(item.indicatorId, e.target.value)}
                                style={{
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
                        )}
                      </td>

                      {/* Editable Price Input */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.unitPrice}
                            onChange={(e) => handlePriceChange(item.indicatorId, e.target.value)}
                            style={{
                              width: '85px',
                              padding: '0.35rem 0.5rem',
                              textAlign: 'right',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: isModifiedPrice ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                              backgroundColor: isModifiedPrice ? '#eff6ff' : 'white',
                              color: isModifiedPrice ? '#0284c7' : '#0f172a',
                              fontSize: '0.85rem',
                            }}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>บ.</span>
                        </div>
                      </td>

                      {/* Default NHSO Rate */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                        {item.defaultUnitPrice.toLocaleString()} บาท
                      </td>

                      {/* Reset Action */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        {isModifiedPrice && (
                          <button
                            onClick={() => handleResetSinglePrice(item.indicatorId, item.defaultUnitPrice)}
                            title="คืนค่าอัตราจ่ายมาตรฐาน สปสช."
                            style={{
                              border: 'none',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              padding: '0.3rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          >
                            คืนค่า
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
