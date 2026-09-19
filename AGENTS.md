# Guía de trabajo para agentes

## Flujo de Git

- No desarrollar directamente sobre `develop` ni `master`.
- Crear una rama por cambio con prefijos como `feature/`, `fix/`, `docs/` o `chore/`.
- Mantener cada rama enfocada en un único objetivo y evitar cambios ajenos al alcance solicitado.
- No fusionar a `develop`, publicar ramas ni crear pull requests sin una solicitud explícita.
- Antes de editar, comprobar `git status --short --branch` y conservar cambios preexistentes del usuario.

## Arquitectura actual

- El frontend usa React 19, TypeScript, Vite, React Router y Zustand.
- La API temporal vive en `src/server/apiPlugin.ts`; las consultas PostgreSQL están en `src/server/queries/`.
- PostgreSQL conserva metadatos y MinIO almacena documentos. El navegador nunca debe conectarse directamente a esos servicios.
- La migración futura a NestJS debe mantener, inicialmente, los contratos `/api/*` consumidos por `src/services/`.
- Las migraciones aplicadas son inmutables. Los cambios de esquema se agregan en un archivo nuevo y se reflejan también en `database/schema.sql` para instalaciones limpias.

## Flujo CEISH y anexos

- Los modelos institucionales originales son la fuente de verdad para nombres, contenido y estructura de anexos.
- En esta estación se encuentran en `/home/marcodev/Documents/ceish/ANEXOS PARA MIEMBROS/ANEXOS PARA MIEMBROS/Anexos para miembros`.
- No reutilizar un número de anexo para una finalidad distinta de la indicada por su modelo institucional.
- Cada emisión debe conservarse como un registro independiente y auditable; regenerar un documento no debe sobrescribir emisiones históricas.
- Los anexos y su historial deben autorizarse por rol y pertenencia a la investigación.
- Consultar `contexto/flujo-anexos-evaluacion.md` antes de modificar calificación, correcciones o generación documental.

## Calidad

- Aplicar autorización y reglas de negocio en el servidor, aunque la interfaz también oculte acciones.
- Validar entradas en el cliente y nuevamente en el servidor.
- Ejecutar `npm run lint` y `npm run build` antes de entregar cambios de código.
- Toda transición del flujo debe probar el caso exitoso, acceso no autorizado, estado cerrado y repetición/concurrencia cuando corresponda.

