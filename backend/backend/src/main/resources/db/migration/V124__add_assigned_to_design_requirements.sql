ALTER TABLE design_requirements
    ADD COLUMN IF NOT EXISTS assigned_to BIGINT;

CREATE INDEX IF NOT EXISTS idx_design_requirements_assigned_to ON design_requirements(assigned_to);
