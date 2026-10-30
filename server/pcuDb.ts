import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.PCU_05570_HOST) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

export interface PcuNode {
  hospcode: string;
  name: string;
  subdistrict: string;
  officialPopulation?: number; // ประชากรตามทะเบียนราษฎร์ทางการ (DOPA 2567 รวม 21,612 คน)
  moos?: string[]; // หมู่บ้านที่รับผิดชอบ
  gdccId?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'LOCAL_SYNC';
  lastChecked?: string;
  error?: string;
}

// 6 facilities in CUP Khok Si Suphan (1 Hospital PCU + 5 Sub-district Health Centers)
// Real HOSxP / HOSxP-PCU Living Population with Type Area 1 & 3 Total: 26,080 คน
export const PCU_REGISTRY: Record<string, PcuNode> = {
  '11101': {
    hospcode: '11101',
    name: 'PCU โรงพยาบาลโคกศรีสุพรรณ',
    subdistrict: 'ต.ตองโขบ',
    officialPopulation: 6880,
    moos: ['1', '2', '4', '5', '7', '8', '9', '10', '13', '14', '15', '16'],
    status: 'ONLINE',
  },
  '05569': {
    hospcode: '05569',
    name: 'รพ.สต.ห้วยหีบ',
    subdistrict: 'ต.ตองโขบ',
    officialPopulation: 2691,
    moos: ['3', '6', '11', '12', '17', '18'],
    gdccId: process.env.PCU_05569_GDCC_ID || 'GCC1800900157-VN',
    host: process.env.PCU_05569_HOST || '202.139.215.223',
    port: Number(process.env.PCU_05569_PORT || 3306),
    user: process.env.PCU_05569_USER || 'root',
    password: process.env.PCU_05569_PASSWORD || '',
    database: process.env.PCU_05569_DB || 'hospcu05569',
  },
  '05570': {
    hospcode: '05570',
    name: 'รพ.สต.โพนค้อ (เหล่าโพนค้อ)',
    subdistrict: 'ต.เหล่าโพนค้อ',
    officialPopulation: 4325,
    moos: [], // ทั้งตำบลเหล่าโพนค้อ
    gdccId: process.env.PCU_05570_GDCC_ID || 'GCC1800900038-VN',
    host: process.env.PCU_05570_HOST || '209.15.96.29',
    port: Number(process.env.PCU_05570_PORT || 3306),
    user: process.env.PCU_05570_USER || 'root',
    password: process.env.PCU_05570_PASSWORD || '',
    database: process.env.PCU_05570_DB || 'hospcu05570',
  },
  '05571': {
    hospcode: '05571',
    name: 'รพ.สต.ม่วงไข่',
    subdistrict: 'ต.ด่านม่วงคำ',
    officialPopulation: 5312,
    moos: [], // ทั้งตำบลด่านม่วงคำ
    gdccId: process.env.PCU_05571_GDCC_ID || 'GCC1800900161-VN',
    host: process.env.PCU_05571_HOST || '202.139.215.221',
    port: Number(process.env.PCU_05571_PORT || 3306),
    user: process.env.PCU_05571_USER || 'root',
    password: process.env.PCU_05571_PASSWORD || '',
    database: process.env.PCU_05571_DB || 'hospcu05571',
  },
  '05572': {
    hospcode: '05572',
    name: 'รพ.สต.โคกนาดี',
    subdistrict: 'ต.แมดนาท่ม',
    officialPopulation: 3065,
    moos: ['2', '3', '6', '7', '8', '13'],
    gdccId: process.env.PCU_05572_GDCC_ID || 'GCC1800900041-VN',
    host: process.env.PCU_05572_HOST || '209.15.96.27',
    port: Number(process.env.PCU_05572_PORT || 3306),
    user: process.env.PCU_05572_USER || 'root',
    password: process.env.PCU_05572_PASSWORD || '',
    database: process.env.PCU_05572_DB || 'hospcu05572',
  },
  '05573': {
    hospcode: '05573',
    name: 'รพ.สต.โพนทอง',
    subdistrict: 'ต.แมดนาท่ม',
    officialPopulation: 3807,
    moos: ['1', '5', '9', '10', '11', '12'],
    gdccId: process.env.PCU_05573_GDCC_ID || 'GCC1800900044-VN',
    host: process.env.PCU_05573_HOST || '209.15.96.25',
    port: Number(process.env.PCU_05573_PORT || 3306),
    user: process.env.PCU_05573_USER || 'root',
    password: process.env.PCU_05573_PASSWORD || '',
    database: process.env.PCU_05573_DB || 'hospcu05573',
  },
};

const pcuPools: Map<string, mysql.Pool> = new Map();

export const getPcuPool = (hospcode: string): mysql.Pool | null => {
  const node = PCU_REGISTRY[hospcode];
  if (!node || !node.host || !node.database) return null;

  if (pcuPools.has(hospcode)) {
    return pcuPools.get(hospcode)!;
  }

  const pool = mysql.createPool({
    host: node.host,
    port: node.port || 3306,
    user: node.user || 'root',
    password: node.password || '',
    database: node.database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 5000,
    charset: 'utf8mb4',
  });

  pool.on('error', (err) => {
    console.error(`[PCU ${hospcode} Pool Error]:`, err?.message);
  });

  pcuPools.set(hospcode, pool);
  return pool;
};

export const checkPcuHealth = async (hospcode: string): Promise<PcuNode> => {
  const node = { ...PCU_REGISTRY[hospcode] };
  node.lastChecked = new Date().toISOString();

  if (hospcode === '11101' || !node.host) {
    node.status = 'LOCAL_SYNC';
    return node;
  }

  const pool = getPcuPool(hospcode);
  if (!pool) {
    node.status = 'LOCAL_SYNC';
    node.error = 'No connection credentials configured';
    return node;
  }

  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    node.status = 'ONLINE';
    delete node.error;
  } catch (err: any) {
    // If direct cloud MySQL is closed or requires active VPN, fall back gracefully to local synced HOSxP
    node.status = 'LOCAL_SYNC';
    node.error = `รอเชื่อมต่อ VPN หรือ Access Denied (${err?.message || 'Access denied'})`;
  }

  return node;
};

export const checkAllPcuHealth = async (): Promise<PcuNode[]> => {
  const keys = Object.keys(PCU_REGISTRY);
  const results = await Promise.all(keys.map((k) => checkPcuHealth(k)));
  return results;
};
