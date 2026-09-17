import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UserType } from '@common/enums';
import { PrismaService } from '@common/prisma';
import { DocumentResponseDto, UploadDocumentDto } from '../dto';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/repositories/document.repository.interface';
import { MinioService } from '../../domain/services/minio.service';

type AuthenticatedUser = { id: string; userType: UserType };

const toResponseDto = async (
  document: {
    id: string;
    filename: string;
    originalFilename: string;
    documentType: DocumentResponseDto['documentType'];
    uploadedAt: Date;
    storagePath: string;
  },
  minioService: MinioService,
): Promise<DocumentResponseDto> => ({
  id: document.id,
  filename: document.filename,
  originalFilename: document.originalFilename,
  documentType: document.documentType,
  uploadedAt: document.uploadedAt,
  downloadUrl: await minioService.getFileUrl(document.storagePath),
});

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    private readonly minioService: MinioService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(user: AuthenticatedUser, file: Express.Multer.File, data: UploadDocumentDto) {
    if (!file) throw new NotFoundException('File is required');
    if (!data.investigationId && !data.correctionRoundId && !data.conflictDeclarationId) {
      throw new ForbiddenException('A document association is required');
    }

    if (data.investigationId) {
      const investigation = await this.prisma.investigation.findUnique({
        where: { id: data.investigationId },
      });
      if (!investigation || (user.userType !== UserType.ADMIN && investigation.createdById !== user.id)) {
        throw new ForbiddenException('You cannot upload a document for this investigation');
      }
    }

    const storagePath = `${data.documentType}/${data.investigationId ?? 'related'}/${uuid()}-${file.originalname}`;
    await this.minioService.uploadFile(file.buffer, storagePath, file.mimetype);
    const document = await this.documentRepository.create({
      filename: storagePath.split('/').pop() as string,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath,
      documentType: data.documentType,
      investigationId: data.investigationId,
      correctionRoundId: data.correctionRoundId,
      conflictDeclarationId: data.conflictDeclarationId,
    });

    return toResponseDto(document, this.minioService);
  }
}

@Injectable()
export class GetDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(id: string) {
    const document = await this.documentRepository.findById(id);
    if (!document) throw new NotFoundException('Document not found');
    return toResponseDto(document, this.minioService);
  }
}

@Injectable()
export class GetInvestigationDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(investigationId: string) {
    const documents = await this.documentRepository.findByInvestigation(investigationId);
    return Promise.all(documents.map((document) => toResponseDto(document, this.minioService)));
  }
}

@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(id: string): Promise<void> {
    const document = await this.documentRepository.findById(id);
    if (!document) throw new NotFoundException('Document not found');
    await this.minioService.deleteFile(document.storagePath);
    await this.documentRepository.delete(id);
  }
}

@Injectable()
export class DownloadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(id: string) {
    const document = await this.documentRepository.findById(id);
    if (!document) throw new NotFoundException('Document not found');
    return {
      document,
      stream: await this.minioService.getClient().getObject(
        process.env.MINIO_BUCKET ?? 'ceish-documents',
        document.storagePath,
      ),
    };
  }
}
