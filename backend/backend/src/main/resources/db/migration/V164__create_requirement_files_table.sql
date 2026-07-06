CREATE TABLE IF NOT EXISTS requirement_files (
    id BIGSERIAL PRIMARY KEY,
    requirement_id BIGINT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    saved_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_req_files_requirement FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_req_files_requirement_id ON requirement_files(requirement_id);
