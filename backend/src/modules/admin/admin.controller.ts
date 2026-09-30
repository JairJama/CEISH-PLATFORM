import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser, Roles } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";

class ReassignStratifierDto {
  stratifierId!: string;
}

class ReassignQualifierDto {
  qualifierId!: string;
}

class CreateAssignmentDto {
  teacherId!: string;
  studentId!: string;
}

@Controller()
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("admin/research")
  @Roles("admin")
  async listAdminResearch() {
    return this.adminService.listAdminResearch();
  }

  @Patch("admin/research/:id/reassign")
  @Roles("admin")
  async reassignStratifier(
    @Param("id") id: string,
    @Body() body: ReassignStratifierDto,
  ) {
    if (!body.stratifierId)
      throw new BadRequestException("ID del estratificador es requerido");
    return this.adminService.reassignStratifier(id, body.stratifierId);
  }

  @Patch("admin/research/:id/qualifier")
  @Roles("admin")
  async reassignQualifier(
    @Param("id") id: string,
    @Body() body: ReassignQualifierDto,
  ) {
    if (!body.qualifierId)
      throw new BadRequestException("ID del evaluador es requerido");
    return this.adminService.reassignQualifier(id, body.qualifierId);
  }

  @Patch("admin/research/:id/cancel")
  @Roles("admin")
  async cancelResearch(@Param("id") id: string) {
    return this.adminService.cancelResearch(id);
  }

  // ── Assignments ─────────────────────────────────────────
  @Get("assignments")
  async listAssignments(
    @CurrentUser() user: SessionUser,
    @Query("teacherId") teacherId?: string,
  ) {
    if (user.role === "evaluator") {
      return this.adminService.listAssignments(user.id);
    }
    if (user.role === "admin") {
      return this.adminService.listAssignments(teacherId);
    }
    throw new ForbiddenException(
      "No tienes permiso para consultar asignaciones",
    );
  }

  @Post("assignments")
  @Roles("admin")
  @HttpCode(HttpStatus.CREATED)
  async createAssignment(@Body() body: CreateAssignmentDto) {
    if (!body.teacherId || !body.studentId) {
      throw new BadRequestException("teacherId y studentId son requeridos");
    }
    return this.adminService.createAssignment(body.teacherId, body.studentId);
  }

  @Delete("assignments/:id")
  @Roles("admin")
  async deleteAssignment(@Param("id") id: string) {
    return this.adminService.deleteAssignment(id);
  }
}
