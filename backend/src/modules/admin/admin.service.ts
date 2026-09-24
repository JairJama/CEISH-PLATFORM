import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

const CEISH_INTERNAL_ROLES = [
  "teacher",
  "evaluator",
  "member",
  "miembro",
  "ceish",
  "ceish_member",
  "miembro_ceish",
];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdminResearch() {
    const submissions = await this.prisma.submission.findMany({
      include: {
        student: true,
        stratifications: {
          where: { roundNumber: 1 },
          include: { stratifier: true },
        },
        qualificationCase: {
          include: {
            qualifier: true,
            cycles: true,
          },
        },
        annexes: {
          where: {
            status: "completed",
            annexNumber: { in: [11, 12, 13, 23, 27] },
          },
          include: { qualificationCycle: true },
          orderBy: [{ annexNumber: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return submissions.map((s) => {
      const firstStrat = s.stratifications[0];
      const qualCase = s.qualificationCase;

      const annexes = s.annexes.map((a) => {
        const data = (a.data as Record<string, unknown>) ?? {};
        return {
          id: a.id,
          annexNumber: a.annexNumber as 11 | 12 | 13 | 23 | 27,
          cycleNumber: a.qualificationCycle?.cycleNumber ?? null,
          revisionNumber: (data.revisionNumber as number) ?? null,
          decision: (data.decision as string) ?? null,
          createdAt: a.createdAt,
          documentName: a.documentName ?? `Anexo-${a.annexNumber}.docx`,
          documentReady: !!a.documentPath,
        };
      });

      return {
        submission_id: s.id,
        document_name: s.documentName,
        submitted_at: s.submittedAt,
        researcher_name: s.student.name,
        researcher_email: s.student.email,
        classification_status: s.classificationStatus,
        risk_level: s.riskLevel,
        stratifier_id: firstStrat?.stratifierId ?? null,
        stratifier_name: firstStrat?.stratifier.name ?? null,
        stratifier_email: firstStrat?.stratifier.email ?? null,
        stratification_decided_at: firstStrat?.decidedAt ?? null,
        qualification_status: qualCase?.status ?? null,
        qualifier_id: qualCase?.qualifierId ?? null,
        qualifier_name: qualCase?.qualifier.name ?? null,
        qualifier_email: qualCase?.qualifier.email ?? null,
        annexes,
      };
    });
  }

  async reassignStratifier(submissionId: string, nextStratifierId: string) {
    const assignment = await this.prisma.stratificationAssignment.findFirst({
      where: { submissionId, roundNumber: 1 },
      include: { submission: true },
    });
    if (!assignment) throw new NotFoundException("Investigación no encontrada");
    if (
      assignment.submission.classificationStatus !== "awaiting-first" ||
      assignment.riskLevel !== null
    ) {
      throw new ConflictException(
        "No se puede reasignar una investigación que ya tiene dictamen",
      );
    }

    const member = await this.prisma.user.findFirst({
      where: {
        id: nextStratifierId,
        role: { name: { in: CEISH_INTERNAL_ROLES } },
      },
    });
    if (!member)
      throw new BadRequestException(
        "El usuario seleccionado no es miembro CEISH",
      );

    await this.prisma.stratificationAssignment.update({
      where: { id: assignment.id },
      data: {
        stratifierId: nextStratifierId,
        assignedAt: new Date(),
      },
    });

    return { message: "Estratificador reasignado" };
  }

  async reassignQualifier(submissionId: string, nextQualifierId: string) {
    const qualCase = await this.prisma.qualificationCase.findUnique({
      where: { submissionId },
    });
    if (!qualCase)
      throw new NotFoundException("Caso de evaluación no encontrado");
    if (["approved", "cancelled", "expired"].includes(qualCase.status)) {
      throw new ConflictException(
        "No se puede cambiar el evaluador de una investigación cerrada",
      );
    }

    const member = await this.prisma.user.findFirst({
      where: {
        id: nextQualifierId,
        role: { name: { in: CEISH_INTERNAL_ROLES } },
      },
    });
    if (!member)
      throw new BadRequestException(
        "El usuario seleccionado no es miembro CEISH interno",
      );

    await this.prisma.qualificationCase.update({
      where: { id: qualCase.id },
      data: {
        qualifierId: nextQualifierId,
        updatedAt: new Date(),
      },
    });

    return { message: "Evaluador reasignado" };
  }

  async cancelResearch(submissionId: string) {
    const sub = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { qualificationCase: true },
    });
    if (!sub) throw new NotFoundException("Investigación no encontrada");
    if (
      ["cancelled"].includes(sub.classificationStatus) ||
      sub.qualificationCase?.status === "approved"
    ) {
      throw new ConflictException("La investigación ya está cerrada");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submissionId },
        data: { classificationStatus: "cancelled" },
      });
      if (sub.qualificationCase) {
        await tx.qualificationCase.update({
          where: { id: sub.qualificationCase.id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    });

    return { message: "Investigación cancelada" };
  }

  // ── Assignments ─────────────────────────────────────────
  async listAssignments(teacherId?: string) {
    const whereClause: Record<string, unknown> = {};
    if (teacherId) whereClause.teacherId = teacherId;

    const list = await this.prisma.assignment.findMany({
      where: whereClause,
      include: { teacher: true, student: true },
      orderBy: { createdAt: "asc" },
    });

    return list.map((a) => ({
      id: a.id,
      teacher_id: a.teacherId,
      teacher_name: a.teacher.name,
      student_id: a.studentId,
      student_name: a.student.name,
      created_at: a.createdAt,
    }));
  }

  async createAssignment(teacherId: string, studentId: string) {
    if (teacherId === studentId) {
      throw new BadRequestException(
        "El profesor y el estudiante no pueden ser la misma persona",
      );
    }

    const assignment = await this.prisma.assignment.upsert({
      where: { teacherId_studentId: { teacherId, studentId } },
      create: { teacherId, studentId },
      update: { teacherId },
      include: { teacher: true, student: true },
    });

    return {
      id: assignment.id,
      teacher_id: assignment.teacherId,
      teacher_name: assignment.teacher.name,
      student_id: assignment.studentId,
      student_name: assignment.student.name,
      created_at: assignment.createdAt,
    };
  }

  async deleteAssignment(id: string) {
    await this.prisma.assignment.delete({ where: { id } });
    return { ok: true };
  }
}
