# Contexto integral de CEISH Platform

> Para el flujo documental de evaluación, historial del Anexo 12 y correspondencia verificada de los modelos institucionales, consultar [`flujo-anexos-evaluacion.md`](./flujo-anexos-evaluacion.md).

> Documento de transferencia para entender el propósito, funcionamiento, reglas de negocio, arquitectura y estado real del proyecto.
>
> Está basado en README.md, CLAUDE.md, docs/database-design.md, database/schema.sql, database/seed.sql y el código actual de src/. Cuando el diseño conceptual difiere de la implementación, se indica expresamente.

## 1. ¿Qué es el proyecto?

CEISH Platform es una plataforma institucional para registrar investigaciones, administrar su documentación, estratificar el nivel de riesgo y ejecutar la revisión ética de documentos.

El flujo principal es:

1. Un investigador solicita acceso como investigador interno o externo.
2. Un administrador revisa la solicitud y, si la aprueba, crea la cuenta con perfil de investigador.
3. El investigador registra una investigación con título y uno o varios documentos Word.
4. Los documentos se almacenan en MinIO y sus metadatos se guardan en PostgreSQL.
5. El sistema asigna miembros CEISH para la estratificación; el administrador puede reasignar o cancelar antes del dictamen.
6. El miembro completa los anexos 11 y 23. Si corresponde a una investigación sin riesgo, completa también el Anexo 27.
7. El sistema genera documentos Word de los anexos a partir de las plantillas institucionales.
8. Las investigaciones sin riesgo pasan al flujo de calificación y correcciones; las demás continúan hacia la revisión por etapas.
9. El investigador consulta el estado, sus documentos, anexos y observaciones.

### Estado vigente (2026-09-17)

La rama `develop` contiene el flujo integrado de registro, administración de investigaciones, documentos múltiples, estratificación, anexos generados y calificación de investigaciones sin riesgo. La aplicación se ejecuta como frontend React/Vite con una API integrada en el servidor de desarrollo de Vite; no existe un backend separado.

### Roles

| Rol de negocio | Nombre en BD | Nombre en UI | Responsabilidad |
|---|---|---|---|
| Investigador | student | student | Registrar investigaciones, adjuntar documentos y consultar anexos y resultados. |
| Profesor evaluador | teacher | evaluator | Revisar y calificar documentos asignados. |
| Administrador | admin | admin | Consultar el estado general y administrar asignaciones. |

La traducción teacher/evaluator se realiza principalmente en src/shared/services/platformService.ts y durante el login.

## 2. Estado real del proyecto

### Implementado

- Frontend React 19 + TypeScript ejecutado con Vite.
- API mínima dentro del propio servidor de desarrollo de Vite.
- PostgreSQL para usuarios, entregas, asignaciones y evaluaciones.
- MinIO para almacenar documentos PDF, DOC y DOCX.
- Login contra PostgreSQL mediante sesión firmada en cookie HttpOnly y contraseñas scrypt.
- Registro público de investigadores con aprobación o rechazo desde el panel administrativo.
- Interfaces diferenciadas para estudiante, evaluador y administrador.
- Investigaciones con código CEISH, título y múltiples documentos.
- Subida, reemplazo, consulta y eliminación de investigaciones mientras el flujo lo permite.
- Asignación automática de miembros CEISH, detección de conflicto de interés, reasignación y cancelación administrativa.
- Formularios institucionales para anexos 11, 12, 13, 23 y 27.
- Generación de archivos DOCX desde plantillas en `public/annex-templates/` y almacenamiento en MinIO.
- Calificación de investigaciones sin riesgo, solicitud de correcciones y vencimiento automático del plazo de 30 días.
- Revisión con cuatro etapas y criterios configurados en código.
- Persistencia de estados, observaciones, referencias de página y calificación.
- Panel administrativo de asignaciones.
- Visor PDF con navegación, zoom y referencia de página.

### Diseñado o pendiente

- Contraseñas con bcrypt.
- Historial de auditoría.
- Plantillas de criterios administrables desde la base de datos.
- Anotaciones visuales completas sobre regiones del PDF.
- Notificaciones por correo.
- Estadísticas para administradores.
- Versionado completo de documentos y entregas históricas.
- Borrado lógico y preservación completa del historial.

docs/database-design.md describe una arquitectura futura más completa, con backend separado, JWT y tablas adicionales. La arquitectura real actual usa el middleware del dev server de Vite y no tiene un backend independiente.

## 3. Responsabilidades por usuario

### Estudiante

Entra a `/estudiante` y administra su investigación.

Puede:

- Ver el código CEISH, título y documentos de su investigación.
- Subir uno o varios documentos Word (`.doc` o `.docx`).
- Escribir un comentario opcional.
- Abrir los documentos mediante URLs temporales.
- Descargar el Anexo 11 generado cuando esté disponible.
- Editar el título, comentario y conjunto documental mientras el flujo lo permita.
- Retirar la investigación antes de que quede cerrada.
- Consultar la estratificación, anexos, observaciones y estado de correcciones.

Reglas de carga:

- Se aceptan documentos Word (`.doc` y `.docx`) para investigaciones.
- El límite por defecto es 15 MB.
- La validación se hace en el navegador y vuelve a hacerse en el servidor.
- El archivo se envía como multipart/form-data a /api/upload.
- El comentario de la entrega es opcional.

Estados visibles para el estudiante:

| Estado visual | Estado en PostgreSQL | Significado |
|---|---|---|
| Pendiente de revisión | pending | La entrega existe, pero no se ha iniciado una revisión. |
| En revisión | submitted | Ya existe una revisión o el evaluador la abrió. |
| Revisado | reviewed | La evaluación terminó y la calificación fue sincronizada. |

### Evaluador

Entra a `/evaluador` y puede utilizar `/evaluador/estratificacion`, `/evaluador/calificacion` y `/evaluador/revision/:submissionId`.

En estratificación puede:

- Consultar investigaciones asignadas.
- Preparar los datos del Anexo 11, que se emite cuando la investigación es aprobada.
- Declarar conflicto de interés mediante el Anexo 23.
- Completar el Anexo 27 con los ocho indicadores de investigación sin riesgo.
- Descargar los anexos DOCX generados.
- Emitir el dictamen de riesgo cuando la información requerida esté completa.

En el módulo de calificación completa el checklist oficial del Anexo 12. Cada decisión conserva una nueva emisión histórica: puede solicitar correcciones, aprobar mediante un Anexo 12 sin observaciones junto con el Anexo 11, o cerrar con observaciones y Anexo 13 después de una corrección. El investigador dispone de 30 días para enviar el informe de correcciones.

La pantalla muestra estudiantes que tienen una asignación con ese evaluador. Por estudiante muestra:

- Nombre y correo.
- Si tiene o no una entrega.
- Nombre del documento.
- Estado.
- Acción para abrir la revisión.

Filtros disponibles:

- Todos.
- Con documento.
- Sin documento.
- Revisados.

La pantalla /evaluador/revision/:submissionId tiene:

- Visor PDF a la izquierda.
- Panel de criterios a la derecha.
- Navegación de las cuatro etapas.
- Botón para guardar.
- Botón para avanzar.
- Formulario de finalización en la última etapa.

En cada criterio puede:

- Dejarlo pendiente.
- Aprobarlo.
- Rechazarlo.
- Escribir una observación.
- Asociar una referencia numérica de página.
- Usar la página actual del visor como referencia.

Para finalizar debe ingresar:

- Calificación entre 0 y 10.
- Comentario final no vacío.

El comentario final se guarda en la entrega y se muestra al estudiante.

### Administrador

Tiene dos vistas:

- /admin: panel general.
- /admin/asignaciones: mantenimiento de asignaciones.
- /admin/solicitudes: aprobación o rechazo de solicitudes de registro.
- /admin/investigaciones: seguimiento, reasignación y cancelación de investigaciones.

En el panel general puede:

- Ver evaluadores.
- Ver estudiantes asignados a cada evaluador.
- Ver el estado de cada entrega.
- Abrir directamente una revisión.

En asignaciones puede:

- Buscar evaluadores por nombre o correo.
- Buscar estudiantes por nombre o correo.
- Seleccionar un evaluador y un estudiante.
- Crear la relación.
- Ver asignaciones existentes.
- Eliminar una asignación.

En solicitudes puede consultar el tipo de investigador y su afiliación. Al aprobar, se crea el usuario con rol `student` y un registro en `researcher_profiles`.

En investigaciones puede:

- Ver el estado de estratificación y calificación.
- Reasignar el miembro CEISH antes de que exista un dictamen.
- Cancelar una investigación que no esté aprobada o ya cancelada.
- Abrir los documentos y anexos disponibles.

La base de datos impide duplicar la misma pareja mediante UNIQUE (teacher_id, student_id).

## 4. Flujo funcional completo

La descripción de esta sección conserva el flujo legacy de revisión PDF para mantenimiento del módulo `/evaluacion`. El flujo vigente de investigación, estratificación y anexos se describe en la sección de estado actual, en las rutas nuevas y en la guía de anexos.

### 4.1 Login

1. El usuario abre /login.
2. El formulario valida correo y contraseña.
3. El navegador hace POST /api/auth/login.
4. PostgreSQL busca el correo y compara la contraseña.
5. La API devuelve el usuario sin la contraseña.
6. authStore guarda el usuario en Zustand.
7. La aplicación redirige según el rol:
   - student → /estudiante
   - evaluator → /evaluador
   - admin → /admin

En el prototipo la contraseña está en texto plano y la sesión solo vive en memoria del navegador. Al recargar la página, Zustand pierde el usuario.

### 4.2 Crear una entrega

1. El estudiante pulsa Agregar documento.
2. Selecciona o arrastra un PDF.
3. validatePdf comprueba tipo y tamaño.
4. storageService.uploadDocument envía el archivo a /api/upload.
5. El middleware de Vite lo recibe con Busboy.
6. El servidor valida nuevamente tipo y tamaño.
7. src/lib/minio.ts guarda el PDF en el bucket configurado, normalmente documents.
8. MinIO devuelve una clave como documents/<uuid>.pdf.
9. El navegador hace POST /api/submissions con studentId, documentName, documentPath y comment.
10. PostgreSQL crea la entrega con estado pending.

PostgreSQL no almacena los bytes del PDF. Solo guarda la clave del objeto en submissions.document_path.

### 4.3 Consultar un PDF

- El estudiante usa GET /api/documents/:submissionId, que devuelve una URL firmada de MinIO válida durante 5 minutos.
- El evaluador usa GET /api/documents/:submissionId/raw, que transmite el PDF por el mismo origen y lo carga en react-pdf.

### 4.4 Iniciar una revisión

1. El evaluador abre una entrega.
2. useReview llama a POST /api/reviews con submissionId y evaluatorId.
3. Si la revisión existe, se devuelve.
4. Si no existe, se crea con estado in-progress.
5. Se crean cuatro etapas:
   - Etapa 1: in-progress.
   - Etapas 2, 3 y 4: pending.
6. Se crean los criterios definidos en STAGE_TEMPLATE.
7. La entrega pasa de pending a submitted.
8. La interfaz carga el PDF desde /api/documents/:id/raw.

La creación se hace dentro de una transacción y utiliza pg_advisory_xact_lock por entrega para evitar revisiones duplicadas ante llamadas concurrentes.

### 4.5 Guardar avances

platformService.saveReview envía:

- Estado general.
- Comentario final, aunque esté vacío.
- Calificación, si existe.
- Estado de cada etapa.
- Estado y comentario de cada criterio.
- Referencia de página de cada criterio.

El servidor actualiza reviews, review_stages y criteria_evaluations. Para la referencia de página crea una fila en annotations.

### 4.6 Avanzar y finalizar

Al pulsar Siguiente etapa:

1. La etapa actual se marca completed en el estado local.
2. La siguiente pasa a in-progress.
3. La revisión se guarda en PostgreSQL.

En la última etapa el botón cambia a Finalizar entrega. Al confirmar:

1. Todas las etapas se marcan completed en el estado local.
2. La revisión pasa a completed.
3. Se guardan calificación y comentario.
4. La entrega pasa a reviewed.
5. Se asignan reviewed_at, grade y final_comment en submissions.
6. El estudiante puede ver el resultado.

## 5. Etapas y criterios

La plantilla actual está en src/server/queries/reviews.ts.

### Etapa 1: Estructura

- El documento contiene una introducción clara.
- Los objetivos están claramente definidos.
- La hipótesis o pregunta de investigación está planteada.

### Etapa 2: Metodología

- La metodología es apropiada para el tipo de investigación.
- La población de estudio está correctamente definida.
- Los instrumentos de recolección están descritos.

### Etapa 3: Resultados

- Los resultados se presentan de forma clara y ordenada.
- El análisis estadístico es correcto y justificado.
- Las conclusiones responden a los objetivos planteados.

### Etapa 4: Formato

- Las referencias bibliográficas están en formato APA.
- El documento cumple con los criterios de extensión mínima.

Cada criterio tiene uno de estos estados:

| Estado | Uso |
|---|---|
| pending | Todavía no evaluado. |
| approved | Cumple el criterio. |
| rejected | No cumple el criterio. |

La tasa de avance de una etapa se calcula así:

    (criterios aprobados + criterios rechazados) / criterios totales

La calificación final no se calcula automáticamente a partir de los criterios; el evaluador la introduce manualmente entre 0 y 10.

## 6. Reglas de negocio actuales

1. El correo de usuario es único.
2. Cada usuario pertenece a un rol de roles.
3. Una asignación no puede relacionar a un usuario consigo mismo.
4. No se puede repetir una pareja evaluador-estudiante.
5. Una entrega pertenece a un estudiante mediante student_id.
6. Una revisión pertenece a una entrega y existe como máximo una por entrega.
7. Una revisión contiene etapas numeradas del 1 al 4.
8. Una etapa no puede repetir el mismo número dentro de una revisión.
9. Un criterio pertenece a una etapa.
10. Una anotación pertenece a un criterio evaluado.
11. Una entrega solo puede tener pending, submitted o reviewed en PostgreSQL.
12. Una revisión solo puede tener in-progress o completed.
13. Una etapa solo puede tener pending, in-progress o completed.
14. Un criterio solo puede tener pending, approved o rejected.
15. La calificación debe estar entre 0 y 10.
16. La página de una anotación debe ser mayor o igual a 1.
17. Varias relaciones usan ON DELETE CASCADE: eliminar una entrega puede eliminar su revisión; eliminar una revisión puede eliminar sus etapas; y así sucesivamente.

### Entrega por estudiante

El esquema no tiene UNIQUE sobre submissions.student_id. Sin embargo, la interfaz y getSubmissionByStudent trabajan como si hubiera una entrega visible por estudiante: consultan la más reciente. Si se crean varias, las anteriores quedan en la BD, pero la UI normalmente muestra solo la última.

## 7. Reglas diseñadas pero aún no garantizadas

docs/database-design.md propone reglas que todavía no están completamente implementadas:

- El servidor debe autorizar por rol.
- Un evaluador debe poder revisar únicamente estudiantes asignados.
- Debe existir una sola etapa in-progress por revisión.
- No se debe avanzar si la etapa tiene criterios pending.
- No se debe finalizar si existen criterios pendientes.
- El backend debe comprobar que una asignación relacione un evaluador con un estudiante.
- Debe existir historial de auditoría.
- Las contraseñas deben usar bcrypt.
- El login debe usar JWT o cookie httpOnly.
- Usuarios y entregas deberían poder conservarse mediante borrado lógico.

Diferencia especialmente importante: advanceStage marca la etapa como completada sin comprobar criterios pendientes. La finalización también completa todas las etapas sin esa comprobación. Si la regla académica es obligatoria, debe validarse en el servidor, no solo en React.

## 8. Modelo de datos actual

### roles

Catálogo de roles. Actualmente contiene student, teacher y admin.

### users

Campos principales:

- id.
- name.
- email único.
- password con hash scrypt.
- role_id.
- created_at.

Los investigadores aprobados mantienen rol `student` por compatibilidad con la aplicación y además tienen un registro en `researcher_profiles` con tipo y afiliación.

### submissions

Metadatos de la investigación:

- id.
- research_code único con formato `CEISH-#####`.
- title.
- student_id.
- document_name y document_path del documento principal.
- comment.
- status.
- classification_status y risk_level.
- submitted_at.
- reviewed_at.
- grade.
- final_comment.

`submission_documents` almacena el conjunto documental asociado y `research_annexes` conserva los datos y documentos generados de los anexos 11, 12, 13, 23 y 27. Las emisiones del Anexo 12 son registros independientes vinculados a su ciclo de calificación y nunca se sobrescriben.

### registration_requests y researcher_profiles

`registration_requests` conserva solicitudes públicas pendientes, aprobadas o rechazadas, incluyendo tipo de investigador, afiliación, hash de contraseña y datos de revisión. `researcher_profiles` relaciona al usuario aprobado con su información institucional.

### stratification_assignments

Relaciona una investigación con un miembro CEISH y conserva ronda, riesgo, fecha y dictamen. El sistema puede reasignar la primera ronda cuando existe conflicto de interés.

### qualification_cases y qualification_cycles

Gestionan la calificación de investigaciones sin riesgo, los ciclos de corrección, la fecha límite de 30 días y los documentos enviados por el investigador. Cada decisión del evaluador se vincula con una emisión del Anexo 12; la aprobación emite el Anexo 11 y el cierre emite el Anexo 13.

### assignments

Relaciona teacher_id con student_id.

Restricciones:

- Pareja única.
- El profesor y el estudiante no pueden ser la misma persona.
- Las eliminaciones de usuarios se propagan por cascada.

### reviews

Representa la revisión de una entrega:

- submission_id único.
- reviewer_id.
- comment.
- grade.
- status.
- created_at.

### review_stages

Contiene las cuatro etapas:

- review_id.
- stage_number de 1 a 4.
- status.
- completed_at.

### criteria_evaluations

Contiene los criterios copiados al crear la revisión:

- stage_id.
- criterion.
- status.
- comment.

### annotations

Está preparada para referencias dentro del PDF:

- criteria_evaluation_id.
- page_number.
- x, y, width y height como porcentajes de la página.
- comment.

La interfaz actual solo permite elegir una página. Al guardar, crea una anotación con coordenadas en cero; todavía no existe una selección visual de regiones.

## 9. Estados y transiciones

### Entrega

    pending --(se crea una revisión)--> submitted --(se finaliza)--> reviewed

En la UI submitted se presenta como under-review.

### Revisión

    in-progress --(finalización)--> completed

### Etapa

    pending --> in-progress --> completed

La primera etapa se crea como in-progress y las demás como pending.

## 10. Arquitectura técnica

### Stack

- React 19.
- TypeScript.
- Vite 6.
- React Router.
- Zustand.
- react-pdf y PDF.js.
- CSS global con variables; no Tailwind ni CSS Modules.
- PostgreSQL 16 en Docker.
- MinIO en Docker.

### Capa API actual

No existe un proyecto separado de Express, NestJS u otro framework. src/server/apiPlugin.ts registra un plugin de Vite que intercepta /api/* dentro del proceso Node del dev server.

El navegador llama a src/services/ o a platformService con fetch. El plugin de Vite llama a las consultas SQL y a MinIO.

    React en navegador
        |
        +-- src/services/*
        +-- src/shared/services/platformService.ts
                    |
                    | fetch /api/*
                    v
            src/server/apiPlugin.ts
                    |
              +-----+-----+
              |           |
              v           v
          PostgreSQL    MinIO
          src/lib/     src/lib/
          database.ts  minio.ts

Reglas de separación:

- Los componentes no ejecutan SQL.
- Los componentes no importan pg ni minio.
- Las consultas SQL viven en src/server/queries/.
- src/lib/database.ts mantiene un único pool.
- src/lib/minio.ts mantiene el cliente de MinIO.
- El navegador no se conecta directamente por TCP a PostgreSQL o MinIO.

### Carpetas principales

| Carpeta | Responsabilidad |
|---|---|
| src/features/auth | Login. |
| src/features/student | Gestión de entrega. |
| src/features/evaluator | Lista y revisión multi-etapa. |
| src/features/admin | Panel general y asignaciones. |
| src/features/evaluation | Módulo PDF original/legacy y componentes reutilizados. |
| src/services | Llamadas HTTP del navegador y subida. |
| src/shared/services/platformService.ts | Adaptador DTO/API a tipos de UI. |
| src/server/queries | SQL por dominio. |
| src/store | Estado global. |
| database | Esquema y datos iniciales. |

### Punto de integración principal

platformService.ts traduce:

- teacher ↔ evaluator.
- submitted ↔ under-review.
- currentStageIndex se deriva de la etapa in-progress; no se guarda en BD.

Al cambiar persistencia o modelo de datos hay que revisar ese archivo y las consultas de src/server/queries/.

## 11. Rutas de la aplicación

| Ruta | Uso | Rol esperado |
|---|---|---|
| /login | Inicio de sesión. | Todos |
| /registro | Solicitud pública de registro. | Público |
| / | Redirección por usuario activo. | Todos |
| /estudiante | Gestión de investigación y documentos. | Investigador |
| /evaluador | Estudiantes asignados. | Evaluador |
| /evaluador/estratificacion | Anexos y dictamen de riesgo. | Evaluador |
| /evaluador/calificacion | Calificación de investigaciones sin riesgo. | Evaluador |
| /evaluador/revision/:submissionId | Revisión PDF. | Evaluador |
| /admin | Panel general. | Administrador |
| /admin/asignaciones | Asignaciones. | Administrador |
| /admin/solicitudes | Solicitudes de registro. | Administrador |
| /admin/investigaciones | Gestión de investigaciones. | Administrador |
| /evaluacion | Módulo original. | Evaluador/prototipo |
| /evaluacion/:id | Variante del módulo original. | Evaluador/prototipo |

Las rutas protegidas usan `RequireRole` en el frontend y la API valida sesión y rol mediante cookies HttpOnly firmadas. La autorización por asignación y propiedad se aplica en los endpoints principales; se deben mantener pruebas de autorización al ampliar el sistema.

## 12. Endpoints actuales

### Autenticación y usuarios

| Método | Endpoint | Uso |
|---|---|---|
| POST | /api/auth/login | Validar correo y contraseña. |
| POST | /api/auth/register | Crear una solicitud de registro pendiente. |
| POST | /api/auth/logout | Cerrar sesión. |
| GET | /api/auth/session | Consultar la sesión actual. |
| GET | /api/registration-requests | Listar solicitudes para administración. |
| PATCH | /api/registration-requests/:id | Aprobar o rechazar una solicitud. |
| GET | /api/users | Listar usuarios. |
| GET | /api/users?role=student | Filtrar usuarios por rol de BD. |
| GET | /api/users/:id | Consultar usuario. |

### Entregas y documentos

| Método | Endpoint | Uso |
|---|---|---|
| POST | /api/upload | Subir un documento a MinIO. |
| GET | /api/submission-documents/:id | Obtener URL firmada de un documento de investigación. |
| GET | /api/documents/:id | URL firmada temporal. |
| GET | /api/documents/:id/raw | Transmitir PDF. |
| GET | /api/submissions | Listar entregas. |
| GET | /api/submissions?studentId=:id | Entrega más reciente del estudiante. |
| GET | /api/submissions/:id | Obtener entrega. |
| POST | /api/submissions | Crear entrega. |
| PATCH | /api/submissions/:id | Actualizar entrega. |
| DELETE | /api/submissions/:id | Eliminar entrega. |

### Estratificación y anexos

| Método | Endpoint | Uso |
|---|---|---|
| GET | /api/stratifications | Listar investigaciones asignadas al evaluador. |
| PATCH | /api/stratifications/:id/annex-11 | Guardar información del Anexo 11. |
| POST | /api/stratifications/:id/conflict | Registrar conflicto o ausencia de conflicto mediante el Anexo 23. |
| PATCH | /api/stratifications/:id | Completar el Anexo 27 y clasificar sin riesgo. |
| GET | /api/annexes/:id/document | Obtener URL firmada del DOCX generado. |
| GET | /api/admin/research | Listar investigaciones para administración. |
| PATCH | /api/admin/research/:id/reassign | Reasignar miembro CEISH antes del dictamen. |
| PATCH | /api/admin/research/:id/cancel | Cancelar una investigación. |

### Calificación sin riesgo

| Método | Endpoint | Uso |
|---|---|---|
| GET | /api/qualifications | Listar casos del evaluador. |
| PATCH | /api/qualifications/:id/review | Emitir el checklist del Anexo 12; solicitar correcciones, aprobar con Anexo 11 o cerrar con Anexo 13 después de correcciones. |
| POST | /api/qualifications/:id/corrections | Enviar el informe de correcciones. |
| GET | /api/qualification-corrections/:id | Obtener URL del informe de correcciones. |

### Asignaciones

| Método | Endpoint | Uso |
|---|---|---|
| GET | /api/assignments | Listar asignaciones. |
| GET | /api/assignments?teacherId=:id | Asignaciones de un evaluador. |
| POST | /api/assignments | Crear asignación. |
| DELETE | /api/assignments/:id | Eliminar asignación. |

### Revisiones

| Método | Endpoint | Uso |
|---|---|---|
| POST | /api/reviews | Obtener o crear revisión. |
| GET | /api/reviews/:submissionId | Consultar revisión completa. |
| PUT | /api/reviews/:reviewId | Guardar revisión completa. |

## 13. Estado global del frontend

### authStore

Archivo: src/store/authStore.ts.

Guarda currentUser y permite setUser y logout. No persiste sesión en cookies ni localStorage.

### reviewStore

Archivo: src/store/reviewStore.ts.

Guarda la revisión activa y permite cambiar de etapa, finalizar, cambiar estado de criterios, observaciones y páginas. useReview conecta el store con platformService.

### evaluationStore

Archivo: src/store/evaluationStore.ts.

Pertenece a /evaluacion, el módulo anterior. Se conserva para el flujo legacy y para reutilizar componentes visuales.

## 14. Módulo legacy /evaluacion

/evaluacion no representa todavía una revisión persistida de una entrega real.

- Usa src/features/evaluation/services/evaluationService.ts.
- La sesión sale de MOCK_SESSION.
- El guardado simula una demora y mantiene el estado en memoria.
- El PDF se carga manualmente.
- La matriz tiene criterios de demostración distintos de la plantilla actual de PostgreSQL.

La revisión real de un estudiante usa /evaluador/revision/:submissionId y reutiliza componentes del módulo legacy mediante una sesión sintética.

## 15. Infraestructura local

docker-compose.yml levanta:

### PostgreSQL

- Imagen postgres:16-alpine.
- Base por defecto: ceish_db.
- Usuario por defecto: ceish_user.
- Contraseña por defecto: ceish_pass.
- Puerto interno 5432.
- schema.sql y seed.sql se ejecutan solo con el volumen vacío.

### MinIO

- Imagen quay.io/minio/minio:latest.
- API S3 en 9000.
- Consola web en 9001.
- Credenciales por defecto minioadmin / minioadmin.
- Bucket por defecto documents.

Las migraciones incrementales están en `database/migrations/` y se aplican con `node scripts/migrate.mjs` sobre una base ya existente. `schema.sql` y `seed.sql` se ejecutan automáticamente solo cuando PostgreSQL inicia con un volumen vacío.

### Persistencia

- ceish_postgres_data: datos de PostgreSQL.
- ceish_minio_data: archivos de MinIO.

docker compose down conserva volúmenes. docker compose down -v los elimina y hace que el esquema y el seed vuelvan a ejecutarse en el siguiente arranque.

## 16. Configuración y comandos

Requisitos:

- Node.js 18 o superior.
- Docker y Docker Compose.

Comandos principales:

    npm install
    docker compose up -d
    npm run dev

Otros comandos:

    npm run build
    npm run lint
    npx tsc -b
    node scripts/migrate.mjs
    docker compose down
    docker compose down -v

El servidor de Vite normalmente queda en http://localhost:5173.

Variables relevantes:

    DATABASE_HOST
    DATABASE_PORT
    DATABASE_NAME
    DATABASE_USER
    DATABASE_PASSWORD
    MINIO_ENDPOINT
    MINIO_PORT
    MINIO_CONSOLE_PORT
    MINIO_ROOT_USER
    MINIO_ROOT_PASSWORD
    MINIO_BUCKET
    MINIO_USE_SSL
    UPLOAD_MAX_MB

vite.config.ts carga las variables de .env en process.env para que el middleware de Vite pueda leerlas.

Hay una diferencia documental: README.md y CLAUDE.md mencionan PostgreSQL en el puerto host 5433, pero docker-compose.yml usa 5432 si DATABASE_PORT no está definido. Hay que verificar el .env y el puerto real.

## 17. Datos de prueba

El seed crea:

| Usuario | Rol | Correo | Contraseña del prototipo |
|---|---|---|---|
| Admin Demo | Administrador | admin@ceish.edu | demo123 |
| Profesor Demo | Evaluador | profesor@ceish.edu | demo123 |
| Juan Pérez | Estudiante | juan@ceish.edu | demo123 |
| María López | Estudiante | maria@ceish.edu | demo123 |
| Carlos Ruiz | Estudiante | carlos@ceish.edu | demo123 |

También existen seis miembros CEISH de prueba para validar selección, conflictos y consenso:

| Usuarios | Rol | Contraseña |
|---|---|---|
| miembro@ceish.edu, miembro01@ceish.edu … miembro06@ceish.edu | Evaluador/miembro CEISH | demo123 |

El profesor demo tiene asignados a los tres estudiantes.

Juan tiene una entrega con:

- Estado submitted.
- Una revisión en progreso.
- Etapa 1 completada.
- Etapa 2 en progreso.
- Etapas 3 y 4 pendientes.
- Criterios evaluados en etapa 1.
- Una anotación en página 2.

El `document_path` del seed apunta a un objeto de ejemplo que no se incluye físicamente en MinIO. El PDF de Juan puede fallar hasta cargar un documento real. Los documentos DOCX generados para anexos se crean cuando se registra o actualiza la información correspondiente y requieren que MinIO esté disponible.

## 18. Riesgos y pendientes técnicos

1. La autorización server-side debe seguir ampliándose y cubrir cada nueva operación por rol, propietario y asignación.
2. No hay historial de auditoría completo para cambios administrativos y decisiones.
3. El almacenamiento de documentos no implementa todavía limpieza garantizada de objetos huérfanos al reemplazar o retirar una investigación.
4. La revisión PDF legacy y el nuevo flujo de investigación conviven; el módulo `/evaluacion` mantiene comportamiento de prototipo.
5. Las reglas de criterios y transiciones deben seguir validándose en backend, especialmente para revisiones de cuatro etapas.
6. Las anotaciones visuales del PDF siguen limitadas: algunas referencias de página no representan una región real.
7. No hay pruebas automatizadas configuradas.
8. docs/database-design.md todavía describe partes de una arquitectura futura y debe mantenerse alineado con el esquema actual.
9. Las plantillas DOCX dependen de `unzip`, `zip` y de la estructura interna de los archivos institucionales.
10. El seed y las migraciones contienen credenciales demo; nunca deben reutilizarse en producción.

## 19. Guía para modificar el sistema

### Flujo de entrega

Revisar:

- src/features/student/SubmissionPage.tsx.
- src/features/student/components/UploadModal.tsx.
- src/features/student/components/SubmissionCard.tsx.
- src/services/submissions.ts.
- src/services/storage.ts.
- src/server/queries/submissions.ts.

La entrega actual es una investigación con título y documentos DOC/DOCX. Al registrarla se prepara un borrador del Anexo 11; el documento se emite al aprobar la investigación.

### Flujo de anexos

Revisar:

- src/features/evaluator/StratificationDashboard.tsx.
- src/server/queries/stratifications.ts.
- src/server/queries/annexes.ts.
- src/server/annexDocuments.ts.
- public/annex-templates/.

Los cambios en los formularios de anexos regeneran el DOCX correspondiente y lo guardan en MinIO. Si se agregan campos a un anexo, deben actualizarse la interfaz, la consulta, la plantilla y la función de reemplazo XML.
- src/services/submissions.ts.
- src/services/storage.ts.
- src/server/queries/submissions.ts.
- src/server/apiPlugin.ts.

### Etapas y criterios

Revisar:

- src/server/queries/reviews.ts, especialmente STAGE_TEMPLATE.
- database/seed.sql.
- src/shared/services/platformService.ts.
- src/features/evaluator/components/ReviewPage.tsx.
- src/features/evaluator/hooks/useReview.ts.

### Asignaciones

Revisar:

- src/features/admin/components/AssignmentPanel.tsx.
- src/features/admin/AdminDashboard.tsx.
- src/server/queries/assignments.ts.
- src/shared/services/platformService.ts.
- database/schema.sql.

### Autenticación

Revisar:

- src/features/auth/LoginPage.tsx.
- src/features/auth/LoginForm.tsx.
- src/services/authService.ts.
- src/server/queries/auth.ts.
- src/store/authStore.ts.
- src/app/router/index.tsx.
- src/server/apiPlugin.ts.

Para autenticación real no basta con cambiar el formulario: también deben protegerse los endpoints y las operaciones en el servidor.

### Regla de capas

    Componente
      -> hook o feature
      -> service del navegador
      -> endpoint en apiPlugin
      -> query SQL
      -> PostgreSQL o MinIO

No se debe poner SQL dentro de componentes ni importar módulos server-only en código del navegador.

## 20. Recorrido recomendado de prueba

1. Levantar PostgreSQL y MinIO con `docker compose up -d`.
2. Arrancar Vite con npm run dev.
3. Entrar como `admin@ceish.edu` y revisar solicitudes e investigaciones.
4. Entrar como `juan@ceish.edu` y registrar una investigación con documentos Word menores a 15 MB.
5. Entrar como `miembro@ceish.edu` o `miembro01@ceish.edu`.
6. Abrir `/evaluador/estratificacion`, preparar el Anexo 11 y declarar el Anexo 23.
7. Si aplica, completar los ocho indicadores del Anexo 27 y comprobar que se emitan los DOCX de los anexos 11 y 27.
8. Verificar como investigador los documentos y anexos en `/estudiante`.
9. Probar `/evaluador/calificacion`: completar todos los criterios del Anexo 12, emitir observaciones, enviar correcciones como investigador y revisar el historial. Verificar que la aprobación genere los anexos 12 y 13.
10. Probar `/evaluador/revision/:submissionId` para el flujo de revisión por etapas.

Endpoints útiles:

    curl "http://localhost:5173/api/users?role=student"
    curl "http://localhost:5173/api/submissions"
    curl "http://localhost:5173/api/reviews/<submission-id>"

## 21. Resumen

CEISH Platform conecta tres actores alrededor de una investigación:

    Administrador
        -> aprueba registros, supervisa investigaciones y asigna miembros CEISH

    Investigador
        -> registra documentos, consulta anexos y responde observaciones

    Evaluador
        -> declara conflicto, estratifica riesgo, califica y revisa

Los metadatos, decisiones y anexos están en PostgreSQL; los documentos de investigación, correcciones y anexos DOCX están en MinIO. El sistema ya cuenta con autenticación, autorización básica por rol y generación de anexos; antes de producción deben reforzarse auditoría, pruebas automatizadas, limpieza de archivos y validación exhaustiva de transiciones.
