-- 036 · Las fotografías de estilo del storyteller
--
-- Natalia (2026-09-11): en el perfil que ve una casa tienen que estar las
-- fotografías que enseñan cómo fotografía la persona. Hasta ahora solo existían
-- las de la candidatura, y ninguno de los storytellers de antes las tiene. Con
-- esto cada uno puede subir hasta seis desde Mon profil (16b).
--
-- Van al mismo bucket privado que los retratos (creator-portraits, migración
-- 032), en la carpeta <id>/estilo/, y se firman por una hora al enseñarse. En
-- el dossier van antes que las de la candidatura.

ALTER TABLE creators ADD COLUMN IF NOT EXISTS style_paths TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN creators.style_paths IS
  'Fotografías de estilo que el storyteller sube a su perfil (16b): rutas en el bucket privado creator-portraits. Máximo seis.';
