ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS certificate_path VARCHAR(500);
