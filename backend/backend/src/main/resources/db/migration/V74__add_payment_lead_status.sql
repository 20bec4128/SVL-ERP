insert into lead_statuses (status_id, status_name, is_deleted, created_at)
select 'PAYMENT', 'Payment', false, now()
where not exists (
    select 1 from lead_statuses where lower(status_name) = lower('Payment')
);
