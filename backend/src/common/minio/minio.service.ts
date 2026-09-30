import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";
import { randomUUID } from "node:crypto";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>("MINIO_BUCKET", "documents");
    this.client = new Client({
      endPoint: this.configService.get<string>("MINIO_ENDPOINT", "localhost"),
      port: Number(this.configService.get<string | number>("MINIO_PORT", 9000)),
      useSSL:
        this.configService.get<string>("MINIO_USE_SSL", "false") === "true",
      accessKey: this.configService.get<string>(
        "MINIO_ROOT_USER",
        "minioadmin",
      ),
      secretKey: this.configService.get<string>(
        "MINIO_ROOT_PASSWORD",
        "minioadmin",
      ),
    });
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  async ensureBucket(): Promise<void> {
    try {
      const exists = await this.client
        .bucketExists(this.bucket)
        .catch(() => false);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket "${this.bucket}" creado exitosamente`);
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo verificar el bucket de MinIO en arranque: ${error}`,
      );
    }
  }

  private safeExtension(originalName: string): string {
    const match = originalName.toLowerCase().match(/\.(docx?|pdf)$/);
    return match?.[0] ?? "";
  }

  async uploadDocument(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<string> {
    await this.ensureBucket();
    const key = `documents/${randomUUID()}${this.safeExtension(originalName)}`;
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      "Content-Type": mimeType,
      "X-Amz-Meta-Original-Name": encodeURIComponent(originalName),
    });
    return key;
  }

  async uploadAnnexDocx(buffer: Buffer, key: string): Promise<string> {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    return key;
  }

  async getPresignedUrl(key: string, expirySeconds = 300): Promise<string> {
    await this.ensureBucket();
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  async getObjectStream(key: string): Promise<NodeJS.ReadableStream> {
    await this.ensureBucket();
    return this.client.getObject(this.bucket, key);
  }
}
