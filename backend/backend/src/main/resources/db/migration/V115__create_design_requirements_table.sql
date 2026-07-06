-- Create design_requirements table for storing design brief details
CREATE TABLE IF NOT EXISTS design_requirements (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL UNIQUE,
    requirement_type VARCHAR(100) NOT NULL, -- Design, Production, Design + Production
    requirement_notes TEXT,
    requirement_file_name VARCHAR(255),
    requirement_file_path VARCHAR(500),
    
    -- Design Product Details
    design_product_type VARCHAR(160),
    design_custom_product_type VARCHAR(255),
    design_size VARCHAR(100),
    design_custom_size VARCHAR(255),
    design_orientation VARCHAR(50),
    design_num_pages INT,
    
    -- Design Brief
    design_description TEXT,
    design_purpose VARCHAR(160),
    design_custom_purpose VARCHAR(255),
    design_target_audience TEXT,
    design_style_pref TEXT, -- JSON array: [Modern, Minimal, Corporate, Creative]
    
    -- Brand Details
    design_brand_colors TEXT,
    design_fonts TEXT,
    design_brand_guidelines_file_name VARCHAR(255),
    design_brand_guidelines_file_path VARCHAR(500),
    
    -- Content from Client
    design_logo_file_name VARCHAR(255),
    design_logo_file_path VARCHAR(500),
    design_images_file_name VARCHAR(255),
    design_images_file_path VARCHAR(500),
    design_text_content TEXT,
    design_website VARCHAR(500),
    design_phone VARCHAR(40),
    design_phone_country_code VARCHAR(20),
    design_address VARCHAR(500),
    design_social_media TEXT,
    design_qr_code VARCHAR(500),
    
    -- Reference Designs
    design_reference_images_file_name VARCHAR(255),
    design_reference_images_file_path VARCHAR(500),
    design_reference_links TEXT,
    design_previous_designs_file_name VARCHAR(255),
    design_previous_designs_file_path VARCHAR(500),
    
    -- Deadline & Priority
    design_deadline TIMESTAMP,
    design_priority VARCHAR(160),
    design_custom_priority VARCHAR(255),
    
    -- Special Instructions
    design_additional_notes TEXT,
    design_restrictions TEXT,
    design_color_prefs TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    
    CONSTRAINT fk_design_req_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_design_req_lead_id ON design_requirements(lead_id);
CREATE INDEX IF NOT EXISTS idx_design_req_created_at ON design_requirements(created_at);
CREATE INDEX IF NOT EXISTS idx_design_req_updated_at ON design_requirements(updated_at);
