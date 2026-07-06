-- Add design workflow tracking fields to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_draft_file_name VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_draft_file_path VARCHAR(500);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_draft_count INT DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_sales_feedback TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_final_file_name VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_final_file_path VARCHAR(500);
