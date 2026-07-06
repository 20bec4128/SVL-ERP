-- Make project_location column nullable
alter table projects
    alter column project_location drop not null;

-- Add description column if it doesn't exist
alter table projects
    add column if not exists description varchar(1000);
