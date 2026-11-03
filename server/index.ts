import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PPFSEngine } from './ppfsEngine.js';
import { PPFS_INDICATORS, getIndicatorById } from './ppfsIndicators.js';
import { PPFSSettingsService } from './ppfsSettingsService.js';
import { checkAllPcuHealth, checkPcuHealth, PCU_REGISTRY } from './pcuDb.js';
import { testConnection } from './db.js';
import { MophAuthService } from './mophAuthService.js';

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

// --- MOPH Provider ID (หมอพร้อม) Authentication Endpoints ---

// Step 1: Login Redirect
app.get('/api/auth/moph/login', (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3600';
    const callbackUrl = `${protocol}://${host}/api/auth/moph/callback`;
    const redirectUrl = MophAuthService.getLoginRedirectUrl(callbackUrl);
    res.json({ success: true, redirectUrl, callbackUrl });
  } catch (err: any) {
    console.error('Error generating login url:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Step 2-4: OAuth Callback Handler
app.get('/api/auth/moph/callback', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const code = (req.query.code as string) || '';
  const error = (req.query.error as string) || '';

  if (error || !code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>เข้าสู่ระบบไม่สำเร็จ</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; margin: 0;">
          <div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 420px;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h2 style="color: #dc2626; margin: 0 0 12px;">เข้าสู่ระบบไม่สำเร็จ</h2>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">${error || 'ไม่ได้รับ authorization code จากระบบ Health ID'}</p>
            <a href="/" style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">กลับสู่หน้าหลัก</a>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3600';
    const callbackUrl = `${protocol}://${host}/api/auth/moph/callback`;
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

    const session = await MophAuthService.handleCallback(code, callbackUrl, userAgent);

    // Render HTML callback that stores session in localStorage and redirects back to app
    const sessionJson = JSON.stringify({
      token: session.token,
      user: {
        name: session.hosxpUser?.name || session.providerProfile?.name_th || 'บุคลากรสาธารณสุข',
        loginname: session.hosxpUser?.loginname || 'moph_user',
        position: session.hosxpUser?.entryposition || session.providerProfile?.position || 'เจ้าหน้าที่',
        doctorcode: session.hosxpUser?.doctorcode,
        licenseId: session.providerProfile?.license_id,
        organization: session.providerProfile?.organization || 'โรงพยาบาลโคกศรีสุพรรณ',
        matchedBy: session.matchedBy,
      },
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>เข้าสู่ระบบสำเร็จ - PPFS Platform</title>
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0fdf4; margin: 0;">
          <div style="background: white; padding: 36px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); text-align: center; max-width: 440px;">
            <div style="width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px;">
              ✓
            </div>
            <h2 style="color: #166534; margin: 0 0 8px; font-size: 20px;">ยืนยันตัวตนสำเร็จ</h2>
            <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">
              ยินดีต้อนรับคุณ <strong>${session.hosxpUser?.name || session.providerProfile?.name_th}</strong>
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 20px;">กำลังนำท่านเข้าสู่ระบบ...</p>
            <div style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
              <div style="width: 100%; height: 100%; background: #22c55e; animation: load 1.2s ease-in-out infinite;"></div>
            </div>
          </div>
          <script>
            try {
              const sessionData = ${sessionJson};
              localStorage.setItem('ppfs_auth_session', JSON.stringify(sessionData));
              sessionStorage.setItem('ppfs_auth_session', JSON.stringify(sessionData));
              // Check if opened as popup or redirect
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ type: 'MOPH_AUTH_SUCCESS', session: sessionData }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1000);
              }
            } catch (err) {
              console.error(err);
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[MOPH AUTH ERROR]:', err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>เกิดข้อผิดพลาดในการยืนยันตัวตน</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff1f2; margin: 0;">
          <div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 480px;">
            <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
            <h2 style="color: #be123c; margin: 0 0 12px;">เกิดข้อผิดพลาดในการเชื่อมต่อ Provider ID</h2>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 24px; word-break: break-word;">${err.message || 'OAuth Exchange Failed'}</p>
            <a href="/" style="display: inline-block; background: #0f172a; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">กลับสู่หน้าหลัก</a>
          </div>
        </body>
      </html>
    `);
  }
});

// Get Current User Profile
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ success: false, authenticated: false, message: 'No session token provided' });
  }

  const session = MophAuthService.getSession(token);
  if (!session) {
    return res.status(401).json({ success: false, authenticated: false, message: 'Invalid or expired session' });
  }

  res.json({
    success: true,
    authenticated: true,
    user: {
      name: session.hosxpUser?.name || session.providerProfile?.name_th || 'บุคลากรสาธารณสุข',
      loginname: session.hosxpUser?.loginname || 'moph_user',
      position: session.hosxpUser?.entryposition || session.providerProfile?.position || 'เจ้าหน้าที่',
      doctorcode: session.hosxpUser?.doctorcode,
      licenseId: session.providerProfile?.license_id,
      organization: session.providerProfile?.organization || 'โรงพยาบาลโคกศรีสุพรรณ',
      matchedBy: session.matchedBy,
      loginAt: session.loginAt,
    },
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token;
  if (token) {
    MophAuthService.revokeSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Network Centers
app.get('/api/ppfs/centers', (req, res) => {
  const centers = PPFSEngine.getCenters();
  res.json({ success: true, data: centers });
});

// PPFS Indicators Catalog (returns effective unit prices & enabled states)
app.get('/api/ppfs/indicators', (req, res) => {
  const indicators = PPFSSettingsService.getEffectiveIndicators(false);
  res.json({ success: true, data: indicators });
});

// PPFS Indicators Settings Management
app.get('/api/ppfs/settings', (req, res) => {
  try {
    const settings = PPFSSettingsService.getSettings();
    const list = Object.values(settings);
    res.json({ success: true, data: settings, list });
  } catch (err: any) {
    console.error('Error in GET /api/ppfs/settings:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch settings' });
  }
});

app.post('/api/ppfs/settings', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }
    const updated = PPFSSettingsService.saveSettings(settings);
    const list = Object.values(updated);
    res.json({ success: true, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', data: updated, list });
  } catch (err: any) {
    console.error('Error in POST /api/ppfs/settings:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to save settings' });
  }
});

app.post('/api/ppfs/settings/reset', (req, res) => {
  try {
    const defaults = PPFSSettingsService.resetToDefaults();
    const list = Object.values(defaults);
    res.json({ success: true, message: 'รีเซ็ตเป็นค่าเริ่มต้นตามประกาศ สปสช. เรียบร้อยแล้ว', data: defaults, list });
  } catch (err: any) {
    console.error('Error in POST /api/ppfs/settings/reset:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to reset settings' });
  }
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
