-- Vendor master table
CREATE TABLE vendor (
    id              BIGSERIAL PRIMARY KEY,
    vendor_name     VARCHAR(255)  NOT NULL,
    contact_person  VARCHAR(255),
    phone           VARCHAR(50)   NOT NULL,
    email           VARCHAR(255),
    address         TEXT,
    materials_supplied TEXT,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);

-- Add vendor columns to stock_item
ALTER TABLE stock_item ADD COLUMN vendor_id   BIGINT;
ALTER TABLE stock_item ADD COLUMN vendor_name VARCHAR(255);

-- Seed 3 mock vendors
INSERT INTO vendor (vendor_name, contact_person, phone, email, address, materials_supplied)
VALUES
    ('ITC Papers Ltd',    'Raj Kumar',   '+91 98765 43210', 'raj@itcpapers.com',     'Chennai',   '["Paper"]'),
    ('PrintoVinyl Co',    'Sneha Rathi', '+91 91234 56789', 'sneha@printvinyl.com',  'Mumbai',    '["Vinyl","Net"]'),
    ('ColorInk Supplies', 'Arjun Nair',  '+91 99887 76655', 'arjun@colorink.com',    'Bangalore', '["Ink","Paper"]');
