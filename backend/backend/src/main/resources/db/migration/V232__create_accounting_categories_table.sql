create table if not exists accounting_categories (
    id bigserial primary key,
    name varchar(120) not null,
    sub_name varchar(160) not null,
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index if not exists idx_accounting_categories_deleted on accounting_categories (deleted);

create unique index if not exists uq_accounting_categories_name_sub_name_active
    on accounting_categories (lower(name), lower(sub_name))
    where deleted = false;
