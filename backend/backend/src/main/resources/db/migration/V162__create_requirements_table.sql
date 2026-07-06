CREATE TABLE requirements (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    category_id BIGINT,
    type_id BIGINT,
    subtype_id BIGINT,
    quantity INT,
    specs TEXT,
    design_status VARCHAR(50),
    design_notes TEXT,
    file_format VARCHAR(50),
    colour_mode VARCHAR(50),
    style_preference VARCHAR(100),
    colour_preference VARCHAR(255),
    reference_notes TEXT,
    brand_colours VARCHAR(255),
    delivery_date DATE,
    special_instructions TEXT,
    employee_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_requirements_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    CONSTRAINT fk_requirements_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_requirements_type FOREIGN KEY (type_id) REFERENCES service_types(id) ON DELETE SET NULL,
    CONSTRAINT fk_requirements_subtype FOREIGN KEY (subtype_id) REFERENCES service_types(id) ON DELETE SET NULL,
    CONSTRAINT fk_requirements_employee FOREIGN KEY (employee_id) REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_requirements_lead_id ON requirements(lead_id);
CREATE INDEX idx_requirements_category_id ON requirements(category_id);
CREATE INDEX idx_requirements_employee_id ON requirements(employee_id);
