-- 1. Create department_branches join table
CREATE TABLE IF NOT EXISTS department_branches (
    department_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    PRIMARY KEY (department_id, branch_id),
    CONSTRAINT fk_department_branches_dept FOREIGN KEY (department_id) REFERENCES department_master (id) ON DELETE CASCADE,
    CONSTRAINT fk_department_branches_branch FOREIGN KEY (branch_id) REFERENCES branch_master (id) ON DELETE CASCADE
);

-- 2. Populate department_branches from existing branch_id in department_master
INSERT INTO department_branches (department_id, branch_id)
SELECT id, branch_id 
FROM department_master 
WHERE branch_id IS NOT NULL;

-- 3. Group and merge duplicate departments by name (case-insensitive)
DO $$
DECLARE
    dept_rec RECORD;
    main_dept_id BIGINT;
    dup_dept_id BIGINT;
BEGIN
    FOR dept_rec IN 
        SELECT LOWER(TRIM(name)) as clean_name, MIN(id) as main_id
        FROM department_master
        WHERE deleted = false
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        main_dept_id := dept_rec.main_id;
        
        FOR dup_dept_id IN 
            SELECT id 
            FROM department_master
            WHERE LOWER(TRIM(name)) = dept_rec.clean_name AND id <> main_dept_id AND deleted = false
        LOOP
            -- Copy branch associations of duplicate to main
            INSERT INTO department_branches (department_id, branch_id)
            SELECT main_dept_id, branch_id 
            FROM department_branches 
            WHERE department_id = dup_dept_id
            ON CONFLICT DO NOTHING;

            -- Update employee references
            UPDATE employees SET department_master_id = main_dept_id WHERE department_master_id = dup_dept_id;

            -- Update designations references
            UPDATE designations SET department_master_id = main_dept_id WHERE department_master_id = dup_dept_id;

            -- Update performance indicators
            UPDATE performance_indicators SET department_id = main_dept_id WHERE department_id = dup_dept_id;

            -- Update policies
            UPDATE policies SET department_id = main_dept_id WHERE department_id = dup_dept_id;

            -- Delete duplicate
            DELETE FROM department_branches WHERE department_id = dup_dept_id;
            DELETE FROM department_master WHERE id = dup_dept_id;
        END LOOP;
    END LOOP;
END $$;

-- 4. Create designation_departments join table
CREATE TABLE IF NOT EXISTS designation_departments (
    designation_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    PRIMARY KEY (designation_id, department_id),
    CONSTRAINT fk_designation_depts_desig FOREIGN KEY (designation_id) REFERENCES designations (id) ON DELETE CASCADE,
    CONSTRAINT fk_designation_depts_dept FOREIGN KEY (department_id) REFERENCES department_master (id) ON DELETE CASCADE
);

-- 5. Populate designation_departments from existing department_master_id in designations
INSERT INTO designation_departments (designation_id, department_id)
SELECT id, department_master_id 
FROM designations 
WHERE department_master_id IS NOT NULL;

-- 6. Group and merge duplicate designations by name (case-insensitive)
DO $$
DECLARE
    desig_rec RECORD;
    main_desig_id BIGINT;
    dup_desig_id BIGINT;
BEGIN
    FOR desig_rec IN 
        SELECT LOWER(TRIM(name)) as clean_name, MIN(id) as main_id
        FROM designations
        WHERE deleted = false
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        main_desig_id := desig_rec.main_id;
        
        FOR dup_desig_id IN 
            SELECT id 
            FROM designations
            WHERE LOWER(TRIM(name)) = desig_rec.clean_name AND id <> main_desig_id AND deleted = false
        LOOP
            -- Copy department associations of duplicate to main
            INSERT INTO designation_departments (designation_id, department_id)
            SELECT main_desig_id, department_id 
            FROM designation_departments 
            WHERE designation_id = dup_desig_id
            ON CONFLICT DO NOTHING;

            -- Update employee references
            UPDATE employees SET designation_master_id = main_desig_id WHERE designation_master_id = dup_desig_id;

            -- Update performance indicators
            UPDATE performance_indicators SET designation_id = main_desig_id WHERE designation_id = dup_desig_id;

            -- Delete duplicate
            DELETE FROM designation_departments WHERE designation_id = dup_desig_id;
            DELETE FROM designations WHERE id = dup_desig_id;
        END LOOP;
    END LOOP;
END $$;
