import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

const STAGE_TEMPLATE = [
  {
    name: "Estructura",
    criteria: [
      "El documento contiene una introducción clara",
      "Los objetivos están claramente definidos",
      "La hipótesis o pregunta de investigación está planteada",
    ],
  },
  {
    name: "Metodología",
    criteria: [
      "La metodología es apropiada para el tipo de investigación",
      "La población de estudio está correctamente definida",
      "Los instrumentos de recolección están descritos",
    ],
  },
  {
    name: "Resultados",
    criteria: [
      "Los resultados se presentan de forma clara y ordenada",
      "El análisis estadístico es correcto y justificado",
      "Las conclusiones responden a los objetivos planteados",
    ],
  },
  {
    name: "Formato",
    criteria: [
      "Las referencias bibliográficas están en formato APA",
      "El documento cumple con los criterios de extensión mínima",
    ],
  },
];

export interface SaveReviewInput {
  submissionId: string;
  comment?: string;
  grade?: number;
  status?: string;
  stages?: Array<{
    id: string;
    stage_number: number;
    status: string;
    criteria?: Array<{
      id: string;
      status: string;
      comment?: string;
      pageNumber?: number;
    }>;
  }>;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapReview(rev: any) {
    if (!rev) return null;
    return {
      id: rev.id,
      submission_id: rev.submissionId,
      student_id: rev.submission.studentId,
      reviewer_id: rev.reviewerId,
      reviewer_name: rev.reviewer.name,
      comment: rev.comment,
      grade: rev.grade ? Number(rev.grade) : null,
      status: rev.status,
      created_at: rev.createdAt,
      stages: (rev.stages ?? []).map((st: any) => ({
        id: st.id,
        stage_number: st.stageNumber,
        status: st.status,
        completed_at: st.completedAt,
        criteria: (st.criteria ?? []).map((cr: any) => ({
          id: cr.id,
          criterion: cr.criterion,
          status: cr.status,
          comment: cr.comment,
          annotations: (cr.annotations ?? []).map((an: any) => ({
            id: an.id,
            page_number: an.pageNumber,
            x: Number(an.x),
            y: Number(an.y),
            width: Number(an.width),
            height: Number(an.height),
            comment: an.comment,
          })),
        })),
      })),
    };
  }

  async getReviewBySubmission(submissionId: string) {
    const rev = await this.prisma.review.findUnique({
      where: { submissionId },
      include: {
        reviewer: true,
        submission: true,
        stages: {
          orderBy: { stageNumber: "asc" },
          include: {
            criteria: {
              include: { annotations: true },
            },
          },
        },
      },
    });
    return this.mapReview(rev);
  }

  async getOrCreateReview(submissionId: string, reviewerId: string) {
    const rev = await this.getReviewBySubmission(submissionId);
    if (rev) return rev;

    await this.prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          submissionId,
          reviewerId,
          status: "in-progress",
        },
      });

      for (let i = 0; i < STAGE_TEMPLATE.length; i++) {
        const stageNum = i + 1;
        const stageStatus = i === 0 ? "in-progress" : "pending";
        const template = STAGE_TEMPLATE[i];

        const createdStage = await tx.reviewStage.create({
          data: {
            reviewId: createdReview.id,
            stageNumber: stageNum,
            status: stageStatus,
          },
        });

        for (const critText of template.criteria) {
          await tx.criteriaEvaluation.create({
            data: {
              stageId: createdStage.id,
              criterion: critText,
              status: "pending",
              comment: "",
            },
          });
        }
      }

      await tx.submission.update({
        where: { id: submissionId },
        data: { status: "submitted" },
      });
    });

    return this.getReviewBySubmission(submissionId);
  }

  async saveReview(input: SaveReviewInput) {
    const review = await this.prisma.review.findUnique({
      where: { submissionId: input.submissionId },
    });
    if (!review) throw new NotFoundException("Revisión no encontrada");

    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: review.id },
        data: {
          comment: input.comment ?? undefined,
          grade: input.grade !== undefined ? input.grade : undefined,
          status: input.status ?? undefined,
        },
      });

      if (input.stages) {
        for (const st of input.stages) {
          await tx.reviewStage.update({
            where: { id: st.id },
            data: {
              status: st.status,
              completedAt: st.status === "completed" ? new Date() : null,
            },
          });

          if (st.criteria) {
            for (const cr of st.criteria) {
              await tx.criteriaEvaluation.update({
                where: { id: cr.id },
                data: {
                  status: cr.status,
                  comment: cr.comment ?? undefined,
                },
              });

              if (
                cr.pageNumber !== undefined &&
                cr.pageNumber !== null &&
                cr.pageNumber >= 1
              ) {
                await tx.annotation.deleteMany({
                  where: { criteriaEvaluationId: cr.id },
                });
                await tx.annotation.create({
                  data: {
                    criteriaEvaluationId: cr.id,
                    pageNumber: cr.pageNumber,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    comment: cr.comment ?? "",
                  },
                });
              }
            }
          }
        }
      }

      if (input.status === "completed") {
        await tx.submission.update({
          where: { id: input.submissionId },
          data: {
            status: "reviewed",
            reviewedAt: new Date(),
            grade: input.grade ?? undefined,
            finalComment: input.comment ?? undefined,
          },
        });
      }
    });

    return { ok: true };
  }
}
