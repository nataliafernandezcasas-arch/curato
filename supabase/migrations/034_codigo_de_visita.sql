-- 034 · El código de cada maison para registrar la visita
--
-- La pantalla 27 (entrega 4): la casa enseña su QR en sala, el storyteller lo
-- escanea y su visita queda registrada (reservations.visited_at). Cuando la
-- cámara falla, teclea el mismo código a mano: tres letras de la casa y tres
-- cifras, "MRC 418" para Maison Marceau.
--
-- El código se genera la primera vez que la casa abre su pantalla del QR, así
-- que aquí solo hace falta la columna y que no se repita.

ALTER TABLE comercios ADD COLUMN IF NOT EXISTS check_in_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS comercios_check_in_code_key
  ON comercios (check_in_code)
  WHERE check_in_code IS NOT NULL;

COMMENT ON COLUMN comercios.check_in_code IS
  'Código de visita de la maison: tres letras y tres cifras, sin espacio (MRC418). Va dentro del QR de sala y se puede teclear a mano en /v.';
