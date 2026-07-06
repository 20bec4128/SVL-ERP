create table if not exists leads (
    id bigserial primary key,
    name varchar(200) not null,
    email varchar(190),
    email_normalized varchar(190),
    mobile varchar(40) not null,
    mobile_normalized varchar(40) not null,
    primary_source varchar(160) not null,
    secondary_source varchar(160),
    tertiary_source varchar(160),
    project_name varchar(200),
    status varchar(100) not null default 'New Lead',
    sv_status varchar(100),
    owner varchar(120) not null,
    is_deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp null
);

create index if not exists idx_leads_deleted on leads (is_deleted);
create index if not exists idx_leads_project_mobile on leads (project_name, mobile_normalized);
create index if not exists idx_leads_project_email on leads (project_name, email_normalized);
create index if not exists idx_leads_created_at on leads (created_at desc);
