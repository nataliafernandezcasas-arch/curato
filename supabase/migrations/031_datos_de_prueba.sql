-- 031 · Datos de prueba que no se ven fuera de la prueba
--
-- Curato tiene una sola base de datos, la de producción. Para enseñar la app y
-- buscar fallos hace falta una casa y un creador de prueba con datos de verdad,
-- y hasta ahora no había forma de esconderlos:
--
--   · Una maison visible (is_reservable) aparece en el carnet de todos los
--     creadores. Con cero maisons reales publicadas, la de prueba sería la única
--     que verían los testers de TestFlight, y podrían pedirle visita.
--   · Para creadores ya existía hidden_from_roster (migración 026), que los
--     esconde del tablero de las casas. Para maisons no había nada.
--
-- is_test marca lo que es de prueba. Un miembro real no ve nada marcado; un
-- miembro de prueba lo ve todo, lo real y lo de prueba, para poder probar el
-- producto tal como es.

ALTER TABLE comercios ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE creators  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN comercios.is_test IS
  'Maison de prueba. Invisible para miembros reales en el carnet y en el carnet de maisons.';
COMMENT ON COLUMN creators.is_test IS
  'Creador de prueba. Ve las maisons de prueba además de las reales.';

-- Las dos cuentas de prueba que ya existían: la maison con la que entra
-- Natalia y el storyteller apercu.
UPDATE comercios SET is_test = true WHERE email = 'testcurato@gmail.com';
UPDATE creators  SET is_test = true WHERE email = 'apercu@curato.test';
