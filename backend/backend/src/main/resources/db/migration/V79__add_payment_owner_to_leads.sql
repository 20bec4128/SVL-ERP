-- add paymentOwnerId for tracking original payment handler during design phase
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS payment_owner_id BIGINT;

-- creating an index will make lookups by this column efficient when the
-- backend has to pull "design" leads retained by a payment user.
CREATE INDEX IF NOT EXISTS idx_leads_payment_owner_id ON leads(payment_owner_id);
