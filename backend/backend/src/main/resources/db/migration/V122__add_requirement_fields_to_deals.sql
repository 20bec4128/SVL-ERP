ALTER TABLE deals
ADD COLUMN requirement_type VARCHAR(100),
ADD COLUMN requirement_notes TEXT,
ADD COLUMN requirement_file_name VARCHAR(255);
