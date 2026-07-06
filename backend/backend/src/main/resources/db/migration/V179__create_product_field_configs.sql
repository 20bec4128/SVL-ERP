CREATE TABLE product_field_configs (
    id BIGSERIAL PRIMARY KEY,
    service_type_id BIGINT NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
    field_key VARCHAR(120) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    options JSONB,
    is_required BOOLEAN DEFAULT false,
    placeholder VARCHAR(255),
    allow_custom BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    has_unit BOOLEAN DEFAULT false,
    unit_options JSONB,
    default_unit VARCHAR(50),
    enable_3rd_dimension BOOLEAN DEFAULT false,
    third_dimension_label VARCHAR(120),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pfc_service_type_id ON product_field_configs(service_type_id);
CREATE INDEX idx_pfc_active ON product_field_configs(service_type_id, is_active);
