-- V203__create_role_scope_page_permissions.sql
CREATE TABLE IF NOT EXISTS role_scope_page_permissions (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(40) NOT NULL,
    scope_type VARCHAR(20) NOT NULL,
    scope_id BIGINT,
    page_keys_csv TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_role_scope UNIQUE (role, scope_type, scope_id)
);
