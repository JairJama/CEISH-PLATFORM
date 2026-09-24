import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomInt } from "node:crypto";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AnnexDocumentService } from "../../common/annexes/annex-document.service";
import { MinioService } from "../../common/minio/minio.service";

export interface Annex27Input {
  researchType: string;
  location: string;
  responsibleInstitutions: string;
  principalInvestigatorId: string;
  principalInvestigatorDegree: string;
  criteria: Array<{
    indicator: string;
    answer: "yes" | "no";
    observations: string;
  }>;
}

@Injectable()
export class StratificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly annexDocumentService: AnnexDocumentService,
    private readonly minioService: MinioService,
  ) {}

  async listStratificationTasks(stratifierId: string) {
    const assignments = await this.prisma.stratificationAssignment.findMany({
      where: { stratifierId },
      include: {
        submission: {
          include: {
            student: true,
            documents: { orderBy: [{ uploadedAt: "asc" }, { id: "asc" }] },
            annexes: { where: { annexNumber: 11, status: { not: "voided" } } },
          },
        },
        annexes: {
          where: { annexNumber: { in: [23, 27] } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [
        { submission: { classificationStatus: "asc" } },
        { assignedAt: "desc" },
      ],
    });

    return assignments.map((sa) => {
      const activeAnnex11 = sa.submission.annexes?.[0];
      const annex23 = sa.annexes.find(
        (a) => a.annexNumber === 23 && a.status === "completed",
      );
      const annex27 = sa.annexes.find(
        (a) => a.annexNumber === 27 && a.status !== "voided",
      );

      const conflictData = (annex23?.data as Record<string, unknown>) ?? null;
      const hasConflict = conflictData
        ? (conflictData.hasConflict as boolean)
        : null;

      return {
        id: sa.id,
        submission_id: sa.submissionId,
        stratifier_id: sa.stratifierId,
        round_number: sa.roundNumber,
        risk_level: sa.riskLevel,
        assigned_at: sa.assignedAt,
        decided_at: sa.decidedAt,
        research_code: sa.submission.researchCode,
        title: sa.submission.title,
        document_name: sa.submission.documentName,
        researcher_name: sa.submission.student.name,
        researcher_email: sa.submission.student.email,
        classification_status: sa.submission.classificationStatus,
        final_risk_level: sa.submission.riskLevel,
        documents: sa.submission.documents.map((d) => ({
          id: d.id,
          submission_id: d.submissionId,
          document_name: d.documentName,
          document_path: d.documentPath,
          mime_type: d.mimeType,
          size_bytes: Number(d.sizeBytes),
          uploaded_at: d.uploadedAt,
        })),
        annex_11_id: activeAnnex11?.id ?? null,
        annex_11_status: activeAnnex11?.status ?? null,
        annex_11_data: (activeAnnex11?.data as Record<string, unknown>) ?? null,
        annex_23_id: annex23?.id ?? null,
        has_conflict: hasConflict,
        conflict_data: conflictData,
        annex_27_id: annex27?.id ?? null,
        annex_27_status: annex27?.status ?? null,
        annex_27_data: (annex27?.data as Record<string, unknown>) ?? null,
      };
    });
  }

  async updateAnnex11(
    assignmentId: string,
    stratifierId: string,
    data: Record<string, unknown>,
  ) {
    const assignment = await this.prisma.stratificationAssignment.findFirst({
      where: { id: assignmentId, stratifierId },
    });
    if (!assignment) throw new NotFoundException("Asignación no encontrada");

    const draft = await this.prisma.researchAnnex.findFirst({
      where: {
        submissionId: assignment.submissionId,
        annexNumber: 11,
        status: "draft",
      },
    });
    if (!draft) throw new NotFoundException("Anexo 11 no encontrado");

    const mergedData = { ...(draft.data as Record<string, unknown>), ...data };
    await this.prisma.researchAnnex.update({
      where: { id: draft.id },
      data: { data: mergedData as any, updatedAt: new Date() },
    });

    return { message: "Borrador del Anexo 11 guardado" };
  }

  async declareConflict(
    assignmentId: string,
    stratifierId: string,
    input: { placeDate: string; hasConflict: boolean; details: string },
  ) {
    const assignment = await this.prisma.stratificationAssignment.findFirst({
      where: { id: assignmentId, stratifierId },
      include: { submission: true, stratifier: true },
    });
    if (!assignment) throw new NotFoundException("Asignación no encontrada");
    if (
      ["classified", "cancelled"].includes(
        assignment.submission.classificationStatus,
      )
    ) {
      throw new ConflictException("Esta investigación ya fue clasificada");
    }

    const annex23 = await this.prisma.researchAnnex.create({
      data: {
        submissionId: assignment.submissionId,
        assignmentId: assignment.id,
        annexNumber: 23,
        status: "completed",
        data: {
          placeDate: input.placeDate,
          hasConflict: input.hasConflict,
          details: input.details,
          memberName: assignment.stratifier.name,
          researchCode: assignment.submission.researchCode,
          researchTitle: assignment.submission.title,
        },
        createdBy: stratifierId,
        completedBy: stratifierId,
        completedAt: new Date(),
      },
    });

    // Generar documento Word del Anexo 23 y subirlo a MinIO
    await this.regenerateAnnexDocx(annex23.id);

    if (!input.hasConflict) {
      // Crear borrador del Anexo 27 si no existe
      const existing27 = await this.prisma.researchAnnex.findFirst({
        where: {
          assignmentId: assignment.id,
          annexNumber: 27,
          status: { not: "voided" },
        },
      });
      if (!existing27) {
        await this.prisma.researchAnnex.create({
          data: {
            submissionId: assignment.submissionId,
            assignmentId: assignment.id,
            annexNumber: 27,
            status: "draft",
            data: {},
            createdBy: stratifierId,
          },
        });
      }

      return {
        result: "cleared",
        message: "Anexo 23 registrado. Ya puedes completar el Anexo 27.",
      };
    }

    // Hay conflicto: Reasignar a otro evaluador
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { not: stratifierId },
        role: {
          name: {
            in: [
              "teacher",
              "evaluator",
              "member",
              "miembro",
              "ceish",
              "ceish_member",
              "miembro_ceish",
            ],
          },
        },
      },
      include: {
        stratificationTasks: {
          include: { submission: true },
        },
      },
    });

    // Excluir miembros que ya hayan tenido conflicto en esta investigación
    const conflictedUsers = await this.prisma.researchAnnex.findMany({
      where: {
        submissionId: assignment.submissionId,
        annexNumber: 23,
        status: "completed",
      },
      select: { completedBy: true, data: true },
    });
    const excludedIds = new Set(
      conflictedUsers
        .filter(
          (c) =>
            (c.data as Record<string, unknown>)?.hasConflict === true &&
            c.completedBy,
        )
        .map((c) => c.completedBy as string),
    );
    excludedIds.add(stratifierId);

    const eligible = candidates.filter((c) => !excludedIds.has(c.id));

    if (eligible.length === 0) {
      await this.prisma.submission.update({
        where: { id: assignment.submissionId },
        data: { classificationStatus: "awaiting-assignment" },
      });
      return {
        result: "unavailable",
        message:
          "Conflicto registrado, pero no hay otro miembro CEISH disponible.",
      };
    }

    const loads = eligible.map((m) => {
      const activeCount = m.stratificationTasks.filter(
        (st) =>
          !["classified", "cancelled"].includes(
            st.submission.classificationStatus,
          ),
      ).length;
      return { id: m.id, activeCount };
    });
    const minLoad = Math.min(...loads.map((l) => l.activeCount));
    const bestCandidates = loads.filter((l) => l.activeCount === minLoad);
    const selected = bestCandidates[randomInt(bestCandidates.length)];

    await this.prisma.stratificationAssignment.update({
      where: { id: assignment.id },
      data: {
        stratifierId: selected.id,
        assignedAt: new Date(),
        riskLevel: null,
        decidedAt: null,
      },
    });

    await this.prisma.submission.update({
      where: { id: assignment.submissionId },
      data: { classificationStatus: "awaiting-first" },
    });

    return {
      result: "reassigned",
      message:
        "Conflicto registrado. La investigación fue reasignada a otro miembro CEISH.",
    };
  }

  async saveStratificationDecision(
    assignmentId: string,
    stratifierId: string,
    annex: Annex27Input,
  ) {
    const assignment = await this.prisma.stratificationAssignment.findFirst({
      where: { id: assignmentId, stratifierId },
      include: {
        submission: true,
        annexes: { where: { annexNumber: { in: [23, 27] } } },
      },
    });
    if (!assignment) throw new NotFoundException("Asignación no encontrada");
    if (assignment.submission.classificationStatus === "cancelled") {
      throw new ConflictException(
        "Esta investigación ya fue clasificada o cancelada",
      );
    }

    const clearedConflict = assignment.annexes.find(
      (a) =>
        a.annexNumber === 23 &&
        a.status === "completed" &&
        (a.data as Record<string, unknown>)?.hasConflict === false,
    );
    if (!clearedConflict) {
      throw new ConflictException(
        "Primero debes completar el Anexo 23 sin conflicto de interés",
      );
    }

    const annex27 = assignment.annexes.find(
      (a) => a.annexNumber === 27 && a.status !== "voided",
    );
    if (!annex27) {
      throw new ConflictException("No se encontró el borrador del Anexo 27");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.researchAnnex.update({
        where: { id: annex27.id },
        data: {
          status: "completed",
          data: { ...annex, finalRiskLevel: "no-risk" },
          completedBy: stratifierId,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.stratificationAssignment.update({
        where: { id: assignment.id },
        data: { riskLevel: "no-risk", decidedAt: new Date() },
      });

      await tx.submission.update({
        where: { id: assignment.submissionId },
        data: {
          classificationStatus: "classified",
          riskLevel: "no-risk",
          classifiedAt: new Date(),
        },
      });

      // Crear caso de calificación
      let qualCase = await tx.qualificationCase.findUnique({
        where: { submissionId: assignment.submissionId },
      });
      if (!qualCase) {
        qualCase = await tx.qualificationCase.create({
          data: {
            submissionId: assignment.submissionId,
            qualifierId: stratifierId,
          },
        });
        await tx.qualificationCycle.create({
          data: {
            qualificationId: qualCase.id,
            cycleNumber: 1,
          },
        });
      }
    });

    // Generar DOCX del Anexo 27
    await this.regenerateAnnexDocx(annex27.id);

    return {
      result: "classified",
      message: "Anexo 27 completado: investigación clasificada sin riesgo",
    };
  }

  async regenerateAnnexDocx(annexId: string) {
    const annex = await this.prisma.researchAnnex.findUnique({
      where: { id: annexId },
      include: {
        submission: {
          include: {
            student: true,
            documents: { orderBy: [{ uploadedAt: "asc" }, { id: "asc" }] },
          },
        },
        assignment: { include: { stratifier: true } },
      },
    });
    if (!annex) return null;

    let memberName = "Miembro CEISH-Uleam";
    if (annex.completedBy) {
      const member = await this.prisma.user.findUnique({
        where: { id: annex.completedBy },
      });
      if (member) memberName = member.name;
    } else if (annex.assignment?.stratifier) {
      memberName = annex.assignment.stratifier.name;
    }

    const generated = await this.annexDocumentService.generateAnnexDocx({
      annexNumber: annex.annexNumber as any,
      researchCode: annex.submission.researchCode,
      title: annex.submission.title,
      researcherName: annex.submission.student.name,
      memberName,
      data: annex.data as Record<string, unknown>,
      documents: annex.submission.documents.map((d) => ({
        name: d.documentName,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
    });

    const docName = `Anexo-${annex.annexNumber}-${annex.submission.researchCode}.docx`;
    const docPath = `documents/annexes/${annex.id}/${docName}`;
    await this.minioService.uploadAnnexDocx(generated, docPath);

    return this.prisma.researchAnnex.update({
      where: { id: annex.id },
      data: {
        documentName: docName,
        documentPath: docPath,
        documentUpdatedAt: new Date(),
      },
    });
  }
}
