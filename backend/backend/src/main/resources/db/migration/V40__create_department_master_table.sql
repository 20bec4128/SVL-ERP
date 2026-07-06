CREATE TABLE IF NOT EXISTS department_master (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_department_master_deleted ON department_master(deleted);
CREATE INDEX IF NOT EXISTS idx_department_master_status ON department_master(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_department_master_name_active
    ON department_master (LOWER(name))
    WHERE deleted = FALSE;
