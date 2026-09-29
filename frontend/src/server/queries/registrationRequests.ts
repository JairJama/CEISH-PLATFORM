import { query, withTransaction } from '../../lib/database';
import { hashPassword } from './auth';

export type ResearcherType = 'internal' | 'external';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface RegistrationRequestRow {
  id: string;
  name: string;
  email: string;
  researcher_type: ResearcherType;
  affiliation: string;
  status: RegistrationStatus;
  created_at: string;
  reviewed_at: string | null;
}

interface CreateRegistrationRequestInput {
  name: string;
  email: string;
  password: string;
  researcherType: ResearcherType;
  affiliation: string;
}

export async function createRegistrationRequest(input: CreateRegistrationRequestInput): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const existing = await query(
    `SELECT 1 FROM users WHERE email = $1
     UNION ALL
     SELECT 1 FROM registration_requests WHERE email = $1
     LIMIT 1`,
    [email],
  );
  if (existing.length) return false;

  await query(
    `INSERT INTO registration_requests
       (name, email, password_hash, researcher_type, affiliation, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')`,
    [input.name.trim(), email, passwordHash, input.researcherType, input.affiliation.trim()],
  );
  return true;
}

const PUBLIC_COLUMNS = `
  id, name, email, researcher_type, affiliation, status, created_at, reviewed_at`;

export async function listRegistrationRequests(): Promise<RegistrationRequestRow[]> {
  return query<RegistrationRequestRow>(
    `SELECT ${PUBLIC_COLUMNS}
       FROM registration_requests
      ORDER BY (status = 'pending') DESC, created_at DESC`,
  );
}

export async function getRegistrationStatus(email: string): Promise<RegistrationStatus | null> {
  const rows = await query<{ status: RegistrationStatus }>(
    `SELECT status FROM registration_requests WHERE email = $1 LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  return rows[0]?.status ?? null;
}

export async function reviewRegistrationRequest(
  id: string,
  decision: 'approved' | 'rejected',
  adminId: string,
): Promise<RegistrationRequestRow | null> {
  return withTransaction(async (client) => {
    const locked = await client.query<RegistrationRequestRow & { password_hash: string }>(
      `SELECT ${PUBLIC_COLUMNS}, password_hash
         FROM registration_requests
        WHERE id = $1
        FOR UPDATE`,
      [id],
    );
    const request = locked.rows[0];
    if (!request || request.status !== 'pending') return null;

    if (decision === 'approved') {
      const created = await client.query<{ id: string }>(
        `INSERT INTO users (name, email, password, role_id)
         SELECT $1, $2, $3, id FROM roles WHERE name = 'student'
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [request.name, request.email, request.password_hash],
      );
      let userId = created.rows[0]?.id;
      if (!userId) {
        const existingUser = await client.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [request.email]);
        userId = existingUser.rows[0]?.id;
      }
      if (!userId) throw new Error('No se pudo crear la cuenta del investigador');

      await client.query(
        `INSERT INTO researcher_profiles (user_id, researcher_type, affiliation)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET researcher_type = EXCLUDED.researcher_type,
               affiliation = EXCLUDED.affiliation`,
        [userId, request.researcher_type, request.affiliation],
      );
    }

    const reviewed = await client.query<RegistrationRequestRow>(
      `UPDATE registration_requests
          SET status = $2, reviewed_at = NOW(), reviewed_by = $3
        WHERE id = $1
        RETURNING ${PUBLIC_COLUMNS}`,
      [id, decision, adminId],
    );
    return reviewed.rows[0] ?? null;
  });
}
