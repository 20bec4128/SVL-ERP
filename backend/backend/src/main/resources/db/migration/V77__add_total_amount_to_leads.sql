-- Add total_amount column for payment tracking
-- PostgreSQL syntax; using DECIMAL(19,2) as requested

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS total_amount DECIMAL(19,2) DEFAULT 0;