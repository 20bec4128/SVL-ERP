ALTER TABLE employees ADD COLUMN IF NOT EXISTS country_code VARCHAR(10);
CREATE INDEX IF NOT EXISTS idx_employees_country_code ON employees(country_code);
