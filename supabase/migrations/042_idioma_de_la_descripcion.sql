-- 042 · En qué idioma escribe la casa su descripción
--
-- La casa escribe en un idioma y Claude traduce a los otros dos al guardar
-- (src/lib/traducir.ts). Esta columna recuerda cuál es el suyo: cuando cambia
-- ese texto, se rehacen las traducciones; cuando retoca una traducción, no se
-- toca nada más. Sin la columna, se supone el francés.

ALTER TABLE comercios ADD COLUMN IF NOT EXISTS description_lang TEXT
  CHECK (description_lang IS NULL OR description_lang IN ('fr', 'en', 'es'));

COMMENT ON COLUMN comercios.description_lang IS
  'El idioma en que la casa escribe su descripción. Los otros dos se traducen solos al guardar. NULL = francés.';
