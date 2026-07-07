-- ============================================================================
-- 025_comercios_coming_soon.sql
-- Curato Collective — hide a maison behind a "coming soon" teaser
-- ============================================================================
-- When true, the maison appears in the directory other maisons browse as a
-- blurred "Prochainement" card (name / details hidden). Used to hide test
-- accounts and to signal that more houses are in negotiation.
-- ============================================================================

ALTER TABLE comercios ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;

-- ============================================================================
-- End of 025_comercios_coming_soon.sql
-- ============================================================================
