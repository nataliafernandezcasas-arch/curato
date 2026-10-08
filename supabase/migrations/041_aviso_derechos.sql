-- 041 · El aviso del fin de la exclusividad, enviado una sola vez
--
-- La casa tiene 90 días de derechos de uso exclusivos sobre las fotos de una
-- visita, contados desde que el storyteller las sube a Curato
-- (content_rights_expires_at, fijado en la primera subida). Pasado el plazo
-- conserva una licencia no exclusiva (CGU, artículo 20), pero las fotos dejan
-- de verse en su tablero. Nadie se lo decía.
--
-- La tarea de cada hora (/api/cron/recordatorios) avisa ahora a la casa, por
-- correo y en el teléfono:
--
--   · siete días antes del fin: "l'exclusivité se termine le …";
--   · el día del fin: "l'exclusivité a pris fin aujourd'hui".
--
-- Con esto los avisos del teléfono pasan de cuatro a seis: el comentario de la
-- 038 ("cuatro avisos y ninguno más") queda como historia.
--
-- Estas dos columnas dicen cuándo salió cada uno, para que no se repita aunque
-- la tarea corra dos veces a la vez. Las de reservations ya tienen sus
-- permisos: no hace falta ningún GRANT nuevo.

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS aviso_derechos_7d_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aviso_derechos_fin_at TIMESTAMPTZ;

COMMENT ON COLUMN reservations.aviso_derechos_7d_at IS
  'Cuándo se avisó a la casa de que su exclusividad sobre las fotos acaba en siete días. NULL = no se avisó.';
COMMENT ON COLUMN reservations.aviso_derechos_fin_at IS
  'Cuándo se avisó a la casa de que su exclusividad sobre las fotos terminó. NULL = no se avisó.';
