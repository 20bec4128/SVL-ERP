ALTER TABLE user_groups
    ADD COLUMN IF NOT EXISTS institution_name VARCHAR(160),
    ADD COLUMN IF NOT EXISTS institution_category VARCHAR(160),
    ADD COLUMN IF NOT EXISTS institution_type VARCHAR(160),
    ADD COLUMN IF NOT EXISTS department_name VARCHAR(160),
    ADD COLUMN IF NOT EXISTS team_names_csv VARCHAR(2000);
