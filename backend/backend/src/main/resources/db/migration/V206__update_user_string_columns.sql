ALTER TABLE app_users
    ALTER COLUMN institution_name TYPE VARCHAR(255) USING institution_name::VARCHAR(255),
    ALTER COLUMN department_name TYPE VARCHAR(255) USING department_name::VARCHAR(255),
    ALTER COLUMN team_name TYPE VARCHAR(255) USING team_name::VARCHAR(255);
