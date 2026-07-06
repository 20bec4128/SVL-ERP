-- Rename table
ALTER TABLE product_categories RENAME TO service_categories;

-- Rename indexes
ALTER INDEX idx_product_categories_deleted RENAME TO idx_service_categories_deleted;
