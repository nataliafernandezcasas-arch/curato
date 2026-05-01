-- Track whether each applicant receives payments from foreign clients.
-- Useful signal for cross-selling Midi's USD payment product to creators
-- who already have international revenue streams.

ALTER TABLE creators ADD COLUMN IF NOT EXISTS receives_foreign_payments BOOLEAN;
