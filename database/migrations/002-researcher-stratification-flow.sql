ALTER TABLE registration_requests
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS researcher_profiles (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  researcher_type VARCHAR(20) NOT NULL
                    CHECK (researcher_type IN ('internal', 'external')),
  affiliation     VARCHAR(180) NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO researcher_profiles (user_id, researcher_type, affiliation)
SELECT u.id, rr.researcher_type, rr.affiliation
  FROM registration_requests rr
  JOIN users u ON u.email = rr.email
 WHERE rr.status = 'approved'
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS classification_status VARCHAR(30) NOT NULL DEFAULT 'awaiting-assignment',
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(30),
  ADD COLUMN IF NOT EXISTS classified_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE submissions ADD CONSTRAINT submissions_classification_status_check
    CHECK (classification_status IN (
      'awaiting-assignment', 'awaiting-first', 'awaiting-second',
      'awaiting-consensus', 'classified'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE submissions ADD CONSTRAINT submissions_risk_level_check
    CHECK (risk_level IN ('no-risk', 'minimal-risk', 'greater-than-minimal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS stratification_assignments (
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

CREATE INDEX IF NOT EXISTS idx_stratification_member
  ON stratification_assignments(stratifier_id, decided_at);
CREATE INDEX IF NOT EXISTS idx_stratification_submission
  ON stratification_assignments(submission_id);
