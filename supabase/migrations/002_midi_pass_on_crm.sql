-- Midi Pass additions to existing CRM schema
-- This adds columns to existing creators/comercios tables and creates Midi Pass specific tables

-- ========================================
-- ADD MIDI PASS COLUMNS TO CREATORS TABLE
-- ========================================
ALTER TABLE creators ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS follower_range TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS monthly_credit_cop INTEGER DEFAULT 1500000;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS credit_used_cop INTEGER DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS credit_resets_at TIMESTAMPTZ;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS midi_pass_active BOOLEAN DEFAULT false;

-- ==========================================
-- ADD MIDI PASS COLUMNS TO COMERCIOS TABLE
-- ==========================================
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS midi_pass_active BOOLEAN DEFAULT false;
ALTER TABLE comercios ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- ========================================
-- OFFERS TABLE (businesses publish these)
-- ========================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gastronomy', 'beauty', 'wellness', 'hospitality')),
  address TEXT NOT NULL,
  reservation_phone TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  visit_value_cop INTEGER NOT NULL DEFAULT 200000,
  extras TEXT,
  available_days TEXT[] DEFAULT '{Lunes,Martes,Miercoles,Jueves,Viernes,Sabado,Domingo}',
  available_hours TEXT,
  max_visits_per_month INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- VISITS TABLE (core transaction)
-- ========================================
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  comercio_id UUID NOT NULL REFERENCES comercios(id),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN (
    'reserved', 'checked_in', 'content_pending',
    'content_submitted', 'completed', 'cancelled', 'expired'
  )),
  visit_value_cop INTEGER NOT NULL,
  bill_amount_cop INTEGER,
  midi_covers_cop INTEGER,
  influencer_pays_cop INTEGER,
  check_in_at TIMESTAMPTZ,
  qr_token TEXT UNIQUE,
  qr_expires_at TIMESTAMPTZ,
  content_proof_urls TEXT[] DEFAULT '{}',
  content_submitted_at TIMESTAMPTZ,
  content_verified BOOLEAN DEFAULT false,
  content_notes TEXT,
  reserved_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_creators_email ON creators(email);
CREATE INDEX IF NOT EXISTS idx_creators_stage ON creators(stage);
CREATE INDEX IF NOT EXISTS idx_comercios_stage ON comercios(stage);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);
CREATE INDEX IF NOT EXISTS idx_visits_creator ON visits(creator_id);
CREATE INDEX IF NOT EXISTS idx_visits_comercio ON visits(comercio_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);

-- ========================================
-- RLS POLICIES FOR NEW TABLES
-- ========================================
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Anyone can read active offers (for the landing/catalog)
CREATE POLICY "Public read active offers" ON offers FOR SELECT USING (is_active = true);

-- Allow inserts to creators and comercios from the public form (application)
CREATE POLICY "Public can apply as creator" ON creators FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can apply as comercio" ON comercios FOR INSERT WITH CHECK (true);
