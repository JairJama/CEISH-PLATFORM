import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

const appConfig = {
  port: Number(process.env.APP_PORT ?? 3000),
  host: process.env.APP_HOST ?? "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    cookieParser(
      process.env.SESSION_SECRET ??
        "ceish-development-secret-change-before-production",
    ),
  );

  app.setGlobalPrefix("api");

  app.enableCors({
    origin: [
      appConfig.corsOrigin,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("CEISH Platform API")
    .setDescription(
      "API institucional CEISH para gestión ética de investigaciones",
    )
    .setVersion("1.0")
    .addTag("Auth", "Autenticación y solicitudes de acceso")
    .addTag("Users", "Gestión de usuarios y perfiles")
    .addTag("Submissions", "Investigaciones y documentos")
    .addTag("Stratification", "Estratificación y conflicto (Anexos 23 y 27)")
    .addTag("Qualifications", "Calificación de investigaciones sin riesgo")
    .addTag("Annexes", "Descarga y emisión de resoluciones DOCX")
    .addTag("Admin", "Supervisión y asignaciones")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(appConfig.port, appConfig.host);
  console.log(
    `CEISH Platform Backend running at http://localhost:${appConfig.port}/api`,
  );
  console.log(
    `Swagger documentation available at http://localhost:${appConfig.port}/api/docs`,
  );
}

void bootstrap();
