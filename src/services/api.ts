import { OverviewData, PPFSIndicator, PatientRecord, PcuNode, AuditReport } from '../types/ppfs';

const API_BASE = '/api';

export const api = {
  // Get overview KPI
  async getOverview(params?: { startDate?: string; endDate?: string; centerId?: string }): Promise<OverviewData> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.centerId) query.set('centerId', params.centerId);

    const res = await fetch(`${API_BASE}/ppfs/overview?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load overview data');
    const json = await res.json();
    return json.data;
  },

  // Get list of indicators
  async getIndicators(): Promise<PPFSIndicator[]> {
    const res = await fetch(`${API_BASE}/ppfs/indicators`);
    if (!res.ok) throw new Error('Failed to load indicators');
    const json = await res.json();
    return json.data;
  },

  // Get indicator detail
  async getIndicatorDetail(id: string, params?: { startDate?: string; endDate?: string; centerId?: string }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.centerId) query.set('centerId', params.centerId);

    const res = await fetch(`${API_BASE}/ppfs/indicators/${id}?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load indicator detail');
    const json = await res.json();
    return json.data;
  },

  // Get target patients list
  async getPatients(params: {
    indicatorId: string;
    status?: 'unserved' | 'served' | 'all';
    centerId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ list: PatientRecord[]; total: number }> {
    const query = new URLSearchParams();
    query.set('indicatorId', params.indicatorId);
    if (params.status) query.set('status', params.status);
    if (params.centerId) query.set('centerId', params.centerId);
    if (params.search) query.set('search', params.search);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/ppfs/patients?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load patients list');
    const json = await res.json();
    return { list: json.data, total: json.total };
  },

  // Get export excel URL
  getExportExcelUrl(indicatorId: string, status?: string, centerId?: string): string {
    const query = new URLSearchParams();
    query.set('indicatorId', indicatorId);
    if (status) query.set('status', status);
    if (centerId) query.set('centerId', centerId);
    return `${API_BASE}/ppfs/export-excel?${query.toString()}`;
  },

  // Get Data Quality Audit report
  async getAuditReport(params?: { startDate?: string; endDate?: string; centerId?: string }): Promise<AuditReport> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.centerId) query.set('centerId', params.centerId);

    const res = await fetch(`${API_BASE}/ppfs/audit?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load audit report');
    const json = await res.json();
    return json.data;
  },

  // Get Network status
  async getNetworkStatus(): Promise<PcuNode[]> {
    const res = await fetch(`${API_BASE}/network/status`);
    if (!res.ok) throw new Error('Failed to load network status');
    const json = await res.json();
    return json.data;
  },

  // Get Centers list
  async getCenters(): Promise<{ hospcode: string; name: string; subdistrict: string }[]> {
    const res = await fetch(`${API_BASE}/ppfs/centers`);
    if (!res.ok) throw new Error('Failed to load centers');
    const json = await res.json();
    return json.data;
  },

  // Get Monthly Matrix
  async getMonthlyMatrix(params?: { fiscalYear?: number; centerId?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.fiscalYear) query.set('fiscalYear', String(params.fiscalYear));
    if (params?.centerId) query.set('centerId', params.centerId);

    const res = await fetch(`${API_BASE}/ppfs/monthly-matrix?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load monthly matrix');
    const json = await res.json();
    return json.data;
  },

  // Get Export Monthly Matrix URL
  getExportMonthlyMatrixUrl(fiscalYear?: number, centerId?: string): string {
    const query = new URLSearchParams();
    if (fiscalYear) query.set('fiscalYear', String(fiscalYear));
    if (centerId) query.set('centerId', centerId);
    return `${API_BASE}/ppfs/export-monthly-matrix?${query.toString()}`;
  },
};
