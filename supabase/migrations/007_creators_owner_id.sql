-- Link creators to their auth.users record.
-- Mirrors comercios.owner_id pattern so dashboard pages can query by owner_id = auth.uid()
-- instead of looking up by email on every request.

ALTER TABLE creators ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS creators_owner_idx ON creators (owner_id);
