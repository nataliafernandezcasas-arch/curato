-- 046: confirmar la asistencia, cancelar, y el código QR antes de la visita.
--
-- · Quien reservó con más de 24 h de antelación confirma que va: se le pide 24 h
--   antes y se le recuerda 6 h antes si no ha contestado. Quien reservó con
--   menos de 24 h queda confirmado al reservar.
-- · El storyteller puede cancelar. Con más de 24 h, recupera el crédito; con
--   menos, lo pierde (cancelada_tarde). Un no show también lo pierde.
-- · El código QR de la visita llega por correo 1 h antes y como aviso en el
--   teléfono 15 min antes.
-- Cada columna *_at marca que ese aviso ya salió: nunca sale dos veces.
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS asistencia_confirmada_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS aviso_confirmar_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS recordatorio_confirmar_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS correo_qr_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS aviso_qr_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelada_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelada_tarde BOOLEAN NOT NULL DEFAULT false;
