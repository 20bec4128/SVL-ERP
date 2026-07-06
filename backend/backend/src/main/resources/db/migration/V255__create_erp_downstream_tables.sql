-- Create sales_orders table
CREATE TABLE sales_orders (
    id BIGSERIAL PRIMARY KEY,
    so_number VARCHAR(50) NOT NULL UNIQUE,
    lead_id BIGINT,
    quotation_id BIGINT,
    customer_id BIGINT,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'AWAITING_ADVANCE',
    delivery_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Create sales_order_items table
CREATE TABLE sales_order_items (
    id BIGSERIAL PRIMARY KEY,
    sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    requirement_id BIGINT,
    product_name VARCHAR(255) NOT NULL,
    specs_summary TEXT,
    specs_json TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00
);

-- Create lead_payment_entries table
CREATE TABLE lead_payment_entries (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    sales_order_id BIGINT,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100),
    proof_file_name VARCHAR(255),
    proof_file_path VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    recorded_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL
);

-- Create jobs table
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    job_number VARCHAR(50) NOT NULL UNIQUE,
    sales_order_id BIGINT NOT NULL,
    overall_progress DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Create job_tasks table
CREATE TABLE job_tasks (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    department VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    version_number INTEGER NOT NULL DEFAULT 1,
    assigned_user_id BIGINT,
    notes TEXT,
    proof_file_path VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
