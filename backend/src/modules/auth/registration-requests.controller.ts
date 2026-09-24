import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from "@nestjs/common";
import { IsIn } from "class-validator";
import { RegistrationRequestsService } from "./registration-requests.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser, Roles } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";

class ReviewDecisionDto {
  @IsIn(["approved", "rejected"])
  decision!: "approved" | "rejected";
}

@Controller("registration-requests")
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class RegistrationRequestsController {
  constructor(private readonly requestsService: RegistrationRequestsService) {}

  @Get()
  @Roles("admin")
  async listRequests() {
    return this.requestsService.listRequests();
  }

  @Patch(":id")
  @Roles("admin")
  async reviewRequest(
    @Param("id") id: string,
    @Body() body: ReviewDecisionDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.requestsService.reviewRequest(id, body.decision, user.id);
  }
}
