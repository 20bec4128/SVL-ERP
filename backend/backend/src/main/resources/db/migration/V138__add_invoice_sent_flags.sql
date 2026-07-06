-- V138__add_invoice_sent_flags.sql
-- Add invoice sent tracking flags to leads and deals tables

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS budget_invoice_sent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS payment_invoice_sent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS budget_invoice_sent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS payment_invoice_sent BOOLEAN NOT NULL DEFAULT FALSE;
