-- Make lead_id nullable and add deal_id to stock_request table
ALTER TABLE stock_request ALTER COLUMN lead_id DROP NOT NULL;

-- Add deal_id column
ALTER TABLE stock_request ADD COLUMN deal_id BIGINT NULL;

-- Create index on deal_id for better query performance
CREATE INDEX idx_stock_request_deal_id ON stock_request(deal_id);
