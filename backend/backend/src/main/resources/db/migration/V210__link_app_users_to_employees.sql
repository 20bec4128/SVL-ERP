ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS employee_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_app_users_employee'
    ) THEN
        ALTER TABLE app_users
            ADD CONSTRAINT fk_app_users_employee
            FOREIGN KEY (employee_id) REFERENCES employees(id);
    END IF;
END $$;

UPDATE app_users u
SET employee_id = e.id
FROM employees e
WHERE u.employee_id IS NULL
  AND e.deleted = false
  AND (
    lower(coalesce(e.email, '')) = lower(u.email)
    OR lower(coalesce(e.official_email, '')) = lower(u.email)
    OR lower(coalesce(e.personal_email, '')) = lower(u.email)
  );

CREATE INDEX IF NOT EXISTS idx_app_users_employee_id ON app_users(employee_id);
