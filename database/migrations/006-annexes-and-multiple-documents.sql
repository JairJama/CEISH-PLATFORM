ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS research_code VARCHAR(11),
  ADD COLUMN IF NOT EXISTS title TEXT;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY submitted_at, id) AS sequence
    FROM submissions
   WHERE research_code IS NULL
)
UPDATE submissions s
   SET research_code = 'CEISH-' || LPAD(numbered.sequence::text, 5, '0')
  FROM numbered
 WHERE s.id = numbered.id;

UPDATE submissions
   SET title = COALESCE(NULLIF(document_name, ''), 'Investigación sin título')
 WHERE title IS NULL;

ALTER TABLE submissions
  ALTER COLUMN research_code SET NOT NULL,
  ALTER COLUMN title SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'submissions_research_code_unique'
       AND conrelid = 'submissions'::regclass
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_research_code_unique UNIQUE (research_code);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS submission_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_path TEXT NOT NULL,
  mime_type     VARCHAR(120) NOT NULL,
  size_bytes    BIGINT NOT NULL CHECK (size_bytes > 0),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT submission_documents_path_unique UNIQUE (submission_id, document_path)
);

CREATE INDEX IF NOT EXISTS idx_submission_documents_submission
  ON submission_documents(submission_id, uploaded_at);

INSERT INTO submission_documents (
  submission_id, document_name, document_path, mime_type, size_bytes
)
SELECT id, document_name, document_path,
       CASE
         WHEN LOWER(document_name) LIKE '%.docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
         WHEN LOWER(document_name) LIKE '%.doc' THEN 'application/msword'
         ELSE 'application/pdf'
       END,
       1
  FROM submissions
 WHERE document_path IS NOT NULL
ON CONFLICT (submission_id, document_path) DO NOTHING;

CREATE TABLE IF NOT EXISTS research_annexes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES stratification_assignments(id) ON DELETE SET NULL,
  annex_number  SMALLINT NOT NULL CHECK (annex_number IN (11, 23, 27)),
  status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'completed', 'voided')),
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by    UUID NOT NULL REFERENCES users(id),
  completed_by  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_research_annexes_submission
  ON research_annexes(submission_id, annex_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_annexes_assignment
  ON research_annexes(assignment_id, annex_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_annexes_completed_by
  ON research_annexes(completed_by, annex_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_annexes_active_11
  ON research_annexes(submission_id, annex_number)
  WHERE annex_number = 11 AND status <> 'voided';

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_annexes_active_27
  ON research_annexes(assignment_id, annex_number)
  WHERE annex_number = 27 AND status <> 'voided';

INSERT INTO research_annexes (
  submission_id, annex_number, status, data, created_by, completed_at
)
SELECT s.id,
       11,
       'completed',
       jsonb_build_object(
         'researchCode', s.research_code,
         'title', s.title,
         'researcherName', u.name,
         'issuedAt', s.submitted_at
       ),
       s.student_id,
       s.submitted_at
  FROM submissions s
  JOIN users u ON u.id = s.student_id
ON CONFLICT (submission_id, annex_number)
  WHERE annex_number = 11 AND status <> 'voided'
DO NOTHING;
