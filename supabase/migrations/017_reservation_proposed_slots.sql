-- ============================================================================
-- 013_reservation_proposed_slots.sql
-- Curato Collective — alternative slots proposed when a request is declined
-- ============================================================================
-- Option A reschedule flow: when an admin can't confirm the requested time, they
-- propose one or more alternative créneaux. We store them on the reservation so
-- there's a record; the storyteller picks one from the decline email, which
-- re-opens the booking form pre-filled with that slot.
-- ============================================================================

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS proposed_slots TIMESTAMPTZ[];

-- ============================================================================
-- End of 013_reservation_proposed_slots.sql
-- ============================================================================
