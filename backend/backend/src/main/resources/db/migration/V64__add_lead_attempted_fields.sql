ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS attempted_open_reason VARCHAR(160),
    ADD COLUMN IF NOT EXISTS attempted_call_status VARCHAR(160),
    ADD COLUMN IF NOT EXISTS attempted_call_remarks VARCHAR(1000);
