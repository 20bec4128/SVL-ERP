CREATE TABLE IF NOT EXISTS user_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    group_level INTEGER NOT NULL,
    is_system_group BOOLEAN NOT NULL DEFAULT FALSE,
    member_scope VARCHAR(20) NOT NULL DEFAULT 'NONE'
);

INSERT INTO user_groups (name, group_level, is_system_group, member_scope)
SELECT 'Administrators', 1, TRUE, 'ADMINS'
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE lower(name) = lower('Administrators'));

INSERT INTO user_groups (name, group_level, is_system_group, member_scope)
SELECT 'Managers', 2, TRUE, 'MANAGERS'
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE lower(name) = lower('Managers'));

INSERT INTO user_groups (name, group_level, is_system_group, member_scope)
SELECT 'Sales', 3, FALSE, 'NONE'
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE lower(name) = lower('Sales'));

INSERT INTO user_groups (name, group_level, is_system_group, member_scope)
SELECT 'presales', 4, FALSE, 'NONE'
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE lower(name) = lower('presales'));
