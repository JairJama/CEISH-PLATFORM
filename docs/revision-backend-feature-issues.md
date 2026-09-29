# Revisión de `feature/issues`

Revisión realizada el 28 de septiembre de 2026 sobre el commit `1d74c1570c2d69611fad480978d87786cdabd2ab` (`feat: implement assigned platform issues`). La rama remota se publica como `feature/issues`.

## Resultado

La rama contiene un backend NestJS funcional a nivel de compilación y pruebas unitarias, y el frontend ya está estructurado para consumirlo. NestJS es la API de referencia; el plugin de API de Vite permanece únicamente como alternativa transitoria para desarrollo local.

No se debe considerar una validación integral de producción todavía: no se pudo ejecutar el flujo con PostgreSQL y MinIO porque este entorno no tiene permiso de acceso al socket de Docker. Además, las pruebas automatizadas actuales cubren autenticación y guardas, no los flujos de dominio completos.

## Implementación presente

- El repositorio se convirtió en monorepo: `frontend/` contiene React 19/Vite y `backend/` contiene NestJS 10 con Prisma.
- Vite reenvía `/api/*` al backend cuando `VITE_USE_NEST_BACKEND=true`; `BACKEND_URL` define el destino local.
- NestJS expone las rutas bajo `/api` y Swagger en `/api/docs`.
- Los módulos de API abarcan autenticación y solicitudes de registro, usuarios, investigaciones/documentos, estratificación, calificación, revisiones, anexos y administración/asignaciones.
- PostgreSQL se consulta exclusivamente desde NestJS mediante Prisma y los documentos se almacenan mediante MinIO. El navegador no recibe credenciales de esos servicios.
- La autenticación usa cookie firmada `HttpOnly`, `SameSite=Lax` y `Secure` en producción. En cada solicitud protegida el guard consulta el usuario y rol vigente, e invalida sesiones mediante `authSessionVersion`.
- Se añadió la migración `010-auth-session-version.sql` y su reflejo en `database/schema.sql`.
- Compose define PostgreSQL, MinIO, creación del bucket y el servicio de backend. El frontend se ejecuta localmente con Vite durante el desarrollo.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| `backend: npx prisma generate` | Correcto |
| `backend: npm run build` | Correcto |
| `backend: npm test` | Correcto: 2 suites y 6 pruebas de sesión/guardas |
| `backend: eslint` (sin autocorrección) | Sin errores; 21 advertencias de `any` explícito e imports sin usar |
| `frontend: npm run lint` | Correcto |
| `frontend: npm run build` | Correcto |
| `docker compose config --quiet` | Correcto |
| Prueba integrada con PostgreSQL/MinIO | Pendiente: sin permiso para acceder a `/var/run/docker.sock` |

La construcción del frontend informa un aviso no bloqueante: el paquete JavaScript principal supera 500 kB tras minificación. Conviene abordar la división dinámica de código como mejora de rendimiento, no como requisito para levantar la API.

El análisis estático del backend tampoco bloquea la compilación, pero mantiene 21 advertencias: predominan `any` explícitos en los servicios de entregas, revisiones, estratificación y calificación, además de dos imports sin usar. Conviene eliminarlas antes de establecer una política de lint sin advertencias.

La instalación de dependencias del frontend reportó 11 vulnerabilidades transitivas (6 moderadas y 5 altas). No se aplicó `npm audit fix`, para evitar actualizaciones no revisadas o potencialmente incompatibles.

### Incidencia corregida durante el despliegue

El contenedor del backend fallaba al iniciar con `PrismaClientInitializationError` porque no encontraba `libssl.so.1.1`. La imagen `node:22-bookworm-slim` no incluía OpenSSL y Prisma seleccionaba un motor incompatible. `backend/Dockerfile` instala ahora `openssl` en las etapas de compilación y ejecución; al reconstruir la imagen Prisma debe usar el motor Debian/OpenSSL 3 compatible con Bookworm.

## Puesta en marcha local

1. Copia `.env.example` a `.env` y cambia `SESSION_SECRET` por un valor aleatorio de al menos 32 caracteres. Para producción, configura también credenciales de base de datos y MinIO no predeterminadas, y un `CORS_ORIGIN` explícito.
2. Ejecuta `docker compose up -d postgres minio`.
3. En `backend/`, ejecuta `npm ci`, `npx prisma generate` y `npm run start:dev`.
4. En `frontend/`, ejecuta `npm ci` y `npm run dev`.
5. Abre `http://localhost:5173`; la API y Swagger quedan en `http://localhost:3000/api` y `http://localhost:3000/api/docs`.

Si el backend ya tenía una imagen construida antes de la corrección de OpenSSL, fuerza su reconstrucción:

```bash
docker compose build --no-cache backend
docker compose up -d backend
docker compose logs backend --tail=80
```

Para una base ya creada, aplica las migraciones SQL pendientes con `node scripts/migrate.mjs` desde la raíz; los scripts de inicialización de Compose solo se ejecutan con un volumen PostgreSQL nuevo.

## Antes de integrar la rama

- Ejecutar una prueba de extremo a extremo con los servicios de Compose: registro/aprobación, inicio/cierre de sesión, subida/descarga de documento, asignación, estratificación, calificación, correcciones y emisión de anexos.
- Probar en cada transición el acceso no autorizado, el estado cerrado y los reintentos/concurrencia, según `AGENTS.md`.
- Añadir pruebas de integración para módulos de dominio y controladores; por ahora la cobertura automatizada se limita a autenticación.
- Revisar y actualizar las dependencias vulnerables de forma controlada, comprobando de nuevo build y pruebas.
