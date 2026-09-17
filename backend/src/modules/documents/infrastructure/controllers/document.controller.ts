import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@common/decorators';
import { UserType } from '@common/enums';
import { UploadDocumentDto } from '../../application/dto';
import {
  DeleteDocumentUseCase,
  DownloadDocumentUseCase,
  GetDocumentUseCase,
  GetInvestigationDocumentsUseCase,
  UploadDocumentUseCase,
} from '../../application/use-cases';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly getInvestigationDocumentsUseCase: GetInvestigationDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly downloadDocumentUseCase: DownloadDocumentUseCase,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: { id: string; userType: UserType },
    @UploadedFile() file: Express.Multer.File,
    @Body() data: UploadDocumentDto,
  ) {
    return { success: true, data: await this.uploadDocumentUseCase.execute(user, file, data) };
  }

  @Get('investigation/:investigationId')
  async findByInvestigation(@Param('investigationId') investigationId: string) {
    return { success: true, data: await this.getInvestigationDocumentsUseCase.execute(investigationId) };
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() response: any) {
    const { document, stream } = await this.downloadDocumentUseCase.execute(id);
    response.setHeader('Content-Type', document.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${document.originalFilename}"`);
    stream.pipe(response);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.getDocumentUseCase.execute(id) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.deleteDocumentUseCase.execute(id);
    return { success: true, data: { message: 'Deleted' } };
  }
}
