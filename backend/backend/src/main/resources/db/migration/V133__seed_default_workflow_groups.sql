-- Seed the core workflow groups required by the current CRM/operations setup.
-- This is safe for existing systems because each insert is guarded by NOT EXISTS.

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Administrators', 1, TRUE, 'ADMINS', ''
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Administrators')
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Managers', 2, TRUE, 'MANAGERS', ''
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Managers')
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Presales', 3, FALSE, 'NONE', 'leads,rejected-leads,lead-source,contacts,companies,pipeline,analytics,activity,quotation'
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Presales')
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Sales', 4, FALSE, 'NONE', 'deals,quotation,contacts,companies,invoices,sales'
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Sales')
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Budget', 5, FALSE, 'NONE', 'budget-verifications,accounts'
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Budget')
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Accounts', 6, FALSE, 'NONE', 'accounts,payment-verifications,invoices,accounting,sales'
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Accounts')
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Design', 7, FALSE, 'NONE', 'design,deals'
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Design')
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Production', 8, FALSE, 'NONE', 'production,deals,stocks,accounts'
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Production')
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope, page_keys_csv)
SELECT 'Stock', 9, FALSE, 'NONE', 'stocks,accounts'
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups WHERE LOWER(name) = LOWER('Stock')
);
