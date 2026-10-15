-- El recorrido de después de la encuesta: cómo se usa la app, conectar
-- Instagram y crear el perfil. Se marca al terminarlo (o al saltarlo).
ALTER TABLE creators ADD COLUMN IF NOT EXISTS guia_completada_at TIMESTAMPTZ;

-- Quien ya usaba la app no lo ve: ya sabe usarla.
UPDATE creators SET guia_completada_at = now()
WHERE guia_completada_at IS NULL AND onboarding_survey_completed_at IS NOT NULL;
