ALTER TABLE research_annexes
  ADD COLUMN IF NOT EXISTS document_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS document_path TEXT,
  ADD COLUMN IF NOT EXISTS document_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_research_annexes_document
  ON research_annexes(id)
  WHERE document_path IS NOT NULL;
