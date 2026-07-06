-- add a column to remember the production owner for leads
ALTER TABLE leads
    ADD COLUMN production_owner_id bigint;
