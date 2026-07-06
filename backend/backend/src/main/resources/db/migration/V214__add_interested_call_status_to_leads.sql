ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS interested_call_status VARCHAR(160);
