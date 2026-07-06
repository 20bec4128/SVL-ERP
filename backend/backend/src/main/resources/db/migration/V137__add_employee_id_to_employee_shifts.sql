-- Add employee_id to employee_shifts table so shifts can be assigned directly to
-- employees (not just app_users). All employees are NOT users, but all users ARE
-- employees — the bridge is the email field.

ALTER TABLE employee_shifts ADD COLUMN IF NOT EXISTS employee_id BIGINT REFERENCES employees(id);

-- Back-fill: for existing rows that have a user_id, find the employee via email match
UPDATE employee_shifts es
SET employee_id = e.id
FROM app_users u
JOIN employees e ON LOWER(TRIM(e.email)) = LOWER(TRIM(u.email))
WHERE u.id = es.user_id
  AND es.employee_id IS NULL;

-- Now enforce that every row has an employee_id
ALTER TABLE employee_shifts ALTER COLUMN employee_id SET NOT NULL;

-- Make user_id optional (legacy; kept for potential backward-compat queries)
ALTER TABLE employee_shifts ALTER COLUMN user_id DROP NOT NULL;

-- Re-index
DROP INDEX IF EXISTS idx_employee_shifts_user;
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
