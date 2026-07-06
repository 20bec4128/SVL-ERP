ALTER TABLE quotation_items
  ADD COLUMN IF NOT EXISTS gst_master_id BIGINT REFERENCES gst_masters(id);
