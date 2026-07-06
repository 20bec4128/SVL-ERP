CREATE TABLE IF NOT EXISTS deals (
    id                   BIGSERIAL PRIMARY KEY,
    source_lead_id       BIGINT        NOT NULL,
    name                 VARCHAR(200)  NOT NULL,
    email                VARCHAR(190),
    mobile               VARCHAR(40),
    country_code         VARCHAR(20),
    primary_source       VARCHAR(160),
    secondary_source     VARCHAR(160),
    tertiary_source      VARCHAR(160),
    project_name         VARCHAR(200),
    company_name         VARCHAR(200),
    owner                VARCHAR(120),
    owner_user_id        BIGINT,
    total_amount         NUMERIC(14, 2),
    paid_amount          NUMERIC(14, 2),
    remaining_amount     NUMERIC(14, 2),
    invoice_data         TEXT,
    invoice_cgst_percent NUMERIC(5, 2),
    invoice_sgst_percent NUMERIC(5, 2),
    status               VARCHAR(100),
    converted_at         TIMESTAMP    NOT NULL,
    is_deleted           BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_deals_source_lead ON deals(source_lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_deleted ON deals(is_deleted);
CREATE INDEX IF NOT EXISTS idx_deals_converted ON deals(converted_at);
