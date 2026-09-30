ALTER TABLE submissions
  DROP CONSTRAINT IF EXISTS submissions_classification_status_check;

ALTER TABLE submissions
  ADD CONSTRAINT submissions_classification_status_check
  CHECK (classification_status IN (
    'awaiting-assignment', 'awaiting-first', 'awaiting-second',
    'awaiting-consensus', 'classified', 'cancelled'
  ));
