-- ============================================================================
-- 019_reservation_content.sql
-- Curato Collective — creator-uploaded visit photos + 90-day usage rights
-- ============================================================================
-- After a creator visits a maison they mark the reservation as visited and
-- upload HD photos. The maison can use those photos for 90 days. We store the
-- storage PATHS (not URLs) on the reservation and gate access with short-lived
-- signed URLs + an explicit rights-expiry timestamp.
-- ============================================================================

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS visited_at                TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS content_photo_paths       TEXT[];
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS content_uploaded_at       TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS content_rights_expires_at TIMESTAMPTZ;

-- Ensure the `content-proofs` bucket exists and is PRIVATE so the 90-day signed
-- URLs are the only way in (a public bucket would leak permanent URLs and bypass
-- the rights window). HD photos → 50MB limit, images only. Writes are blocked
-- for clients by the 006 policy; uploads happen via the service-role route.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-proofs',
  'content-proofs',
  false,
  52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- End of 019_reservation_content.sql
-- ============================================================================
