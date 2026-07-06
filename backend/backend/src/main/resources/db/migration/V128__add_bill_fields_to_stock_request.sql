-- Add bill upload fields to stock_request table for production employee bill submission workflow
ALTER TABLE stock_request ADD COLUMN IF NOT EXISTS bill_file_name VARCHAR(500) NULL;
ALTER TABLE stock_request ADD COLUMN IF NOT EXISTS bill_file_path VARCHAR(1000) NULL;
ALTER TABLE stock_request ADD COLUMN IF NOT EXISTS bill_note TEXT NULL;
ALTER TABLE stock_request ADD COLUMN IF NOT EXISTS bill_uploaded_at TIMESTAMP NULL;
