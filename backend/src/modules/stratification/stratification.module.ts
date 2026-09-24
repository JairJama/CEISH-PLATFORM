import { Module } from "@nestjs/common";
import { StratificationService } from "./stratification.service";
import { StratificationController } from "./stratification.controller";

@Module({
  providers: [StratificationService],
  controllers: [StratificationController],
  exports: [StratificationService],
})
export class StratificationModule {}
