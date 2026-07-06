CREATE TABLE IF NOT EXISTS gst_masters (
  id          BIGSERIAL PRIMARY KEY,
  tax_name    VARCHAR(100) NOT NULL,
  tax_percent NUMERIC(6,2) NOT NULL,
  tax_type    VARCHAR(50),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gst_masters_active_percent
  ON gst_masters(is_active, tax_percent);

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS cgst_percent NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_percent NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_percent NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_rows_json TEXT;

INSERT INTO gst_masters (tax_name, tax_percent, tax_type, is_active)
SELECT 'GST 0%', 0, 'GST', TRUE
WHERE NOT EXISTS (SELECT 1 FROM gst_masters WHERE tax_percent = 0 AND is_active = TRUE);

INSERT INTO gst_masters (tax_name, tax_percent, tax_type, is_active)
SELECT 'GST 5%', 5, 'GST', TRUE
WHERE NOT EXISTS (SELECT 1 FROM gst_masters WHERE tax_percent = 5 AND is_active = TRUE);

INSERT INTO gst_masters (tax_name, tax_percent, tax_type, is_active)
SELECT 'GST 12%', 12, 'GST', TRUE
WHERE NOT EXISTS (SELECT 1 FROM gst_masters WHERE tax_percent = 12 AND is_active = TRUE);

INSERT INTO gst_masters (tax_name, tax_percent, tax_type, is_active)
SELECT 'GST 18%', 18, 'GST', TRUE
WHERE NOT EXISTS (SELECT 1 FROM gst_masters WHERE tax_percent = 18 AND is_active = TRUE);

INSERT INTO gst_masters (tax_name, tax_percent, tax_type, is_active)
SELECT 'GST 28%', 28, 'GST', TRUE
WHERE NOT EXISTS (SELECT 1 FROM gst_masters WHERE tax_percent = 28 AND is_active = TRUE);
