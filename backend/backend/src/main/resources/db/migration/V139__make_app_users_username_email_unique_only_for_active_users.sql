ALTER TABLE app_users
    DROP CONSTRAINT IF EXISTS app_users_username_key;

ALTER TABLE app_users
    DROP CONSTRAINT IF EXISTS app_users_email_key;

DROP INDEX IF EXISTS ux_app_users_username_active;
DROP INDEX IF EXISTS ux_app_users_email_active;

CREATE UNIQUE INDEX ux_app_users_username_active
    ON app_users (lower(username))
    WHERE is_deleted = false;

CREATE UNIQUE INDEX ux_app_users_email_active
    ON app_users (lower(email))
    WHERE is_deleted = false;
