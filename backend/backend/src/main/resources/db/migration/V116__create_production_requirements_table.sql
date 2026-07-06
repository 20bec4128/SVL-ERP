-- Create production_requirements table for storing production/printing specifications
CREATE TABLE IF NOT EXISTS production_requirements (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL UNIQUE,
    requirement_type VARCHAR(100), -- "Production" or "Design + Production"
    requirement_notes TEXT,
    requirement_file_name VARCHAR(255),
    requirement_file_path VARCHAR(500),
    
    -- Product Details
    product_type VARCHAR(160),
    custom_product_type VARCHAR(255),
    quantity INT,
    num_pages INT,
    
    -- Size Details
    paper_size VARCHAR(100),
    custom_size_width DOUBLE PRECISION,
    custom_size_height DOUBLE PRECISION,
    custom_size_unit VARCHAR(20),
    
    -- Paper Specifications
    paper_type VARCHAR(100),
    paper_gsm VARCHAR(100),
    
    -- Printing Specifications
    color_type VARCHAR(100),
    print_sides VARCHAR(100),
    printing_method VARCHAR(100),
    
    -- Finishing Options
    finishing_options TEXT, -- JSON array
    folding_type VARCHAR(100),
    
    -- Client Artwork Upload
    artwork_file_name VARCHAR(255),
    artwork_file_path VARCHAR(500),
    additional_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    
    CONSTRAINT fk_production_req_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_production_req_lead_id ON production_requirements(lead_id);
CREATE INDEX IF NOT EXISTS idx_production_req_created_at ON production_requirements(created_at);
CREATE INDEX IF NOT EXISTS idx_production_req_updated_at ON production_requirements(updated_at);
