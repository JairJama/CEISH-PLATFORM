import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

type RegistrationRequestRecord = {
  id: string;
  name: string;
  email: string;
  researcherType: string;
  affiliation: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
};

function mapRegistrationRequest(request: RegistrationRequestRecord) {
  return {
    id: request.id,
    name: request.name,
    email: request.email,
    researcher_type: request.researcherType,
    affiliation: request.affiliation,
    status: request.status,
    created_at: request.createdAt,
    reviewed_at: request.reviewedAt,
  };
}

@Injectable()
export class RegistrationRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRequests() {
    const requests = await this.prisma.registrationRequest.findMany({
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
    return requests.map(mapRegistrationRequest);
  }

  async reviewRequest(
    id: string,
    decision: "approved" | "rejected",
    adminId: string,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
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

            // A request can never grant access to an already-existing account.
            const existingUser = await tx.user.findUnique({
              where: { email: request.email },
            });
            if (existingUser) {
              throw new ConflictException(
                "Ya existe una cuenta con el correo de esta solicitud",
              );
            }

            const user = await tx.user.create({
              data: {
                name: request.name,
                email: request.email,
                password: request.passwordHash,
                roleId: studentRole.id,
              },
            });

            await tx.researcherProfile.create({
              data: {
                userId: user.id,
                researcherType: request.researcherType,
                affiliation: request.affiliation,
              },
            });
          }

          const reviewed = await tx.registrationRequest.update({
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
          return mapRegistrationRequest(reviewed);
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error.code === "P2002" || error.code === "P2034")
      ) {
        throw new ConflictException(
          "La solicitud fue procesada por otra operación o ya existe una cuenta",
        );
      }
      throw error;
    }
  }
}
