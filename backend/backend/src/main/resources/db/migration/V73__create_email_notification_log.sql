CREATE TABLE IF NOT EXISTS email_notification_log (
    id BIGSERIAL PRIMARY KEY,
    recipient_email VARCHAR(190) NOT NULL,
    last_sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notification_log_recipient
    ON email_notification_log (recipient_email);
