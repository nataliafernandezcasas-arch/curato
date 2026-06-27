-- ============================================================================
-- 018_phyllo_engagement.sql
-- Curato Collective — formalize Phyllo / engagement columns on creators
-- ============================================================================
-- The Phyllo columns were added outside the migration flow during the Midi Pass
-- era. We declare them here (IF NOT EXISTS) so the catalogue does not depend on
-- schema drift. `engagement_rate` and `followers_count` already exist from 009.
-- ============================================================================

ALTER TABLE creators ADD COLUMN IF NOT EXISTS phyllo_account_id    TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_connected  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS phyllo_consent       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS phyllo_connected_at  TIMESTAMPTZ;

-- ============================================================================
-- End of 018_phyllo_engagement.sql
-- ============================================================================
