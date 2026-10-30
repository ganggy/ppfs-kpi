import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PPFSEngine } from './ppfsEngine.js';
import { PPFS_INDICATORS, getIndicatorById } from './ppfsIndicators.js';
import { checkAllPcuHealth, checkPcuHealth, PCU_REGISTRY } from './pcuDb.js';
import { testConnection } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3600;

app.use(cors());
app.use(express.json());

// Health & DB Connection Check
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ONLINE',
    app: 'PPFS KPI & Network Monitoring Platform',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});

// Network Centers
app.get('/api/ppfs/centers', (req, res) => {
  const centers = PPFSEngine.getCenters();
  res.json({ success: true, data: centers });
});

// PPFS Indicators Catalog
app.get('/api/ppfs/indicators', (req, res) => {
  res.json({ success: true, data: PPFS_INDICATORS });
});

// Overview KPI & League Table
app.get('/api/ppfs/overview', async (req, res) => {
  try {
    const { startDate, endDate, centerId } = req.query;
    const result = await PPFSEngine.getOverviewKpi({
      startDate: startDate as string,
      endDate: endDate as string,
      centerId: centerId as string,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Error in /api/ppfs/overview:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Indicator Deep-dive Detail
app.get('/api/ppfs/indicators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, centerId } = req.query;
    const detail = await PPFSEngine.getIndicatorDetail(id, {
      startDate: startDate as string,
      endDate: endDate as string,
      centerId: centerId as string,
    });
    res.json({ success: true, data: detail });
  } catch (err: any) {
    console.error(`Error in /api/ppfs/indicators/${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Target Patients List (Unserved / Served)
app.get('/api/ppfs/patients', async (req, res) => {
  try {
    const { indicatorId, status, centerId, search, startDate, endDate, limit, offset } = req.query;
    if (!indicatorId) {
      return res.status(400).json({ success: false, error: 'indicatorId is required' });
    }

    const result = await PPFSEngine.getTargetPatients(indicatorId as string, {
      status: (status as any) || 'unserved',
      centerId: centerId as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    res.json({ success: true, data: result.list, total: result.total });
  } catch (err: any) {
    console.error('Error in /api/ppfs/patients:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Export Target Patients to Excel
app.get('/api/ppfs/export-excel', async (req, res) => {
  try {
    const { indicatorId, status, centerId } = req.query;
    if (!indicatorId) {
      return res.status(400).send('indicatorId is required');
    }

    const ind = getIndicatorById(indicatorId as string);
    const indName = ind ? ind.shortName.replace(/[\/\\]/g, '_') : 'PPFS';
    const filename = `PPFS_Target_${indName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    const buffer = await PPFSEngine.exportExcel(indicatorId as string, {
      status: (status as any) || 'unserved',
      centerId: centerId as string,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('Error exporting excel:', err);
    res.status(500).send(err?.message || 'Excel export failed');
  }
});

// Export TB High Risk Screening Targets to Excel (ตามเกณฑ์ 9 กลุ่มเสี่ยง Type 1 & 3)
app.get('/api/ppfs/export-tb-risk-excel', (req, res) => {
  const filePath = path.resolve('d:/ppfs-kpi/TB_HighRisk_Screening_Targets_KhokSiSuphan.xlsx');
  res.download(filePath, 'รายชื่อกลุ่มเป้าหมายคัดกรองวัณโรคกลุ่มเสี่ยงสูง_Type1และ3.xlsx');
});

// Pre-Audit Data Quality Check
app.get('/api/ppfs/audit', async (req, res) => {
  try {
    const { startDate, endDate, centerId } = req.query;
    const audit = await PPFSEngine.auditDataQuality({
      startDate: startDate as string,
      endDate: endDate as string,
      centerId: centerId as string,
    });
    res.json({ success: true, data: audit });
  } catch (err: any) {
    console.error('Error in /api/ppfs/audit:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// 12-Month Matrix Tracking by Facility
app.get('/api/ppfs/monthly-matrix', async (req, res) => {
  try {
    const { fiscalYear, centerId } = req.query;
    const data = await PPFSEngine.getMonthlyMatrix({
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      centerId: centerId as string,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in /api/ppfs/monthly-matrix:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Export 12-Month Matrix to Excel
app.get('/api/ppfs/export-monthly-matrix', async (req, res) => {
  try {
    const { fiscalYear, centerId } = req.query;
    const buffer = await PPFSEngine.exportMonthlyMatrixExcel({
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      centerId: centerId as string,
    });

    const filename = `PPFS_Monthly_Matrix_${fiscalYear || '2568'}_${centerId || 'ALL'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('Error exporting monthly matrix excel:', err);
    res.status(500).send(err?.message || 'Export failed');
  }
});

// Multi-Year Comparison Table across FY 2567, 2568, 2569, 2570
app.get('/api/ppfs/yearly-comparison', async (req, res) => {
  try {
    const { centerId } = req.query;
    const data = await PPFSEngine.getYearlyComparison({
      centerId: centerId as string,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in /api/ppfs/yearly-comparison:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Export Multi-Year Comparison Table to Excel
app.get('/api/ppfs/export-yearly-comparison', async (req, res) => {
  try {
    const { centerId } = req.query;
    const buffer = await PPFSEngine.exportYearlyComparisonExcel({
      centerId: centerId as string,
    });
    const filename = `PPFS_Yearly_Comparison_2567-2570_${centerId || 'ALL'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('Error exporting yearly comparison excel:', err);
    res.status(500).send(err?.message || 'Export failed');
  }
});

// Network PCU Database Health Status
app.get('/api/network/status', async (req, res) => {
  try {
    const status = await checkAllPcuHealth();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Network check failed' });
  }
});

app.post('/api/network/check-node', async (req, res) => {
  try {
    const { hospcode } = req.body;
    if (!hospcode) return res.status(400).json({ error: 'hospcode required' });
    const node = await checkPcuHealth(hospcode);
    res.json({ success: true, data: node });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Node check failed' });
  }
});

// Serve static production frontend from ../dist
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 PPFS KPI Platform Server running on port ${PORT}`);
  console.log(`📡 Connected to HOSxP Database: ${process.env.HOSXP_HOST}:${process.env.HOSXP_PORT || 3306}`);
  console.log(`🏥 CUP Network: ${process.env.CUP_NAME || 'CUP โคกศรีสุพรรณ'}`);
  // Pre-warm cache in background so all pages load instantaneously
  setTimeout(() => {
    PPFSEngine.warmupCache();
  }, 500);
});
