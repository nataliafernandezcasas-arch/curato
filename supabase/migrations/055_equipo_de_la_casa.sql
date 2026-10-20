-- El equipo de una casa: más personas (sala, dirección, comunicación) que
-- entran con su propio correo y ven el mismo tablero que la cuenta de la casa.
-- La cuenta principal sigue siendo comercios.email / owner_id; la facturación
-- solo la ve ella. Solo se lee con la clave de servicio, así que RLS sin
-- políticas cierra la tabla a los clientes.
CREATE TABLE IF NOT EXISTS maison_equipo (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id  UUID NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  nombre       TEXT,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comercio_id, email)
);
CREATE INDEX IF NOT EXISTS maison_equipo_email_idx ON maison_equipo (email);
CREATE INDEX IF NOT EXISTS maison_equipo_user_idx ON maison_equipo (user_id);
ALTER TABLE maison_equipo ENABLE ROW LEVEL SECURITY;
