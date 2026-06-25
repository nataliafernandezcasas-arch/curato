-- ============================================================================
-- 011_grant_catalog_select.sql
-- Curato Collective — table-level SELECT grants for the public catalogue
-- ============================================================================
-- `comercios` (and `creators`) were created outside the migration flow, so they
-- never received the default SELECT privilege for the `anon` / `authenticated`
-- roles that Supabase normally grants to new tables. The result: even with the
-- permissive RLS policies from migration 009, PostgREST rejects reads with
--   code 42501 — "permission denied for table comercios".
--
-- GRANT and RLS are two separate gates: GRANT decides whether a role may touch
-- the table at all; RLS then filters which rows it sees. This migration adds the
-- missing table-level SELECT; row visibility is still governed by the RLS
-- policies (signed venues are public, a creator sees their own row, etc.).
-- ============================================================================

GRANT SELECT ON comercios TO anon, authenticated;
GRANT SELECT ON creators  TO anon, authenticated;
GRANT SELECT ON categories, category_costs, cities, influencer_tiers TO anon, authenticated;

-- ============================================================================
-- End of 011_grant_catalog_select.sql
-- ============================================================================
