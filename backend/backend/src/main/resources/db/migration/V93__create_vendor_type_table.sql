-- Vendor type master table
CREATE TABLE vendor_type (
    id BIGSERIAL PRIMARY KEY,
    type_name VARCHAR(255) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);
