ALTER TABLE research_annexes
  DROP CONSTRAINT IF EXISTS research_annexes_annex_number_check;

ALTER TABLE research_annexes
  ADD CONSTRAINT research_annexes_annex_number_check
  CHECK (annex_number IN (11, 12, 13, 23, 27));

ALTER TABLE research_annexes
  ADD COLUMN IF NOT EXISTS qualification_cycle_id UUID
    REFERENCES qualification_cycles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_research_annexes_qualification_cycle
  ON research_annexes(qualification_cycle_id, annex_number, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_annexes_active_13
  ON research_annexes(submission_id, annex_number)
  WHERE annex_number = 13 AND status <> 'voided';

-- El Anexo 11 solo se emite al aprobar la investigación.
-- Las instalaciones existentes pueden tenerlo marcado como completo desde el envío.
UPDATE research_annexes annex
   SET status = 'draft',
       completed_by = NULL,
       completed_at = NULL,
       document_name = NULL,
       document_path = NULL,
       document_updated_at = NULL,
       updated_at = NOW()
  FROM submissions submission
  LEFT JOIN qualification_cases qualification
    ON qualification.submission_id = submission.id
 WHERE annex.submission_id = submission.id
   AND annex.annex_number = 11
   AND annex.status = 'completed'
   AND COALESCE(qualification.status, '') <> 'approved';
