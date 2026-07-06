-- Add paid_amount column for payment tracking
-- PostgreSQL syntax; numeric precision matches previous monetary columns

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14,2) DEFAULT 0;