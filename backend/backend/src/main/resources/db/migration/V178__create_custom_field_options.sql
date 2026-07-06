CREATE TABLE custom_field_options (
  id          BIGSERIAL PRIMARY KEY,
  type_id     BIGINT      NOT NULL,
  subtype_id  BIGINT,
  field_key   VARCHAR(100) NOT NULL,
  value_raw   VARCHAR(500) NOT NULL,
  value_norm  VARCHAR(500) NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_custom_field_option UNIQUE (type_id, subtype_id, field_key, value_norm)
);

CREATE INDEX idx_cfo_lookup ON custom_field_options (type_id, subtype_id, field_key);
