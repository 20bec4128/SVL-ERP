-- Store the amount submitted with each payment verification request
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS payment_verification_amount NUMERIC(14, 2);
