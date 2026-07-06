ALTER TABLE user_group_members
    ADD COLUMN IF NOT EXISTS page_keys_csv VARCHAR(2000);
