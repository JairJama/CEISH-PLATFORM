import { Global, Module } from "@nestjs/common";
import { AnnexDocumentService } from "./annex-document.service";

@Global()
@Module({
  providers: [AnnexDocumentService],
  exports: [AnnexDocumentService],
})
export class AnnexDocumentModule {}
