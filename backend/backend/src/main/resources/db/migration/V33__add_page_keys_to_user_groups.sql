ALTER TABLE user_groups
    ADD COLUMN IF NOT EXISTS page_keys_csv VARCHAR(2000);
