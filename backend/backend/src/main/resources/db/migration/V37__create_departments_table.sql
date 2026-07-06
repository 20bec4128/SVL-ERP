CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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

-- Soft-delete duplicate names (case-insensitive), keep lowest id as active
UPDATE departments a
SET deleted = TRUE
FROM departments b
WHERE a.id > b.id
  AND LOWER(a.name) = LOWER(b.name)
  AND a.deleted = FALSE
  AND b.deleted = FALSE;

-- Create unique index only after duplicates are handled
CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_name_active
    ON departments (LOWER(name))
    WHERE deleted = FALSE;
