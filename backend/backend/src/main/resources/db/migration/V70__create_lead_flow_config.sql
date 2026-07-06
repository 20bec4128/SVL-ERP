CREATE TABLE IF NOT EXISTS lead_flow_config (
    id BIGINT PRIMARY KEY,
    default_group_id BIGINT,
    rules_json TEXT,
    updated_by VARCHAR(120),
    updated_at TIMESTAMP
);

INSERT INTO lead_flow_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
