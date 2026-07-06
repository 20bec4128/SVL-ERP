ALTER TABLE user_groups
    ALTER COLUMN page_keys_csv TYPE TEXT;

ALTER TABLE user_group_members
    ALTER COLUMN page_keys_csv TYPE TEXT;
