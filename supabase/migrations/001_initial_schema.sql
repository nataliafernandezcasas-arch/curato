-- Midi Pass MVP Schema

-- Applications (influencers and businesses)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('influencer', 'business')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bogota',
  -- Influencer fields
  instagram_handle TEXT,
  tiktok_handle TEXT,
  follower_range TEXT,
  content_niche TEXT,
  motivation TEXT,
  -- Business fields
  business_name TEXT,
  business_type TEXT,
  business_address TEXT,
  website_url TEXT,
  business_description TEXT,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- Profiles (created when user first signs in after acceptance)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  role TEXT NOT NULL CHECK (role IN ('influencer', 'business', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  city TEXT NOT NULL DEFAULT 'Bogota',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Influencer profiles (extended)
CREATE TABLE influencer_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  instagram_handle TEXT NOT NULL,
  tiktok_handle TEXT,
  follower_range TEXT,
  content_niche TEXT,
  monthly_credit_cop INTEGER DEFAULT 1500000,
  credit_used_cop INTEGER DEFAULT 0,
  credit_resets_at TIMESTAMPTZ
);

-- Business profiles (extended)
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  is_offer_published BOOLEAN DEFAULT false
);

-- Offers (what businesses publish)
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
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

-- Visits (core transaction)
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  business_id UUID NOT NULL REFERENCES business_profiles(id),
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

-- Business QR codes (static, one per business)
CREATE TABLE business_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_type ON applications(type);
CREATE INDEX idx_visits_influencer ON visits(influencer_id);
CREATE INDEX idx_visits_business ON visits(business_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_offers_active ON offers(is_active) WHERE is_active = true;
CREATE INDEX idx_offers_category ON offers(category);

-- RLS Policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_qr_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can insert applications (public forms)
CREATE POLICY "Anyone can apply" ON applications FOR INSERT WITH CHECK (true);

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Influencers read their own extended profile
CREATE POLICY "Influencers read own" ON influencer_profiles FOR SELECT USING (auth.uid() = id);

-- Business owners read their own extended profile
CREATE POLICY "Business read own" ON business_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Business update own" ON business_profiles FOR UPDATE USING (auth.uid() = id);

-- All authenticated users can read active offers
CREATE POLICY "Read active offers" ON offers FOR SELECT USING (is_active = true);
-- Business owners can manage their own offers
CREATE POLICY "Business manage offers" ON offers FOR ALL USING (auth.uid() = business_id);

-- Influencers see their own visits, businesses see visits to their offers
CREATE POLICY "Influencer read visits" ON visits FOR SELECT USING (auth.uid() = influencer_id);
CREATE POLICY "Business read visits" ON visits FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "Influencer create visits" ON visits FOR INSERT WITH CHECK (auth.uid() = influencer_id);
CREATE POLICY "Influencer update visits" ON visits FOR UPDATE USING (auth.uid() = influencer_id);

-- Business QR codes visible to owner
CREATE POLICY "Business read qr" ON business_qr_codes FOR SELECT USING (auth.uid() = business_id);
