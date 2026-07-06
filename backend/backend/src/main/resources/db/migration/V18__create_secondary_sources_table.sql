create table if not exists secondary_sources (
    id bigserial primary key,
    secondary_id varchar(64) not null unique,
    source_name varchar(160) not null unique,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_secondary_sources_deleted on secondary_sources (is_deleted);
create index if not exists idx_secondary_sources_name on secondary_sources (source_name);
