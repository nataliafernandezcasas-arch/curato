-- La valoración de una visita: de 1 a 5 estrellas y una nota opcional, que el
-- storyteller deja después de ir. La lee Curato, no la casa.
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rating      SMALLINT CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rating_note TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rated_at    TIMESTAMPTZ;
