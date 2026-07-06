ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS requirement_file_name VARCHAR(200);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS requirement_file_path VARCHAR(1000);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS requirement_file_type VARCHAR(100);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS requirement_file_size BIGINT;
