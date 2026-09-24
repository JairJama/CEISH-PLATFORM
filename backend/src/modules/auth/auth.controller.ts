import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Public } from "../../common/decorators/public.decorator";
import {
  clearSessionCookie,
  getSessionFromRequest,
  setSessionCookie,
} from "../../common/auth/session.util";

class LoginDto {
  email!: string;
  password!: string;
}

class RegisterRequestDto {
  name!: string;
  email!: string;
  password!: string;
  researcherType!: "internal" | "external";
  affiliation?: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email || !body.password) {
      throw new UnauthorizedException("Email y contraseña son requeridos");
    }
    const user = await this.authService.validateUser(body.email, body.password);
    setSessionCookie(res, { id: user.id, role: user.role });
    return { user };
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterRequestDto) {
    if (!body.name || !body.email || !body.password || !body.researcherType) {
      throw new UnauthorizedException("Completa todos los campos requeridos");
    }
    return this.authService.register(body);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    clearSessionCookie(res);
    return { ok: true };
  }

  @Public()
  @Get("session")
  async getSession(@Req() req: Request) {
    const session = getSessionFromRequest(req);
    if (!session) {
      throw new UnauthorizedException("Debes iniciar sesión para continuar");
    }
    const user = await this.authService.getSessionUser(session.id);
    if (!user) {
      throw new UnauthorizedException("La sesión ya no es válida");
    }
    return user;
  }
}
