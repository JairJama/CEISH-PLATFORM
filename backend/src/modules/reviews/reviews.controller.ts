import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ReviewsService, SaveReviewInput } from "./reviews.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser, Roles } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";
import { SubmissionsService } from "../submissions/submissions.service";

class CreateReviewDto {
  submissionId!: string;
}

@Controller("reviews")
@UseGuards(AuthGuard, RolesGuard)
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly submissionsService: SubmissionsService,
  ) {}

  @Post()
  @Roles("evaluator")
  async getOrCreateReview(
    @Body() body: CreateReviewDto,
    @CurrentUser() user: SessionUser,
  ) {
    if (!body.submissionId)
      throw new BadRequestException("submissionId es requerido");
    const canAccess = await this.submissionsService.canAccessSubmission(
      user.id,
      user.role,
      body.submissionId,
    );
    if (!canAccess)
      throw new ForbiddenException(
        "No tienes una asignación para esta entrega",
      );

    return this.reviewsService.getOrCreateReview(body.submissionId, user.id);
  }

  @Get(":submissionId")
  async getReview(
    @Param("submissionId") submissionId: string,
    @CurrentUser() user: SessionUser,
  ) {
    const canAccess = await this.submissionsService.canAccessSubmission(
      user.id,
      user.role,
      submissionId,
    );
    if (!canAccess)
      throw new ForbiddenException(
        "No tienes permiso para consultar esta revisión",
      );

    const rev = await this.reviewsService.getReviewBySubmission(submissionId);
    return rev;
  }

  @Put(":reviewId")
  @Roles("evaluator")
  async saveReview(
    @Param("reviewId") reviewId: string,
    @Body() body: SaveReviewInput,
    @CurrentUser() user: SessionUser,
  ) {
    const rev = await this.reviewsService.getReviewBySubmission(
      body.submissionId,
    );
    if (!rev || rev.id !== reviewId || rev.reviewer_id !== user.id) {
      throw new ForbiddenException("No puedes modificar esta revisión");
    }
    return this.reviewsService.saveReview(body);
  }
}
