-- Lo que la casa quiere que el storyteller sepa antes de venir: por dónde se
-- entra, a quién preguntar, si hay que avisar al llegar, el código de la
-- puerta… Se lee en su ficha, debajo de la oferta (revisión de diseño,
-- 2026-10-20).
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS storyteller_note TEXT;
