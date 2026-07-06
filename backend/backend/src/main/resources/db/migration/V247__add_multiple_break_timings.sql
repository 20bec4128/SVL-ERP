-- Add multiple break timings and lunch timings config to shifts
ALTER TABLE shifts ADD COLUMN break1_start_time TIME NULL;
ALTER TABLE shifts ADD COLUMN break1_end_time TIME NULL;
ALTER TABLE shifts ADD COLUMN break1_allowed_minutes INT NOT NULL DEFAULT 15;
ALTER TABLE shifts ADD COLUMN break1_grace_minutes INT NOT NULL DEFAULT 5;

ALTER TABLE shifts ADD COLUMN lunch_start_time TIME NULL;
ALTER TABLE shifts ADD COLUMN lunch_end_time TIME NULL;

ALTER TABLE shifts ADD COLUMN break2_start_time TIME NULL;
ALTER TABLE shifts ADD COLUMN break2_end_time TIME NULL;
ALTER TABLE shifts ADD COLUMN break2_allowed_minutes INT NOT NULL DEFAULT 15;
ALTER TABLE shifts ADD COLUMN break2_grace_minutes INT NOT NULL DEFAULT 5;

-- Add granular break tracking to attendance table
ALTER TABLE attendance ADD COLUMN break1_time_minutes INT DEFAULT 0;
ALTER TABLE attendance ADD COLUMN break2_time_minutes INT DEFAULT 0;
ALTER TABLE attendance ADD COLUMN excess_break1_minutes INT DEFAULT 0;
ALTER TABLE attendance ADD COLUMN excess_break2_minutes INT DEFAULT 0;
