-- Store proof and notes for advance payment

ALTER TABLE vendor_order
    ADD COLUMN IF NOT EXISTS advance_paid_proof_name VARCHAR(255);

ALTER TABLE vendor_order
    ADD COLUMN IF NOT EXISTS advance_paid_proof_path TEXT;

ALTER TABLE vendor_order
    ADD COLUMN IF NOT EXISTS advance_paid_notes TEXT;

