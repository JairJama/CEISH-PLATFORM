# Diseño de base de datos — CEISH Platform (v2)

Documento de diseño conceptual revisado. Cubre arquitectura general, modelo de datos, relaciones, flujos de estado e infraestructura Docker. **No contiene código de implementación todavía.**

---

## 1. Arquitectura general

El sistema sigue una arquitectura de tres capas estricta. El frontend **nunca** se conecta directamente a la base de datos.

```
┌─────────────────────────────────────┐
│          Frontend (React)           │
│   - Interfaz por rol                │
│   - Estado local (Zustand)          │
│   - Llamadas HTTP al backend        │
└────────────────┬────────────────────┘
                 │  HTTP / REST (JSON)
                 │
┌────────────────▼────────────────────┐
│          Backend (API)              │
│   - Autenticación y JWT             │
│   - Autorización por rol            │
│   - Lógica de negocio               │
│   - Validaciones                    │
│   - Subida y gestión de archivos    │
│   - Comunicación con MinIO          │
│   - Comunicación con PostgreSQL     │
└──────────┬─────────────┬────────────┘
           │             │
           │ SQL         │ S3-compatible API
           │             │
┌──────────▼───┐   ┌─────▼──────────┐
│  PostgreSQL  │   │     MinIO      │
│  (datos)     │   │  (archivos)    │
└──────────────┘   └────────────────┘
```

### Por qué esta separación es no negociable

| Responsabilidad | Dónde vive | Por qué |
|----------------|-----------|---------|
| Autenticación / JWT | Backend | El frontend nunca debe validar tokens por sí solo |
| Autorización | Backend | Las reglas de rol deben aplicarse server-side |
| Validaciones de negocio | Backend | El frontend puede ser manipulado; el backend no |
| Credenciales de BD | Backend | El frontend no debe conocer la cadena de conexión |
| Subida de archivos | Backend → MinIO | El archivo pasa por el backend antes de almacenarse |

---

## 2. Decisiones de diseño

### 2.1 Roles como tabla independiente

**Decisión:** `users.role` pasa de ser un campo `VARCHAR` con `CHECK` a ser una FK hacia una tabla `roles`.

**Motivo:** el sistema tiene 3 roles hoy (`student`, `evaluator`, `admin`), pero necesitará agregar roles futuros sin modificar el esquema de base de datos:

- `coordinator` — coordina grupos de evaluadores
- `external_evaluator` — evaluador invitado sin acceso completo
- `supervisor` — revisión de calidad sobre evaluaciones
- `academic_admin` — administrador por facultad o programa

Con la tabla `roles`, agregar un nuevo rol es insertar una fila, no alterar la estructura.

**Trade-off:** los JOINs para obtener el nombre del rol requieren una tabla adicional. Es un costo mínimo dado el beneficio de extensibilidad.

---

### 2.2 Archivos PDF fuera de la base de datos

**Decisión:** los archivos PDF **nunca** se almacenan en PostgreSQL (`BYTEA` o similar). La base de datos guarda únicamente metadatos.

**Flujo correcto:**

```
Estudiante sube PDF
       ↓
Frontend envía multipart/form-data al Backend
       ↓
Backend valida el archivo (tipo, tamaño, virus scan futuro)
       ↓
Backend sube el archivo a MinIO
       ↓
MinIO devuelve la URL del objeto almacenado
       ↓
Backend guarda en submissions: document_name, document_url, storage_provider
       ↓
Frontend recibe confirmación
```

**Por qué no en PostgreSQL:**
- Los binarios en BD hacen los backups extremadamente pesados
- No escala para múltiples archivos o archivos grandes
- MinIO está diseñado específicamente para esto y es compatible con la API de S3

---

### 2.3 Sistema de anotaciones PDF

**Decisión:** reemplazar el campo simple `page_reference` en `criteria_evaluations` por una tabla `annotations` con coordenadas completas.

**Motivo:** el sistema debe poder mostrar marcadores visuales directamente sobre el PDF, vinculados a criterios específicos. Un número de página solo no es suficiente para eso.

---

### 2.4 Historial de auditoría

**Decisión:** agregar una tabla `review_history` que registre toda acción relevante durante el ciclo de vida de una revisión.

**Motivo:** el contexto académico-institucional exige trazabilidad. Un administrador o coordinador debe poder responder a "¿quién hizo qué y cuándo?".

---

### 2.5 Preparación para funcionalidades futuras

Las siguientes funcionalidades **no se implementan ahora**, pero el modelo de datos no debe bloquearlas:

| Funcionalidad futura | Cómo el modelo actual la facilita |
|---------------------|----------------------------------|
| Módulo de IA | `stage_criteria_templates` puede tener campo `ai_prompt`; `criteria_evaluations` puede recibir campo `ai_suggestion` |
| Generación de documentos PDF | `reviews` tiene todos los datos necesarios para exportar un reporte |
| Chat / mensajes | Nueva tabla `messages` con FK a `reviews` o `users` |
| Anexos dinámicos | Nueva tabla `attachments` con FK polimórfica o a `submissions` |
| Notificaciones | Nueva tabla `notifications` con FK a `users` y campo `event_type` |
| Múltiples entregas | Eliminar el índice único en `submissions.student_id` y agregar versiones |

---

## 3. Infraestructura Docker

Cuatro servicios en un solo `docker-compose.yml`:

```
┌─────────────────────────────────────────────────────┐
│                   Docker Network                     │
│                                                     │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────┐ │
│  │ frontend │   │ backend  │   │    postgres      │ │
│  │ :80      │   │ :3000    │   │    :5432         │ │
│  └──────────┘   └────┬─────┘   └─────────────────┘ │
│                      │                              │
│                 ┌────▼─────┐                        │
│                 │  minio   │                        │
│                 │  :9000   │  (API S3)              │
│                 │  :9001   │  (Console web)         │
│                 └──────────┘                        │
└─────────────────────────────────────────────────────┘
```

| Servicio | Imagen | Puerto expuesto | Propósito |
|----------|--------|----------------|-----------|
| `frontend` | nginx (build de Vite) | 80 | Sirve el SPA en producción |
| `backend` | Node.js custom | 3000 | API REST |
| `postgres` | postgres:16-alpine | 5432 | Base de datos relacional |
| `minio` | minio/minio | 9000 (API), 9001 (UI) | Object storage para PDFs y archivos |

### Volúmenes persistentes

| Volumen | Contenido |
|---------|-----------|
| `postgres_data` | Datos de PostgreSQL |
| `minio_data` | Archivos almacenados (PDFs, anexos futuros) |

### Variables de entorno del backend (referencia)

```
DATABASE_URL        postgresql://user:pass@postgres:5432/ceish_db
JWT_SECRET          (secreto fuerte, rotar en producción)
JWT_EXPIRES_IN      7d
MINIO_ENDPOINT      minio
MINIO_PORT          9000
MINIO_ACCESS_KEY    (credencial MinIO)
MINIO_SECRET_KEY    (credencial MinIO)
MINIO_BUCKET        ceish-documents
MINIO_USE_SSL       false   (true en producción con certificado)
```

---

## 4. Modelo de datos

### Orden de creación (dependencias)

```
1.  roles
2.  users                     (FK → roles)
3.  submissions               (FK → users)
4.  assignments               (FK → users × 2)
5.  stage_criteria_templates  (sin FK externas — tabla de referencia)
6.  reviews                   (FK → submissions, users × 2)
7.  review_stages             (FK → reviews)
8.  criteria_evaluations      (FK → review_stages)
9.  annotations               (FK → criteria_evaluations)
10. review_history            (FK → reviews, users)
```

---

### Tabla: `roles`

Catálogo de roles del sistema. Desacopla el concepto de rol del esquema de `users`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `name` | VARCHAR(40) UNIQUE | Nombre técnico: `student`, `evaluator`, `admin`, … |
| `description` | TEXT | Descripción legible del rol |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

**Filas iniciales:**

| name | description |
|------|-------------|
| `student` | Estudiante que envía documentos para evaluación |
| `evaluator` | Profesor que revisa y califica entregas |
| `admin` | Administrador que gestiona usuarios y asignaciones |

---

### Tabla: `users`

Usuarios del sistema. `role_id` apunta a la tabla `roles`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `name` | VARCHAR(120) | Nombre completo |
| `email` | VARCHAR(255) UNIQUE | Correo electrónico (usado para login) |
| `password_hash` | VARCHAR(255) | Hash bcrypt de la contraseña |
| `role_id` | UUID FK → roles | Rol del usuario |
| `is_active` | BOOLEAN | Permite desactivar usuarios sin eliminarlos |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Actualizado por trigger |

**Nota sobre `is_active`:** en un contexto académico los usuarios no se eliminan — un profesor puede reincorporarse. Este campo permite suspender el acceso sin perder historial.

---

### Tabla: `submissions`

Entrega de documento de un estudiante. Un estudiante tiene como máximo una entrega activa (índice único sobre `student_id`).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `student_id` | UUID FK → users | Estudiante que entregó |
| `document_name` | VARCHAR(255) | Nombre original del archivo |
| `document_url` | TEXT | URL completa del archivo en MinIO |
| `storage_provider` | VARCHAR(20) | `minio` / `s3` / `local` — para multi-proveedor futuro |
| `comment` | TEXT | Descripción del estudiante sobre la entrega |
| `status` | VARCHAR(20) | `pending` / `under-review` / `reviewed` |
| `grade` | NUMERIC(4,2) | Calificación final (0.00 – 10.00) |
| `final_comment` | TEXT | Retroalimentación anónima para el estudiante |
| `submitted_at` | TIMESTAMPTZ | Fecha de entrega |
| `reviewed_at` | TIMESTAMPTZ | Fecha en que se completó la revisión |

**Campo `storage_provider`:** aunque hoy solo se usa MinIO, este campo permite migrar a S3 u otro proveedor en producción sin cambiar el esquema.

---

### Tabla: `assignments`

Asignación evaluador → estudiante creada por el administrador. La combinación evaluador + estudiante es única.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `evaluator_id` | UUID FK → users | Evaluador asignado |
| `student_id` | UUID FK → users | Estudiante asignado |
| `assigned_by` | UUID FK → users | Administrador que creó la asignación |
| `created_at` | TIMESTAMPTZ | |

**Cambio respecto a v1:** se agrega `assigned_by` para trazabilidad. Permite saber qué administrador realizó cada asignación.

**Restricciones:**
- `UNIQUE (evaluator_id, student_id)` — no se puede duplicar la asignación
- El backend valida que `evaluator_id` tenga rol `evaluator` y `student_id` tenga rol `student`

---

### Tabla: `reviews`

Proceso de revisión de una entrega. Una entrega tiene una sola revisión. El evaluador avanza por etapas de forma secuencial.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `submission_id` | UUID FK → submissions | Entrega que se revisa (única) |
| `evaluator_id` | UUID FK → users | Evaluador que realiza la revisión |
| `student_id` | UUID FK → users | Estudiante dueño de la entrega (denormalizado) |
| `current_stage_index` | SMALLINT | Índice de la etapa activa (0–3) |
| `grade` | NUMERIC(4,2) | Calificación final |
| `final_comment` | TEXT | Comentario global al finalizar |
| `completed_at` | TIMESTAMPTZ | NULL si está en progreso |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Actualizado por trigger |

**Por qué `student_id` está denormalizado aquí:** las consultas del evaluador ("ver mis revisiones") son muy frecuentes. Evitar un JOIN extra a `submissions` en cada request mejora el rendimiento sin romper la integridad, ya que `student_id` no cambia.

---

### Tabla: `review_stages`

Las etapas de cada revisión. Se crean automáticamente al iniciar una revisión, a partir de las plantillas en `stage_criteria_templates`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `review_id` | UUID FK → reviews | Revisión a la que pertenece |
| `name` | VARCHAR(80) | Nombre de la etapa |
| `stage_order` | SMALLINT | Orden secuencial: 1, 2, 3, 4 |
| `status` | VARCHAR(20) | `pending` / `in-progress` / `completed` |

**Regla de negocio (aplicada en backend):**
- Solo puede existir una etapa `in-progress` por revisión en cualquier momento
- No se puede avanzar a una etapa sin completar la anterior

---

### Tabla: `criteria_evaluations`

Evaluación de cada criterio dentro de una etapa. Un criterio puede estar pendiente, aprobado o rechazado, con una observación de texto libre.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `stage_id` | UUID FK → review_stages | Etapa a la que pertenece |
| `criterion_key` | VARCHAR(40) | Clave que mapea a `stage_criteria_templates` |
| `label` | TEXT | Texto del criterio copiado al momento de la revisión |
| `status` | VARCHAR(20) | `pending` / `approved` / `rejected` |
| `observation` | TEXT | Nota del evaluador sobre este criterio |
| `updated_at` | TIMESTAMPTZ | Actualizado por trigger |

**Por qué se copia `label`:** si la plantilla de criterios evoluciona, los registros históricos conservan el texto exacto con el que fueron evaluados. La auditabilidad académica lo requiere.

**Cambio respecto a v1:** se elimina `page_reference`. Las referencias espaciales al PDF ahora viven en la tabla `annotations`, que soporta múltiples marcaciones por criterio con coordenadas completas.

---

### Tabla: `annotations`

Anotaciones espaciales sobre el PDF, vinculadas a un criterio evaluado. Permite marcar visualmente regiones del documento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `criteria_evaluation_id` | UUID FK → criteria_evaluations | Criterio al que pertenece |
| `page_number` | SMALLINT | Página del PDF (base 1) |
| `x` | NUMERIC(8,4) | Coordenada X (porcentaje del ancho de página, 0–100) |
| `y` | NUMERIC(8,4) | Coordenada Y (porcentaje del alto de página, 0–100) |
| `width` | NUMERIC(8,4) | Ancho del área marcada (porcentaje) |
| `height` | NUMERIC(8,4) | Alto del área marcada (porcentaje) |
| `comment` | TEXT | Comentario puntual de la anotación |
| `created_at` | TIMESTAMPTZ | |

**Por qué coordenadas como porcentaje y no píxeles:** los PDFs se renderizan a distintas resoluciones en distintos dispositivos. Usar porcentajes del tamaño de página hace que las coordenadas sean independientes de la resolución de pantalla.

**Relación con `criteria_evaluations`:** un criterio puede tener cero o múltiples anotaciones. El evaluador puede marcar varias secciones del documento para el mismo criterio.

---

### Tabla: `review_history`

Registro de auditoría de todas las acciones relevantes durante el ciclo de vida de una revisión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `review_id` | UUID FK → reviews | Revisión afectada |
| `user_id` | UUID FK → users | Usuario que realizó la acción |
| `action` | VARCHAR(60) | Código de la acción (ver catálogo) |
| `metadata` | JSONB | Contexto adicional de la acción |
| `created_at` | TIMESTAMPTZ | Fecha exacta de la acción |

**Catálogo de acciones (`action`):**

| Código | Descripción |
|--------|-------------|
| `review_started` | El evaluador abrió la revisión por primera vez |
| `stage_started` | Se inició una etapa (incluye cuál en `metadata`) |
| `stage_completed` | Se completó una etapa |
| `criterion_updated` | Se evaluó o cambió un criterio |
| `annotation_added` | Se agregó una anotación al PDF |
| `review_finalized` | Se finalizó la revisión con calificación |
| `assignment_created` | Admin creó una asignación |
| `assignment_deleted` | Admin eliminó una asignación |

**Campo `metadata` (JSONB):** almacena contexto variable por tipo de acción. Ejemplos:

```
action: "stage_completed"
metadata: { "stage_name": "Metodología", "stage_order": 2, "approved": 3, "rejected": 0 }

action: "review_finalized"
metadata: { "grade": 8.5, "stages_completed": 4 }

action: "assignment_created"
metadata: { "student_name": "Juan Pérez", "evaluator_name": "Prof. García" }
```

**Nota importante:** `review_history` es solo de inserción (`INSERT`). Nunca se hacen `UPDATE` ni `DELETE` sobre esta tabla.

---

### Tabla: `stage_criteria_templates`

Catálogo estático de criterios por etapa. Define qué criterios se crean automáticamente al iniciar una revisión. No se modifica en tiempo de ejecución.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador |
| `stage_name` | VARCHAR(80) | Nombre de la etapa |
| `stage_order` | SMALLINT | Orden de la etapa (1–4) |
| `criterion_key` | VARCHAR(40) UNIQUE | Clave única del criterio |
| `label` | TEXT | Texto descriptivo del criterio |
| `category` | VARCHAR(80) | Agrupación dentro de la etapa |
| `is_active` | BOOLEAN | Permite desactivar criterios sin eliminar historial |

**Datos iniciales:**

| stage_order | stage_name | criterion_key | label |
|-------------|------------|---------------|-------|
| 1 | Estructura | s1-c1 | El documento contiene una introducción clara |
| 1 | Estructura | s1-c2 | Los objetivos están claramente definidos |
| 1 | Estructura | s1-c3 | La hipótesis o pregunta de investigación está planteada |
| 2 | Metodología | s2-c1 | La metodología es apropiada para el tipo de investigación |
| 2 | Metodología | s2-c2 | La población de estudio está correctamente definida |
| 2 | Metodología | s2-c3 | Los instrumentos de recolección están descritos |
| 3 | Resultados | s3-c1 | Los resultados se presentan de forma clara y ordenada |
| 3 | Resultados | s3-c2 | El análisis estadístico es correcto y justificado |
| 3 | Resultados | s3-c3 | Las conclusiones responden a los objetivos planteados |
| 4 | Formato | s4-c1 | Las referencias bibliográficas están en formato APA |
| 4 | Formato | s4-c2 | El documento cumple con los criterios de extensión mínima |

---

## 5. Diagrama de relaciones

```
roles
  │ 1
  ▼ N
users ──────────────────────────────────────────┐
  │ (role=student)          (role=evaluator)     │ (role=admin)
  │ 1                              │ 1           │
  ▼ N                              │             │
submissions                        │             │
  │ 1                              ▼ N           │
  │                          assignments ◄───────┘
  │                           (assigned_by)
  │
  ▼ 1
reviews ──────────────── review_history
  │ 1                         (audit log)
  ▼ N
review_stages
  │ 1
  ▼ N
criteria_evaluations
  │ 1
  ▼ N
annotations


stage_criteria_templates  (referencia estática — sin FK a reviews)
```

---

## 6. Flujos de estado

### `submissions.status`

```
            [estudiante sube documento]
                       │
                       ▼
                    pending
                       │
          [evaluador abre la revisión]
                       │
                       ▼
                 under-review
                       │
        [evaluador finaliza la revisión]
                       │
                       ▼
                   reviewed
```

- La transición `pending → under-review` ocurre cuando el backend crea el registro en `reviews`
- La transición `under-review → reviewed` ocurre cuando `reviews.completed_at` recibe valor
- Si se elimina una revisión en progreso, `status` vuelve a `pending`

---

### `review_stages.status`

```
pending ──► in-progress ──► completed
```

**Reglas que el backend debe garantizar:**

1. Al iniciar una revisión, la primera etapa pasa a `in-progress`; las demás quedan en `pending`
2. Solo puede haber **una etapa `in-progress`** por revisión
3. Para pasar una etapa a `completed`, todos sus criterios deben tener estado diferente a `pending`
4. Al completar una etapa, la siguiente pasa automáticamente a `in-progress`
5. Cuando se completa la última etapa, el evaluador puede finalizar la revisión

---

## 7. Índices recomendados

| Índice | Tabla | Columna(s) | Justificación |
|--------|-------|-----------|---------------|
| `idx_users_role` | users | `role_id` | Filtrar usuarios por rol (admin ve todos los evaluadores) |
| `idx_submissions_student` | submissions | `student_id` | El estudiante consulta su propia entrega |
| `idx_submissions_status` | submissions | `status` | Filtros de estado en paneles del evaluador y admin |
| `idx_assignments_evaluator` | assignments | `evaluator_id` | Cargar estudiantes asignados a un evaluador |
| `idx_assignments_student` | assignments | `student_id` | Verificar a qué evaluadores está asignado un estudiante |
| `idx_reviews_evaluator` | reviews | `evaluator_id` | Dashboard del evaluador |
| `idx_reviews_submission` | reviews | `submission_id` (UNIQUE) | Lookup por entrega |
| `idx_review_stages_review` | review_stages | `review_id` | Cargar todas las etapas de una revisión |
| `idx_criteria_stage` | criteria_evaluations | `stage_id` | Cargar criterios de una etapa |
| `idx_annotations_criteria` | annotations | `criteria_evaluation_id` | Cargar anotaciones de un criterio |
| `idx_history_review` | review_history | `review_id` | Historial de una revisión específica |
| `idx_history_user` | review_history | `user_id` | Acciones de un usuario específico |

---

## 8. Consideraciones adicionales

### Triggers de `updated_at`
Las tablas `users`, `reviews` y `criteria_evaluations` necesitan un trigger que actualice `updated_at` automáticamente en cada `UPDATE`. Esto se implementa con una función PostgreSQL reutilizable aplicada a cada tabla.

### Contraseñas
Las contraseñas se almacenan como hash `bcrypt` con cost factor 12. El backend nunca devuelve `password_hash` en ninguna respuesta de API.

### Autenticación JWT
El backend emite un JWT firmado al hacer login. El token incluye `user_id` y `role_name` en el payload. El frontend lo almacena en memoria o `httpOnly cookie`, no en `localStorage`.

### MinIO — organización de objetos
Los archivos se almacenan en MinIO con la siguiente estructura de claves:

```
ceish-documents/
  submissions/
    {submission_id}/
      {timestamp}_{filename}.pdf
  (futuro: attachments/, exports/, etc.)
```

Esto facilita gestionar permisos por prefijo y hacer limpieza selectiva.

### Borrado lógico vs físico
Las eliminaciones de usuarios y submissions usan `is_active = false` en lugar de `DELETE`, para preservar el historial de revisiones. Solo las asignaciones (`assignments`) se eliminan físicamente, ya que no afectan el historial de evaluaciones completadas.
