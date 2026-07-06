ALTER TABLE quotation_items
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(6,2) NOT NULL DEFAULT 0;

UPDATE quotation_items
SET discount_percent = COALESCE(discount_percent, 0),
    gst_percent = COALESCE(gst_percent, 0);
