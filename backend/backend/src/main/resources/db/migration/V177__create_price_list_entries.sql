CREATE TABLE price_list_entry (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT,
  type_id BIGINT NOT NULL,
  subtype_id BIGINT,
  type_name VARCHAR(255),
  subtype_name VARCHAR(255),
  variant_fields TEXT,
  quantity_slabs TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);
