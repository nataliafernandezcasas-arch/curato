-- 022_comercios_description_i18n.sql
-- Curato Collective — translatable maison descriptions.
-- `description` stays as the French / default copy; these hold the EN and ES
-- translations. The storyteller-facing views fall back to `description` when a
-- translation is empty.
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS description_es TEXT;
-- End of 022_comercios_description_i18n.sql
