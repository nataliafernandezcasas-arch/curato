-- Storage bucket for visit content proofs (stories / reels uploads).
-- Files written by `src/app/api/visits/upload-proof/route.ts` (service role).
-- Bucket is public-read because proofs are screenshots of already-public IG/TikTok content,
-- and the dashboard uses getPublicUrl to render them. Writes are blocked at the policy level
-- so only the API (service role) can upload.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-proofs',
  'content-proofs',
  true,
  104857600,  -- 100 MB per file (reels can be large)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Block direct client uploads/updates/deletes. All writes go through the API (service role bypasses RLS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'block client writes content-proofs'
  ) THEN
    CREATE POLICY "block client writes content-proofs"
      ON storage.objects FOR INSERT
      TO authenticated, anon
      WITH CHECK (bucket_id <> 'content-proofs');
  END IF;
END $$;
