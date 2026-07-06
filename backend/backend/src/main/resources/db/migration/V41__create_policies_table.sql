CREATE TABLE IF NOT EXISTS policies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    department_id BIGINT NOT NULL,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(100),
    file_size BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_policies_department_master
        FOREIGN KEY (department_id)
        REFERENCES department_master(id)
);

CREATE INDEX IF NOT EXISTS idx_policies_deleted ON policies(deleted);
CREATE INDEX IF NOT EXISTS idx_policies_department ON policies(department_id);
