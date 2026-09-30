import { Module } from "@nestjs/common";
import { AnnexesController } from "./annexes.controller";

@Module({
  controllers: [AnnexesController],
})
export class AnnexesModule {}
