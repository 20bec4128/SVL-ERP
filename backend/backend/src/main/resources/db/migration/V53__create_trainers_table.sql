create table if not exists trainers (
    id bigserial primary key,
    first_name varchar(120) not null,
    last_name varchar(120) not null,
    role varchar(160),
    phone varchar(40),
    email varchar(160),
    description varchar(500),
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_trainers_deleted on trainers (is_deleted);
create index if not exists idx_trainers_name on trainers (first_name, last_name);
