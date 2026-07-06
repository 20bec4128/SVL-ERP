-- V99__add_requirement_type_to_leads.sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS requirement_type VARCHAR(100);