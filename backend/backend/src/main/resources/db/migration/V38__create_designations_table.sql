CREATE TABLE IF NOT EXISTS designations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    department VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_designations_deleted ON designations(deleted);
CREATE INDEX IF NOT EXISTS idx_designations_status ON designations(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_designations_name_dept_active
    ON designations (LOWER(name), LOWER(department))
    WHERE deleted = FALSE;
