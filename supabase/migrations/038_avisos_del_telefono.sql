-- 038 · Los avisos del teléfono
--
-- Hasta hoy la app pedía el permiso de notificaciones, recibía su token de
-- Apple y lo escribía en la consola: no había dónde guardarlo ni quién enviara
-- nada. Esta tabla es ese sitio.
--
-- Un token es de un aparato, no de una persona: la misma persona puede tener el
-- teléfono y el iPad, y un teléfono prestado puede quedarse con el token de
-- quien entró antes. Por eso la llave es el token y el dueño se reescribe en
-- cada entrada.
--
-- Se guarda también el correo porque la identidad de un miembro en Curato es su
-- cuenta o su correo, indistintamente (src/lib/identidad.ts): hay creadores y
-- casas cuyo owner_id todavía está vacío y a quienes solo se llega por ahí.
--
-- Cuatro avisos y ninguno más, según el diseño: visita confirmada, visita
-- rechazada, quedan seis horas para publicar y, para la casa, nueva demanda.
-- No hay bandeja de entrada, así que aquí no se guarda lo enviado.

CREATE TABLE IF NOT EXISTS device_tokens (
  token       TEXT PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  platform    TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens (user_id);
CREATE INDEX IF NOT EXISTS device_tokens_email_idx   ON device_tokens (email);

-- Sin políticas: solo la clave de servicio entra, como en el resto de la app.
-- Un token en manos ajenas permite mandarle avisos al teléfono de otra persona.
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Y el permiso a mano. En esta base las tablas nuevas no heredan privilegios,
-- así que sin esta línea la tabla existe y nadie puede escribir en ella: la app
-- recibía un 42501 al guardar un token y ningún aviso salía. Se da igual en la
-- 020 y en la 027, por lo mismo. En producción se corrió aparte el 26 de
-- septiembre de 2026, después de la 038.
GRANT ALL ON device_tokens TO service_role;

COMMENT ON TABLE device_tokens IS
  'Un aparato que aceptó recibir avisos. La llave es el token de Apple o de Google; el dueño se reescribe en cada entrada.';
COMMENT ON COLUMN device_tokens.email IS
  'El correo de la cuenta que registró el aparato. Se usa cuando el owner_id todavía está vacío.';
COMMENT ON COLUMN device_tokens.updated_at IS
  'Última vez que el aparato dio señales. Un token que Apple declara muerto se borra en el acto.';
