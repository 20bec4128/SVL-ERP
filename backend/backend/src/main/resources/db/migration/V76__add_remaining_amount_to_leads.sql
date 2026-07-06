-- Add remaining_amount column for payment tracking
-- PostgreSQL syntax; numeric precision matches other monetary columns

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(14,2) DEFAULT 0;