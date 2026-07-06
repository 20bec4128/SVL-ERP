create table if not exists training_types (
    id bigserial primary key,
    type_id varchar(64) not null unique,
    type_name varchar(160) not null unique,
    description varchar(500),
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_training_types_deleted on training_types (is_deleted);
create index if not exists idx_training_types_name on training_types (type_name);
