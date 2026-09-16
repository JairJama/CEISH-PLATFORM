import { withTransaction } from '../../lib/database';
import { hashPassword } from './auth';

export type ResearcherType = 'internal' | 'external';

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

  return withTransaction(async (client) => {
    const existing = await client.query(
      `SELECT 1 FROM users WHERE email = $1
       UNION ALL
       SELECT 1 FROM registration_requests WHERE email = $1
       LIMIT 1`,
      [email],
    );
    if (existing.rowCount) return false;

    await client.query(
      `INSERT INTO registration_requests
         (name, email, password_hash, researcher_type, affiliation)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.name.trim(), email, passwordHash, input.researcherType, input.affiliation.trim()],
    );
    return true;
  });
}
