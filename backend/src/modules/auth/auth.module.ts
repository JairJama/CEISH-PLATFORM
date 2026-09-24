import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { RegistrationRequestsService } from "./registration-requests.service";
import { RegistrationRequestsController } from "./registration-requests.controller";

@Module({
  providers: [AuthService, RegistrationRequestsService],
  controllers: [AuthController, RegistrationRequestsController],
  exports: [AuthService, RegistrationRequestsService],
})
export class AuthModule {}
