ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS research_type VARCHAR(30) NOT NULL DEFAULT 'general';

ALTER TABLE submissions ALTER COLUMN research_type SET DEFAULT 'general';

ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_research_type_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_research_type_check
  CHECK (research_type IN ('general', 'scientific', 'clinical', 'social'));

CREATE INDEX IF NOT EXISTS idx_submissions_research_type
  ON submissions(research_type);
