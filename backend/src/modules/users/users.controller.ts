import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { AuthGuard, RolesGuard } from "../../common/guards";
import { CurrentUser } from "../../common/decorators";
import type { SessionUser } from "../../common/auth/session.util";

@Controller("users")
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(
    @CurrentUser() user: SessionUser,
    @Query("role") role?: string,
  ) {
    if (user.role === "admin") {
      return this.usersService.listUsers(role);
    }
    if (user.role === "evaluator") {
      return this.usersService.listAssignedStudents(user.id);
    }
    throw new ForbiddenException("No tienes permiso para consultar usuarios");
  }

  @Get(":id")
  async getUser(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    if (user.role !== "admin" && user.id !== id) {
      throw new ForbiddenException(
        "No tienes permiso para consultar este usuario",
      );
    }
    return this.usersService.getUserById(id);
  }
}
