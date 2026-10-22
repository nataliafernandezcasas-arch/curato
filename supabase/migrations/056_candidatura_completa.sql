-- La candidatura de un storyteller trae ahora sus seguidores y las ciudades
-- donde está basado (una o varias, si viaja o vive entre dos sitios), y el
-- admin puede dejarla en lista de espera (Natalia, 2026-10-22). Las ciudades
-- pasan a su ficha al aceptarla, y se pueden cambiar desde su perfil.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS followers INTEGER CHECK (followers IS NULL OR followers >= 0);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cities TEXT[];
ALTER TABLE creators     ADD COLUMN IF NOT EXISTS cities TEXT[];

-- El estado admite la lista de espera. NOT VALID: las filas antiguas, con los
-- valores que tuvieran, no se revisan.
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'approved', 'accepted', 'rejected', 'deleted', 'waitlist')) NOT VALID;
