create table if not exists institutions (
    id bigserial primary key,
    name varchar(160) not null unique,
    email varchar(160),
    phone varchar(60),
    address varchar(500),
    status varchar(20) not null default 'ACTIVE',
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp
);

create table if not exists institution_categories (
    id bigserial primary key,
    institution_id bigint not null references institutions(id),
    name varchar(160) not null,
    status varchar(20) not null default 'ACTIVE',
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp,
    unique (institution_id, name, is_deleted)
);

create table if not exists institution_types (
    id bigserial primary key,
    institution_id bigint not null references institutions(id),
    category_id bigint not null references institution_categories(id),
    name varchar(160) not null,
    status varchar(20) not null default 'ACTIVE',
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp,
    unique (institution_id, category_id, name, is_deleted)
);

create table if not exists departments (
    id bigserial primary key,
    institution_id bigint not null references institutions(id),
    category_id bigint not null references institution_categories(id),
    type_id bigint not null references institution_types(id),
    name varchar(160) not null,
    status varchar(20) not null default 'ACTIVE',
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp,
    unique (institution_id, category_id, type_id, name, is_deleted)
);

create table if not exists teams (
    id bigserial primary key,
    institution_id bigint not null references institutions(id),
    category_id bigint not null references institution_categories(id),
    type_id bigint not null references institution_types(id),
    department_id bigint not null references departments(id),
    name varchar(160) not null,
    status varchar(20) not null default 'ACTIVE',
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp,
    unique (institution_id, category_id, type_id, department_id, name, is_deleted)
);

create index if not exists idx_inst_cat_inst on institution_categories(institution_id);
create index if not exists idx_inst_type_scope on institution_types(institution_id, category_id);
create index if not exists idx_dept_scope on departments(institution_id, category_id, type_id);
create index if not exists idx_team_scope on teams(institution_id, category_id, type_id, department_id);
