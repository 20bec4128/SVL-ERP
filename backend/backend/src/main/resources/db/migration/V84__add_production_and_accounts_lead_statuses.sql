insert into lead_statuses (status_id, status_name, is_deleted, created_at)
select 'PRODUCTION', 'Production', false, now()
where not exists (
    select 1 from lead_statuses where lower(status_name) = lower('Production')
);

insert into lead_statuses (status_id, status_name, is_deleted, created_at)
select 'ACCOUNTS', 'Accounts', false, now()
where not exists (
    select 1 from lead_statuses where lower(status_name) = lower('Accounts')
);
