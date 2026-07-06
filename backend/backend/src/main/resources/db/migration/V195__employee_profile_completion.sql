-- Employee profile completion (public form + field-level verification)

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS profile_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS profile_status_updated_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NULL;

CREATE TABLE IF NOT EXISTS employee_profile_tokens (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    scope VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    used_at TIMESTAMP NULL,
    created_by_user_id BIGINT NULL
);

CREATE INDEX IF NOT EXISTS ix_employee_profile_tokens_employee_id ON employee_profile_tokens(employee_id);
CREATE INDEX IF NOT EXISTS ix_employee_profile_tokens_expires_at ON employee_profile_tokens(expires_at);

CREATE TABLE IF NOT EXISTS employee_profile_field_verifications (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    field_key VARCHAR(60) NOT NULL,
    status VARCHAR(20) NOT NULL,
    remarks TEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by_user_id BIGINT NULL,
    CONSTRAINT uq_employee_profile_field UNIQUE (employee_id, field_key)
);

CREATE INDEX IF NOT EXISTS ix_employee_profile_field_employee_id ON employee_profile_field_verifications(employee_id);

CREATE TABLE IF NOT EXISTS employee_documents (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    doc_type VARCHAR(30) NOT NULL,
    file_path VARCHAR(600) NOT NULL,
    original_filename VARCHAR(255) NULL,
    content_type VARCHAR(120) NULL,
    size_bytes BIGINT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    remarks TEXT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMP NULL,
    verified_by_user_id BIGINT NULL
);

CREATE INDEX IF NOT EXISTS ix_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS ix_employee_documents_doc_type ON employee_documents(doc_type);
