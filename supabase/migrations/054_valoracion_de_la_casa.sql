-- La casa también valora la visita: de 1 a 5 estrellas y una nota opcional
-- sobre el storyteller. La lee Curato, no el storyteller; sirve para cuidar
-- la calidad del club.
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS maison_rating      SMALLINT CHECK (maison_rating BETWEEN 1 AND 5);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS maison_rating_note TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS maison_rated_at    TIMESTAMPTZ;
