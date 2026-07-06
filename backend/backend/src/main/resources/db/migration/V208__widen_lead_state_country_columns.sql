-- Widen lead_state and lead_country columns to hold full names (e.g. "Maharashtra", "Tamil Nadu")
-- Previously VARCHAR(10) which caused truncation errors on import
ALTER TABLE leads ALTER COLUMN lead_state TYPE VARCHAR(100);
ALTER TABLE leads ALTER COLUMN lead_country TYPE VARCHAR(100);
