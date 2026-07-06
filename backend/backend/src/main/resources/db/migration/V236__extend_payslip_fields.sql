ALTER TABLE payslips ADD COLUMN overtime decimal(15, 2) not null default 0.00;
ALTER TABLE payslips ADD COLUMN status varchar(50) not null default 'Generated';

-- Insert default overtime rate
INSERT INTO payroll_overtimes (name, rate_type, rate, deleted) VALUES ('Overtime', 'HOURLY', 150.00, false);
