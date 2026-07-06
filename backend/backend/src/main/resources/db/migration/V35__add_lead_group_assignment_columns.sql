ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS assigned_group_id BIGINT,
    ADD COLUMN IF NOT EXISTS allocator_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS owner_user_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_group_id ON leads(assigned_group_id);
CREATE INDEX IF NOT EXISTS idx_leads_allocator_user_id ON leads(allocator_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_user_id ON leads(owner_user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_leads_assigned_group'
    ) THEN
        ALTER TABLE leads
            ADD CONSTRAINT fk_leads_assigned_group
                FOREIGN KEY (assigned_group_id)
                    REFERENCES user_groups(id)
                    ON DELETE SET NULL;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_leads_allocator_user'
    ) THEN
        ALTER TABLE leads
            ADD CONSTRAINT fk_leads_allocator_user
                FOREIGN KEY (allocator_user_id)
                    REFERENCES app_users(id)
                    ON DELETE SET NULL;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_leads_owner_user'
    ) THEN
        ALTER TABLE leads
            ADD CONSTRAINT fk_leads_owner_user
                FOREIGN KEY (owner_user_id)
                    REFERENCES app_users(id)
                    ON DELETE SET NULL;
    END IF;
END
$$;
