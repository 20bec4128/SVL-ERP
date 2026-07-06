create table if not exists terminations (
    id bigserial primary key,
    employee_id bigint,
    employee_name varchar(160) not null,
    department varchar(160) not null,
    termination_type varchar(120) not null,
    notice_date date not null,
    reason varchar(500) not null,
    termination_date date not null,
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_terminations_deleted on terminations (deleted);
