CREATE TABLE IF NOT EXISTS ticket_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_categories_deleted ON ticket_categories(deleted);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ticket_categories_name_active
    ON ticket_categories (LOWER(name))
    WHERE deleted = FALSE;
