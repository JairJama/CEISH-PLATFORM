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
-- registration_requests
-- Solicitudes públicas de acceso. No crean una sesión ni una cuenta activa
-- hasta que el equipo administrador las revise.
-- ----------------------------------------------------------------------------
CREATE TABLE registration_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  researcher_type VARCHAR(20) NOT NULL
                    CHECK (researcher_type IN ('internal', 'external')),
  affiliation     VARCHAR(180) NOT NULL DEFAULT '',
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES users(id)
);

CREATE INDEX idx_registration_requests_status ON registration_requests(status);

CREATE TABLE researcher_profiles (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  researcher_type VARCHAR(20) NOT NULL
                    CHECK (researcher_type IN ('internal', 'external')),
  affiliation     VARCHAR(180) NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- submissions  (entrega de documentos)
-- ----------------------------------------------------------------------------
CREATE TABLE submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  research_code VARCHAR(11) NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  document_name VARCHAR(255) NOT NULL,           -- nombre original del archivo
  document_path TEXT,                            -- clave del objeto en MinIO (bucket "documents")
  comment       TEXT NOT NULL DEFAULT '',
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'submitted', 'reviewed')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  grade         NUMERIC(4,2) CHECK (grade >= 0 AND grade <= 10),
  final_comment TEXT,                                -- retroalimentación anónima para el estudiante
  classification_status VARCHAR(30) NOT NULL DEFAULT 'awaiting-assignment'
                    CHECK (classification_status IN (
                      'awaiting-assignment', 'awaiting-first', 'awaiting-second',
                    'awaiting-consensus', 'classified', 'cancelled'
                  )),
  risk_level VARCHAR(30)
                  CHECK (risk_level IN ('no-risk', 'minimal-risk', 'greater-than-minimal')),
  classified_at TIMESTAMPTZ
);

CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status  ON submissions(status);

-- ----------------------------------------------------------------------------
-- submission_documents
-- Una investigación se presenta como un conjunto de documentos Word.
-- ----------------------------------------------------------------------------
CREATE TABLE submission_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_path TEXT NOT NULL,
  mime_type     VARCHAR(120) NOT NULL,
  size_bytes    BIGINT NOT NULL CHECK (size_bytes > 0),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT submission_documents_path_unique UNIQUE (submission_id, document_path)
);

CREATE INDEX idx_submission_documents_submission
  ON submission_documents(submission_id, uploaded_at);

-- ----------------------------------------------------------------------------
-- stratification_assignments
-- Dictámenes de riesgo emitidos por miembros CEISH. Una entrega puede requerir
-- uno o dos estratificadores según el primer nivel seleccionado.
-- ----------------------------------------------------------------------------
CREATE TABLE stratification_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  stratifier_id   UUID NOT NULL REFERENCES users(id),
  round_number    SMALLINT NOT NULL CHECK (round_number IN (1, 2)),
  risk_level      VARCHAR(30)
                    CHECK (risk_level IN ('no-risk', 'minimal-risk', 'greater-than-minimal')),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at      TIMESTAMPTZ,
  CONSTRAINT stratification_round_unique UNIQUE (submission_id, round_number),
  CONSTRAINT stratification_member_unique UNIQUE (submission_id, stratifier_id)
);

CREATE INDEX idx_stratification_member
  ON stratification_assignments(stratifier_id, decided_at);
CREATE INDEX idx_stratification_submission
  ON stratification_assignments(submission_id);

-- ----------------------------------------------------------------------------
-- research_annexes
-- Instancias editables y auditables de los anexos 11, 23 y 27.
-- ----------------------------------------------------------------------------
CREATE TABLE research_annexes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES stratification_assignments(id) ON DELETE SET NULL,
  annex_number  SMALLINT NOT NULL CHECK (annex_number IN (11, 23, 27)),
  status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'completed', 'voided')),
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  document_name VARCHAR(255),
  document_path TEXT,
  document_updated_at TIMESTAMPTZ,
  created_by    UUID NOT NULL REFERENCES users(id),
  completed_by  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_research_annexes_submission
  ON research_annexes(submission_id, annex_number, created_at DESC);
CREATE INDEX idx_research_annexes_assignment
  ON research_annexes(assignment_id, annex_number, created_at DESC);
CREATE INDEX idx_research_annexes_completed_by
  ON research_annexes(completed_by, annex_number);
CREATE UNIQUE INDEX idx_research_annexes_active_11
  ON research_annexes(submission_id, annex_number)
  WHERE annex_number = 11 AND status <> 'voided';
CREATE UNIQUE INDEX idx_research_annexes_active_27
  ON research_annexes(assignment_id, annex_number)
  WHERE annex_number = 27 AND status <> 'voided';
CREATE INDEX idx_research_annexes_document
  ON research_annexes(id)
  WHERE document_path IS NOT NULL;

-- ----------------------------------------------------------------------------
-- qualification_cases / qualification_cycles
-- Para investigaciones sin riesgo, el primer estratificador continúa como
-- calificador. Cada ciclo conserva observaciones y el informe de corrección.
-- ----------------------------------------------------------------------------
CREATE TABLE qualification_cases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  qualifier_id   UUID NOT NULL REFERENCES users(id),
  status         VARCHAR(30) NOT NULL DEFAULT 'pending-review'
                   CHECK (status IN (
                     'pending-review', 'corrections-required', 'resubmitted',
                     'approved', 'cancelled', 'expired'
                   )),
  current_cycle  SMALLINT NOT NULL DEFAULT 1 CHECK (current_cycle >= 1),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  cancelled_at   TIMESTAMPTZ
);

CREATE INDEX idx_qualification_qualifier
  ON qualification_cases(qualifier_id, status);

CREATE TABLE qualification_cycles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qualification_id         UUID NOT NULL REFERENCES qualification_cases(id) ON DELETE CASCADE,
  cycle_number             SMALLINT NOT NULL CHECK (cycle_number >= 1),
  status                   VARCHAR(30) NOT NULL DEFAULT 'pending-review'
                             CHECK (status IN (
                               'pending-review', 'corrections-required', 'resubmitted',
                               'reviewed', 'approved'
                             )),
  observations             TEXT NOT NULL DEFAULT '',
  correction_due_at        TIMESTAMPTZ,
  correction_document_name VARCHAR(255),
  correction_document_path TEXT,
  correction_submitted_at  TIMESTAMPTZ,
  reviewed_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qualification_cycle_unique UNIQUE (qualification_id, cycle_number)
);

CREATE INDEX idx_qualification_cycles_case
  ON qualification_cycles(qualification_id, cycle_number);

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
