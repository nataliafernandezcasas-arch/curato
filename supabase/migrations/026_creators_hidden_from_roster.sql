-- ============================================================================
-- 026_creators_hidden_from_roster.sql
-- Curato Collective — hide a creator from the maison-facing roster
-- ============================================================================
-- When true, the creator stays in admin but is NOT shown to maisons in their
-- storyteller roster. Used to hide test/internal accounts without archiving.
-- ============================================================================

ALTER TABLE creators ADD COLUMN IF NOT EXISTS hidden_from_roster boolean NOT NULL DEFAULT false;

-- ============================================================================
-- End of 026_creators_hidden_from_roster.sql
-- ============================================================================
