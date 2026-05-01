-- Midi Pass: PassKit.com integration fields on creators table
-- Stores the Apple Wallet + Google Wallet pass URLs returned by PassKit when a creator is approved

ALTER TABLE creators ADD COLUMN IF NOT EXISTS passkit_member_id TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pass_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_pay_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pass_created_at TIMESTAMPTZ;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pass_voided_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_creators_passkit_member ON creators(passkit_member_id);
