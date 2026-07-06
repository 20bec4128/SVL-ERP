-- V103__add_payment_verification_assigned_to_user_id.sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS payment_verification_assigned_to_user_id BIGINT;