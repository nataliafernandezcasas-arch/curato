-- ============================================================================
-- 021_maison_photos_bucket.sql
-- Curato Collective — public bucket for maison catalogue photos
-- ============================================================================
-- Maisons manage their own catalogue photos + description from their dashboard.
-- Unlike visit content (private, 90-day signed URLs), these are PUBLIC images
-- shown to every storyteller in the catalogue, so the bucket is public-read and
-- the URLs are stored in `comercios.photos`. Uploads go through the service-role
-- route; clients cannot write (default-deny, no write policy on this bucket).
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maison-photos',
  'maison-photos',
  true,
  52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- End of 021_maison_photos_bucket.sql
-- ============================================================================
