-- flyway migration for stock categories and items

CREATE TABLE stock_category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    fields TEXT NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE stock_item (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES stock_category(id),
    name VARCHAR(255),
    quantity INT NOT NULL DEFAULT 0,
    min_threshold INT NOT NULL DEFAULT 0,
    values TEXT NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
