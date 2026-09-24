import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { getSessionFromRequest, SessionUser } from "../auth/session.util";

export const IS_PUBLIC_KEY = "isPublic";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: SessionUser }>();
    const session = getSessionFromRequest(request);

    if (session) {
      request.user = session;
    }

    if (isPublic) {
      return true;
    }

    if (!session) {
      throw new UnauthorizedException("Debes iniciar sesión para continuar");
    }

    return true;
  }
}
