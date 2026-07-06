ALTER TABLE designations
    ADD COLUMN department_master_id BIGINT NULL;

CREATE INDEX ix_designations_department_master_id
    ON designations(department_master_id);

