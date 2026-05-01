-- Add country column to creators and comercios tables.
-- Stores ISO 3166-1 alpha-2 country codes (e.g. "CO", "MX", "US").
-- Defaults to "CO" because the pilot launches in Colombia.

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'CO';

ALTER TABLE comercios
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'CO';

CREATE INDEX IF NOT EXISTS creators_country_idx  ON creators  (country);
CREATE INDEX IF NOT EXISTS comercios_country_idx ON comercios (country);
