-- 040 · El código es de la visita, no de la casa
--
-- La 034 lo hacía al revés: la casa enseñaba un QR fijo y el storyteller lo
-- escaneaba. Ahora el storyteller enseña el código de SU visita y la casa lo
-- escanea desde su pantalla Scanner, con la cara de quien llega delante antes
-- de registrarla. Un código fijo por casa no decía quién venía; uno por visita
-- sí, y deja de valer cuando la visita pasa.
--
-- El código se genera la primera vez que el storyteller lo abre, el día de la
-- visita. comercios.check_in_code (034) se queda sin uso; no se borra para no
-- romper nada que aún lo lea.

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS visit_code TEXT;
-- Quién de la casa la registró: la persona que escaneó. Sin clave foránea,
-- como la 039: el usuario puede borrarse y la visita tiene que seguir.
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS checked_in_by UUID;

CREATE UNIQUE INDEX IF NOT EXISTS reservations_visit_code_key
  ON reservations (visit_code)
  WHERE visit_code IS NOT NULL;

COMMENT ON COLUMN reservations.visit_code IS
  'Código de la visita: seis caracteres sin los que se confunden (sin O, 0, I, 1). Va en el QR que enseña el storyteller y se puede teclear a mano.';
COMMENT ON COLUMN reservations.checked_in_by IS
  'El usuario de la casa que registró la visita escaneando el código.';
COMMENT ON COLUMN comercios.check_in_code IS
  'Sin uso desde la 040: el código ya es de cada visita (reservations.visit_code).';
