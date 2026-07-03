-- ============================================================================
-- 024_maison_commitment.sql
-- Curato Collective — maison commitment agreement (first-login signature)
-- ============================================================================
-- Before reaching their dashboard, a maison must "sign" the commitment: a
-- 3-month minimum at 299 €/month. We record when they accepted, the name they
-- typed as signature, and set the subscription plan. `subscription_plan` already
-- exists (migration 009, enum venue_subscription_plan with value 'monthly_299').
-- ============================================================================

ALTER TABLE comercios ADD COLUMN IF NOT EXISTS commitment_accepted_at TIMESTAMPTZ;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS commitment_signatory   TEXT;

-- ============================================================================
-- End of 024_maison_commitment.sql
-- ============================================================================
