create table if not exists performance_indicators (
    id bigserial primary key,
    designation_id bigint references designations(id),
    department_id bigint references department_master(id),
    approved_by varchar(160),
    customer_experience varchar(40),
    marketing varchar(40),
    management varchar(40),
    administration varchar(40),
    presentation_skills varchar(40),
    quality_of_work varchar(40),
    efficiency varchar(40),
    integrity varchar(40),
    professionalism varchar(40),
    team_work varchar(40),
    critical_thinking varchar(40),
    conflict_management varchar(40),
    attendance varchar(40),
    ability_to_meet_deadline varchar(40),
    status varchar(20),
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_performance_indicators_deleted on performance_indicators (deleted);
