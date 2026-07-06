-- add a column to remember the design owner for leads
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS design_owner_id bigint;

-- optional index to speed up lookups when restoring payment owner for a lead
CREATE INDEX IF NOT EXISTS idx_leads_design_owner_id ON leads(design_owner_id);
