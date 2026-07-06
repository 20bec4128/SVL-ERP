-- Enhance vendor table with comprehensive fields for vendor management

-- Add new columns to vendor table
ALTER TABLE vendor ADD COLUMN vendor_type_ids TEXT;
ALTER TABLE vendor ADD COLUMN product_ids TEXT;
ALTER TABLE vendor ADD COLUMN brand_ids TEXT;
ALTER TABLE vendor ADD COLUMN deals_with VARCHAR(255);
ALTER TABLE vendor ADD COLUMN internal_representative VARCHAR(255);
ALTER TABLE vendor ADD COLUMN relationship_since DATE;
ALTER TABLE vendor ADD COLUMN company_website VARCHAR(255);
ALTER TABLE vendor ADD COLUMN country_of_registration VARCHAR(255);
ALTER TABLE vendor ADD COLUMN company_registration_no VARCHAR(255);
ALTER TABLE vendor ADD COLUMN gst_number VARCHAR(50);
ALTER TABLE vendor ADD COLUMN pan_number VARCHAR(50);
ALTER TABLE vendor ADD COLUMN company_address TEXT;
ALTER TABLE vendor ADD COLUMN status VARCHAR(50) DEFAULT 'active';
ALTER TABLE vendor ADD COLUMN official_email VARCHAR(255);
ALTER TABLE vendor ADD COLUMN secondary_email VARCHAR(255);

-- Create index for status column for faster filtering
CREATE INDEX idx_vendor_status ON vendor(status);
