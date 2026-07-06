-- Remove legacy seeded user-group data so environments can manage groups manually.
-- We keep old Flyway files intact and clean up the data with a forward-only migration.

UPDATE lead_flow_config
SET default_group_id = NULL
WHERE default_group_id IN (
    SELECT id
    FROM user_groups
    WHERE lower(name) IN (
        'administrators',
        'managers',
        'presales',
        'sales',
        'budget',
        'accounts',
        'design',
        'production',
        'stock'
    )
);

DELETE FROM user_groups
WHERE lower(name) IN (
    'administrators',
    'managers',
    'presales',
    'sales',
    'budget',
    'accounts',
    'design',
    'production',
    'stock'
);
