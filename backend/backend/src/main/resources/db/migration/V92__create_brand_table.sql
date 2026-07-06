-- Brand table (associated with stock categories)
CREATE TABLE brand (
    id BIGSERIAL PRIMARY KEY,
    stock_category_id BIGINT NOT NULL REFERENCES stock_category(id),
    brand_name VARCHAR(255) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Add brand columns to stock_item for future use
ALTER TABLE stock_item ADD COLUMN brand_id BIGINT;
ALTER TABLE stock_item ADD COLUMN brand_name VARCHAR(255);
