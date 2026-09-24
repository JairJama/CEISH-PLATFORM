import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SubmissionsService, UpdateSubmissionDto } from "./submissions.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser, Roles } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";

class CreateSubmissionBodyDto {
  title!: string;
  comment?: string;
  documents!: Array<{
    documentName: string;
    documentPath: string;
    mimeType: string;
    sizeBytes: number;
  }>;
}

@Controller("submissions")
@UseGuards(AuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  async getSubmissions(
    @CurrentUser() user: SessionUser,
    @Query("studentId") studentId?: string,
    @Query("all") all?: string,
  ) {
    if (user.role === "student") {
      return this.submissionsService.listSubmissionsByStudent(
        user.id,
        all === "true",
      );
    }
    if (user.role === "evaluator") {
      return this.submissionsService.listAssignedSubmissionsForEvaluator(
        user.id,
      );
    }
    // Admin
    if (studentId) {
      return this.submissionsService.listSubmissionsByStudent(
        studentId,
        all === "true",
      );
    }
    return this.submissionsService.listSubmissions();
  }

  @Post()
  @Roles("student")
  @HttpCode(HttpStatus.CREATED)
  async createSubmission(
    @CurrentUser() user: SessionUser,
    @Body() body: CreateSubmissionBodyDto,
  ) {
    if (!body.title || !body.documents || !body.documents.length) {
      throw new BadRequestException(
        "El título y al menos un documento Word válido son requeridos",
      );
    }
    return this.submissionsService.createSubmission({
      studentId: user.id,
      title: body.title,
      comment: body.comment,
      documents: body.documents,
    });
  }

  @Get(":id")
  async getSubmission(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
  ) {
    const canAccess = await this.submissionsService.canAccessSubmission(
      user.id,
      user.role,
      id,
    );
    if (!canAccess)
      throw new ForbiddenException(
        "No tienes permiso para consultar esta entrega",
      );

    const sub = await this.submissionsService.getSubmissionById(id);
    if (!sub) throw new NotFoundException("Entrega no encontrada");
    return sub;
  }

  @Patch(":id")
  @Roles("student")
  async updateSubmission(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: UpdateSubmissionDto,
  ) {
    return this.submissionsService.updateSubmission(id, body, user.id);
  }

  @Delete(":id")
  @Roles("student")
  async deleteSubmission(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.submissionsService.deleteSubmission(id, user.id);
  }
}
