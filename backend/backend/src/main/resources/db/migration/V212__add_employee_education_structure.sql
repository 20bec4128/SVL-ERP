ALTER TABLE employees
    ADD COLUMN education_qualification VARCHAR(30) NULL;

ALTER TABLE employees
    ADD COLUMN education_course_name VARCHAR(150) NULL;

ALTER TABLE employees
    ADD COLUMN education_certificate_number VARCHAR(80) NULL;

ALTER TABLE employees
    ADD COLUMN education_roll_number VARCHAR(80) NULL;

ALTER TABLE employees
    ADD COLUMN education_mark VARCHAR(40) NULL;

ALTER TABLE employees
    ADD COLUMN education_max_mark VARCHAR(40) NULL;

ALTER TABLE employees
    ADD COLUMN education_mark_percentage VARCHAR(20) NULL;

ALTER TABLE employees
    ADD COLUMN education_from_year VARCHAR(10) NULL;

ALTER TABLE employees
    ADD COLUMN education_to_year VARCHAR(10) NULL;
