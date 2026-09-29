import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import {
  getSessionFromRequest,
  normalizeRole,
  SessionUser,
} from "../auth/session.util";
import { PrismaService } from "../prisma/prisma.service";

export const IS_PUBLIC_KEY = "isPublic";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: SessionUser }>();
    const session = getSessionFromRequest(request);

    if (isPublic) {
      return true;
    }

    if (!session) {
      throw new UnauthorizedException("Debes iniciar sesión para continuar");
    }

    // The cookie proves identity, while the database remains authoritative for
    // the current account and role so deleted or demoted users lose access.
    const account = await this.prisma.user.findUnique({
      where: { id: session.id },
      include: { role: true },
    });
    const role = account ? normalizeRole(account.role.name) : null;
    if (
      !account ||
      !role ||
      account.authSessionVersion !== session.sessionVersion
    ) {
      throw new UnauthorizedException("La sesión ya no es válida");
    }
    request.user = { ...session, id: account.id, role };

    return true;
  }
}
