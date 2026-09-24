import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { COOKIE_NAME, setSessionCookie } from "../auth/session.util";
import { PrismaService } from "../prisma/prisma.service";
import { AuthGuard } from "./auth.guard";

function signedCookie(sessionVersion: number): string {
  let value = "";
  const response = {
    cookie: (_name: string, token: string) => {
      value = token;
    },
  } as unknown as Response;
  setSessionCookie(response, {
    id: "user-1",
    role: "student",
    sessionVersion,
  });
  return value;
}

function executionContext(request: Request): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("AuthGuard", () => {
  const originalSecret = process.env.SESSION_SECRET;
  const originalEnvironment = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.SESSION_SECRET =
      "auth-guard-test-secret-with-more-than-32-characters";
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  });

  it("uses the current database role instead of the role captured in the cookie", async () => {
    const request = {
      cookies: { [COOKIE_NAME]: signedCookie(2) },
      headers: {},
    } as unknown as Request & { user?: { role: string } };
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          authSessionVersion: 2,
          role: { name: "evaluator" },
        }),
      },
    } as unknown as PrismaService;
    const guard = new AuthGuard(reflector, prisma);

    await expect(guard.canActivate(executionContext(request))).resolves.toBe(
      true,
    );
    expect(request.user?.role).toBe("evaluator");
  });

  it("rejects a session after logout increments its database version", async () => {
    const request = {
      cookies: { [COOKIE_NAME]: signedCookie(1) },
      headers: {},
    } as unknown as Request;
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          authSessionVersion: 2,
          role: { name: "student" },
        }),
      },
    } as unknown as PrismaService;
    const guard = new AuthGuard(reflector, prisma);

    await expect(
      guard.canActivate(executionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
