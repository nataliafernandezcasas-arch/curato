-- ============================================================================
-- 027_recruiters.sql
-- Curato Collective — Recruiters programme (commission-based maison sourcing)
-- ============================================================================
-- Recruiters bring maisons to Curato and earn a commission (50% of the 299 €
-- monthly subscription, for the first 3 paid months = up to 448,50 € per maison).
--
-- Flow: a recruiter SUBMITS a maison prospect -> Curato VALIDATES or REJECTS it
-- (to avoid duplicates / maisons already in the pipeline) -> once validated, the
-- recruiter contacts it -> when the maison signs its commitment, it turns green.
-- ============================================================================

CREATE TABLE IF NOT EXISTS recruiters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name   text,
  email       text UNIQUE NOT NULL,
  iban        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recruiter_prospects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id  uuid REFERENCES recruiters(id) ON DELETE CASCADE,
  maison_name   text NOT NULL,
  maison_email  text,
  notes         text,
  -- 'pending' (awaiting validation) | 'approved' (go contact) | 'rejected'.
  -- The "signed" state is derived live by matching maison_email against a
  -- comercio that has accepted its commitment, so it needs no manual step.
  status        text NOT NULL DEFAULT 'pending',
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_prospects_recruiter ON recruiter_prospects(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_prospects_status ON recruiter_prospects(status);

-- ---------------------------------------------------------------------------
-- RLS: a recruiter may read/insert only their own rows. All privileged reads
-- and the admin validation happen through the service-role key (bypasses RLS),
-- so these policies are defense-in-depth for the browser client.
-- ---------------------------------------------------------------------------
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recruiters_select_own ON recruiters;
CREATE POLICY recruiters_select_own ON recruiters
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS recruiters_update_own ON recruiters;
CREATE POLICY recruiters_update_own ON recruiters
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS rp_select_own ON recruiter_prospects;
CREATE POLICY rp_select_own ON recruiter_prospects
  FOR SELECT USING (recruiter_id IN (SELECT id FROM recruiters WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS rp_insert_own ON recruiter_prospects;
CREATE POLICY rp_insert_own ON recruiter_prospects
  FOR INSERT WITH CHECK (recruiter_id IN (SELECT id FROM recruiters WHERE owner_id = auth.uid()));

-- ============================================================================
-- End of 027_recruiters.sql
-- ============================================================================
