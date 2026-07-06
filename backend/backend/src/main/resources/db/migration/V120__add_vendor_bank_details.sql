ALTER TABLE vendor
  ADD COLUMN IF NOT EXISTS bank_account_holder_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_name                VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_account_number      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_ifsc_code           VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bank_branch_name         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_account_type        VARCHAR(50);
