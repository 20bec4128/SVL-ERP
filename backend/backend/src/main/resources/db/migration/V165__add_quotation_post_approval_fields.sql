ALTER TABLE quotations
    ADD COLUMN sent_at             TIMESTAMP    NULL,
    ADD COLUMN sent_by_name        VARCHAR(255) NULL,
    ADD COLUMN negotiating_at      TIMESTAMP    NULL,
    ADD COLUMN negotiating_by_name VARCHAR(255) NULL,
    ADD COLUMN negotiating_notes   TEXT         NULL,
    ADD COLUMN rejected_at         TIMESTAMP    NULL,
    ADD COLUMN rejected_by_name    VARCHAR(255) NULL,
    ADD COLUMN rejection_notes     TEXT         NULL,
    ADD COLUMN accepted_at         TIMESTAMP    NULL,
    ADD COLUMN accepted_by_name    VARCHAR(255) NULL,
    ADD COLUMN acceptance_notes    TEXT         NULL;
