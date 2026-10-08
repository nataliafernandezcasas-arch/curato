-- 043 · La oferta de la casa, en euros
--
-- La casa ya no describe servicios con precio: ofrece un importe por visita
-- (por ejemplo, 200 €) y el storyteller lo gasta como quiera en su carta. La
-- carta sigue en menu_urls. comercios.services (023) se queda sin uso para las
-- casas que ya tienen importe; las que aún no lo han puesto siguen enseñando sus
-- servicios hasta que lo pongan.

ALTER TABLE comercios ADD COLUMN IF NOT EXISTS offer_eur INTEGER
  CHECK (offer_eur IS NULL OR (offer_eur > 0 AND offer_eur <= 10000));

COMMENT ON COLUMN comercios.offer_eur IS
  'Lo que la casa ofrece por visita, en euros enteros. El storyteller lo usa libremente en la carta.';
