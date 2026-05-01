-- Pre-registrations for the Midi Pass launch event.
-- Event: 13 May 2026, Bogotá, Colombia.
-- Source-tracked (email/whatsapp/instagram/direct) for channel attribution.

CREATE TABLE IF NOT EXISTS launch_event_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  profile TEXT NOT NULL CHECK (profile IN ('creator', 'merchant', 'curious')),
  instagram_handle TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS launch_event_signups_created_idx ON launch_event_signups (created_at DESC);
CREATE INDEX IF NOT EXISTS launch_event_signups_source_idx ON launch_event_signups (source);

-- RLS on, no public policies. Inserts go through the API (service role).
ALTER TABLE launch_event_signups ENABLE ROW LEVEL SECURITY;
