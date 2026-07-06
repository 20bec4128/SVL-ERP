CREATE TABLE leave_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE leave_type_settings (
    id BIGSERIAL PRIMARY KEY,
    leave_type_id BIGINT NOT NULL UNIQUE REFERENCES leave_types(id) ON DELETE CASCADE,
    days_per_year INT NOT NULL DEFAULT 0,
    carry_forward_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    max_carry_forward_days INT,
    max_days_per_request INT,
    earned_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE leave_policies (
    id BIGSERIAL PRIMARY KEY,
    leave_type_id BIGINT NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    days_per_year INT NOT NULL DEFAULT 0,
    carry_forward_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    max_carry_forward_days INT,
    max_days_per_request INT,
    earned_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE leave_policy_employees (
    id BIGSERIAL PRIMARY KEY,
    policy_id BIGINT NOT NULL REFERENCES leave_policies(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL,
    UNIQUE(policy_id, employee_id)
);
