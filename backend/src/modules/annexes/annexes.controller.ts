import {
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MinioService } from "../../common/minio/minio.service";
import { AnnexDocumentService } from "../../common/annexes/annex-document.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";

@Controller("annexes")
@UseGuards(AuthGuard, RolesGuard)
export class AnnexesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
    private readonly annexDocumentService: AnnexDocumentService,
  ) {}

  @Get(":id/document")
  async getAnnexDocument(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
  ) {
    let annex = await this.prisma.researchAnnex.findUnique({
      where: { id },
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

    if (!annex) throw new NotFoundException("Anexo no encontrado");
    if (annex.status !== "completed") {
      throw new ConflictException("El anexo todavía no ha sido emitido");
    }

    const qualCase = await this.prisma.qualificationCase.findUnique({
      where: { submissionId: annex.submissionId },
    });

    const isAssignedMember =
      user.role === "evaluator" &&
      (user.id === annex.completedBy ||
        user.id === annex.assignment?.stratifierId ||
        user.id === qualCase?.qualifierId);

    const isResearcherWithExemption =
      user.role === "student" &&
      user.id === annex.submission.studentId &&
      annex.annexNumber === 11;

    if (
      user.role !== "admin" &&
      !isAssignedMember &&
      !isResearcherWithExemption
    ) {
      throw new ForbiddenException(
        "No tienes permiso para consultar este anexo",
      );
    }

    // Si no tiene documentPath, generarlo
    if (!annex.documentPath) {
      let memberName = "Miembro CEISH-Uleam";
      if (annex.completedBy) {
        const m = await this.prisma.user.findUnique({
          where: { id: annex.completedBy },
        });
        if (m) memberName = m.name;
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

      annex = await this.prisma.researchAnnex.update({
        where: { id: annex.id },
        data: {
          documentName: docName,
          documentPath: docPath,
          documentUpdatedAt: new Date(),
        },
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
    }

    if (!annex.documentPath) {
      throw new NotFoundException(
        "No se pudo generar el documento Word del anexo",
      );
    }

    const url = await this.minioService.getPresignedUrl(annex.documentPath);
    return {
      url,
      documentName: annex.documentName,
    };
  }
}
