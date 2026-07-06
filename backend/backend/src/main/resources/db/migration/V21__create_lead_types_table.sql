create table if not exists lead_types (
    id bigserial primary key,
    type_id varchar(64) not null unique,
    type_name varchar(160) not null unique,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_lead_types_deleted on lead_types (is_deleted);
create index if not exists idx_lead_types_name on lead_types (type_name);
