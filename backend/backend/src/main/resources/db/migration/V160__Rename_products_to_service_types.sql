-- Rename table
ALTER TABLE products RENAME TO service_types;

-- Rename indexes
ALTER INDEX idx_products_category_id RENAME TO idx_service_types_category_id;
ALTER INDEX idx_products_deleted RENAME TO idx_service_types_deleted;
