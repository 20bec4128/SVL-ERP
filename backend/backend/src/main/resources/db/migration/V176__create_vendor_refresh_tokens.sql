CREATE TABLE IF NOT EXISTS vendor_refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    token VARCHAR(200) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_vendor_refresh_tokens_vendor_id ON vendor_refresh_tokens(vendor_id);

