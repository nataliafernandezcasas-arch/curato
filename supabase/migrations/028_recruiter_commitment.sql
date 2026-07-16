-- ============================================================================
-- 028_recruiter_commitment.sql
-- Curato Collective — recruiter commitment signature (first-login)
-- ============================================================================
-- Before reaching their dashboard, a recruiter must read the Recruiters dossier
-- and sign: accept the terms, and state where and when (lieu + date), like a
-- storyteller or a maison does.
-- ============================================================================

ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS commitment_accepted_at TIMESTAMPTZ;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS commitment_signatory   TEXT;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS commitment_place       TEXT;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS commitment_date        DATE;

-- ============================================================================
-- End of 028_recruiter_commitment.sql
-- ============================================================================
