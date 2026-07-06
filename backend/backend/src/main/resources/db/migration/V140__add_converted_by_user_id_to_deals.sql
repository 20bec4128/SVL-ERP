ALTER TABLE deals
    ADD COLUMN IF NOT EXISTS converted_by_user_id BIGINT;

WITH latest_conversion_log AS (
    SELECT DISTINCT ON (lead_id)
        lead_id,
        actor
    FROM lead_logs
    WHERE lower(action) LIKE '%status changed to deal%'
    ORDER BY lead_id, created_at DESC, id DESC
)
UPDATE deals d
SET converted_by_user_id = u.id
FROM latest_conversion_log l
JOIN app_users u
    ON lower(coalesce(u.username, '')) = lower(coalesce(l.actor, ''))
    OR lower(coalesce(u.email, '')) = lower(coalesce(l.actor, ''))
WHERE d.source_lead_id = l.lead_id
  AND d.converted_by_user_id IS NULL
  AND d.is_deleted = false;
