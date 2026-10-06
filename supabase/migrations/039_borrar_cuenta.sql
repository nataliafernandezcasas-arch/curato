-- 039 · Borrar la cuenta desde la app
--
-- Apple exige que quien tiene cuenta pueda borrarla desde dentro de la app
-- (norma 5.1.1 v). El acceso se cierra en el acto, pero los datos no se pueden
-- borrar de un golpe: las visitas y los créditos apuntan al creador y a la casa
-- con ON DELETE RESTRICT, porque son el historial de la otra parte y, a veces,
-- contabilidad. Así que la app cierra la puerta y deja aquí constancia, y el
-- equipo termina de borrar o anonimizar lo demás.
--
-- Sin esta fila no se cierra nada: una cuenta cerrada sin rastro sería una
-- cuenta cuyos datos nadie se acuerda de borrar.

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  email         TEXT NOT NULL,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS account_deletion_requests_pending_idx
  ON account_deletion_requests (requested_at) WHERE completed_at IS NULL;

-- Sin políticas: solo la clave de servicio entra.
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Las tablas nuevas no heredan privilegios en esta base (ver la 038).
GRANT ALL ON account_deletion_requests TO service_role;

COMMENT ON TABLE account_deletion_requests IS
  'Cuentas cerradas desde la app. El acceso ya está cerrado; completed_at se pone cuando el equipo ha borrado o anonimizado los datos.';
COMMENT ON COLUMN account_deletion_requests.user_id IS
  'El id de auth.users. Sin clave foránea: el usuario queda borrado (soft delete) y la fila tiene que sobrevivirle.';
