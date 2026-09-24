import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { normalizeRole } from "../../common/auth/session.util";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(roleName?: string) {
    const whereClause: Record<string, unknown> = {};
    if (roleName) {
      whereClause.role = { name: roleName };
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      include: { role: true, researcherProfile: true },
      orderBy: { name: "asc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role.name),
      createdAt: u.createdAt,
      researcherType: u.researcherProfile?.researcherType,
      affiliation: u.researcherProfile?.affiliation,
    }));
  }

  async listAssignedStudents(evaluatorId: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: { teacherId: evaluatorId },
      include: {
        student: {
          include: { role: true, researcherProfile: true },
        },
      },
    });

    return assignments.map((a) => ({
      id: a.student.id,
      name: a.student.name,
      email: a.student.email,
      role: normalizeRole(a.student.role.name),
      createdAt: a.student.createdAt,
      researcherType: a.student.researcherProfile?.researcherType,
      affiliation: a.student.researcherProfile?.affiliation,
    }));
  }

  async getUserById(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, researcherProfile: true },
    });
    if (!u) throw new NotFoundException("Usuario no encontrado");
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role.name),
      createdAt: u.createdAt,
      researcherType: u.researcherProfile?.researcherType,
      affiliation: u.researcherProfile?.affiliation,
    };
  }
}
