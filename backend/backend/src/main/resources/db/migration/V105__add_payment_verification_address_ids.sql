-- Add address ID columns to link payment verification to specific addresses
ALTER TABLE leads ADD COLUMN payment_verification_billing_address_id BIGINT;
ALTER TABLE leads ADD COLUMN payment_verification_shipping_address_id BIGINT;

-- Add foreign key constraints to maintain referential integrity
ALTER TABLE leads ADD CONSTRAINT fk_payment_billing_address 
    FOREIGN KEY (payment_verification_billing_address_id) REFERENCES addresses(id);

ALTER TABLE leads ADD CONSTRAINT fk_payment_shipping_address 
    FOREIGN KEY (payment_verification_shipping_address_id) REFERENCES addresses(id);

-- Create indexes for faster queries
CREATE INDEX idx_payment_billing_address_id ON leads(payment_verification_billing_address_id);
CREATE INDEX idx_payment_shipping_address_id ON leads(payment_verification_shipping_address_id);
