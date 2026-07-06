ALTER TABLE service_types
ADD COLUMN parent_id BIGINT;

ALTER TABLE service_types
ADD CONSTRAINT fk_service_types_parent
FOREIGN KEY (parent_id) REFERENCES service_types(id);

CREATE INDEX idx_service_types_parent_id ON service_types(parent_id);
