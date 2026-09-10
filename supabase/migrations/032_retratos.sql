-- 032 · Dónde viven los retratos de los storytellers
--
-- La pantalla 16b deja que cada storyteller elija hasta dos retratos y escriba
-- su frase (creators.portrait_urls y creators.own_bio, migración 030). Faltaba
-- dónde guardar las fotografías.
--
-- Privado, a diferencia de las fotos de las maisons: es la cara de una persona,
-- y solo tienen que verla las casas del club. En portrait_urls se guarda la
-- ruta dentro del bucket, y el servidor firma el enlace por una hora cada vez
-- que lo enseña, como con el portafolio de candidatura (029).
--
-- Las subidas las hace el servidor con la clave de servicio, así que no hacen
-- falta políticas sobre storage.objects.
--
-- El tope y los formatos son los de la candidatura (candidature-portfolio.ts):
-- 3 MB, JPEG, PNG, WEBP y HEIC.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-portraits',
  'creator-portraits',
  false,
  3145728,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON COLUMN creators.portrait_urls IS
  'Rutas en el bucket privado creator-portraits, elegidas por el creador (16b). Máximo dos. Vacío = se usa el avatar de Phyllo.';
