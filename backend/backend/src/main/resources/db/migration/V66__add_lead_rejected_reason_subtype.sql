ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS rejected_reason_subtype VARCHAR(500);
