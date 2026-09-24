import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AnnexDocumentService } from "../../common/annexes/annex-document.service";
import { MinioService } from "../../common/minio/minio.service";
import {
  ANNEX_12_CRITERIA,
  Annex12ChecklistItem,
  Annex12CriterionResult,
} from "../../common/annexes/annex12.constants";

export type QualificationReviewDecision =
  | "approved"
  | "corrections-required"
  | "cancelled";

export interface QualificationReviewInput {
  decision: QualificationReviewDecision;
  observations: string;
  checklist: Array<{
    id: string;
    result: Annex12CriterionResult;
    observations: string;
  }>;
}

@Injectable()
export class QualificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly annexDocumentService: AnnexDocumentService,
    private readonly minioService: MinioService,
  ) {}

  private normalizeChecklist(
    input: QualificationReviewInput["checklist"],
  ): Annex12ChecklistItem[] | null {
    const allowedResults = new Set<Annex12CriterionResult>([
      "complies",
      "does-not-comply",
    ]);
    const byId = new Map(input.map((item) => [item.id, item]));
    if (
      byId.size !== ANNEX_12_CRITERIA.length ||
      input.length !== ANNEX_12_CRITERIA.length
    )
      return null;

    const normalized: Annex12ChecklistItem[] = [];
    for (const definition of ANNEX_12_CRITERIA) {
      const item = byId.get(definition.id);
      if (!item || !allowedResults.has(item.result)) return null;
      normalized.push({
        ...definition,
        result: item.result,
        observations: String(item.observations ?? "").trim(),
      });
    }
    return normalized;
  }

  async expireOverdueQualifications() {
    const now = new Date();
    const overdueCycles = await this.prisma.qualificationCycle.findMany({
      where: {
        correctionDueAt: { lt: now },
        qualification: { status: "corrections-required" },
      },
      include: { qualification: true },
    });

    for (const cycle of overdueCycles) {
      if (cycle.cycleNumber === cycle.qualification.currentCycle) {
        await this.prisma.qualificationCase.update({
          where: { id: cycle.qualificationId },
          data: {
            status: "expired",
            updatedAt: now,
            completedAt: now,
          },
        });
      }
    }
  }

  async ensureQualificationCasesForNoRiskResearch() {
    const noRiskSubmissions = await this.prisma.submission.findMany({
      where: {
        classificationStatus: "classified",
        riskLevel: "no-risk",
        qualificationCase: null,
      },
      include: {
        stratifications: { where: { roundNumber: 1 } },
      },
    });

    for (const sub of noRiskSubmissions) {
      const stratifierId = sub.stratifications[0]?.stratifierId;
      if (stratifierId) {
        const qc = await this.prisma.qualificationCase.create({
          data: {
            submissionId: sub.id,
            qualifierId: stratifierId,
          },
        });
        await this.prisma.qualificationCycle.create({
          data: {
            qualificationId: qc.id,
            cycleNumber: 1,
          },
        });
      }
    }
  }

  async listTasks(qualifierId: string) {
    await this.ensureQualificationCasesForNoRiskResearch();
    await this.expireOverdueQualifications();

    const cases = await this.prisma.qualificationCase.findMany({
      where: { qualifierId },
      include: {
        submission: {
          include: {
            student: true,
            annexes: {
              where: {
                annexNumber: { in: [11, 12, 13] },
                status: "completed",
              },
              include: { qualificationCycle: true },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            },
          },
        },
        cycles: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return cases.map((qc) => {
      const currentCycle = qc.cycles.find(
        (c) => c.cycleNumber === qc.currentCycle,
      );
      const annexes = qc.submission.annexes
        .filter((a) => a.annexNumber !== 11 || a.qualificationCycleId !== null)
        .map((a) => {
          const data = (a.data as Record<string, unknown>) ?? {};
          return {
            id: a.id,
            annexNumber: a.annexNumber as 11 | 12 | 13,
            cycleNumber: a.qualificationCycle?.cycleNumber ?? null,
            revisionNumber: (data.revisionNumber as number) ?? null,
            decision: (data.decision as string) ?? null,
            createdAt: a.createdAt,
            documentName: a.documentName ?? `Anexo-${a.annexNumber}.docx`,
            documentReady: !!a.documentPath,
          };
        });

      return {
        id: qc.id,
        submission_id: qc.submissionId,
        qualifier_id: qc.qualifierId,
        status: qc.status,
        current_cycle: qc.currentCycle,
        updated_at: qc.updatedAt,
        document_name: qc.submission.documentName,
        researcher_name: qc.submission.student.name,
        researcher_email: qc.submission.student.email,
        cycle_id: currentCycle?.id ?? "",
        cycle_status: currentCycle?.status ?? "",
        observations: currentCycle?.observations ?? "",
        correction_due_at: currentCycle?.correctionDueAt ?? null,
        correction_document_name: currentCycle?.correctionDocumentName ?? null,
        correction_submitted_at: currentCycle?.correctionSubmittedAt ?? null,
        annexes,
      };
    });
  }

  async reviewQualification(
    qualificationId: string,
    qualifierId: string,
    input: QualificationReviewInput,
  ) {
    const checklist = this.normalizeChecklist(input.checklist);
    if (!checklist) {
      throw new BadRequestException(
        "Completa todos los criterios del checklist",
      );
    }
    const observations = input.observations.trim();
    const hasObservations = input.decision !== "approved";

    if (
      hasObservations &&
      (!observations || !checklist.some((i) => i.result === "does-not-comply"))
    ) {
      throw new BadRequestException(
        "Completa todos los criterios y mantén la decisión consistente con el checklist",
      );
    }
    if (
      !hasObservations &&
      checklist.some((i) => i.result === "does-not-comply")
    ) {
      throw new BadRequestException(
        "Completa todos los criterios y mantén la decisión consistente con el checklist",
      );
    }

    const outcome = await this.prisma.$transaction(async (tx) => {
      const qc = await tx.qualificationCase.findUnique({
        where: { id: qualificationId },
        include: {
          submission: {
            include: {
              student: { include: { researcherProfile: true } },
            },
          },
          cycles: true,
        },
      });

      if (!qc) throw new NotFoundException("Calificación no encontrada");
      if (qc.qualifierId !== qualifierId) {
        throw new ForbiddenException(
          "Esta evaluación fue reasignada a otro miembro CEISH",
        );
      }
      if (!["pending-review", "resubmitted"].includes(qc.status)) {
        throw new ConflictException(
          "Esta investigación no está disponible para revisión",
        );
      }
      if (input.decision === "cancelled" && qc.status !== "resubmitted") {
        throw new ConflictException(
          "El evaluador solo puede cerrar el caso después de recibir correcciones",
        );
      }

      const currentCycle = qc.cycles.find(
        (c) => c.cycleNumber === qc.currentCycle,
      );
      if (!currentCycle)
        throw new NotFoundException("Ciclo de calificación no encontrado");

      let annexCycleId = currentCycle.id;
      let annexCycleNumber = qc.currentCycle;
      const now = new Date();

      if (input.decision === "approved") {
        await tx.qualificationCycle.update({
          where: { id: currentCycle.id },
          data: { status: "approved", observations: "", reviewedAt: now },
        });
        await tx.qualificationCase.update({
          where: { id: qc.id },
          data: { status: "approved", updatedAt: now, completedAt: now },
        });
      } else if (input.decision === "cancelled") {
        await tx.qualificationCycle.update({
          where: { id: currentCycle.id },
          data: { status: "reviewed", observations, reviewedAt: now },
        });
        await tx.qualificationCase.update({
          where: { id: qc.id },
          data: {
            status: "cancelled",
            updatedAt: now,
            cancelledAt: now,
            completedAt: now,
          },
        });
      } else {
        // corrections-required
        if (qc.status === "resubmitted") {
          await tx.qualificationCycle.update({
            where: { id: currentCycle.id },
            data: { status: "reviewed", reviewedAt: now },
          });

          const nextCycleNumber = qc.currentCycle + 1;
          const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const newCycle = await tx.qualificationCycle.create({
            data: {
              qualificationId: qc.id,
              cycleNumber: nextCycleNumber,
              status: "corrections-required",
              observations,
              correctionDueAt: due,
              reviewedAt: now,
            },
          });
          annexCycleId = newCycle.id;
          annexCycleNumber = nextCycleNumber;

          await tx.qualificationCase.update({
            where: { id: qc.id },
            data: {
              status: "corrections-required",
              currentCycle: nextCycleNumber,
              updatedAt: now,
            },
          });
        } else {
          const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await tx.qualificationCycle.update({
            where: { id: currentCycle.id },
            data: {
              status: "corrections-required",
              observations,
              correctionDueAt: due,
              reviewedAt: now,
            },
          });
          await tx.qualificationCase.update({
            where: { id: qc.id },
            data: { status: "corrections-required", updatedAt: now },
          });
        }
      }

      // Conteo de revisiones previas del Anexo 12
      const priorCount = await tx.researchAnnex.count({
        where: {
          submissionId: qc.submissionId,
          annexNumber: 12,
          status: { not: "voided" },
        },
      });
      const revisionNumber = priorCount + 1;
      const affiliation =
        qc.submission.student.researcherProfile?.affiliation ?? "";

      const annex12Data = {
        revisionNumber,
        cycleNumber: annexCycleNumber,
        decision: input.decision,
        hasObservations,
        generalObservations: observations,
        checklist,
        affiliation,
        researchType: "Investigación sin riesgo",
        receivedAt: qc.submission.submittedAt.toISOString(),
        reviewedAt: now.toISOString(),
      };

      const annex12 = await tx.researchAnnex.create({
        data: {
          submissionId: qc.submissionId,
          qualificationCycleId: annexCycleId,
          annexNumber: 12,
          status: "completed",
          data: annex12Data as any,
          createdBy: qualifierId,
          completedBy: qualifierId,
          completedAt: now,
        },
      });

      const annexIds = [annex12.id];

      if (input.decision === "approved") {
        const draft11 = await tx.researchAnnex.findFirst({
          where: {
            submissionId: qc.submissionId,
            annexNumber: 11,
            status: "draft",
          },
        });

        if (draft11) {
          const merged11 = {
            ...(draft11.data as Record<string, unknown>),
            decision: "approved",
            reviewedAt: now.toISOString(),
            revisionNumber,
          };
          const updated11 = await tx.researchAnnex.update({
            where: { id: draft11.id },
            data: {
              status: "completed",
              qualificationCycleId: annexCycleId,
              completedBy: qualifierId,
              completedAt: now,
              updatedAt: now,
              data: merged11,
            },
          });
          annexIds.push(updated11.id);
        } else {
          const created11 = await tx.researchAnnex.create({
            data: {
              submissionId: qc.submissionId,
              qualificationCycleId: annexCycleId,
              annexNumber: 11,
              status: "completed",
              data: {
                decision: "approved",
                reviewedAt: now.toISOString(),
                revisionNumber,
              },
              createdBy: qualifierId,
              completedBy: qualifierId,
              completedAt: now,
            },
          });
          annexIds.push(created11.id);
        }
      }

      if (input.decision === "cancelled") {
        const annex13 = await tx.researchAnnex.create({
          data: {
            submissionId: qc.submissionId,
            qualificationCycleId: annexCycleId,
            annexNumber: 13,
            status: "completed",
            data: {
              revisionNumber,
              decision: "cancelled",
              affiliation,
              reviewedAt: now.toISOString(),
              generalObservations: observations,
            },
            createdBy: qualifierId,
            completedBy: qualifierId,
            completedAt: now,
          },
        });
        annexIds.push(annex13.id);
      }

      return { result: input.decision, annexIds };
    });

    // Regenerar documentos Word de los anexos emitidos
    await Promise.allSettled(
      outcome.annexIds.map((id) => this.regenerateAnnexDocx(id)),
    );

    let message =
      "Anexo 12 emitido; el investigador tiene 30 días para responder";
    if (outcome.result === "approved") {
      message = "Anexos 11 y 12 emitidos: investigación aprobada";
    } else if (outcome.result === "cancelled") {
      message = "Anexos 12 y 13 emitidos: caso cerrado por el evaluador";
    }

    return { result: outcome.result, message };
  }

  async submitCorrection(
    qualificationId: string,
    researcherId: string,
    documentName: string,
    documentPath: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const qc = await tx.qualificationCase.findUnique({
        where: { id: qualificationId },
        include: { submission: true, cycles: true },
      });
      if (!qc || qc.submission.studentId !== researcherId) {
        throw new NotFoundException("Calificación no encontrada");
      }
      if (qc.status !== "corrections-required") {
        throw new ConflictException(
          "La investigación no está esperando correcciones",
        );
      }

      const currentCycle = qc.cycles.find(
        (c) => c.cycleNumber === qc.currentCycle,
      );
      if (!currentCycle) throw new NotFoundException("Ciclo no encontrado");

      if (
        !currentCycle.correctionDueAt ||
        currentCycle.correctionDueAt.getTime() < Date.now()
      ) {
        await tx.qualificationCase.update({
          where: { id: qc.id },
          data: {
            status: "expired",
            updatedAt: new Date(),
            completedAt: new Date(),
          },
        });
        throw new GoneException(
          "El plazo de 30 días venció y la investigación fue anulada",
        );
      }

      await tx.qualificationCycle.update({
        where: { id: currentCycle.id },
        data: {
          status: "resubmitted",
          correctionDocumentName: documentName,
          correctionDocumentPath: documentPath,
          correctionSubmittedAt: new Date(),
        },
      });

      await tx.qualificationCase.update({
        where: { id: qc.id },
        data: { status: "resubmitted", updatedAt: new Date() },
      });

      return { message: "Informe enviado para una nueva revisión" };
    });
  }

  async getCorrectionDocument(cycleId: string) {
    const cycle = await this.prisma.qualificationCycle.findUnique({
      where: { id: cycleId },
      include: {
        qualification: {
          include: { submission: true },
        },
      },
    });
    if (!cycle || !cycle.correctionDocumentPath) return null;

    return {
      documentPath: cycle.correctionDocumentPath,
      submissionId: cycle.qualification.submissionId,
      researcherId: cycle.qualification.submission.studentId,
      qualifierId: cycle.qualification.qualifierId,
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

    const revision =
      annex.annexNumber === 12 &&
      typeof (annex.data as any)?.revisionNumber === "number"
        ? `-Revision-${String((annex.data as any).revisionNumber).padStart(2, "0")}`
        : "";
    const docName = `Anexo-${annex.annexNumber}-${annex.submission.researchCode}${revision}.docx`;
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
