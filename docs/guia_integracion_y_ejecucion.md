# Guía de Integración y Puesta en Marcha: Backend NestJS

Este documento describe la arquitectura, la integración del backend **NestJS** realizada en la rama `feature/backend-nestjs-integration` y la guía paso a paso para inicializar y ejecutar toda la plataforma CEISH (PostgreSQL, MinIO, Backend NestJS y Frontend React).

---

## 1. Resumen de la Implementación

Se completó la migración y adaptación del backend NestJS (originario de `backend_things`) para conectarse directamente con el frontend React 19 y la base de datos PostgreSQL existente, **respetando el 100% de los contratos de API (`/api/*`) y el flujo institucional de anexos**.

### Logros Principales:
* **Cero cambios destructivos en el Frontend:** No se modificaron componentes ni servicios de React (`src/services/`). La interfaz funciona idénticamente contra el nuevo backend.
* **Sincronización 1:1 con PostgreSQL:** El archivo `backend/prisma/schema.prisma` mapea fielmente las tablas oficiales de `database/schema.sql` (usuarios, solicitudes, entregas, anexos, casos de calificación, asignaciones, revisiones por etapas, etc.).
* **Autenticación transparente por Cookie HttpOnly:** Implementación de sesión firmada `ceish_session` con HMAC SHA-256 y hashing de contraseñas con `scrypt` (compatible con los datos del seed).
* **Motor de generación DOCX oficial:** Implementado en memoria mediante `AnnexDocumentService` con `adm-zip`, permitiendo generar y descargar los Word oficiales (Anexos 11, 12, 13, 23 y 27) desde MinIO sin depender de comandos del sistema operativo (`zip`/`unzip`).
* **Proxy de desarrollo en Vite:** Enrutamiento condicional en `vite.config.ts` hacia `http://localhost:3000` mediante la variable `VITE_USE_NEST_BACKEND=true`.

---

## 2. Arquitectura del Backend NestJS

El backend está ubicado en la carpeta `backend/` y organizado de forma modular:

```text
backend/
├── prisma/
│   └── schema.prisma              # Definición de modelos Prisma mapeados a PostgreSQL
└── src/
    ├── app.module.ts              # Registro central de módulos
    ├── main.ts                    # Bootstrap con prefijo /api, cookie-parser, CORS y Swagger
    ├── common/
    │   ├── auth/session.util.ts   # Lógica de cookies ceish_session y hash scrypt/bcrypt
    │   ├── guards/                # AuthGuard (valida cookies) y RolesGuard (roles permitidos)
    │   ├── decorators/            # @CurrentUser, @Roles, @Public
    │   ├── minio/                 # MinioService (carga de archivos y presigned URLs)
    │   ├── annexes/               # AnnexDocumentService y constantes del checklist oficial
    │   └── prisma/                # PrismaService con lifecycle hooks de conexión
    └── modules/
        ├── auth/                  # /api/auth (login, register, logout, session, registration-requests)
        ├── users/                 # /api/users (listado por rol y consultas individuales)
        ├── submissions/           # /api/submissions, /api/upload, /api/documents (gestión de archivos)
        ├── stratification/        # /api/stratifications (Anexo 23 conflicto y Anexo 27 sin riesgo)
        ├── qualification/         # /api/qualifications (checklist Anexo 12 y ciclos de 30 días)
        ├── annexes/               # /api/annexes/:id/document (descarga de resoluciones Word)
        ├── admin/                 # /api/admin/research (supervisión) y /api/assignments
        └── reviews/               # /api/reviews (revisión de 4 etapas legacy)
```

---

## 3. Requisitos Previos

Asegúrate de tener instalados en tu sistema:
* **Node.js 18 o superior** (se recomienda Node 20 o 22).
* **Docker y Docker Compose** (para PostgreSQL y MinIO).
* **Git** (trabajando en la rama `feature/backend-nestjs-integration`).

---

## 4. Guía Paso a Paso para Inicializar el Proyecto

### Paso 1: Configurar Variables de Entorno

1. **Variables de la raíz:**
   Asegúrate de que exista el archivo `.env` en la raíz del proyecto. Si no existe, copia `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Valores estándar requeridos en `.env`:
   ```env
   # PostgreSQL
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=ceish_db
   DATABASE_USER=ceish_user
   DATABASE_PASSWORD=ceish_pass

   # MinIO
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_CONSOLE_PORT=9001
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=minioadmin
   MINIO_BUCKET=documents
   MINIO_USE_SSL=false

   # Habilitar backend NestJS en el frontend Vite
   VITE_USE_NEST_BACKEND=true
   BACKEND_URL=http://localhost:3000
   ```

2. **Variables del backend (`backend/.env`):**
   Verifica que `backend/.env` contenga la cadena de conexión correspondiente a tu base de datos:
   ```env
   DATABASE_URL=postgresql://ceish_user:ceish_pass@localhost:5432/ceish_db?schema=public
   SESSION_SECRET=ceish-development-secret-change-before-production

   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=minioadmin
   MINIO_BUCKET=documents
   MINIO_USE_SSL=false

   APP_PORT=3000
   APP_HOST=0.0.0.0
   CORS_ORIGIN=http://localhost:5173
   ```

---

### Paso 2: Levantar Infraestructura con Docker Compose

Inicia los contenedores de PostgreSQL y MinIO:
```bash
docker compose up -d
```
* **PostgreSQL:** disponible en `localhost:5432`.
* **MinIO API:** disponible en `localhost:9000`.
* **MinIO Console (Web):** disponible en `http://localhost:9001` (usuario: `minioadmin` / contraseña: `minioadmin`).

> [!NOTE]
> Si es la primera vez que levantas Docker Compose con volúmenes vacíos, PostgreSQL ejecutará automáticamente `database/schema.sql` y `database/seed.sql`. Si ya existía un volumen previo, aplica migraciones pendientes con `node scripts/migrate.mjs`.

---

### Paso 3: Inicializar y Arrancar el Backend NestJS

Abre una terminal dedicada para el backend:
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

* **Salida esperada:**
  ```text
  [Nest] ... LOG [NestFactory] Starting Nest application...
  [Nest] ... LOG [MinioService] Bucket "documents" verificado exitosamente
  CEISH Platform Backend running at http://localhost:3000/api
  Swagger documentation available at http://localhost:3000/api/docs
  ```
* Puedes abrir tu navegador en `http://localhost:3000/api/docs` para explorar y probar interactivamente los endpoints documentados con OpenAPI / Swagger.

---

### Paso 4: Arrancar el Frontend React

En otra terminal separada, desde la raíz del proyecto:
```bash
npm install
npm run dev
```

* **Salida esperada:**
  ```text
  VITE v8.0.16 ready in 350 ms
  ➜  Local:   http://localhost:5173/
  ```
* Vite detectará `VITE_USE_NEST_BACKEND=true` y redirigirá todas las peticiones a `/api/*` directamente hacia el servidor NestJS en el puerto 3000.

---

## 5. Cuentas de Prueba del Sistema (Seed)

La base de datos cuenta con usuarios precargados para verificar cada rol y flujo:

| Rol | Correo | Contraseña | Vistas y Funcionalidades |
|---|---|---|---|
| **Administrador** | `admin@ceish.edu` | `demo123` | `/admin`, `/admin/solicitudes`, `/admin/investigaciones`, `/admin/asignaciones` |
| **Investigador** | `juan@ceish.edu` | `demo123` | `/estudiante` (Subida de investigaciones Word, descarga de resoluciones) |
| **Investigador 2** | `maria@ceish.edu` | `demo123` | `/estudiante` |
| **Evaluador / Miembro CEISH** | `profesor@ceish.edu` | `demo123` | `/evaluador`, `/evaluador/estratificacion`, `/evaluador/calificacion` |
| **Miembros de Prueba** | `miembro01@ceish.edu` hasta `miembro06@ceish.edu` | `demo123` | Estratificación de riesgo, Anexo 23 (conflicto) y Anexo 27 |

---

## 6. Comprobaciones de Calidad y Validación

Antes de realizar commits o integración continua, ejecuta las revisiones de calidad:

* **En la raíz (Frontend):**
  ```bash
  npm run lint
  npm run build
  ```
* **En `backend/`:**
  ```bash
  npm run lint
  npm run build
  ```

Ambos entornos deben compilar y pasar el linter con **0 errores**.

---

## 7. Solución de Problemas Comunes

1. **Error de conexión a PostgreSQL (`ECONNREFUSED` / puerto ocupado):**
   * Verifica si tu PostgreSQL local está en el puerto 5432 o 5433 en `.env`.
   * Asegúrate de que el contenedor de Docker esté activo con `docker compose ps`.

2. **Error al subir archivos en MinIO:**
   * Entra a la consola web de MinIO en `http://localhost:9001` y confirma que el bucket `documents` exista. El backend lo crea automáticamente en el arranque, pero requiere credenciales correctas.

3. **Recargar el navegador pierde la sesión:**
   * Las cookies `ceish_session` requieren que el frontend y el backend compartan origen o utilicen `credentials: true` en CORS. Al usar el proxy de Vite (`VITE_USE_NEST_BACKEND=true`), todas las llamadas se realizan por el mismo origen (`localhost:5173`), garantizando persistencia perfecta de la sesión.
