CREATE TABLE quotations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    quotation_number VARCHAR(120),
    quotation_date DATE,
    customer_name VARCHAR(255),
    party_mode VARCHAR(40),
    selected_lead_json TEXT,
    line_items_json TEXT,
    totals_json TEXT,
    discount_pct DECIMAL(10,2),
    cgst_pct DECIMAL(10,2),
    sgst_pct DECIMAL(10,2),
    status VARCHAR(40) NOT NULL,
    verification_requested_at TIMESTAMP NULL,
    verification_requested_by_id BIGINT NULL,
    verification_requested_by_name VARCHAR(255),
    verification_requested_by_role VARCHAR(40),
    verification_request_notes TEXT,
    approved_at TIMESTAMP NULL,
    approved_by_id BIGINT NULL,
    approved_by_name VARCHAR(255),
    approved_by_role VARCHAR(40),
    approval_notes TEXT,
    created_by_id BIGINT NOT NULL,
    created_by_name VARCHAR(255),
    created_by_email VARCHAR(255),
    created_by_role VARCHAR(40),
    created_by_team VARCHAR(160),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotations_created_by_id ON quotations(created_by_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_by_team ON quotations(created_by_team);
