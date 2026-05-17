-- ============================================================================
-- 009_curato_collective_schema.sql
-- Curato Collective — Reservations module schema
-- ============================================================================
-- Adds the booking subsystem on top of the existing Midi Pass CRM tables
-- (creators / comercios). Introduces:
--   * Multi-city support (city table + FK; v1 ships with Paris only).
--   * Canonical categories (Hoteles · Gastronomía · Wellness · Belleza).
--   * Partnership lifecycle (prospect → signed) for both venues and creators,
--     plus a generated is_reservable flag that drives public catalogue visibility.
--   * Influencer tiers with monthly credit grants, per-category cost table,
--     monthly credit balances, and an append-only credit ledger.
--   * Reservations with hotel-night support (slot_end is GENERATED), reminders
--     scheduling, and creator/venue recommendation pairs.
--   * admin_users table (replacing the shared-password admin gate) and an
--     is_admin() SECURITY DEFINER helper used by RLS policies.
--   * Renames of orphaned Midi Pass tables to legacy_* (data preserved).
--
-- Pure schema: no application code is updated by this migration. App code that
-- still queries `visits` / `offers` / `business_qr_codes` will break and must
-- be migrated to the new reservation flow.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- pgsodium powers BYTEA-encrypted Google Calendar tokens on creators.
-- (Supabase has begun migrating from pgsodium to Vault; revisit if upgrading.)
CREATE EXTENSION IF NOT EXISTS "pgsodium";


-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE partnership_stage AS ENUM (
    'prospect',
    'dm_sent',
    'replied',
    'call_done',
    'contract_sent',
    'signed',
    'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE venue_priority AS ENUM (
    'top_personalizado',
    'alta',
    'media',
    'estandar'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE venue_subscription_plan AS ENUM (
    'yearly_2990',
    'monthly_299'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM (
    'pending_review',
    'confirmed',
    'declined',
    'cancelled',
    'completed',
    'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE credit_transaction_kind AS ENUM (
    'monthly_grant',
    'reservation_hold',
    'reservation_confirm',
    'cancellation',
    'admin_refund',
    'manual_adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reservation_reminder_kind AS ENUM ('24h', '2h');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_source AS ENUM (
    'notion_import',
    'admin_manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ----------------------------------------------------------------------------
-- 2. Reference / lookup tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  country     TEXT NOT NULL,                  -- ISO 3166-1 alpha-2
  slug        TEXT NOT NULL UNIQUE,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name_es     TEXT NOT NULL,
  name_fr     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  icon        TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS influencer_tiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  min_followers   INT NOT NULL,
  max_followers   INT,                              -- NULL = unbounded upper
  monthly_credits INT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_costs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         UUID NOT NULL UNIQUE REFERENCES categories(id) ON DELETE CASCADE,
  credits_per_booking INT NOT NULL CHECK (credits_per_booking >= 0),
  unit                TEXT NOT NULL DEFAULT 'booking' CHECK (unit IN ('booking', 'night'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by    UUID REFERENCES auth.users(id)
);


-- ----------------------------------------------------------------------------
-- 3. Admin helper function (used throughout RLS)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = uid);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;


-- ----------------------------------------------------------------------------
-- 4. Seed reference data
-- ----------------------------------------------------------------------------
-- Fixed UUIDs for the canonical lookup rows so we can wire DEFAULT values and
-- backfills without subqueries.

INSERT INTO cities (id, name, country, slug, active) VALUES
  ('00000000-0000-0000-0000-0000000c1101', 'Paris', 'FR', 'paris', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, slug, name_es, name_fr, name_en, icon, sort_order) VALUES
  ('00000000-0000-0000-0000-0000000ca701', 'hoteles',     'Hoteles',     'Hôtels',      'Hotels',     'bed',      1),
  ('00000000-0000-0000-0000-0000000ca702', 'gastronomia', 'Gastronomía', 'Gastronomie', 'Gastronomy', 'utensils', 2),
  ('00000000-0000-0000-0000-0000000ca703', 'wellness',    'Wellness',    'Bien-être',   'Wellness',   'sparkles', 3),
  ('00000000-0000-0000-0000-0000000ca704', 'belleza',     'Belleza',     'Beauté',      'Beauty',     'lipstick', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO influencer_tiers (id, slug, name, min_followers, max_followers, monthly_credits, sort_order) VALUES
  ('00000000-0000-0000-0000-0000000c1ee1', 'macro',   'Macro',   500000, NULL,    20, 1),
  ('00000000-0000-0000-0000-0000000c1ee2', 'mid',     'Mid',      50000, 500000,  12, 2),
  ('00000000-0000-0000-0000-0000000c1ee3', 'nano',    'Nano',     10000,  50000,   8, 3),
  ('00000000-0000-0000-0000-0000000c1ee4', 'micro',   'Micro',     5000,  10000,   5, 4),
  ('00000000-0000-0000-0000-0000000c1ee5', 'discard', 'Discard',       0,  5000,   0, 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO category_costs (category_id, credits_per_booking, unit)
SELECT id, 2, 'booking' FROM categories WHERE slug = 'gastronomia'
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO category_costs (category_id, credits_per_booking, unit)
SELECT id, 3, 'booking' FROM categories WHERE slug = 'wellness'
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO category_costs (category_id, credits_per_booking, unit)
SELECT id, 3, 'booking' FROM categories WHERE slug = 'belleza'
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO category_costs (category_id, credits_per_booking, unit)
SELECT id, 8, 'night' FROM categories WHERE slug = 'hoteles'
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('catalog_show_prospects', 'false'::jsonb),
  ('credits_renew_day',      '1'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Admin seed: Natalia. If she hasn't signed in yet, no row exists in auth.users
-- and this INSERT inserts zero rows — re-run manually post-signup.
INSERT INTO admin_users (user_id, added_at)
SELECT id, now() FROM auth.users
WHERE lower(email) = 'nataliafernandezcasas@gmail.com'
ON CONFLICT (user_id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 5. Extend `comercios` (venues)
-- ----------------------------------------------------------------------------
-- Existing columns kept untouched (name, category TEXT, stage TEXT, contact_name,
-- email, phone, address, website_url, description, midi_pass_active, qr_code,
-- country, owner_id, ...). The new partnership_stage / category_id / city_id
-- columns supersede the old text equivalents but coexist for now.

ALTER TABLE comercios ADD COLUMN IF NOT EXISTS city_id                  UUID REFERENCES cities(id);
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS category_id              UUID REFERENCES categories(id);
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS group_id                 UUID REFERENCES venue_groups(id);
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS arrondissement           TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS partnership_stage        partnership_stage NOT NULL DEFAULT 'prospect';
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS priority                 venue_priority NOT NULL DEFAULT 'estandar';
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS subscription_plan        venue_subscription_plan;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS signed_at                TIMESTAMPTZ;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS notion_id                TEXT UNIQUE;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS dress_code               TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS house_account            BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS min_advance_notice_hours INT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS requires_credit_card     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS party_size_max           INT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS contact_email            TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS contact_phone            TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS contact_instagram        TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS last_contacted_at        TIMESTAMPTZ;

-- Backfill city for any existing rows, then lock it down.
UPDATE comercios SET city_id = '00000000-0000-0000-0000-0000000c1101'::uuid WHERE city_id IS NULL;
ALTER TABLE comercios ALTER COLUMN city_id SET NOT NULL;
ALTER TABLE comercios ALTER COLUMN city_id SET DEFAULT '00000000-0000-0000-0000-0000000c1101'::uuid;

-- Catalogue visibility flag — public listings only show venues where this is true.
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS is_reservable BOOLEAN
  GENERATED ALWAYS AS (partnership_stage = 'signed') STORED;

CREATE INDEX IF NOT EXISTS comercios_city_idx              ON comercios (city_id);
CREATE INDEX IF NOT EXISTS comercios_category_idx          ON comercios (category_id);
CREATE INDEX IF NOT EXISTS comercios_group_idx             ON comercios (group_id);
CREATE INDEX IF NOT EXISTS comercios_partnership_stage_idx ON comercios (partnership_stage);
CREATE INDEX IF NOT EXISTS comercios_is_reservable_idx     ON comercios (is_reservable) WHERE is_reservable = true;
CREATE INDEX IF NOT EXISTS comercios_notion_idx            ON comercios (notion_id) WHERE notion_id IS NOT NULL;


-- ----------------------------------------------------------------------------
-- 6. Extend `creators`
-- ----------------------------------------------------------------------------
-- Existing columns kept untouched (full_name, email, handle, category TEXT,
-- followers INT, stage TEXT, tiktok_handle, follower_range, motivation,
-- monthly_credit_cop, credit_used_cop, credit_resets_at, owner_id, country,
-- passkit_*, phyllo_*, receives_foreign_payments, ...).

ALTER TABLE creators ADD COLUMN IF NOT EXISTS tier_id                                 UUID REFERENCES influencer_tiers(id);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS category_id                             UUID REFERENCES categories(id);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS partnership_stage                       partnership_stage NOT NULL DEFAULT 'prospect';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS followers_count                         INT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS notion_id                               TEXT UNIQUE;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS signed_at                               TIMESTAMPTZ;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_calendar_refresh_token_encrypted BYTEA;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_calendar_access_token_encrypted  BYTEA;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_calendar_token_expires_at        TIMESTAMPTZ;

-- Catalogue visibility flag — public listings only show creators where this is true.
-- Requires both a signed partnership AND a linked auth.users account (owner_id).
ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_reservable BOOLEAN
  GENERATED ALWAYS AS (partnership_stage = 'signed' AND owner_id IS NOT NULL) STORED;

CREATE INDEX IF NOT EXISTS creators_tier_idx              ON creators (tier_id);
CREATE INDEX IF NOT EXISTS creators_category_idx          ON creators (category_id);
CREATE INDEX IF NOT EXISTS creators_partnership_stage_idx ON creators (partnership_stage);
CREATE INDEX IF NOT EXISTS creators_is_reservable_idx     ON creators (is_reservable) WHERE is_reservable = true;
CREATE INDEX IF NOT EXISTS creators_notion_idx            ON creators (notion_id) WHERE notion_id IS NOT NULL;


-- ----------------------------------------------------------------------------
-- 7. signed_at trigger (shared by venues + creators)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_signed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.partnership_stage = 'signed'
     AND (OLD.partnership_stage IS DISTINCT FROM 'signed')
     AND NEW.signed_at IS NULL THEN
    NEW.signed_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_comercios_signed_at ON comercios;
CREATE TRIGGER trg_comercios_signed_at
  BEFORE UPDATE ON comercios
  FOR EACH ROW EXECUTE FUNCTION public.set_signed_at();

DROP TRIGGER IF EXISTS trg_creators_signed_at ON creators;
CREATE TRIGGER trg_creators_signed_at
  BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION public.set_signed_at();


-- ----------------------------------------------------------------------------
-- 8. Generic updated_at trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ----------------------------------------------------------------------------
-- 9. Reservations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        UUID NOT NULL REFERENCES creators(id)  ON DELETE RESTRICT,
  venue_id          UUID NOT NULL REFERENCES comercios(id) ON DELETE RESTRICT,
  slot_start        TIMESTAMPTZ NOT NULL,
  nights            INT CHECK (nights IS NULL OR nights > 0),  -- hotels only
  slot_end          TIMESTAMPTZ GENERATED ALWAYS AS (
                      CASE WHEN nights IS NOT NULL
                           THEN slot_start + (nights || ' days')::interval
                           ELSE NULL END
                    ) STORED,
  party_size        INT NOT NULL DEFAULT 1 CHECK (party_size > 0),
  status            reservation_status NOT NULL DEFAULT 'pending_review',
  credits_cost      INT NOT NULL CHECK (credits_cost >= 0),
  special_requests  TEXT,
  calendar_event_id TEXT,
  ics_sent_at       TIMESTAMPTZ,
  confirmed_at      TIMESTAMPTZ,
  confirmed_by      UUID REFERENCES auth.users(id),
  declined_at       TIMESTAMPTZ,
  declined_reason   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_creator_idx    ON reservations (creator_id);
CREATE INDEX IF NOT EXISTS reservations_venue_idx      ON reservations (venue_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx     ON reservations (status);
CREATE INDEX IF NOT EXISTS reservations_slot_start_idx ON reservations (slot_start);

DROP TRIGGER IF EXISTS trg_reservations_updated_at ON reservations;
CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ----------------------------------------------------------------------------
-- 10. Credit balances + append-only credit ledger
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_balances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  period_month  DATE NOT NULL,                                  -- always 1st of month
  tier_id       UUID REFERENCES influencer_tiers(id),
  monthly_grant INT NOT NULL,
  balance       INT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id, period_month)
);

CREATE INDEX IF NOT EXISTS credit_balances_creator_idx ON credit_balances (creator_id);
CREATE INDEX IF NOT EXISTS credit_balances_period_idx  ON credit_balances (period_month);

DROP TRIGGER IF EXISTS trg_credit_balances_updated_at ON credit_balances;
CREATE TRIGGER trg_credit_balances_updated_at
  BEFORE UPDATE ON credit_balances
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS credit_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id     UUID NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  kind           credit_transaction_kind NOT NULL,
  amount         INT NOT NULL,                                  -- signed
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  balance_after  INT NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS credit_transactions_creator_idx     ON credit_transactions (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_transactions_reservation_idx ON credit_transactions (reservation_id);
CREATE INDEX IF NOT EXISTS credit_transactions_kind_idx        ON credit_transactions (kind);


-- ----------------------------------------------------------------------------
-- 11. Reservation reminders (24h / 2h before)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservation_reminders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  kind           reservation_reminder_kind NOT NULL,
  scheduled_for  TIMESTAMPTZ NOT NULL,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reservation_id, kind)
);

CREATE INDEX IF NOT EXISTS reservation_reminders_pending_idx
  ON reservation_reminders (scheduled_for) WHERE sent_at IS NULL;


-- ----------------------------------------------------------------------------
-- 12. Creator ↔ Venue recommendations (replaces Notion free-text "venues
--     recommended for this creator" / "creators recommended for this venue")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_venue_recommendations (
  creator_id UUID NOT NULL REFERENCES creators(id)  ON DELETE CASCADE,
  venue_id   UUID NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
  notes      TEXT,
  source     recommendation_source NOT NULL DEFAULT 'admin_manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, venue_id)
);

CREATE INDEX IF NOT EXISTS creator_venue_recommendations_venue_idx
  ON creator_venue_recommendations (venue_id);


-- ----------------------------------------------------------------------------
-- 13. Rename Midi Pass legacy tables
-- ----------------------------------------------------------------------------
-- These tables belong to the old Midi Pass visit/QR flow and have no place in
-- the Curato reservations module. Data is preserved by RENAME; current app
-- code that still queries `visits` / `offers` will start failing — that's the
-- intended signal to migrate the call sites.
--
-- Only the clearly-orphaned MVP tables are renamed here. `applications`,
-- `profiles` are left alone because the candidature flow still uses them.

ALTER TABLE IF EXISTS visits              RENAME TO legacy_visits;
ALTER TABLE IF EXISTS offers              RENAME TO legacy_offers;
ALTER TABLE IF EXISTS business_qr_codes   RENAME TO legacy_business_qr_codes;
ALTER TABLE IF EXISTS influencer_profiles RENAME TO legacy_influencer_profiles;
ALTER TABLE IF EXISTS business_profiles   RENAME TO legacy_business_profiles;

-- Drop every policy attached to the renamed tables, then re-enable RLS with
-- no public policies — only service_role (which bypasses RLS) can read/write.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'legacy_visits',
        'legacy_offers',
        'legacy_business_qr_codes',
        'legacy_influencer_profiles',
        'legacy_business_profiles'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.legacy_visits')              IS NOT NULL THEN EXECUTE 'ALTER TABLE public.legacy_visits              ENABLE ROW LEVEL SECURITY'; END IF;
  IF to_regclass('public.legacy_offers')              IS NOT NULL THEN EXECUTE 'ALTER TABLE public.legacy_offers              ENABLE ROW LEVEL SECURITY'; END IF;
  IF to_regclass('public.legacy_business_qr_codes')   IS NOT NULL THEN EXECUTE 'ALTER TABLE public.legacy_business_qr_codes   ENABLE ROW LEVEL SECURITY'; END IF;
  IF to_regclass('public.legacy_influencer_profiles') IS NOT NULL THEN EXECUTE 'ALTER TABLE public.legacy_influencer_profiles ENABLE ROW LEVEL SECURITY'; END IF;
  IF to_regclass('public.legacy_business_profiles')   IS NOT NULL THEN EXECUTE 'ALTER TABLE public.legacy_business_profiles   ENABLE ROW LEVEL SECURITY'; END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 14. RLS — enable on new tables
-- ----------------------------------------------------------------------------
ALTER TABLE cities                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_groups                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_tiers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_costs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_reminders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_venue_recommendations   ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- 15. RLS — reference tables: anyone reads, only admin writes
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "cities read"  ON cities;
DROP POLICY IF EXISTS "cities admin" ON cities;
CREATE POLICY "cities read"  ON cities FOR SELECT USING (active = true OR public.is_admin());
CREATE POLICY "cities admin" ON cities FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories read"  ON categories;
DROP POLICY IF EXISTS "categories admin" ON categories;
CREATE POLICY "categories read"  ON categories FOR SELECT USING (true);
CREATE POLICY "categories admin" ON categories FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "venue_groups read"  ON venue_groups;
DROP POLICY IF EXISTS "venue_groups admin" ON venue_groups;
CREATE POLICY "venue_groups read"  ON venue_groups FOR SELECT USING (true);
CREATE POLICY "venue_groups admin" ON venue_groups FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "influencer_tiers read"  ON influencer_tiers;
DROP POLICY IF EXISTS "influencer_tiers admin" ON influencer_tiers;
CREATE POLICY "influencer_tiers read"  ON influencer_tiers FOR SELECT USING (true);
CREATE POLICY "influencer_tiers admin" ON influencer_tiers FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "category_costs read"  ON category_costs;
DROP POLICY IF EXISTS "category_costs admin" ON category_costs;
CREATE POLICY "category_costs read"  ON category_costs FOR SELECT USING (true);
CREATE POLICY "category_costs admin" ON category_costs FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "app_settings read"  ON app_settings;
DROP POLICY IF EXISTS "app_settings admin" ON app_settings;
CREATE POLICY "app_settings read"  ON app_settings FOR SELECT USING (true);
CREATE POLICY "app_settings admin" ON app_settings FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_users admin" ON admin_users;
CREATE POLICY "admin_users admin"
  ON admin_users FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 16. RLS — reservations (creator owns, admin manages)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "reservations creator read"    ON reservations;
DROP POLICY IF EXISTS "reservations creator insert"  ON reservations;
DROP POLICY IF EXISTS "reservations admin all"       ON reservations;

CREATE POLICY "reservations creator read"
  ON reservations FOR SELECT
  USING (
    public.is_admin()
    OR creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );

-- Doble guard: ambos lados reservable, y balance >= costo en el período actual.
CREATE POLICY "reservations creator insert"
  ON reservations FOR INSERT
  WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
    AND EXISTS (SELECT 1 FROM creators  c WHERE c.id = creator_id AND c.is_reservable = true)
    AND EXISTS (SELECT 1 FROM comercios v WHERE v.id = venue_id   AND v.is_reservable = true)
    AND EXISTS (
      SELECT 1 FROM credit_balances b
      WHERE b.creator_id   = reservations.creator_id
        AND b.period_month = date_trunc('month', now())::date
        AND b.balance     >= reservations.credits_cost
    )
  );

CREATE POLICY "reservations admin all"
  ON reservations FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 17. RLS — credit balances + transactions (service_role/admin write, creator read own)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "credit_balances creator read" ON credit_balances;
DROP POLICY IF EXISTS "credit_balances admin write"  ON credit_balances;
CREATE POLICY "credit_balances creator read"
  ON credit_balances FOR SELECT
  USING (
    public.is_admin()
    OR creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );
CREATE POLICY "credit_balances admin write"
  ON credit_balances FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "credit_transactions creator read" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions admin write"  ON credit_transactions;
CREATE POLICY "credit_transactions creator read"
  ON credit_transactions FOR SELECT
  USING (
    public.is_admin()
    OR creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );
CREATE POLICY "credit_transactions admin write"
  ON credit_transactions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 18. RLS — reminders + recommendations
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "reservation_reminders admin"        ON reservation_reminders;
DROP POLICY IF EXISTS "reservation_reminders creator read" ON reservation_reminders;
CREATE POLICY "reservation_reminders admin"
  ON reservation_reminders FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "reservation_reminders creator read"
  ON reservation_reminders FOR SELECT
  USING (
    reservation_id IN (
      SELECT id FROM reservations
      WHERE creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "recommendations creator read" ON creator_venue_recommendations;
DROP POLICY IF EXISTS "recommendations admin write"  ON creator_venue_recommendations;
CREATE POLICY "recommendations creator read"
  ON creator_venue_recommendations FOR SELECT
  USING (
    public.is_admin()
    OR creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );
CREATE POLICY "recommendations admin write"
  ON creator_venue_recommendations FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 19. RLS — public catalogue on comercios / creators
-- ----------------------------------------------------------------------------
-- NOTE: comercios + creators already have RLS enabled from earlier migrations.
-- PostgreSQL combines SELECT policies with OR — so these new "public catalog"
-- policies WIDEN visibility (signed venues/creators become visible to all).
-- They do NOT narrow it. If any pre-existing policy already grants broader
-- SELECT (e.g. "all authenticated"), the strict "only reservable" rule from
-- the spec won't be enforced until those broader policies are dropped. Audit
-- existing policies before applying.

DROP POLICY IF EXISTS "comercios public catalog" ON comercios;
CREATE POLICY "comercios public catalog"
  ON comercios FOR SELECT
  USING (is_reservable = true OR public.is_admin() OR owner_id = auth.uid());

DROP POLICY IF EXISTS "comercios admin write" ON comercios;
CREATE POLICY "comercios admin write"
  ON comercios FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "creators public catalog" ON creators;
CREATE POLICY "creators public catalog"
  ON creators FOR SELECT
  USING (is_reservable = true OR public.is_admin() OR owner_id = auth.uid());

DROP POLICY IF EXISTS "creators admin write" ON creators;
CREATE POLICY "creators admin write"
  ON creators FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- End of 009_curato_collective_schema.sql
-- ============================================================================
