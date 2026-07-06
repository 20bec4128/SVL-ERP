-- Add payment verification fields to leads table
-- NOTE: Using TEXT for compatibility with PostgreSQL (LONGTEXT is MySQL-specific)
ALTER TABLE leads ADD COLUMN payment_proof_file_name VARCHAR(200);
ALTER TABLE leads ADD COLUMN payment_proof_file_path VARCHAR(1000);
ALTER TABLE leads ADD COLUMN payment_proof_notes TEXT;
ALTER TABLE leads ADD COLUMN payment_verification_status VARCHAR(50);
ALTER TABLE leads ADD COLUMN payment_verification_rejection_reason TEXT;

-- Add indexes for faster queries
CREATE INDEX idx_payment_verification_status ON leads(payment_verification_status);