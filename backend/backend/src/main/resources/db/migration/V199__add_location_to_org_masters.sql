ALTER TABLE head_office_master
    ADD COLUMN IF NOT EXISTS location VARCHAR(150);

UPDATE head_office_master
SET location = ''
WHERE location IS NULL;

ALTER TABLE head_office_master
    ALTER COLUMN location SET DEFAULT '',
    ALTER COLUMN location SET NOT NULL;

ALTER TABLE branch_master
    ADD COLUMN IF NOT EXISTS location VARCHAR(150);

UPDATE branch_master
SET location = ''
WHERE location IS NULL;

ALTER TABLE branch_master
    ALTER COLUMN location SET DEFAULT '',
    ALTER COLUMN location SET NOT NULL;

