ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS role VARCHAR(40);

UPDATE app_users
SET role = CASE
    WHEN LOWER(status) = 'admin' THEN 'ADMIN'
    WHEN LOWER(status) = 'manager' THEN 'MANAGER'
    ELSE 'EMPLOYEE'
END
WHERE role IS NULL;

ALTER TABLE app_users
    ALTER COLUMN role SET NOT NULL;

ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT FALSE;
