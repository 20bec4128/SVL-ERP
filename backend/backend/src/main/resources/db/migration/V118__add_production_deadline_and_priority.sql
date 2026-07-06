-- Add missing production requirement columns for deadline, delivery date, and priority
ALTER TABLE production_requirements 
ADD COLUMN IF NOT EXISTS production_print_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS production_delivery_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS production_priority VARCHAR(100);
