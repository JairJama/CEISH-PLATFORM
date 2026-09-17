import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UserRole } from '../shared/types/platform.types';

const COOKIE_NAME = 'ceish_session';
const MAX_AGE_SECONDS = 60 * 60 * 8;

export interface SessionUser { id: string; role: UserRole; exp: number }

function secret() { return process.env.SESSION_SECRET ?? 'ceish-development-secret-change-before-production'; }
function encode(value: unknown) { return Buffer.from(JSON.stringify(value)).toString('base64url'); }
function sign(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url'); }

function parseCookies(req: IncomingMessage): Record<string, string> {
  return Object.fromEntries((req.headers.cookie ?? '').split(';').flatMap((entry) => {
    const index = entry.indexOf('=');
    return index === -1 ? [] : [[entry.slice(0, index).trim(), decodeURIComponent(entry.slice(index + 1).trim())]];
  }));
}

export function getSession(req: IncomingMessage): SessionUser | null {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionUser;
    return value.id && ['student', 'evaluator', 'admin'].includes(value.role) && value.exp > Date.now() / 1000 ? value : null;
  } catch { return null; }
}

export function setSession(res: ServerResponse, user: { id: string; role: UserRole }) {
  const payload: SessionUser = { ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const encoded = encode(payload);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encoded}.${sign(encoded)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`);
}

export function clearSession(res: ServerResponse) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
