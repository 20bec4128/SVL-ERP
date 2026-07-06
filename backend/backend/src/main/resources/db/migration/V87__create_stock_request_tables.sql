CREATE TABLE IF NOT EXISTS stock_request (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id),
    requested_by BIGINT,
    assigned_to BIGINT,
    status VARCHAR(50),
    items TEXT,
    purchase_value NUMERIC(19,2),
    vendor_id BIGINT REFERENCES vendor(id),
    budget_exceeded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_request_chat_thread (
    id BIGSERIAL PRIMARY KEY,
    stock_request_id BIGINT NOT NULL REFERENCES stock_request(id),
    created_by VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (stock_request_id)
);

CREATE TABLE IF NOT EXISTS stock_request_chat_message (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES stock_request_chat_thread(id),
    sender_user_id BIGINT,
    sender_role VARCHAR(40),
    message TEXT,
    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    attachment_name VARCHAR(255),
    attachment_path VARCHAR(500),
    attachment_type VARCHAR(120),
    attachment_size BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
