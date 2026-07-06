-- Replace old quotations table with normalized schema
DROP TABLE IF EXISTS quotation_items;
DROP TABLE IF EXISTS quotations CASCADE;
DROP SEQUENCE IF EXISTS quotation_number_seq;

CREATE TABLE quotations (
  id                BIGSERIAL PRIMARY KEY,
  lead_id           BIGINT NOT NULL REFERENCES leads(id),
  quotation_number  VARCHAR(50) NOT NULL UNIQUE,
  client_name       VARCHAR(255),
  client_mobile     VARCHAR(50),
  client_email      VARCHAR(255),
  client_company    VARCHAR(255),
  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,
  gst_percent       NUMERIC(5,2) NOT NULL DEFAULT 18,
  grand_total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes             TEXT,
  validity_date     DATE,
  status            VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMP NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE quotation_items (
  id              BIGSERIAL PRIMARY KEY,
  quotation_id    BIGINT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  requirement_id  BIGINT REFERENCES requirements(id) ON DELETE SET NULL,
  product_name    VARCHAR(255) NOT NULL,
  specs_summary   TEXT,
  specs_json      TEXT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE SEQUENCE quotation_number_seq START 1001;
