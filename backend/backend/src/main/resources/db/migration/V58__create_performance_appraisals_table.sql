CREATE TABLE IF NOT EXISTS performance_appraisals (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    appraisal_date DATE,
    status VARCHAR(20),
    technical_json TEXT,
    organizational_json TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_appraisals_employee_id
    ON performance_appraisals(employee_id);
