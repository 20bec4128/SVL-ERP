-- Add artwork and requirement file path fields to deals table
ALTER TABLE deals ADD COLUMN artwork_file_name VARCHAR(255);
ALTER TABLE deals ADD COLUMN artwork_file_path VARCHAR(500);
ALTER TABLE deals ADD COLUMN requirement_file_path VARCHAR(500);
