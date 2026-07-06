ALTER TABLE product_field_configs
    ADD COLUMN IF NOT EXISTS custom_dimensions     jsonb,
    ADD COLUMN IF NOT EXISTS custom_dimension_unit VARCHAR(20),
    ADD COLUMN IF NOT EXISTS custom_size_mode      VARCHAR(20);
