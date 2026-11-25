-- 057 · Volver a invitar
--
-- Una casa que quedó contenta con un storyteller puede invitarlo otra vez desde
-- su informe mensual (« Inviter à nouveau »). El storyteller recibe un aviso y
-- un correo, y ve la invitación en su carnet con un botón para reservar.
--
-- Una fila por invitación. Como mucho una por casa y storyteller cada 30 días
-- (lo controla /api/maison/invitar): más sería insistir. Solo se lee con la
-- clave de servicio, así que RLS sin políticas cierra la tabla a los clientes.
CREATE TABLE IF NOT EXISTS maison_invitaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id  UUID NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
  creator_id   UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS maison_invitaciones_creator_idx ON maison_invitaciones (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS maison_invitaciones_par_idx ON maison_invitaciones (comercio_id, creator_id, created_at DESC);
ALTER TABLE maison_invitaciones ENABLE ROW LEVEL SECURITY;
