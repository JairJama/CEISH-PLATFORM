// src/server/queries/auth.ts
import { query } from '../../lib/database';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, hash] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const derived = Buffer.from(await scrypt(password, salt, 64) as ArrayBuffer);
  const expected = Buffer.from(hash, 'hex');
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function verifyLegacyPassword(password: string, stored: string): boolean {
  const supplied = Buffer.from(password);
  const expected = Buffer.from(stored);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = Buffer.from(await scrypt(password, salt, 64) as ArrayBuffer).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

/**
 * Verifica credenciales y devuelve el usuario sin la contraseña.
 * Retorna null si el email no existe o la contraseña no coincide.
 *
 * Reutiliza el mismo tipo UserRow que ya existe en users.ts.
 * La contraseña se compara en Node contra el hash scrypt y nunca se devuelve.
 */
export async function loginUser(email: string, password: string) {
  const rows = await query<{
    id: string;
    name: string;
    email: string;
    role: string;
    password: string;
  }>(
    `SELECT u.id, u.name, u.email, u.password, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE u.email = $1
      LIMIT 1`,
    [email.trim().toLowerCase()],
  );

  const row = rows[0];
  if (!row) return null;
  const passwordIsHashed = row.password.startsWith('scrypt$');
  const validPassword = passwordIsHashed
    ? await verifyPassword(password, row.password)
    : verifyLegacyPassword(password, row.password);
  if (!validPassword) return null;
  // Compatibilidad de una sola vez para instalaciones previas: el primer login
  // correcto reemplaza la contraseña heredada por un hash seguro.
  if (!passwordIsHashed) await query('UPDATE users SET password = $2 WHERE id = $1', [row.id, await hashPassword(password)]);

  const roleMap: Record<string, string> = {
    teacher: 'evaluator',
    student: 'student',
    admin: 'admin',
  };

  return { id: row.id, name: row.name, email: row.email, role: roleMap[row.role] ?? row.role };
}
