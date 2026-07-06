create table if not exists project_statuses (
    id bigserial primary key,
    status_id varchar(64) not null unique,
    status_name varchar(160) not null unique,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_project_statuses_deleted on project_statuses (is_deleted);
create index if not exists idx_project_statuses_name on project_statuses (status_name);
