DELETE FROM user_groups
WHERE lower(name) IN ('administrators', 'managers', 'sales', 'presales');
