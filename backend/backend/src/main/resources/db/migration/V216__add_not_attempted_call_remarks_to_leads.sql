ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS not_attempted_call_remarks VARCHAR(1000) NULL;
