-- Make name column nullable in legacy customers table to support new customer fields
ALTER TABLE customers ALTER COLUMN name DROP NOT NULL;
