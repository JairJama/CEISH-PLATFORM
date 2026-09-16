-- Ejecutar una sola vez en instalaciones ya creadas antes de esta funcionalidad.
CREATE TABLE IF NOT EXISTS registration_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  researcher_type VARCHAR(20) NOT NULL
                    CHECK (researcher_type IN ('internal', 'external')),
  affiliation     VARCHAR(180) NOT NULL DEFAULT '',
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_requests_status
  ON registration_requests(status);
