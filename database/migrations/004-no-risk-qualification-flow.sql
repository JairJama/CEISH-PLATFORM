CREATE TABLE IF NOT EXISTS qualification_cases (
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

CREATE INDEX IF NOT EXISTS idx_qualification_qualifier
  ON qualification_cases(qualifier_id, status);

CREATE TABLE IF NOT EXISTS qualification_cycles (
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

CREATE INDEX IF NOT EXISTS idx_qualification_cycles_case
  ON qualification_cycles(qualification_id, cycle_number);

-- Recupera clasificaciones "sin riesgo" creadas antes de esta migración.
INSERT INTO qualification_cases (submission_id, qualifier_id)
SELECT s.id, sa.stratifier_id
  FROM submissions s
  JOIN stratification_assignments sa
    ON sa.submission_id = s.id AND sa.round_number = 1
 WHERE s.classification_status = 'classified'
   AND s.risk_level = 'no-risk'
ON CONFLICT (submission_id) DO NOTHING;

INSERT INTO qualification_cycles (qualification_id, cycle_number)
SELECT qc.id, 1
  FROM qualification_cases qc
ON CONFLICT (qualification_id, cycle_number) DO NOTHING;
