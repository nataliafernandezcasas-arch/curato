-- Candidature portfolio: how a creator shows their eye before we let them in.
--
-- Until now a creator application carried a handle and a free-text message, so
-- deciding fit meant opening Instagram and guessing. Two columns close that gap:
-- the style they say they shoot, and a handful of frames they actually shot.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS photo_style TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_paths TEXT[];

COMMENT ON COLUMN applications.photo_style IS
  'Creator''s own description of how they shoot. Free text, their words.';

-- Storage PATHS inside the private `candidature-portfolios` bucket, never signed
-- URLs. `visits.content_proof_urls` stores signed URLs and they quietly die at
-- the 90-day expiry; a candidature has to stay reviewable, so the admin mints a
-- fresh short-lived URL from the path on every page load.
COMMENT ON COLUMN applications.portfolio_paths IS
  'Paths in the private candidature-portfolios bucket. Sign on read, never store URLs.';

-- Manual step, this migration cannot do it:
--   In Supabase Storage create a bucket named `candidature-portfolios`,
--   set it to PRIVATE, and add no public policies. Only service_role writes and
--   reads it, which is what the API and the admin page use. If the bucket is
--   left public, every applicant's photographs become guessable on the open web.
