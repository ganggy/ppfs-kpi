import crypto from 'crypto';
import { pool } from './db.js';

export interface MophUserProfile {
  hash_cid?: string;
  cid?: string;
  name_th?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  organization?: string;
  hospcode?: string;
  license_id?: string;
  position?: string;
  email?: string;
  tel?: string;
}

export interface SessionUser {
  token: string;
  providerProfile: MophUserProfile;
  hosxpUser: {
    loginname: string;
    name: string;
    entryposition?: string;
    doctorcode?: string;
    department?: string;
    groupname?: string;
    hospital_code?: string;
  } | null;
  matchedBy: 'hash_cid' | 'license_id' | 'name' | 'moph_fallback';
  loginAt: string;
  expiresAt: number; // timestamp
}

// In-memory active sessions store (key: session token)
const activeSessions = new Map<string, SessionUser>();

// Clean expired sessions periodically (every 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
}, 60 * 60 * 1000);

export class MophAuthService {
  private static getHealthIdClientId(): string {
    return process.env.MOPH_HEALTH_ID_CLIENT_ID || '01a0faf5-2888-758a-a1c3-d885143cf2e4';
  }

  private static getHealthIdSecret(): string {
    return process.env.MOPH_HEALTH_ID_SECRET || 'a92c05aeec078f4cd9da04d34dd3e5ebe1ea0942';
  }

  private static getProviderIdClientId(): string {
    return process.env.MOPH_PROVIDER_ID_CLIENT_ID || '68fdef16-2121-451b-952c-07a9aaf4d1f0';
  }

  private static getProviderIdSecret(): string {
    return process.env.MOPH_PROVIDER_ID_SECRET || '6bFJzxrV1SnBwEwphUK9vcAPXiWFlzX8';
  }

  /**
   * Step 1: สร้าง Redirect Login URL ไปยัง Health ID (OAuth2)
   */
  public static getLoginRedirectUrl(redirectUri: string): string {
    const clientId = this.getHealthIdClientId();
    const encodedRedirect = encodeURIComponent(redirectUri);
    return `https://moph.id.th/oauth/redirect?client_id=${clientId}&redirect_uri=${encodedRedirect}&response_type=code`;
  }

  /**
   * Step 2 & 3 & 4: จัดการ Callback แลกเปลี่ยน Token และดึง Provider Profile
   */
  public static async handleCallback(
    code: string,
    redirectUri: string,
    userAgent: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  ): Promise<SessionUser> {
    const healthClientId = this.getHealthIdClientId();
    const healthSecret = this.getHealthIdSecret();
    const providerClientId = this.getProviderIdClientId();
    const providerSecret = this.getProviderIdSecret();

    console.log(`[MOPH AUTH] Starting OAuth flow with code: ${code.substring(0, 10)}... redirectUri: ${redirectUri}`);

    // --- Step 2: Exchange Health ID Token ---
    const healthTokenUrl = 'https://moph.id.th/api/v1/token';
    const healthTokenPayload = {
      client_id: healthClientId,
      client_secret: healthSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    };

    console.log('[MOPH AUTH] Step 2: Exchanging Health ID Token...');
    const healthTokenResp = await fetch(healthTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify(healthTokenPayload),
    });

    if (!healthTokenResp.ok) {
      const errText = await healthTokenResp.text();
      console.error('[MOPH AUTH] Step 2 Failed:', healthTokenResp.status, errText);
      throw new Error(`Health ID Token exchange failed (${healthTokenResp.status}): ${errText}`);
    }

    const healthTokenData: any = await healthTokenResp.json();
    const healthAccessToken = healthTokenData?.data?.access_token || healthTokenData?.access_token;

    if (!healthAccessToken) {
      console.error('[MOPH AUTH] Step 2 invalid response:', healthTokenData);
      throw new Error('Health ID Token response missing access_token');
    }
    console.log('[MOPH AUTH] Step 2 Success. Health Access Token obtained.');

    // --- Step 3: Exchange Provider ID Token ---
    const providerTokenUrl = 'https://provider.id.th/api/v1/services/token';
    const providerTokenPayload = {
      client_id: providerClientId,
      secret_key: providerSecret,
      token_by: 'Health ID',
      token: healthAccessToken,
    };

    console.log('[MOPH AUTH] Step 3: Exchanging Provider ID Token...');
    const providerTokenResp = await fetch(providerTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify(providerTokenPayload),
    });

    if (!providerTokenResp.ok) {
      const errText = await providerTokenResp.text();
      console.error('[MOPH AUTH] Step 3 Failed:', providerTokenResp.status, errText);
      throw new Error(`Provider ID Token exchange failed (${providerTokenResp.status}): ${errText}`);
    }

    const providerTokenData: any = await providerTokenResp.json();
    const providerAccessToken = providerTokenData?.data?.access_token || providerTokenData?.access_token;

    if (!providerAccessToken) {
      console.error('[MOPH AUTH] Step 3 invalid response:', providerTokenData);
      throw new Error('Provider ID Token response missing access_token');
    }
    console.log('[MOPH AUTH] Step 3 Success. Provider Access Token obtained.');

    // --- Step 4: Get Provider Profile ---
    const profileUrl = 'https://provider.id.th/api/v1/services/profile';
    console.log('[MOPH AUTH] Step 4: Fetching Provider Profile...');
    const profileResp = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${providerAccessToken}`,
        'client-id': providerClientId,
        'secret-key': providerSecret,
        'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!profileResp.ok) {
      const errText = await profileResp.text();
      console.error('[MOPH AUTH] Step 4 Failed:', profileResp.status, errText);
      throw new Error(`Provider Profile fetch failed (${profileResp.status}): ${errText}`);
    }

    const profileData: any = await profileResp.json();
    const providerProfile: MophUserProfile = profileData?.data || profileData;
    console.log('[MOPH AUTH] Step 4 Success. Provider profile received:', {
      name_th: providerProfile.name_th,
      organization: providerProfile.organization,
      license_id: providerProfile.license_id,
      hash_cid: providerProfile.hash_cid ? `${providerProfile.hash_cid.substring(0, 10)}...` : undefined,
    });

    // --- Step 5: Match with HOSxP opduser ---
    const matchResult = await this.matchOpdUser(providerProfile);

    // --- Step 6: Create Session ---
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const session: SessionUser = {
      token: sessionToken,
      providerProfile,
      hosxpUser: matchResult.hosxpUser,
      matchedBy: matchResult.matchedBy,
      loginAt: new Date().toISOString(),
      expiresAt,
    };

    activeSessions.set(sessionToken, session);
    return session;
  }

  /**
   * ค้นหาและจับคู่ opduser ใน HOSxP:
   * 1) ตรวจสอบจาก hash_cid: SHA2(REPLACE(cid, '-', ''), 256)
   * 2) Fallback: ค้นหาจาก doctor.licenseno (license_id)
   * 3) Fallback: ค้นหาจากชื่อ-นามสกุล (name_th)
   */
  public static async matchOpdUser(profile: MophUserProfile): Promise<{
    hosxpUser: SessionUser['hosxpUser'];
    matchedBy: SessionUser['matchedBy'];
  }> {
    try {
      // 1. Try matching with hash_cid
      if (profile.hash_cid) {
        const normalizedHash = profile.hash_cid.trim().toLowerCase();
        const sql = `
          SELECT loginname, name, entryposition, doctorcode
          FROM opduser 
          WHERE LOWER(SHA2(REPLACE(cid, '-', ''), 256)) = ?
            AND (account_disable IS NULL OR account_disable != 'Y')
          LIMIT 1
        `;
        const [rows]: any = await pool.query(sql, [normalizedHash]);
        if (rows && rows.length > 0) {
          console.log(`[MOPH AUTH] Matched opduser by hash_cid: ${rows[0].loginname} (${rows[0].name})`);
          return {
            hosxpUser: {
              loginname: rows[0].loginname,
              name: rows[0].name,
              entryposition: rows[0].entryposition,
              doctorcode: rows[0].doctorcode,
            },
            matchedBy: 'hash_cid',
          };
        }
      }

      // 2. Fallback: match by license_id via doctor table
      if (profile.license_id && profile.license_id.trim()) {
        const cleanLic = profile.license_id.trim().replace(/^ว\.?|^พ\.?/i, '');
        const licSql = `
          SELECT u.loginname, u.name, u.entryposition, u.doctorcode
          FROM doctor d
          JOIN opduser u ON u.doctorcode = d.code
          WHERE (REPLACE(d.licenseno, ' ', '') = ? OR d.licenseno LIKE ?)
            AND (u.account_disable IS NULL OR u.account_disable != 'Y')
          LIMIT 1
        `;
        const [licRows]: any = await pool.query(licSql, [cleanLic, `%${cleanLic}%`]);
        if (licRows && licRows.length > 0) {
          console.log(`[MOPH AUTH] Matched opduser by doctor license_id: ${licRows[0].loginname} (${licRows[0].name})`);
          return {
            hosxpUser: {
              loginname: licRows[0].loginname,
              name: licRows[0].name,
              entryposition: licRows[0].entryposition,
              doctorcode: licRows[0].doctorcode,
            },
            matchedBy: 'license_id',
          };
        }
      }

      // 3. Fallback: match by Thai Name
      if (profile.name_th && profile.name_th.trim()) {
        const cleanName = profile.name_th.trim();
        // Remove common prefixes
        const strippedName = cleanName.replace(/^(นพ\.|พญ\.|นายแพทย์|แพทย์หญิง|นาย|นางสาว|นาง)\s*/, '');
        const nameSql = `
          SELECT loginname, name, entryposition, doctorcode
          FROM opduser
          WHERE (name LIKE ? OR name LIKE ?)
            AND (account_disable IS NULL OR account_disable != 'Y')
          LIMIT 1
        `;
        const [nameRows]: any = await pool.query(nameSql, [`%${cleanName}%`, `%${strippedName}%`]);
        if (nameRows && nameRows.length > 0) {
          console.log(`[MOPH AUTH] Matched opduser by name: ${nameRows[0].loginname} (${nameRows[0].name})`);
          return {
            hosxpUser: {
              loginname: nameRows[0].loginname,
              name: nameRows[0].name,
              entryposition: nameRows[0].entryposition,
              doctorcode: nameRows[0].doctorcode,
            },
            matchedBy: 'name',
          };
        }
      }
    } catch (err) {
      console.error('[MOPH AUTH] Error matching opduser:', err);
    }

    console.log('[MOPH AUTH] No opduser record matched. Creating MOPH fallback user.');
    return {
      hosxpUser: {
        loginname: profile.name_th || 'moph_user',
        name: profile.name_th || 'บุคลากรสาธารณสุข',
        entryposition: profile.position || 'เจ้าหน้าที่ (Provider ID)',
        hospital_code: profile.hospcode || '11101',
      },
      matchedBy: 'moph_fallback',
    };
  }

  /**
   * ดึง Session ปัจจุบัน
   */
  public static getSession(token: string): SessionUser | null {
    if (!token) return null;
    const session = activeSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      activeSessions.delete(token);
      return null;
    }
    return session;
  }

  /**
   * ลบ Session เมื่อ Logout
   */
  public static revokeSession(token: string): boolean {
    return activeSessions.delete(token);
  }
}
