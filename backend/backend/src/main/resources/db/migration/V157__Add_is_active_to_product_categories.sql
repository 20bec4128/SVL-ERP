-- Add is_active column to product_categories table if it doesn't exist
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index on is_active column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_product_categories_is_active ON product_categories(is_active);
