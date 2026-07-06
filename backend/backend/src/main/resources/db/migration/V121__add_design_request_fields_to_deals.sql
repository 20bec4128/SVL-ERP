ALTER TABLE deals
    ADD COLUMN IF NOT EXISTS design_assigned_to_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS design_request_status VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_deals_design_assigned ON deals(design_assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_deals_design_req_status ON deals(design_request_status);
