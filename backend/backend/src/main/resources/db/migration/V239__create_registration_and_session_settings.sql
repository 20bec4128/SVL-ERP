CREATE TABLE registration_settings (
    id BIGSERIAL PRIMARY KEY,
    allow_self_registration BOOLEAN NOT NULL DEFAULT TRUE,
    require_email_verification BOOLEAN NOT NULL DEFAULT FALSE,
    require_admin_approval BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_domains TEXT,
    default_role VARCHAR(50) DEFAULT 'EMPLOYEE',
    updated_at TIMESTAMP,
    updated_by VARCHAR(255)
);

CREATE TABLE session_settings (
    id BIGSERIAL PRIMARY KEY,
    session_timeout_minutes INT NOT NULL DEFAULT 60,
    remember_me_days INT NOT NULL DEFAULT 30,
    max_concurrent_sessions INT NOT NULL DEFAULT 5,
    prevent_concurrent_logins BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP,
    updated_by VARCHAR(255)
);

INSERT INTO registration_settings (allow_self_registration, require_email_verification, require_admin_approval, allowed_domains, default_role)
VALUES (TRUE, FALSE, FALSE, '', 'EMPLOYEE');

INSERT INTO session_settings (session_timeout_minutes, remember_me_days, max_concurrent_sessions, prevent_concurrent_logins)
VALUES (60, 30, 5, FALSE);
