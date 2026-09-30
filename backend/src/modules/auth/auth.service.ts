import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  hashPassword,
  normalizeRole,
  verifyPassword,
} from "../../common/auth/session.util";

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  researcherType: "internal" | "external";
  affiliation?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, pass: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    });

    if (!user) {
      const request = await this.prisma.registrationRequest.findUnique({
        where: { email: normalizedEmail },
      });
      if (request?.status === "pending") {
        throw new ForbiddenException(
          "Tu solicitud aún está pendiente de aprobación",
        );
      }
      if (request?.status === "rejected") {
        throw new ForbiddenException("Tu solicitud de registro fue rechazada");
      }
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    const isValid = await verifyPassword(pass, user.password);
    if (!isValid) {
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    // Si la contraseña estaba en texto plano o scrypt anterior, actualizamos a scrypt seguro
    if (!user.password.startsWith("scrypt$")) {
      const secureHash = await hashPassword(pass);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: secureHash },
      });
    }

    const roleName = normalizeRole(user.role.name);
    if (!roleName) {
      throw new ForbiddenException("La cuenta tiene un rol no permitido");
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleName,
      sessionVersion: user.authSessionVersion,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    const existingRequest = await this.prisma.registrationRequest.findUnique({
      where: { email },
    });

    if (existingUser || existingRequest) {
      throw new ConflictException(
        "Ya existe una cuenta o una solicitud con este correo",
      );
    }

    const passwordHash = await hashPassword(dto.password);
    try {
      await this.prisma.registrationRequest.create({
        data: {
          name: dto.name.trim(),
          email,
          passwordHash,
          researcherType: dto.researcherType,
          affiliation:
            dto.researcherType === "internal"
              ? ""
              : (dto.affiliation?.trim() ?? ""),
          status: "pending",
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "Ya existe una cuenta o una solicitud con este correo",
        );
      }
      throw error;
    }

    return {
      message: "Solicitud enviada. Podrás iniciar sesión cuando sea aprobada.",
    };
  }

  async getSessionUser(userId: string, sessionVersion: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || user.authSessionVersion !== sessionVersion) return null;
    const role = normalizeRole(user.role.name);
    if (!role) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
    };
  }

  async invalidateSessions(userId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { authSessionVersion: { increment: 1 } },
    });
  }
}
