ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS username VARCHAR(120);

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_username_unique
    ON vendor (lower(username))
    WHERE deleted = false AND username IS NOT NULL;
