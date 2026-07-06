CREATE TABLE IF NOT EXISTS overtime (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT,
    overtime_date DATE,
    overtime_hours INT,
    remaining_hours INT,
    project_name VARCHAR(200),
    approved_by VARCHAR(120),
    description VARCHAR(1000),
    status VARCHAR(20),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
