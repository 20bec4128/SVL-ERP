-- Create invoice items table and add CGST/SGST percent columns to leads
CREATE TABLE IF NOT EXISTS lead_invoice_items (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hsn VARCHAR(50),
    quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
    unit_price NUMERIC(14, 4) NOT NULL DEFAULT 0,
    subtotal NUMERIC(14, 4) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS invoice_cgst_percent NUMERIC(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS invoice_sgst_percent NUMERIC(5, 2) DEFAULT 0;
