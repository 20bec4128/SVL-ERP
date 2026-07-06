CREATE TABLE user_settings (
    id BIGSERIAL PRIMARY KEY,
    allow_profile_editing BOOLEAN NOT NULL DEFAULT TRUE,
    allow_password_change BOOLEAN NOT NULL DEFAULT TRUE,
    enable_two_factor_auth BOOLEAN NOT NULL DEFAULT FALSE,
    default_language VARCHAR(50) NOT NULL DEFAULT 'en',
    default_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    updated_at TIMESTAMP,
    updated_by VARCHAR(255)
);

CREATE TABLE security_settings (
    id BIGSERIAL PRIMARY KEY,
    min_password_length INT NOT NULL DEFAULT 8,
    require_uppercase BOOLEAN NOT NULL DEFAULT TRUE,
    require_lowercase BOOLEAN NOT NULL DEFAULT TRUE,
    require_numbers BOOLEAN NOT NULL DEFAULT TRUE,
    require_special_chars BOOLEAN NOT NULL DEFAULT TRUE,
    max_login_attempts INT NOT NULL DEFAULT 5,
    lockout_duration_minutes INT NOT NULL DEFAULT 15,
    password_expiry_days INT NOT NULL DEFAULT 90,
    updated_at TIMESTAMP,
    updated_by VARCHAR(255)
);

INSERT INTO user_settings (allow_profile_editing, allow_password_change, enable_two_factor_auth, default_language, default_timezone)
VALUES (TRUE, TRUE, FALSE, 'en', 'UTC');

INSERT INTO security_settings (min_password_length, require_uppercase, require_lowercase, require_numbers, require_special_chars, max_login_attempts, lockout_duration_minutes, password_expiry_days)
VALUES (8, TRUE, TRUE, TRUE, TRUE, 5, 15, 90);
