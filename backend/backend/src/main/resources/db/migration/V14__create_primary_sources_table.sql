create table if not exists primary_sources (
    id bigserial primary key,
    primary_id varchar(64) not null unique,
    source_name varchar(160) not null unique,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_primary_sources_deleted on primary_sources (is_deleted);
create index if not exists idx_primary_sources_name on primary_sources (source_name);