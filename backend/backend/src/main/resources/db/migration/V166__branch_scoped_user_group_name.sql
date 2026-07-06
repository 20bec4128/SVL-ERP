-- Drop the old global unique constraint on name
ALTER TABLE user_groups DROP CONSTRAINT IF EXISTS user_groups_name_key;

-- Unique name per branch (institution_name is set)
CREATE UNIQUE INDEX uq_user_groups_name_per_branch
    ON user_groups (lower(name), lower(institution_name))
    WHERE institution_name IS NOT NULL;

-- Unique name globally for rows without a branch (safety for legacy / system groups)
CREATE UNIQUE INDEX uq_user_groups_name_global
    ON user_groups (lower(name))
    WHERE institution_name IS NULL;
