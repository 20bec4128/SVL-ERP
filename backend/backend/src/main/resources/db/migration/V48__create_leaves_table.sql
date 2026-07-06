CREATE TABLE IF NOT EXISTS leaves (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    employee_name VARCHAR(120),
    department VARCHAR(120),
    leave_type VARCHAR(120) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    no_of_days INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    reason TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaves_deleted ON leaves(deleted);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_from_date ON leaves(from_date);
