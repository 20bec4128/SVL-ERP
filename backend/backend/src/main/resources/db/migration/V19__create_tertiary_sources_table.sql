create table if not exists tertiary_sources (
    id bigserial primary key,
    tertiary_id varchar(64) not null unique,
    source_name varchar(160) not null unique,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_tertiary_sources_deleted on tertiary_sources (is_deleted);
create index if not exists idx_tertiary_sources_name on tertiary_sources (source_name);
