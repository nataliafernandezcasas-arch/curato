-- 047: vídeos en las visitas.
--
-- El storyteller puede subir, además de fotos, vídeos de hasta 30 segundos (la
-- duración la comprueba la app antes de subir). Un vídeo de 30 s de iPhone en
-- 1080p pesa unos 60 MB, y en 4K bastante más: el límite por archivo sube a
-- 200 MB. OJO: el plan gratuito de Supabase no deja subir archivos de más de
-- 50 MB aunque el bucket lo permita (Storage → Settings → Upload file size limit).
UPDATE storage.buckets
SET file_size_limit = 209715200,
    allowed_mime_types = ARRAY[
      'image/jpeg','image/png','image/webp','image/heic','image/heif',
      'video/mp4','video/quicktime','video/x-m4v','video/webm'
    ]
WHERE id = 'content-proofs';
