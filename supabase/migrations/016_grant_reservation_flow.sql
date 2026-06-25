-- ============================================================================
-- 012_grant_reservation_flow.sql
-- Curato Collective — privileges for the reservation flow tables
-- ============================================================================
-- Same root cause as migration 011: tables in this project did not receive the
-- standard Supabase role grants, so writing to `reservations` failed with
--   code 42501 — "permission denied for table reservations".
--
-- `service_role` is the trusted server-side role used by the reservation
-- request endpoint (and any future admin/cron jobs). Supabase grants it full
-- access to every public table by default; we restore that here. `authenticated`
-- gets the SELECT/INSERT it needs for the RLS-guarded creator-facing paths
-- (reading their own reservations, the future direct-booking flow). Row
-- visibility stays governed by the RLS policies from migration 009.
-- ============================================================================

-- Server role: full access to all current public tables + their sequences.
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Creator-facing tables (RLS still filters rows).
GRANT SELECT, INSERT ON reservations         TO authenticated;
GRANT SELECT          ON credit_balances      TO authenticated;
GRANT SELECT          ON credit_transactions  TO authenticated;
GRANT SELECT          ON reservation_reminders TO authenticated;

-- ============================================================================
-- End of 012_grant_reservation_flow.sql
-- ============================================================================
