-- 036 · Las fotografías del perfil del storyteller
--
-- Natalia (2026-09-11): en el perfil que ve una casa tienen que estar las
-- fotografías que enseñan cómo fotografía la persona, y la persona tiene que
-- poder editarlas: quitar las que tiene, añadir otras, seis como máximo.
--
-- Una sola lista, en el orden en que la casa las ve. Cada entrada es una de dos
-- cosas:
--   · 'candidature:<ruta>' · una foto de su candidatura, en el bucket
--     candidature-portfolios. Quitarla del perfil no la borra de la candidatura.
--   · '<id>/estilo/<archivo>' · una foto subida desde Mon profil (16b), en el
--     bucket privado creator-portraits. Quitarla del perfil la borra.
--
-- NULL quiere decir que todavía no la ha tocado: la casa ve las fotos de su
-- candidatura. Una lista vacía quiere decir que las quitó todas.

ALTER TABLE creators ADD COLUMN IF NOT EXISTS style_paths TEXT[];

COMMENT ON COLUMN creators.style_paths IS
  'Fotografías del perfil (16b), en orden, seis como máximo: ''candidature:<ruta>'' (bucket candidature-portfolios) o ''<id>/estilo/<archivo>'' (bucket creator-portraits). NULL = aún sin tocar, se enseñan las de la candidatura.';
