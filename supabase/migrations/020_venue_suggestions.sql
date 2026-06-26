-- ============================================================================
-- 020_venue_suggestions.sql
-- Curato Collective — creators suggest addresses they'd love to visit
-- ============================================================================
-- During the pre-launch (and after), storytellers can tell Curato which venues
-- they wish were in the catalogue. Curato uses these to know which maisons to
-- reach out to. Written via the service-role endpoint; read by admins.
-- ============================================================================

CREATE TABLE IF NOT EXISTS venue_suggestions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID REFERENCES creators(id) ON DELETE SET NULL,
  venue_name  TEXT NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venue_suggestions_created_idx ON venue_suggestions (created_at DESC);

ALTER TABLE venue_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_suggestions admin" ON venue_suggestions;
CREATE POLICY "venue_suggestions admin"
  ON venue_suggestions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT ALL ON venue_suggestions TO service_role;

-- ============================================================================
-- End of 020_venue_suggestions.sql
-- ============================================================================
