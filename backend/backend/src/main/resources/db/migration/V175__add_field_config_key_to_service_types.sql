ALTER TABLE service_types
ADD COLUMN IF NOT EXISTS field_config_key VARCHAR(120);

UPDATE service_types
SET field_config_key = trim(BOTH '_' FROM regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '_', 'g'))
WHERE field_config_key IS NULL
  AND coalesce(name, '') <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_types_field_config_key_active
ON service_types (lower(field_config_key))
WHERE deleted = false AND field_config_key IS NOT NULL;
