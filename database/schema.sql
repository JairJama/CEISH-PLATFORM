-- ============================================================================
-- CEISH Platform — Esquema de base de datos
-- PostgreSQL 16
-- Se ejecuta automáticamente al crear el contenedor (volumen vacío).
-- ============================================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- roles
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(40) NOT NULL UNIQUE
);

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,           -- hash scrypt: scrypt$salt$hash
  role_id    UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role_id);

-- ----------------------------------------------------------------------------
-- submissions  (entrega de documentos)
-- ----------------------------------------------------------------------------
CREATE TABLE submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,           -- nombre original del archivo
  document_path TEXT,                            -- clave del objeto en MinIO (bucket "documents")
  comment       TEXT NOT NULL DEFAULT '',
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'submitted', 'reviewed')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  grade         NUMERIC(4,2) CHECK (grade >= 0 AND grade <= 10),
  final_comment TEXT                                 -- retroalimentación anónima para el estudiante
);

CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status  ON submissions(status);

-- ----------------------------------------------------------------------------
-- assignments  (relación profesor - estudiante)
-- ----------------------------------------------------------------------------
CREATE TABLE assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT assignments_unique UNIQUE (teacher_id, student_id),
  CONSTRAINT assignments_distinct CHECK (teacher_id <> student_id)
);

CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_student ON assignments(student_id);

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES users(id),
  comment       TEXT NOT NULL DEFAULT '',
  grade         NUMERIC(4,2) CHECK (grade >= 0 AND grade <= 10),
  status        VARCHAR(20) NOT NULL DEFAULT 'in-progress'
                  CHECK (status IN ('in-progress', 'completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_submission_unique UNIQUE (submission_id)
);

CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- ----------------------------------------------------------------------------
-- review_stages  (evaluación dividida en etapas)
-- ----------------------------------------------------------------------------
CREATE TABLE review_stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  stage_number SMALLINT NOT NULL CHECK (stage_number BETWEEN 1 AND 4),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'in-progress', 'completed')),
  completed_at TIMESTAMPTZ,

  CONSTRAINT review_stages_unique UNIQUE (review_id, stage_number)
);

CREATE INDEX idx_review_stages_review ON review_stages(review_id);

-- ----------------------------------------------------------------------------
-- criteria_evaluations
-- ----------------------------------------------------------------------------
CREATE TABLE criteria_evaluations (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id  UUID NOT NULL REFERENCES review_stages(id) ON DELETE CASCADE,
  criterion TEXT NOT NULL,
  status    VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected')),
  comment   TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_criteria_stage ON criteria_evaluations(stage_id);

-- ----------------------------------------------------------------------------
-- annotations  (observaciones ubicadas dentro del PDF)
-- ----------------------------------------------------------------------------
CREATE TABLE annotations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_evaluation_id UUID NOT NULL REFERENCES criteria_evaluations(id) ON DELETE CASCADE,
  page_number            SMALLINT NOT NULL CHECK (page_number >= 1),
  x                      NUMERIC(8,4) NOT NULL,   -- % del ancho de página (0-100)
  y                      NUMERIC(8,4) NOT NULL,   -- % del alto de página (0-100)
  width                  NUMERIC(8,4) NOT NULL,
  height                 NUMERIC(8,4) NOT NULL,
  comment                TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_annotations_criteria ON annotations(criteria_evaluation_id);
