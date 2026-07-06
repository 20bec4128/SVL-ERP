create table if not exists trainings (
    id bigserial primary key,
    training_type_id bigint references training_types(id),
    trainer_id bigint references trainers(id),
    cost numeric(12,2),
    start_date date,
    end_date date,
    description varchar(500),
    status varchar(32),
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create table if not exists training_employees (
    id bigserial primary key,
    training_id bigint not null references trainings(id) on delete cascade,
    employee_id bigint not null,
    unique(training_id, employee_id)
);

create index if not exists idx_trainings_deleted on trainings (deleted);
