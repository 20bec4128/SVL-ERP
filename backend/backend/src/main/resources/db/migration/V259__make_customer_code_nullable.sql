-- Make customer_code nullable in case of legacy constraints on customers table
ALTER TABLE customers ALTER COLUMN customer_code DROP NOT NULL;
