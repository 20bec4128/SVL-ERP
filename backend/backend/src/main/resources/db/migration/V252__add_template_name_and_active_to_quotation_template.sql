ALTER TABLE quotation_template ADD COLUMN IF NOT EXISTS template_name VARCHAR(200);
ALTER TABLE quotation_template ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT FALSE;

-- Set existing records as active and assign a default template name
UPDATE quotation_template SET active = TRUE, template_name = 'Standard Template' WHERE active IS NULL;
