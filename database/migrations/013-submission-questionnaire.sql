ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS questionnaire JSONB NOT NULL DEFAULT '{}'::jsonb;
