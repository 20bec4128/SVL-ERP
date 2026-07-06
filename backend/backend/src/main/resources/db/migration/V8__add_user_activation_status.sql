ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS activation_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS created_by VARCHAR(120);

UPDATE app_users
SET activation_status = 'ACTIVE'
WHERE activation_status IS NULL;
