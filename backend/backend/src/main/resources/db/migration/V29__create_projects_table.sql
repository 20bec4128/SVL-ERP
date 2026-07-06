create table if not exists projects (
    id bigserial primary key,
    project_id varchar(64) not null unique,
    project_name varchar(200) not null unique,
    project_location varchar(200) not null,
    project_type varchar(160) not null,
    project_status varchar(160) not null,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_projects_deleted on projects (is_deleted);
create index if not exists idx_projects_name on projects (project_name);
