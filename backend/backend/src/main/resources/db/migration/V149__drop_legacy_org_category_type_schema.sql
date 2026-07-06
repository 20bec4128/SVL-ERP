ALTER TABLE teams
    DROP CONSTRAINT IF EXISTS teams_category_id_fkey,
    DROP CONSTRAINT IF EXISTS teams_type_id_fkey;

ALTER TABLE departments
    DROP CONSTRAINT IF EXISTS departments_category_id_fkey,
    DROP CONSTRAINT IF EXISTS departments_type_id_fkey;

DROP INDEX IF EXISTS idx_team_scope;
DROP INDEX IF EXISTS idx_dept_scope;
DROP INDEX IF EXISTS idx_inst_type_scope;
DROP INDEX IF EXISTS idx_inst_cat_inst;

ALTER TABLE teams
    DROP COLUMN IF EXISTS category_id,
    DROP COLUMN IF EXISTS type_id;

ALTER TABLE departments
    DROP COLUMN IF EXISTS category_id,
    DROP COLUMN IF EXISTS type_id;

ALTER TABLE app_users
    DROP COLUMN IF EXISTS institution_category,
    DROP COLUMN IF EXISTS institution_type;

ALTER TABLE user_groups
    DROP COLUMN IF EXISTS institution_category,
    DROP COLUMN IF EXISTS institution_type;

ALTER TABLE employees
    DROP COLUMN IF EXISTS institution_category,
    DROP COLUMN IF EXISTS institution_type;

DROP TABLE IF EXISTS institution_types;
DROP TABLE IF EXISTS institution_categories;

CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_branch_name_active
    ON departments (institution_id, name, is_deleted);

CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_branch_department_name_active
    ON teams (institution_id, department_id, name, is_deleted);

CREATE INDEX IF NOT EXISTS idx_departments_institution
    ON departments (institution_id);

CREATE INDEX IF NOT EXISTS idx_teams_institution_department
    ON teams (institution_id, department_id);
