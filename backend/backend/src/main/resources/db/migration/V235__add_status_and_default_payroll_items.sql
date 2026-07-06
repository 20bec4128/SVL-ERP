-- Add status field to payroll_additions and payroll_deductions
ALTER TABLE payroll_additions ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Active';
ALTER TABLE payroll_deductions ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Active';

-- Insert default additions
INSERT INTO payroll_additions (name, category, unit_calculation, status, deleted) VALUES
('Basic', 'MONTHLY', false, 'Active', false),
('DA (Dearness Allowance)', 'MONTHLY', false, 'Active', false),
('HRA (House Rent Allowance)', 'MONTHLY', false, 'Active', false),
('Conveyance', 'MONTHLY', false, 'Active', false);

-- Insert default deductions
INSERT INTO payroll_deductions (name, unit_calculation, status, deleted) VALUES
('TDS', false, 'Active', false),
('ESI', false, 'Active', false),
('PF', false, 'Active', false),
('Leave Deduction', false, 'Active', false);
