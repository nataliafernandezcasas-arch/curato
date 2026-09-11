-- 035 · Los avisos de las stories, enviados una sola vez
--
-- Tras una visita, el storyteller tiene 24 horas para publicar sus dos stories
-- y subirlas a la app (CGU, artículo 14). Una tarea que corre cada hora
-- (/api/cron/recordatorios) revisa las visitas confirmadas que siguen sin
-- stories:
--
--   · a falta de seis horas, un correo al storyteller: "Il vous reste six
--     heures pour publier". Uno solo: dos recordatorios por lo mismo son acoso;
--   · vencido el plazo, un aviso a Curato para que Operations haga el
--     seguimiento.
--
-- Estas dos columnas dicen cuándo salió cada uno, para que no se repita aunque
-- la tarea corra dos veces a la vez.

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS recordatorio_6h_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aviso_plazo_at     TIMESTAMPTZ;

COMMENT ON COLUMN reservations.recordatorio_6h_at IS
  'Cuándo se envió al storyteller el recordatorio de las seis horas. NULL = no se envió.';
COMMENT ON COLUMN reservations.aviso_plazo_at IS
  'Cuándo se avisó a Curato de que el plazo de 24 h venció sin stories. NULL = no se avisó.';
