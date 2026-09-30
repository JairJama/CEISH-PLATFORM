import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  QualificationsService,
  QualificationReviewInput,
} from "./qualifications.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser, Roles } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";
import { MinioService } from "../../common/minio/minio.service";

class SubmitCorrectionBodyDto {
  documentName!: string;
  documentPath!: string;
}

@Controller()
@UseGuards(AuthGuard, RolesGuard)
export class QualificationsController {
  constructor(
    private readonly qualificationsService: QualificationsService,
    private readonly minioService: MinioService,
  ) {}

  @Get("qualifications")
  @Roles("evaluator")
  async listTasks(@CurrentUser() user: SessionUser) {
    return this.qualificationsService.listTasks(user.id);
  }

  @Patch("qualifications/:id/review")
  @Roles("evaluator")
  async reviewQualification(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: QualificationReviewInput,
  ) {
    if (
      !["approved", "corrections-required", "cancelled"].includes(body.decision)
    ) {
      throw new BadRequestException(
        "Selecciona una decisión válida para la evaluación",
      );
    }
    if (body.decision !== "approved" && !body.observations?.trim()) {
      throw new BadRequestException("Describe las observaciones encontradas");
    }
    if (!Array.isArray(body.checklist)) {
      throw new BadRequestException(
        "Completa el checklist institucional del Anexo 12",
      );
    }
    return this.qualificationsService.reviewQualification(id, user.id, body);
  }

  @Post("qualifications/:id/corrections")
  @Roles("student")
  @HttpCode(HttpStatus.CREATED)
  async submitCorrection(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: SubmitCorrectionBodyDto,
  ) {
    if (!body.documentName?.trim() || !body.documentPath?.trim()) {
      throw new BadRequestException("El informe de correcciones es requerido");
    }
    return this.qualificationsService.submitCorrection(
      id,
      user.id,
      body.documentName.trim(),
      body.documentPath.trim(),
    );
  }

  @Get("qualification-corrections/:id")
  async getCorrectionDocument(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
  ) {
    const doc = await this.qualificationsService.getCorrectionDocument(id);
    if (!doc)
      throw new NotFoundException("Informe de correcciones no encontrado");

    const allowed =
      user.role === "admin" ||
      user.id === doc.researcherId ||
      user.id === doc.qualifierId;
    if (!allowed) {
      throw new ForbiddenException(
        "No tienes permiso para consultar este informe",
      );
    }

    const url = await this.minioService.getPresignedUrl(doc.documentPath);
    return { url };
  }
}
