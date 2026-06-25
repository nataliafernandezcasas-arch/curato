-- ============================================================================
-- 010_seed_first_maisons.sql
-- Curato Collective — first two signed maisons + media columns on comercios
-- ============================================================================
-- The reservations schema (009) left `comercios` without any image columns and
-- without geo coordinates. This migration:
--   * Adds `photos` (text[]), `latitude`, `longitude` to comercios. Coordinates
--     are nullable for now — they future-proof the map view of the storyteller
--     dashboard without forcing a geocode pass today.
--   * Seeds the first two SIGNED maisons (David Toutain, Maison Rose Donald) so
--     they become visible in the public catalogue (is_reservable = true).
--
-- Photos and each maison's concrete offer are pending the onboarding emails to
-- Lucien (David Toutain) and Rose (Maison Rose Donald); both rows ship with an
-- empty photos array and fall back to a category placeholder in the UI until
-- those assets arrive.
--
-- Idempotent: column adds use IF NOT EXISTS; row seeds use INSERT ... WHERE NOT
-- EXISTS keyed on name, so re-running is safe.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Media + geo + location columns on comercios
-- ----------------------------------------------------------------------------
-- NOTE: production `comercios` never received the 002 Midi-Pass columns, so
-- `address` / `website_url` do not exist (the Notion import worked around this
-- by stuffing the address into `description`). We add them here as first-class
-- columns alongside the new media/geo fields. All IF NOT EXISTS → idempotent.
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS address     TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS photos      TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS latitude    NUMERIC(9,6);
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS longitude   NUMERIC(9,6);


-- ----------------------------------------------------------------------------
-- 2. Seed the first two signed maisons
-- ----------------------------------------------------------------------------
-- David Toutain — gastronomie, 2★ Michelin, 7e.
INSERT INTO comercios (
  name, category_id, city_id, arrondissement, address,
  website_url, contact_email, description, partnership_stage, signed_at
)
SELECT
  'David Toutain',
  (SELECT id FROM categories WHERE slug = 'gastronomia'),
  '00000000-0000-0000-0000-0000000c1101',
  '7e',
  '29 Rue Surcouf, 75007 Paris',
  'https://davidtoutain.com',
  'salle@davidtoutain.com',
  'À deux pas des Invalides, la table doublement étoilée de David Toutain compose une cuisine végétale et instinctive, où chaque assiette se lit comme un paysage. Une adresse rare, pour celles et ceux qui racontent le goût autrement.',
  'signed',
  now()
WHERE NOT EXISTS (SELECT 1 FROM comercios WHERE name = 'David Toutain');

-- Maison Rose Donald — beauté / soins capillaires, 3e (Marais).
INSERT INTO comercios (
  name, category_id, city_id, arrondissement, address,
  website_url, contact_email, contact_instagram, description, partnership_stage, signed_at
)
SELECT
  'Maison Rose Donald',
  (SELECT id FROM categories WHERE slug = 'belleza'),
  '00000000-0000-0000-0000-0000000c1101',
  '3e',
  '4 Passage de l''Ancre, 75003 Paris',
  'https://maisonrosedonald.com',
  'rose@maisonrosedonald.com',
  '@rosedonaldparis',
  'Nichée dans le passage de l''Ancre, la Maison Rose Donald réinvente le soin capillaire : actifs rares, science florale et deux ans de recherche pour une trilogie d''exception. Un écrin feutré du Marais dédié au rituel et à la matière vivante.',
  'signed',
  now()
WHERE NOT EXISTS (SELECT 1 FROM comercios WHERE name = 'Maison Rose Donald');

-- ============================================================================
-- End of 010_seed_first_maisons.sql
-- ============================================================================
