create table if not exists mail_settings (
    id bigserial primary key,
    enabled boolean not null default true,
    host varchar(255),
    port int not null default 587,
    username varchar(255),
    password_enc text,
    smtp_auth boolean not null default true,
    starttls boolean not null default true,
    from_address varchar(255),
    from_name varchar(255),
    updated_at timestamp,
    updated_by varchar(255)
);

create unique index if not exists ux_mail_settings_single_row on mail_settings ((1));
