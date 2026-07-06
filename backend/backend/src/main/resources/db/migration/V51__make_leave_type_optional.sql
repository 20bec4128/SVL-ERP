ALTER TABLE leave_policies
    DROP CONSTRAINT IF EXISTS leave_policies_leave_type_id_fkey;

ALTER TABLE leave_policies
    ALTER COLUMN leave_type_id DROP NOT NULL;

ALTER TABLE leave_policies
    ADD CONSTRAINT leave_policies_leave_type_id_fkey
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE SET NULL;
