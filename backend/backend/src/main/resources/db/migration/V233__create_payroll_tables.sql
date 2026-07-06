create table if not exists payroll_additions (
    id bigserial primary key,
    name varchar(120) not null,
    category varchar(50) not null, -- MONTHLY/ADDITIONAL
    unit_calculation boolean not null default false,
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);
create index if not exists idx_payroll_additions_deleted on payroll_additions (deleted);

create table if not exists payroll_overtimes (
    id bigserial primary key,
    name varchar(120) not null,
    rate_type varchar(50) not null, -- HOURLY/DAILY
    rate decimal(15, 2) not null default 0.00,
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);
create index if not exists idx_payroll_overtimes_deleted on payroll_overtimes (deleted);

create table if not exists payroll_deductions (
    id bigserial primary key,
    name varchar(120) not null,
    unit_calculation boolean not null default false,
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);
create index if not exists idx_payroll_deductions_deleted on payroll_deductions (deleted);

create table if not exists employee_salaries (
    id bigserial primary key,
    employee_id bigint not null references employees(id) on delete cascade,
    net_salary decimal(15, 2) not null default 0.00,
    basic decimal(15, 2) not null default 0.00,
    da decimal(15, 2) not null default 0.00,
    hra decimal(15, 2) not null default 0.00,
    conveyance decimal(15, 2) not null default 0.00,
    tds decimal(15, 2) not null default 0.00,
    esi decimal(15, 2) not null default 0.00,
    pf decimal(15, 2) not null default 0.00,
    leave_deduction decimal(15, 2) not null default 0.00,
    status varchar(50) not null default 'Active',
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);
create index if not exists idx_employee_salaries_deleted on employee_salaries (deleted);
create index if not exists idx_employee_salaries_employee_id on employee_salaries (employee_id);

create table if not exists payslips (
    id bigserial primary key,
    employee_salary_id bigint references employee_salaries(id) on delete set null,
    employee_id bigint not null references employees(id) on delete cascade,
    month varchar(50) not null, -- e.g. "January 2026"
    net_salary decimal(15, 2) not null default 0.00,
    basic decimal(15, 2) not null default 0.00,
    da decimal(15, 2) not null default 0.00,
    hra decimal(15, 2) not null default 0.00,
    conveyance decimal(15, 2) not null default 0.00,
    tds decimal(15, 2) not null default 0.00,
    esi decimal(15, 2) not null default 0.00,
    pf decimal(15, 2) not null default 0.00,
    leave_deduction decimal(15, 2) not null default 0.00,
    generated_at timestamp not null default now(),
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);
create index if not exists idx_payslips_deleted on payslips (deleted);
create index if not exists idx_payslips_employee_id on payslips (employee_id);

create table if not exists provident_funds (
    id bigserial primary key,
    employee_id bigint not null references employees(id) on delete cascade,
    pf_type varchar(100) not null, -- Employee Share/Employer Share
    employee_share_amount decimal(15, 2) not null default 0.00,
    organization_share_amount decimal(15, 2) not null default 0.00,
    description text,
    status varchar(50) not null default 'Pending', -- Pending/Approved/Rejected
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);
create index if not exists idx_provident_funds_deleted on provident_funds (deleted);
create index if not exists idx_provident_funds_employee_id on provident_funds (employee_id);
