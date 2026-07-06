-- Optional vendor bank details (no mandatory fields)

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS bank_account_holder_name VARCHAR(255);

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(64);

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(32);

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS bank_branch_name VARCHAR(255);

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(32);

