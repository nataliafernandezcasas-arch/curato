-- 037 · El código de bienvenida
--
-- Las dos primeras columnas ya existen en producción, creadas a mano en su día:
-- se declaran aquí para que la base se pueda reconstruir desde este repositorio,
-- que es lo que hoy no se puede hacer. La tercera es nueva y sirve para que un
-- código de seis cifras no se pueda adivinar a fuerza de intentos.
--
-- El código se genera al aprobar una candidatura, viaja en el asunto del correo
-- ("Votre code Curato : 418 062") y caduca a los siete días. Al usarlo, la
-- persona entra y fija su contraseña: así Curato deja de mandar contraseñas por
-- correo.

ALTER TABLE applications ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS access_code_expires_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS access_code_attempts INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN applications.access_code IS
  'Código de bienvenida de seis cifras, generado al aprobar la candidatura. Se borra al fijar la contraseña.';
COMMENT ON COLUMN applications.access_code_expires_at IS
  'Caducidad del código: siete días desde la aprobación, o quince minutos desde que se usa por primera vez.';
COMMENT ON COLUMN applications.access_code_attempts IS
  'Intentos fallidos seguidos. A partir de cinco, el código queda bloqueado y hay que pedir otro.';
