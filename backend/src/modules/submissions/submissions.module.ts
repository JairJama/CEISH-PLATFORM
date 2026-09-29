import { Module } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service";
import { SubmissionsController } from "./submissions.controller";
import { StorageController } from "./storage.controller";

@Module({
  providers: [SubmissionsService],
  controllers: [SubmissionsController, StorageController],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
