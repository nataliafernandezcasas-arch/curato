-- La carta o el folleto de la casa: hasta 50 MB por archivo (antes 20), que
-- es lo máximo que deja el plan gratuito de Supabase por archivo. Y las fotos
-- del iPhone (HEIC) también.
UPDATE storage.buckets
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif']
WHERE id = 'maison-menus';
