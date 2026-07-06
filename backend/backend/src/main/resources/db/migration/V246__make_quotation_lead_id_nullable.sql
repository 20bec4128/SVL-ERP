-- Make lead_id nullable on quotations table to support direct customers without leads
ALTER TABLE quotations ALTER COLUMN lead_id DROP NOT NULL;
