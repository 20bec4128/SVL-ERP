-- Create addresses table for storing multiple billing/shipping addresses per lead
CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- BILLING or SHIPPING
    contact_person_name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    gstin VARCHAR(50),
    country_code VARCHAR(10),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    address_line1 VARCHAR(300) NOT NULL,
    address_line2 VARCHAR(300),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT fk_addresses_lead FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_addresses_deleted ON addresses(is_deleted);
CREATE INDEX IF NOT EXISTS idx_addresses_lead_id ON addresses(lead_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_lead_type ON addresses(lead_id, type);
CREATE INDEX IF NOT EXISTS idx_addresses_is_primary ON addresses(lead_id, type, is_primary) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_addresses_created_at ON addresses(created_at DESC);
