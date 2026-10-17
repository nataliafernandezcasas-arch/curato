-- El aviso para poner las cifras de las stories: sale 23 horas después de
-- subir las fotos, cuando Instagram ya tiene las estadísticas de la story
-- casi completas, y una sola vez (la tarea horaria escribe la hora antes de
-- enviarlo).
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS aviso_cifras_at TIMESTAMPTZ;
