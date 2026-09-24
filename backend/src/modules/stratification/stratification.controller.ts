import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Annex27Input, StratificationService } from "./stratification.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser, Roles } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";

class ConflictBodyDto {
  placeDate!: string;
  hasConflict!: boolean;
  details?: string;
}

class Annex27BodyDto {
  annex27!: Annex27Input;
}

@Controller("stratifications")
@UseGuards(AuthGuard, RolesGuard)
export class StratificationController {
  constructor(private readonly stratificationService: StratificationService) {}

  @Get()
  @Roles("evaluator", "admin")
  async listTasks(@CurrentUser() user: SessionUser) {
    return this.stratificationService.listStratificationTasks(user.id);
  }

  @Patch(":id/annex-11")
  @Roles("evaluator")
  async updateAnnex11(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body("data") data: Record<string, unknown>,
  ) {
    if (!data || typeof data !== "object") {
      throw new BadRequestException("Los datos del Anexo 11 no son válidos");
    }
    return this.stratificationService.updateAnnex11(id, user.id, data);
  }

  @Post(":id/conflict")
  @Roles("evaluator")
  async declareConflict(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: ConflictBodyDto,
  ) {
    if (!body.placeDate?.trim() || typeof body.hasConflict !== "boolean") {
      throw new BadRequestException(
        "Completa el lugar, fecha y declaración de conflicto",
      );
    }
    return this.stratificationService.declareConflict(id, user.id, {
      placeDate: body.placeDate.trim(),
      hasConflict: body.hasConflict,
      details: body.details?.trim() ?? "",
    });
  }

  @Patch(":id")
  @Roles("evaluator")
  async saveDecision(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: Annex27BodyDto,
  ) {
    const annex = body.annex27;
    const criteria = Array.isArray(annex?.criteria) ? annex.criteria : [];
    const required = [
      annex?.researchType,
      annex?.location,
      annex?.responsibleInstitutions,
      annex?.principalInvestigatorId,
    ];

    if (required.some((v) => !v?.trim()) || criteria.length !== 8) {
      throw new BadRequestException(
        "Completa la información general y los ocho indicadores del Anexo 27",
      );
    }

    if (!criteria.some((c) => c.answer === "yes")) {
      throw new BadRequestException(
        "Al menos un indicador debe aplicar para clasificar la investigación sin riesgo",
      );
    }

    return this.stratificationService.saveStratificationDecision(
      id,
      user.id,
      annex,
    );
  }
}
