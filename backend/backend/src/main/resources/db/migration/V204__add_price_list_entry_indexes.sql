CREATE INDEX IF NOT EXISTS idx_price_list_entry_category_id
    ON price_list_entry (category_id);

CREATE INDEX IF NOT EXISTS idx_price_list_entry_type_id
    ON price_list_entry (type_id);

CREATE INDEX IF NOT EXISTS idx_price_list_entry_subtype_id
    ON price_list_entry (subtype_id);

CREATE INDEX IF NOT EXISTS idx_price_list_entry_created_at
    ON price_list_entry (created_at DESC);
