import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { OverviewPage } from './pages/OverviewPage';
import { YearlyComparisonPage } from './pages/YearlyComparisonPage';
import { MonthlyMatrixPage } from './pages/MonthlyMatrixPage';
import { IndicatorDetailPage } from './pages/IndicatorDetailPage';
import { OutreachPage } from './pages/OutreachPage';
import { RevenuePage } from './pages/RevenuePage';
import { DataAuditPage } from './pages/DataAuditPage';
import { NetworkStatusPage } from './pages/NetworkStatusPage';
import { Ppfs30CatalogPage } from './pages/Ppfs30CatalogPage';
import { api } from './services/api';
import { OverviewData } from './types/ppfs';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCenter, setSelectedCenter] = useState<string>('ALL');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('hpv_dna');

  // Dates: Default to FY 2025 (2568)
  const today = new Date();
  const fyYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
  const [startDate, setStartDate] = useState<string>(`${fyYear - 1}-10-01`);
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);

  // Overview data
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  const fetchOverview = () => {
    setLoadingOverview(true);
    api.getOverview({ startDate, endDate, centerId: selectedCenter })
      .then(setOverviewData)
      .catch(console.error)
      .finally(() => setLoadingOverview(false));
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedCenter, startDate, endDate]);

  const handleSelectIndicator = (id: string) => {
    setSelectedIndicatorId(id);
    setActiveTab('indicator');
  };

  const handleNavigateToOutreach = (id: string) => {
    setSelectedIndicatorId(id);
    setActiveTab('outreach');
  };

  const handleSelectCenterFromRanking = (centerId: string) => {
    setSelectedCenter(centerId);
  };

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Container */}
      <main className="main-content">
        {/* Global Filter Bar (shown on relevant tabs) */}
        {activeTab !== 'network' && activeTab !== 'matrix' && activeTab !== 'yearly' && activeTab !== 'catalog30' && (
          <FilterBar
            selectedCenter={selectedCenter}
            onChangeCenter={setSelectedCenter}
            startDate={startDate}
            endDate={endDate}
            onChangeDates={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            onRefresh={fetchOverview}
            loading={loadingOverview}
          />
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <OverviewPage
            data={overviewData}
            loading={loadingOverview}
            onSelectIndicator={handleSelectIndicator}
            onSelectCenter={handleSelectCenterFromRanking}
            onNavigateToOutreach={handleNavigateToOutreach}
          />
        )}

        {/* Tab: Multi-Year Comparison Table (FY 2567-2570) */}
        {activeTab === 'yearly' && (
          <YearlyComparisonPage
            onNavigateToOutreach={handleNavigateToOutreach}
          />
        )}

        {/* Tab 2: Monthly Matrix Tracking Table (New) */}
        {activeTab === 'matrix' && (
          <MonthlyMatrixPage
            onNavigateToOutreach={handleNavigateToOutreach}
          />
        )}

        {/* Tab: PPFS 30 Services Catalog (NHSO 2569-2570) */}
        {activeTab === 'catalog30' && <Ppfs30CatalogPage />}

        {/* Tab 3: Indicator Detail */}
        {activeTab === 'indicator' && (
          <IndicatorDetailPage
            indicatorId={selectedIndicatorId}
            onChangeIndicator={setSelectedIndicatorId}
            selectedCenter={selectedCenter}
            startDate={startDate}
            endDate={endDate}
            onNavigateToOutreach={handleNavigateToOutreach}
          />
        )}

        {/* Tab 3: Target Outreach & Call List */}
        {activeTab === 'outreach' && (
          <OutreachPage
            indicatorId={selectedIndicatorId}
            onChangeIndicator={setSelectedIndicatorId}
            selectedCenter={selectedCenter}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {/* Tab 4: Revenue Forecast */}
        {activeTab === 'revenue' && (
          <RevenuePage
            data={overviewData}
            onSelectIndicator={handleSelectIndicator}
            onNavigateToOutreach={handleNavigateToOutreach}
          />
        )}

        {/* Tab 5: Data Quality Pre-Audit */}
        {activeTab === 'audit' && (
          <DataAuditPage
            selectedCenter={selectedCenter}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {/* Tab 6: Network Status */}
        {activeTab === 'network' && <NetworkStatusPage />}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#64748b',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <strong>PPFS KPI & Network Monitoring Platform (30 รายการ สปสช.)</strong> • CUP โรงพยาบาลโคกศรีสุพรรณ
          </div>
          <div>
            Server 192.168.2.202:3600 • เชื่อมต่อ HOSxP 192.168.2.254 • ระบบวิเคราะห์และบริหารจัดการกองทุน PPFS
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
