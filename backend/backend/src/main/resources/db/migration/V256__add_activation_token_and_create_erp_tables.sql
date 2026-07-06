ALTER TABLE app_users ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255);

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL UNIQUE,
    company_name VARCHAR(200),
    contact_person VARCHAR(200),
    email_address VARCHAR(190),
    mobile_number VARCHAR(40),
    gst_number VARCHAR(50),
    billing_address VARCHAR(500),
    shipping_address VARCHAR(500),
    pan VARCHAR(20),
    business_type VARCHAR(100),
    payment_terms VARCHAR(200),
    credit_limit DECIMAL(12, 2) DEFAULT 0.00,
    sales_executive_id BIGINT,
    source_lead_id BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    sales_order_id BIGINT,
    customer_id BIGINT,
    lead_id BIGINT,
    issue_date DATE NOT NULL,
    due_date DATE,
    payment_terms VARCHAR(200),
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    gst_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    remaining_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    pdf_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
