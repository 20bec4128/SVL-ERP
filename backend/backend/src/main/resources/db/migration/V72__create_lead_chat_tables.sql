CREATE TABLE IF NOT EXISTS lead_chat_thread (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id),
    thread_type VARCHAR(20) NOT NULL,
    created_by VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (lead_id, thread_type)
);

CREATE TABLE IF NOT EXISTS lead_chat_message (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES lead_chat_thread(id),
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

CREATE TABLE IF NOT EXISTS lead_boq_revision (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id),
    created_by_user_id BIGINT,
    created_by_role VARCHAR(40),
    notes TEXT,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(120),
    file_size BIGINT,
    status VARCHAR(30) NOT NULL,
    assigned_to_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);
