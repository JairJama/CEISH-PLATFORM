import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
} from "@nestjs/common";
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Public } from "../../common/decorators/public.decorator";
import {
  clearSessionCookie,
  getSessionFromRequest,
  setSessionCookie,
} from "../../common/auth/session.util";

class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

class RegisterRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsIn(["internal", "external"])
  researcherType!: "internal" | "external";

  @ValidateIf(
    (request: RegisterRequestDto) =>
      request.researcherType === "external" ||
      request.affiliation !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  affiliation?: string;
}

@Controller("auth")
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    const { sessionVersion, ...publicUser } = user;
    setSessionCookie(res, { id: user.id, role: user.role, sessionVersion });
    return { user: publicUser };
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterRequestDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = getSessionFromRequest(req);
    if (session) await this.authService.invalidateSessions(session.id);
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
    const user = await this.authService.getSessionUser(
      session.id,
      session.sessionVersion,
    );
    if (!user) {
      throw new UnauthorizedException("La sesión ya no es válida");
    }
    return user;
  }
}
