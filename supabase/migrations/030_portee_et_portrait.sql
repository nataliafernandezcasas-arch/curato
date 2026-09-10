-- 030 · La portée de una visita, y el retrato propio del storyteller
--
-- Dos huecos que el rediseño dejó al descubierto.
--
-- 1. Se archivaban capturas de las stories y no se guardaba ni una cifra. La
--    maison paga 299 € al mes y no había forma de decirle a cuánta gente
--    llegó, porque el dato no existía en ninguna parte. De aquí sale el
--    informe mensual entero.
--
-- 2. El retrato y la bio de un creador venían de Instagram vía Phyllo, así que
--    la persona no podía decidir con qué cara se presenta ante una casa.

-- ── La portée de cada visita ─────────────────────────────────────────────────
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reach_views        INT,
  ADD COLUMN IF NOT EXISTS reach_accounts     INT,
  ADD COLUMN IF NOT EXISTS reach_interactions INT,
  -- 'phyllo' cuando las cifras llegan solas de la cuenta conectada, 'manual'
  -- cuando las escribe el creador. Se guarda el origen porque no valen lo
  -- mismo: una la certifica Instagram y la otra la teclea una persona.
  ADD COLUMN IF NOT EXISTS reach_source       TEXT
    CHECK (reach_source IS NULL OR reach_source IN ('phyllo', 'manual')),
  ADD COLUMN IF NOT EXISTS reach_declared_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reach_verified     BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN reservations.reach_views IS
  'Vues de las stories de esta visita. Del creador o de Phyllo, ver reach_source.';
COMMENT ON COLUMN reservations.reach_accounts IS
  'Cuentas alcanzadas. Es la cifra que la maison ve en su informe mensual.';

-- El informe mensual agrega por casa y por mes, así que ese es el índice.
CREATE INDEX IF NOT EXISTS idx_reservations_venue_month
  ON reservations (venue_id, slot_start)
  WHERE status = 'completed';

-- ── El retrato y la bio propios del creador ──────────────────────────────────
ALTER TABLE creators
  -- Hasta dos fotografías, en 4:5. Sobrescriben el avatar que trae Phyllo.
  ADD COLUMN IF NOT EXISTS portrait_urls TEXT[] NOT NULL DEFAULT '{}',
  -- 240 caracteres sobre qué fotografía la persona. La de Phyllo es la bio de
  -- su Instagram, que habla a su público y no a una casa.
  ADD COLUMN IF NOT EXISTS own_bio       TEXT
    CHECK (own_bio IS NULL OR char_length(own_bio) <= 240);

COMMENT ON COLUMN creators.portrait_urls IS
  'Retratos elegidos por el creador. Vacío = se usa el avatar de Phyllo.';
