CREATE TABLE IF NOT EXISTS goal_tracking (
    id BIGSERIAL PRIMARY KEY,
    goal_type VARCHAR(120),
    subject VARCHAR(200),
    target_achievement VARCHAR(300),
    start_date DATE,
    end_date DATE,
    description VARCHAR(1000),
    status VARCHAR(20),
    progress_percent INT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
