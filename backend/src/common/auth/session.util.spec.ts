import { createHmac } from "node:crypto";
import type { Request, Response } from "express";
import {
  assertSessionConfiguration,
  COOKIE_NAME,
  getSessionFromRequest,
  hashPassword,
  normalizeRole,
  setSessionCookie,
  verifyPassword,
} from "./session.util";

const TEST_SECRET = "auth-session-test-secret-with-more-than-32-characters";

function signPayload(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", TEST_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function requestWithCookie(token: string): Request {
  return {
    cookies: { [COOKIE_NAME]: token },
    headers: {},
  } as unknown as Request;
}

describe("session security utilities", () => {
  const originalSecret = process.env.SESSION_SECRET;
  const originalEnvironment = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.SESSION_SECRET = TEST_SECRET;
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  });

  it("creates an HttpOnly SameSite cookie and accepts its signed session", () => {
    let token = "";
    let cookieOptions: Record<string, unknown> = {};
    const response = {
      cookie: (
        _name: string,
        value: string,
        options: Record<string, unknown>,
      ) => {
        token = value;
        cookieOptions = options;
      },
    } as unknown as Response;

    setSessionCookie(response, { id: "user-1", role: "teacher" });

    expect(cookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
    expect(getSessionFromRequest(requestWithCookie(token))).toMatchObject({
      id: "user-1",
      role: "evaluator",
    });
  });

  it("rejects tampered, expired, and unsupported-role cookies", () => {
    const valid = signPayload({
      id: "user-1",
      role: "admin",
      exp: Date.now() / 1000 + 60,
    });
    expect(getSessionFromRequest(requestWithCookie(`${valid}x`))).toBeNull();
    expect(
      getSessionFromRequest(
        requestWithCookie(
          signPayload({ id: "user-1", role: "student", exp: 1 }),
        ),
      ),
    ).toBeNull();
    expect(
      getSessionFromRequest(
        requestWithCookie(
          signPayload({
            id: "user-1",
            role: "unknown-role",
            exp: Date.now() / 1000 + 60,
          }),
        ),
      ),
    ).toBeNull();
    expect(normalizeRole("unrecognized-role")).toBeNull();
  });

  it("stores passwords as salted scrypt hashes and verifies them safely", async () => {
    const firstHash = await hashPassword("a-strong-password");
    const secondHash = await hashPassword("a-strong-password");

    expect(firstHash).toMatch(/^scrypt\$/);
    expect(firstHash).not.toBe(secondHash);
    await expect(verifyPassword("a-strong-password", firstHash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("wrong-password", firstHash)).resolves.toBe(
      false,
    );
  });

  it("requires a unique production signing secret", () => {
    process.env.NODE_ENV = "production";
    process.env.SESSION_SECRET = "replace-with-a-long-random-secret";
    expect(assertSessionConfiguration).toThrow(/unique random value/);

    process.env.SESSION_SECRET = TEST_SECRET;
    expect(assertSessionConfiguration).not.toThrow();
  });
});
