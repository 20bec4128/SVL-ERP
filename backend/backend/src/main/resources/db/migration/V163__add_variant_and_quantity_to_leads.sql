-- Add variant and quantity columns to leads table
ALTER TABLE leads ADD COLUMN variant VARCHAR(200);
ALTER TABLE leads ADD COLUMN quantity INT;
