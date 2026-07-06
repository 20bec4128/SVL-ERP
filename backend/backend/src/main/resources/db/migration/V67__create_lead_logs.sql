CREATE TABLE IF NOT EXISTS lead_logs (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    action VARCHAR(200) NOT NULL,
    actor VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_logs_lead_id ON lead_logs(lead_id);
