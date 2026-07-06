alter table app_users
    add column if not exists institution_name varchar(160),
    add column if not exists institution_category varchar(160),
    add column if not exists institution_type varchar(160),
    add column if not exists department_name varchar(160),
    add column if not exists team_name varchar(160);

create index if not exists idx_app_users_org_scope
    on app_users (institution_name, institution_category, institution_type, department_name, team_name);
