ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS interested_follow_up_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS interested_call_remarks VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS rejected_reason VARCHAR(200);
