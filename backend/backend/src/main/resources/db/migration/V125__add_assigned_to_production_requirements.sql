ALTER TABLE production_requirements
    ADD COLUMN IF NOT EXISTS assigned_to BIGINT;

CREATE INDEX IF NOT EXISTS idx_production_requirements_assigned_to ON production_requirements(assigned_to);
