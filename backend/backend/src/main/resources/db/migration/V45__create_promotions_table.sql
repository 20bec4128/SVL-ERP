CREATE TABLE IF NOT EXISTS promotions (
    id BIGSERIAL PRIMARY KEY,
    employee_name VARCHAR(120),
    department VARCHAR(120),
    designation_from VARCHAR(120),
    designation_to VARCHAR(120),
    promotion_date DATE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_deleted ON promotions(deleted);
CREATE INDEX IF NOT EXISTS idx_promotions_date ON promotions(promotion_date);
