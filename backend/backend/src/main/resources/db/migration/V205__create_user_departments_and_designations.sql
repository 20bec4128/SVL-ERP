CREATE TABLE IF NOT EXISTS user_departments (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user_departments_branch FOREIGN KEY (branch_id) REFERENCES branch_master (id)
);

CREATE TABLE IF NOT EXISTS user_designations (
    id BIGSERIAL PRIMARY KEY,
    user_department_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user_designations_department FOREIGN KEY (user_department_id) REFERENCES user_departments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_departments_branch_id ON user_departments(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_designations_department_id ON user_designations(user_department_id);
