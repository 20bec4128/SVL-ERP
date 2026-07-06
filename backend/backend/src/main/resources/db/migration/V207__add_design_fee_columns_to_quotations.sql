ALTER TABLE quotations
    ADD COLUMN IF NOT EXISTS include_design_fee BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE quotations
    ADD COLUMN IF NOT EXISTS design_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE quotations
SET include_design_fee = FALSE
WHERE include_design_fee IS NULL;

UPDATE quotations
SET design_fee_amount = 0
WHERE design_fee_amount IS NULL;
