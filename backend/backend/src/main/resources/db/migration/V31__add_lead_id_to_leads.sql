alter table leads
    add column if not exists lead_id varchar(64);

update leads
set lead_id = 'LEAD_' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 14))
where lead_id is null;

alter table leads
    alter column lead_id set not null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'uk_leads_lead_id'
    ) then
        alter table leads
            add constraint uk_leads_lead_id unique (lead_id);
    end if;
end $$;
