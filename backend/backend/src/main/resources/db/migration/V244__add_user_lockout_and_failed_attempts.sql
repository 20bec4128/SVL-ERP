ALTER TABLE app_users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE app_users ADD COLUMN lockout_end TIMESTAMP;
ALTER TABLE app_users ADD COLUMN password_updated_at TIMESTAMP;

UPDATE app_users SET password_updated_at = NOW() WHERE password_updated_at IS NULL;
