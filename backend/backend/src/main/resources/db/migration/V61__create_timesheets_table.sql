CREATE TABLE IF NOT EXISTS timesheets (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT,
    project_name VARCHAR(200),
    deadline DATE,
    total_hours INT,
    remaining_hours INT,
    work_date DATE,
    worked_hours INT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
