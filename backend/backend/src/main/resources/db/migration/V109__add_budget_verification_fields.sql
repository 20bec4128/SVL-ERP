-- Add budget verification fields to leads table
-- Budget team receives requirements, calculates invoice, and approves before payment phase
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS budget_verification_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS budget_verification_assigned_to_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS budget_verification_rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_budget_verification_assigned ON leads(budget_verification_assigned_to_user_id);
