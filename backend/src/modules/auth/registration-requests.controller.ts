import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { RegistrationRequestsService } from "./registration-requests.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser, Roles } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";

class ReviewDecisionDto {
  decision!: "approved" | "rejected";
}

@Controller("registration-requests")
@UseGuards(AuthGuard, RolesGuard)
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
    if (body.decision !== "approved" && body.decision !== "rejected") {
      throw new BadRequestException("La decisión debe ser approved o rejected");
    }
    return this.requestsService.reviewRequest(id, body.decision, user.id);
  }
}
