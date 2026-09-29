# Guía de integración y ejecución

La estructura y los límites entre `frontend/`, `backend/`, `database/` y Compose se explican en [arquitectura del monorepo](arquitectura.md). Para instalar y levantar la aplicación, sigue la sección **Ejecutar localmente** del [README](../README.md); esta guía resume cómo verificar la conexión.

## Contrato del frontend

Las funciones de `frontend/src/services/` consumen rutas `/api/*` del backend NestJS. En local, `frontend/vite.config.ts` reenvía esas solicitudes al valor de `BACKEND_URL`. Si `VITE_USE_NEST_BACKEND=true`, Vite no carga el plugin de API temporal. La cookie de sesión se conserva en solicitudes del mismo origen.

Las principales rutas de dominio son:

| Ruta | Módulo NestJS | Acceso |
| --- | --- | --- |
| `/api/auth/*`, `/api/registration-requests` | `auth` | Login/registro públicos; revisión por admin |
| `/api/users/*` | `users` | Por sesión, rol y relación con el usuario |
| `/api/submissions/*`, `/api/upload`, `/api/documents/*` | `submissions` | Por rol, propiedad y asignación |
| `/api/stratifications/*` | `stratification` | Miembro CEISH asignado o admin según ruta |
| `/api/qualifications/*` | `qualification` | Evaluador asignado o investigador dueño |
| `/api/reviews/*` | `reviews` | Evaluador asignado y propietario de revisión |
| `/api/annexes/*`, `/api/assignments/*`, `/api/admin/*` | `annexes`, `admin` | Por rol y pertenencia al flujo |

NestJS normaliza errores como JSON. El cliente HTTP compartido prioriza el mensaje de validación y conserva el contrato legible por las pantallas. Para cambios de respuesta o rutas, actualiza ambos lados en una misma rama y registra el cambio aquí.

## Infraestructura y entorno

Compose define PostgreSQL (puerto host 5433), MinIO (9000/9001), creación del bucket y NestJS (3000). Para desarrollo interactivo el frontend Vite se ejecuta local en el puerto 5173; también puede usarse `docker compose up -d` para levantar la API junto con la infraestructura.

La app lee el `.env` de la raíz. Si NestJS corre directamente desde `backend/`, usa su `.env.example` o carga `../.env`; su URL de PostgreSQL debe apuntar a `localhost:5433`. Dentro de Compose, el hostname es `postgres` y el puerto `5432`. MinIO usa `localhost` desde el host y `minio` desde Compose. No compartas ni subas `.env`.

PostgreSQL ejecuta el esquema y seed inicial solo al crear el volumen vacío. En instalaciones existentes, aplica los archivos SQL nuevos mediante `node scripts/migrate.mjs` desde la raíz. Las migraciones ejecutadas son inmutables.

## Revisión de cambios

Antes de entregar, ejecuta lint y build en ambos paquetes. Para autenticación y permisos ejecuta además las pruebas de sesión y recorre la [matriz de seguridad](matriz-seguridad-auth.md) con cuentas de prueba. No ejecutes esos flujos contra datos reales.
