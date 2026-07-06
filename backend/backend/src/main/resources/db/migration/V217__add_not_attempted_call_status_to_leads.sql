ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS not_attempted_call_status VARCHAR(160) NULL;

