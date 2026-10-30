import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.HOSXP_PASSWORD) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const host = process.env.HOSXP_HOST || '192.168.2.254';
const user = process.env.HOSXP_USER || 'opd';
const password = process.env.HOSXP_PASSWORD || '123456';
const database = process.env.HOSXP_DB || 'hos';
const port = Number(process.env.HOSXP_PORT || 3306);

export const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  charset: 'utf8mb4',
});

pool.on('error', (err) => {
  console.error('[HOSxP Pool Error]:', err?.message);
});

export const getDB = async () => {
  return await pool.getConnection();
};

export const testConnection = async (): Promise<{ ok: boolean; message: string; host: string }> => {
  try {
    const conn = await pool.getConnection();
    const [rows]: any = await conn.query('SELECT 1 as test');
    conn.release();
    return { ok: true, message: 'Connected to HOSxP successfully', host };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Connection failed', host };
  }
};
