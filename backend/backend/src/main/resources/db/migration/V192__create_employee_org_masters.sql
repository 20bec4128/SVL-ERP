CREATE TABLE head_office_master (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_head_office_master_name_active
    ON head_office_master (LOWER(name))
    WHERE deleted = FALSE;

CREATE TABLE branch_master (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_branch_master_head_office
        FOREIGN KEY (head_office_id) REFERENCES head_office_master(id)
);

CREATE UNIQUE INDEX ux_branch_master_head_office_name_active
    ON branch_master (head_office_id, LOWER(name))
    WHERE deleted = FALSE;

ALTER TABLE department_master
    ADD COLUMN branch_id BIGINT NULL;

ALTER TABLE department_master
    ADD CONSTRAINT fk_department_master_branch
        FOREIGN KEY (branch_id) REFERENCES branch_master(id);

