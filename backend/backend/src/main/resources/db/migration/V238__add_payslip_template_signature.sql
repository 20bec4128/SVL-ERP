ALTER TABLE payslip_template ADD COLUMN signature_base64 TEXT;
ALTER TABLE payslip_template DROP COLUMN prepared_by_default;
ALTER TABLE payslip_template DROP COLUMN verified_by_default;
ALTER TABLE payslip_template DROP COLUMN received_by_default;
