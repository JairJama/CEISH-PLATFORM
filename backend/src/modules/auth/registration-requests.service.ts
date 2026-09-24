import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class RegistrationRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRequests() {
    return this.prisma.registrationRequest.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        researcherType: true,
        affiliation: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  async reviewRequest(
    id: string,
    decision: "approved" | "rejected",
    adminId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.registrationRequest.findUnique({
        where: { id },
      });

      if (!request || request.status !== "pending") {
        throw new ConflictException(
          "La solicitud ya fue procesada o no existe",
        );
      }

      if (decision === "approved") {
        // Obtenemos el rol 'student'
        let studentRole = await tx.role.findUnique({
          where: { name: "student" },
        });
        if (!studentRole) {
          studentRole = await tx.role.create({ data: { name: "student" } });
        }

        // Crear o actualizar usuario
        let user = await tx.user.findUnique({
          where: { email: request.email },
        });
        if (!user) {
          user = await tx.user.create({
            data: {
              name: request.name,
              email: request.email,
              password: request.passwordHash,
              roleId: studentRole.id,
            },
          });
        }

        // Crear o actualizar perfil de investigador
        await tx.researcherProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            researcherType: request.researcherType,
            affiliation: request.affiliation,
          },
          update: {
            researcherType: request.researcherType,
            affiliation: request.affiliation,
          },
        });
      }

      return tx.registrationRequest.update({
        where: { id },
        data: {
          status: decision,
          reviewedAt: new Date(),
          reviewedBy: adminId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          researcherType: true,
          affiliation: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
        },
      });
    });
  }
}
