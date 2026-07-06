-- ============================================================
-- V187__add_duplicate_lead_fields.sql
-- Adds duplicate detection columns to the leads table
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS is_duplicate         BOOLEAN       NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS duplicate_of_lead_id  BIGINT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS duplicate_of_lead_ref  VARCHAR(64)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS duplicate_of_lead_name VARCHAR(200) DEFAULT NULL;

-- Index for fast duplicate lookup by mobile/email
CREATE INDEX IF NOT EXISTS idx_leads_mobile_normalized ON leads (mobile_normalized);
CREATE INDEX IF NOT EXISTS idx_leads_email_normalized  ON leads (email_normalized);
CREATE INDEX IF NOT EXISTS idx_leads_is_duplicate      ON leads (is_duplicate);
