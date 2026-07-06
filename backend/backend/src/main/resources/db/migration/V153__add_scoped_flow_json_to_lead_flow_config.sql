ALTER TABLE lead_flow_config
    ADD COLUMN IF NOT EXISTS scoped_flow_json TEXT;
