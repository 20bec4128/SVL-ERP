-- V98__add_requirement_notes.sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS requirement_notes TEXT;
