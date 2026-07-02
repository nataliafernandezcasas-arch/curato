-- 023_maison_offer.sql
-- Curato Collective — maison offer & availability.
-- availability: weekly windows [{day:0-6 (JS getDay), start:"HH:MM", end:"HH:MM"}]
-- blocked_slots: closed dates [{date:"YYYY-MM-DD"}]
-- services: [{name, description, price}]
-- menu_urls: uploaded menu/brochure files (maison-menus bucket)
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS availability  jsonb  NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS blocked_slots jsonb  NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS services      jsonb  NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS menu_urls     text[] NOT NULL DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('maison-menus', 'maison-menus', true, 20971520,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
-- End of 023_maison_offer.sql
