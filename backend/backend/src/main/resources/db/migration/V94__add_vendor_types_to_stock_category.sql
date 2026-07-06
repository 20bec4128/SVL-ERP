-- add allowed vendor types to stock_category
ALTER TABLE stock_category
    ADD COLUMN allowed_vendor_type_ids TEXT;  -- store JSON array of ids
