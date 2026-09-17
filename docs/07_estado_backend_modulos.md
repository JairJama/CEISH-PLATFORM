# Estado del Backend y Módulos

## Propósito

Este documento describe el estado actual del backend de CEISH Platform para que el equipo pueda continuar el desarrollo con contexto compartido. La arquitectura es NestJS con módulos y separación inspirada en Clean Architecture:

```text
modules/<modulo>/
├── domain/          entidades, contratos y reglas de negocio
├── application/     DTOs y casos de uso
└── infrastructure/  Prisma, controladores NestJS y módulos
```

La base de datos se gestiona con Prisma/PostgreSQL y los archivos con MinIO. Las acciones relevantes deben conservar trazabilidad mediante `workflow_events`; no se elimina historial de estratificaciones, asignaciones ni evaluaciones.

## Arranque de la aplicación

`backend/src/main.ts` configura:

- Prefijo global `api` y versionado URI: rutas bajo `/api/v1/...`.
- CORS desde `CORS_ORIGIN`.
- `ValidationPipe` global con `transform`, `whitelist` y `forbidNonWhitelisted`.
- `HttpExceptionFilter` global.
- Swagger en `/api/docs`.

`backend/src/app.module.ts` carga `ConfigModule`, `PrismaModule` y los módulos Auth, Users, Investigations, Risk Assessment, Evaluation, Annexes y Documents.

Variables esperadas en `backend/.env`:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=ceish-documents
MINIO_USE_SSL=false
APP_PORT=3000
APP_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
```

El archivo `.env` de la raíz configura Docker Compose (PostgreSQL y MinIO). El archivo `backend/.env` configura NestJS, Prisma, JWT y MinIO; debe conservar las mismas credenciales de PostgreSQL y MinIO que la infraestructura local.

## Dependencias y verificación técnica

En septiembre de 2026 se hizo una instalación limpia de las dependencias de `backend` y se verificó la compilación:

```powershell
cd backend
npm install
npm run build
```

Resultado: `npm run build` finaliza exitosamente con `nest build`.

Durante esta validación se agregó `@types/multer` como dependencia de desarrollo, necesaria para tipar `Express.Multer.File` en las cargas multipart. También se corrigieron los siguientes errores de compilación:

- `WorkflowEventInterceptor` ahora comprueba de forma segura la estructura de la respuesta antes de acceder a sus campos.
- Los casos de uso de Investigations y Risk Assessment tipan explícitamente las listas de roles y estados, evitando incompatibilidades entre uniones literales de TypeScript.
- El módulo Documents fue formateado y recuperó una estructura sintáctica válida; se conservaron los casos de uso y se ordenaron las rutas específicas antes de `GET /:id`.
- Se generó `backend/package-lock.json` al instalar dependencias. Debe versionarse para que el equipo instale la misma resolución de paquetes con `npm ci`.

Si `npm install` muestra errores `TAR_ENTRY_ERROR`, `EPERM` o `ENOENT` dentro de `node_modules`, OneDrive está bloqueando o sincronizando archivos durante la instalación. Pausar su sincronización temporalmente y volver a ejecutar la instalación suele resolverlo.

## Módulos implementados

### Auth

Ubicación: `backend/src/modules/auth`.

- Registro, inicio de sesión, refresh token y cambio de contraseña.
- Hash de contraseñas con bcrypt y JWT access/refresh.
- Las cuentas creadas quedan `PENDING_APPROVAL`.
- Se crean perfiles de investigador o miembro CEISH cuando corresponde.
- El registro y cambio de contraseña generan trazabilidad.

Rutas principales: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/change-password`.

### Users

Ubicación: `backend/src/modules/users`.

- Administración de cuentas: listar, consultar, aprobar, rechazar y suspender.
- Actualización de perfiles de investigadores y miembros CEISH.
- Consulta de miembros CEISH filtrable por tipo interno/externo.
- Cambios de estado generan eventos de auditoría.

Rutas: `/admin/users`, `/users/me` y `/members`.

### Investigations

Ubicación: `backend/src/modules/investigations`.

- Creación y edición de borradores por investigadores.
- Participantes con una persona principal obligatoria al crear.
- Envío para revisión y revisión administrativa.
- Generación de códigos secuenciales `CEISH-001`, `CEISH-002`, etc.
- Máquina de estados centralizada en `InvestigationDomainService`.

Rutas: `/investigator/investigations` y `/admin/investigations`.

### Risk Assessment

Ubicación: `backend/src/modules/risk-assessment`.

- Creación de estratificaciones, asignación de estratificadores internos y envío de nivel de riesgo.
- Revisión administrativa y reestratificación.
- Cada reestratificación preserva el assessment anterior y lo marca como `REPLACED`.
- Historial completo por investigación y bandeja de assessments asignados.

Rutas: `/admin/stratification` y `/stratifier/assessments`.

### Documents

Ubicación: `backend/src/modules/documents`.

- Servicio `MinioService`: creación de bucket, carga, URL prefirmada, descarga y eliminación.
- Persistencia de metadatos de documentos con Prisma.
- Carga multipart bajo `/documents/upload`.
- Consulta, descarga, listado por investigación y eliminación.

Los DTOs y puntos de entrada de casos de uso están separados por archivo (`upload-document.dto.ts`, `upload-document.use-case.ts`, etc.) y se exportan mediante barrels.

### Seed

Ubicación: `backend/src/commands/seed.ts`.

El seed es idempotente y crea:

- Administrador `admin@ceish.local`.
- Tres miembros CEISH y dos investigadores de prueba.
- Seis tipos de investigación.
- Anexos 12, 23 y 27, con versión inicial y campos base.

Ejecutar con:

```powershell
cd backend
npm run prisma:seed
```

## Estado parcial: Evaluation y Annexes

Estos módulos tienen la base de dominio, DTOs, repositorios y algunos casos de uso creados, pero requieren una revisión funcional y de compilación antes de considerarse listos para producción.

### Evaluation

- Ya existen las entidades, el repositorio Prisma, DTOs, casos de uso y los controladores de administración/evaluador.
- Los archivos individuales de DTOs y casos de uso se añadieron como puntos de entrada para respetar la estructura esperada.
- Pendiente: completar y probar todo el flujo de conflictos, activación de evaluadores, envío de evaluaciones, ciclos de corrección y las rutas de consulta especificadas.

### Annexes

- Ya existen entidades, servicio de validación, contrato/repositorio Prisma y casos de uso base para plantillas, versiones, campos y respuestas.
- Pendiente: crear y registrar los tres controladores (`admin-annex`, `investigation-annex`, `evaluator-annex`) y completar las validaciones de autorización y versionado antes de exponerlo en la API.

## Limitaciones conocidas del modelo actual

- `users` no almacena una cédula/identificación. Por eso no se puede verificar de forma robusta que un miembro CEISH no sea participante comparando cédulas; debe añadirse un campo de identificación al perfil o usuario.
- `documents` no tiene `uploadedById`. La regla “solo quien subió el documento o un administrador puede eliminarlo” requiere agregar este campo y una migración.
- El uso de `MulterModule.register({ dest: './uploads' })` debe revisarse antes de producción si las cargas se procesarán como `buffer`; el flujo de carga actual utiliza `file.buffer` para enviarlo a MinIO.

## Checklist antes de integrar o desplegar

1. Ejecutar `npm install` en `backend`.
2. Ejecutar `npm run prisma:generate`.
3. Asegurar que PostgreSQL y MinIO estén disponibles mediante Docker Compose.
4. Ejecutar el seed si se necesitan datos de desarrollo.
5. Ejecutar `npm run build` (verificado exitosamente en septiembre de 2026).
6. Completar pruebas unitarias de casos de uso y pruebas e2e de los flujos de estado.
