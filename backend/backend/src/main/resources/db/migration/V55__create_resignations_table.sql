create table if not exists resignations (
    id bigserial primary key,
    employee_id bigint,
    employee_name varchar(160) not null,
    department varchar(160) not null,
    reason varchar(500) not null,
    notice_date date not null,
    resignation_date date not null,
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_resignations_deleted on resignations (deleted);
