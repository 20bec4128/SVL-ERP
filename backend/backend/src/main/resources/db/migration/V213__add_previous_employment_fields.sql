ALTER TABLE employees
    ADD COLUMN previous_employment_joining_date DATE NULL,
    ADD COLUMN previous_employment_relieving_date DATE NULL,
    ADD COLUMN previous_employment_salary_at_joining VARCHAR(40) NULL,
    ADD COLUMN previous_employment_salary_at_relieving VARCHAR(40) NULL,
    ADD COLUMN previous_employment_relieved_with_notice_period VARCHAR(20) NULL,
    ADD COLUMN previous_employment_absconded VARCHAR(20) NULL,
    ADD COLUMN previous_employment_designation_at_joining VARCHAR(150) NULL,
    ADD COLUMN previous_employment_designation_at_relieving VARCHAR(150) NULL,
    ADD COLUMN previous_employment_manager_name VARCHAR(150) NULL,
    ADD COLUMN previous_employment_manager_mobile_number VARCHAR(30) NULL,
    ADD COLUMN previous_employment_company_address TEXT NULL;
