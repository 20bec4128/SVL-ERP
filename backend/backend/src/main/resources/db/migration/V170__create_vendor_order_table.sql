CREATE TABLE vendor_order (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    category_id BIGINT,
    category_name VARCHAR(255),
    type_id BIGINT,
    type_name VARCHAR(255),
    subtype_id BIGINT,
    subtype_name VARCHAR(255),
    material_name VARCHAR(255),
    vendor_id BIGINT,
    vendor_name VARCHAR(255),
    quantity VARCHAR(100),
    required_date DATE,
    notes TEXT,
    upload_design_path TEXT,
    vendor_deadline DATE,
    quotation_file_name VARCHAR(255),
    quotation_file_path TEXT,
    status VARCHAR(100) NOT NULL DEFAULT 'New',
    payment_status VARCHAR(100) NOT NULL DEFAULT 'Pending',
    accounts_status VARCHAR(100) NOT NULL DEFAULT 'Not Sent',
    vendor_price VARCHAR(100),
    advance_amount VARCHAR(100),
    sent_to_accounts_at TIMESTAMP,
    advance_paid_at TIMESTAMP,
    advance_verified_at TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_vendor_order_vendor_id ON vendor_order(vendor_id);
CREATE INDEX idx_vendor_order_deleted ON vendor_order(deleted);
