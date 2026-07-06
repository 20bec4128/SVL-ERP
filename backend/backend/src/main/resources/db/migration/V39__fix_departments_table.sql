ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_departments_deleted ON departments(deleted);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_name_active
    ON departments (LOWER(name))
    WHERE deleted = FALSE;
