-- Store vendor-eligible service categories/types (including sub-types) as JSON text arrays

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS service_category_ids TEXT;

ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS service_type_ids TEXT;

