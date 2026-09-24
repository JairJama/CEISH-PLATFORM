import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  PayloadTooLargeException,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser, Roles } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";
import { MinioService } from "../../common/minio/minio.service";
import { SubmissionsService } from "./submissions.service";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

@Controller()
@UseGuards(AuthGuard, RolesGuard)
export class StorageController {
  constructor(
    private readonly minioService: MinioService,
    private readonly submissionsService: SubmissionsService,
  ) {}

  @Post("upload")
  @Roles("student")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No se recibió ningún archivo");
    }
    if (file.size > MAX_BYTES) {
      throw new PayloadTooLargeException(
        "El archivo supera el límite de 15 MB",
      );
    }
    const ext = file.originalname.toLowerCase().match(/\.(docx?|pdf)$/)?.[0];
    if (!ext) {
      throw new BadRequestException(
        "Solo se permiten documentos Word (.doc, .docx) o PDF",
      );
    }

    const mimeType =
      ext === ".docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : ext === ".doc"
          ? "application/msword"
          : "application/pdf";

    const documentPath = await this.minioService.uploadDocument(
      file.buffer,
      file.originalname,
      mimeType,
    );

    return {
      documentPath,
      documentName: file.originalname,
      mimeType,
      size: file.size,
    };
  }

  @Get("submission-documents/:id")
  async getSubmissionDocument(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
  ) {
    const doc = await this.submissionsService.getSubmissionDocument(id);
    if (!doc) throw new NotFoundException("Documento no encontrado");

    const canAccess = await this.submissionsService.canAccessSubmission(
      user.id,
      user.role,
      doc.submissionId,
    );
    if (!canAccess)
      throw new ForbiddenException(
        "No tienes permiso para consultar este documento",
      );

    const url = await this.minioService.getPresignedUrl(doc.documentPath);
    return { url };
  }

  @Get("documents/:id")
  async getDocumentUrl(
    @Param("id") submissionId: string,
    @CurrentUser() user: SessionUser,
  ) {
    const canAccess = await this.submissionsService.canAccessSubmission(
      user.id,
      user.role,
      submissionId,
    );
    if (!canAccess)
      throw new ForbiddenException(
        "No tienes permiso para consultar este documento",
      );

    const sub = await this.submissionsService.getSubmissionById(submissionId);
    if (!sub || !sub.document_path)
      throw new NotFoundException("La entrega no tiene documento asociado");

    const url = await this.minioService.getPresignedUrl(sub.document_path);
    return { url };
  }

  @Get("documents/:id/raw")
  async getDocumentRaw(
    @Param("id") submissionId: string,
    @CurrentUser() user: SessionUser,
    @Res() res: Response,
  ) {
    const canAccess = await this.submissionsService.canAccessSubmission(
      user.id,
      user.role,
      submissionId,
    );
    if (!canAccess)
      throw new ForbiddenException(
        "No tienes permiso para consultar este documento",
      );

    const sub = await this.submissionsService.getSubmissionById(submissionId);
    if (!sub || !sub.document_path)
      throw new NotFoundException("La entrega no tiene documento asociado");

    try {
      const stream = await this.minioService.getObjectStream(sub.document_path);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      (stream as any).pipe(res);
    } catch {
      throw new NotFoundException(
        "El documento no existe en el almacenamiento",
      );
    }
  }
}
