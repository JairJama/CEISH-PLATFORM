import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";

const scrypt = promisify(scryptCallback);
const DEVELOPMENT_SESSION_SECRET =
  "ceish-development-secret-change-before-production";

export const COOKIE_NAME = "ceish_session";
export const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

export type UserRole = "student" | "evaluator" | "admin";

export interface SessionUser {
  id: string;
  role: UserRole;
  exp: number;
  sessionVersion: number;
}

export function normalizeRole(role: unknown): UserRole | null {
  const aliases: Record<string, UserRole> = {
    student: "student",
    admin: "admin",
    teacher: "evaluator",
    evaluator: "evaluator",
    member: "evaluator",
    ceish_member: "evaluator",
    ceish: "evaluator",
    miembro: "evaluator",
    miembro_ceish: "evaluator",
  };
  const normalized =
    typeof role === "string"
      ? role
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_")
      : "";
  return aliases[normalized] ?? null;
}

function secret(): string {
  const configured = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!configured || configured.length < 32) {
      throw new Error(
        "SESSION_SECRET must contain at least 32 characters in production",
      );
    }
    return configured;
  }
  return configured ?? DEVELOPMENT_SESSION_SECRET;
}

export function assertSessionConfiguration(): void {
  if (process.env.NODE_ENV !== "production") return;
  const configured = process.env.SESSION_SECRET;
  if (
    !configured ||
    configured.length < 32 ||
    configured === DEVELOPMENT_SESSION_SECRET ||
    configured.startsWith("replace-with-")
  ) {
    throw new Error(
      "Set SESSION_SECRET to a unique random value of at least 32 characters in production",
    );
  }
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function getSessionFromRequest(req: Request): SessionUser | null {
  const rawToken =
    req.cookies?.[COOKIE_NAME] ??
    (req.headers.cookie
      ? parseCookies(req.headers.cookie)[COOKIE_NAME]
      : undefined);
  if (!rawToken) return null;

  const [encoded, signature] = rawToken.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const value = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<SessionUser>;
    const role = normalizeRole(value.role);
    const sessionVersion = value.sessionVersion ?? 0;
    if (
      typeof value.id === "string" &&
      value.id.length > 0 &&
      role &&
      typeof value.exp === "number" &&
      Number.isFinite(value.exp) &&
      Number.isSafeInteger(sessionVersion) &&
      sessionVersion >= 0 &&
      value.exp > Date.now() / 1000
    ) {
      return { id: value.id, role, exp: value.exp, sessionVersion };
    }
    return null;
  } catch {
    return null;
  }
}

export function setSessionCookie(
  res: Response,
  user: { id: string; role: string; sessionVersion?: number },
) {
  const role = normalizeRole(user.role);
  if (!role) throw new Error("Cannot create a session for an unsupported role");
  const payload: SessionUser = {
    id: user.id,
    role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
    sessionVersion: user.sessionVersion ?? 0,
  };
  const encoded = encode(payload);
  const token = `${encoded}.${sign(encoded)}`;
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: MAX_AGE_SECONDS * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(";").flatMap((entry) => {
      const index = entry.indexOf("=");
      return index === -1
        ? []
        : [
            [
              entry.slice(0, index).trim(),
              decodeURIComponent(entry.slice(index + 1).trim()),
            ],
          ];
    }),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = Buffer.from(
    (await scrypt(password, salt, 64)) as ArrayBuffer,
  ).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (stored.startsWith("scrypt$")) {
    const [algorithm, salt, hash] = stored.split("$");
    if (algorithm !== "scrypt" || !salt || !hash) return false;
    const derived = Buffer.from(
      (await scrypt(password, salt, 64)) as ArrayBuffer,
    );
    const expected = Buffer.from(hash, "hex");
    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  }

  // Compatibilidad texto plano para demo
  const supplied = Buffer.from(password);
  const expected = Buffer.from(stored);
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
