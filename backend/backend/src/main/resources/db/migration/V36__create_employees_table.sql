CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120),
    phone VARCHAR(30),
    dept VARCHAR(100),
    designation VARCHAR(100),
    join_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    img VARCHAR(500),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_deleted ON employees(deleted);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
