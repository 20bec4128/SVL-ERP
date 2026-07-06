ALTER TABLE product_field_configs
    ADD COLUMN IF NOT EXISTS depends_on       VARCHAR(120),
    ADD COLUMN IF NOT EXISTS depends_on_value VARCHAR(255);
