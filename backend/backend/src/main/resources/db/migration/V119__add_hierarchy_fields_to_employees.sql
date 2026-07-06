-- Add organization hierarchy fields to employees table
ALTER TABLE employees ADD COLUMN institution VARCHAR(150) NULL;
ALTER TABLE employees ADD COLUMN institution_category VARCHAR(150) NULL;
ALTER TABLE employees ADD COLUMN institution_type VARCHAR(150) NULL;
ALTER TABLE employees ADD COLUMN department_name VARCHAR(150) NULL;
ALTER TABLE employees ADD COLUMN team VARCHAR(100) NULL;
