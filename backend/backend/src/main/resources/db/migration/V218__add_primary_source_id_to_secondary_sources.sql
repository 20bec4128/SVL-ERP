alter table if exists secondary_sources
    add column if not exists primary_source_id bigint;

alter table if exists secondary_sources
    add constraint fk_secondary_sources_primary_source
        foreign key (primary_source_id) references primary_sources (id);

create index if not exists idx_secondary_sources_primary_source_id
    on secondary_sources (primary_source_id);
