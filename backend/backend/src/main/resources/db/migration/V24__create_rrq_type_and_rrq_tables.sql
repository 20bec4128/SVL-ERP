create table if not exists rrq_types (
    id bigserial primary key,
    type_id varchar(64) not null unique,
    type_name varchar(160) not null unique,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create table if not exists rrq (
    id bigserial primary key,
    rrq_id varchar(64) not null unique,
    rrq_name varchar(200) not null unique,
    rrq_type_id bigint not null,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null,
    constraint fk_rrq_type foreign key (rrq_type_id) references rrq_types (id)
);

create table if not exists rrq_users (
    rrq_id_fk bigint not null,
    user_id_fk bigint not null,
    primary key (rrq_id_fk, user_id_fk),
    constraint fk_rrq_users_rrq foreign key (rrq_id_fk) references rrq (id) on delete cascade,
    constraint fk_rrq_users_user foreign key (user_id_fk) references app_users (id) on delete cascade
);

create index if not exists idx_rrq_types_deleted on rrq_types (is_deleted);
create index if not exists idx_rrq_deleted on rrq (is_deleted);
