# Guía de trabajo para agentes

## Ramas

- No desarrollar sobre `develop` ni `master`; una rama por cambio (`feature/`, `fix/`, `docs/`, `chore/`).
- No fusionar, publicar ni crear PRs sin solicitud explícita.
- Antes de editar: `git status --short --branch` y conservar cambios preexistentes.

## Arquitectura (verificada)

- Monorepo sin scripts en raíz: cada `npm` se ejecuta dentro de `frontend/` o `backend/`.
- `frontend/` = React 19 + TS + Vite + React Router + Zustand. `backend/` = NestJS (API de referencia) + Prisma + MinIO SDK.
- Contrato: navegador → `/api/*` (cookies) → NestJS → PostgreSQL (metadatos) + MinIO (bucket `documents`). El navegador nunca toca PostgreSQL/MinIO; los componentes solo usan `frontend/src/services/`.
- `frontend/vite.config.ts`: con `VITE_USE_NEST_BACKEND=true` hace proxy `/api` a `BACKEND_URL` (por defecto `http://localhost:3000`). Con `false` carga el plugin transitorio `frontend/src/server/apiPlugin.ts`: no agregarle capacidades.
- `CLAUDE.md` está desactualizado (describe un backend dentro de Vite sin NestJS): ignorarlo, la fuente vigente es `README.md` + este archivo.
- Backend: Swagger en `http://localhost:3000/api/docs`. Sesión en cookie firmada `HttpOnly`/`SameSite=Lax` (`Secure` en prod); cada request protegida revalida usuario y rol.
- Módulos NestJS en `backend/src/modules/`: `auth users submissions stratification qualification reviews annexes admin`. Esquema Prisma en `backend/prisma/schema.prisma`.

## Comandos

```bash
# Infra (desde raíz): solo crea schema+seed con volumen vacío
docker compose up -d postgres minio
docker compose down        # conserva volúmenes; -v los borra y re-ejecuta seed
# Backend (desde backend/): escucha en :3000
npm ci && npx prisma generate
npm run start:dev
npm test                   # solo specs de auth (jest.auth.config.js); e2e: npm run test:e2e
# Frontend (desde frontend/): abre :5173 con VITE_USE_NEST_BACKEND=true
npm ci
npm run dev
```

Verificación antes de entregar: `npm run lint` + `npm run build` en cada paquete tocado (`frontend` = `tsc -b && vite build`; `backend` = `nest build`). En cambios de API sumar `npx prisma generate` (si tocó el schema) + `npm test` desde `backend/`. Ojo: `backend` `npm run lint` lleva `--fix` (reescribe archivos).

## Entorno y base de datos

- Env: copiar `.env.example` a `.env` (raíz, lo lee Vite con `envDir: '..'`); `backend/.env.example` para NestJS fuera de Docker. Cambiar `SESSION_SECRET` (32+ chars aleatorios), `DATABASE_PASSWORD`, claves MinIO y `CORS_ORIGIN` en prod.
- Puertos host: Postgres `5433` → contenedor `5432`; MinIO API `9000`, consola `9001`. En Compose el backend usa hosts `postgres`/`minio`.
- Migraciones aplicadas son inmutables: nuevo cambio = archivo numerado en `database/migrations/` + reflejarlo en `database/schema.sql`. En BD existente aplicar con `node scripts/migrate.mjs` desde la raíz (usa `DATABASE_*` del entorno).

## Anexos CEISH

- Fuente de verdad: modelos institucionales en `/home/marcodev/Documents/ceish/ANEXOS PARA MIEMBROS/ANEXOS PARA MIEMBROS/Anexos para miembros`; no reutilizar un número de anexo para otra finalidad.
- Leer `contexto/flujo-anexos-evaluacion.md` antes de tocar calificación, correcciones o generación documental.
- Cada emisión es un registro independiente: un Anexo 12 nuevo por decisión (nunca sobrescribir); aprobación = Anexo 12 sin observaciones + Anexo 11; cierre tras correcciones = Anexo 12 + Anexo 13 y estado `cancelled`; plazo de correcciones vencido = `expired`. Anexo 26 solo para suspender/revocar aprobadas (aún no implementado).
- Autorización por rol y pertenencia a la investigación, aplicada en servidor.

## Calidad y seguridad

- Autorización y reglas de negocio en NestJS (guards + DTOs con `class-validator`); el frontend solo oculta UI.
- Validar entradas en cliente y servidor; mantener respuestas de error legibles por `frontend/src/services/`.
- No editar migraciones aplicadas ni reutilizar credenciales demo en prod.
- En transiciones de flujo probar: éxito, no autorizado, estado cerrado y repetición/concurrencia.
