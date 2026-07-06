ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS registered_ip VARCHAR(80);

ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS last_active_ip VARCHAR(80);
