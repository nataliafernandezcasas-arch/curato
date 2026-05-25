-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 011 — Creator welcome flow + T&C / Privacy acceptance
--
-- Adds three TIMESTAMPTZ columns to `creators` to track:
--   • welcome_completed_at  — when the storyteller finished reading the
--                             10-slide onboarding "dossier" (the PDF content
--                             rendered as in-app slides).
--   • terms_accepted_at     — when they explicitly accepted the Terms.
--   • privacy_accepted_at   — when they explicitly accepted the Privacy Policy.
--
-- These are filled in by the server action that closes the
-- `/onboarding/welcome` flow. The dashboard router gates new creators behind
-- `welcome_completed_at IS NULL` (similar to how it already gates behind
-- `onboarding_survey_completed_at IS NULL`).
--
-- Acceptance columns are kept SEPARATE rather than implied by
-- welcome_completed_at because (1) RGPD demands a verifiable timestamp of
-- consent for each policy and (2) if either policy changes, we may need to
-- re-collect consent without restarting the welcome flow.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS welcome_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Partial index for fast lookups of creators who still need to complete the
-- welcome flow. Matches the pattern of the survey index in migration 010.
CREATE INDEX IF NOT EXISTS idx_creators_welcome_pending
  ON creators (id)
  WHERE welcome_completed_at IS NULL;

COMMENT ON COLUMN creators.welcome_completed_at IS
  'Set when the creator finishes the /onboarding/welcome flow (the dossier slides). NULL means they still need to be shown the welcome before the survey/dashboard.';
COMMENT ON COLUMN creators.terms_accepted_at IS
  'Set when the creator explicitly accepts the Terms via the welcome flow checkbox. Required by RGPD as proof of consent timestamp.';
COMMENT ON COLUMN creators.privacy_accepted_at IS
  'Set when the creator explicitly accepts the Privacy Policy via the welcome flow checkbox. Required by RGPD as proof of consent timestamp.';
