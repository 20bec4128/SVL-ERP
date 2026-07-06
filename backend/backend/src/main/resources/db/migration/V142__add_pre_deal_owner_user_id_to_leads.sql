ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS pre_deal_owner_user_id BIGINT;

UPDATE leads l
SET pre_deal_owner_user_id = d.converted_by_user_id
FROM deals d
WHERE d.source_lead_id = l.id
  AND d.is_deleted = false
  AND l.pre_deal_owner_user_id IS NULL
  AND lower(coalesce(l.status, '')) = 'deal'
  AND d.converted_by_user_id IS NOT NULL;

WITH latest_deal_conversion AS (
    SELECT DISTINCT ON (ll.lead_id)
        ll.lead_id,
        ll.actor
    FROM lead_logs ll
    WHERE lower(ll.action) LIKE '%status changed to deal%'
    ORDER BY ll.lead_id, ll.created_at DESC, ll.id DESC
)
UPDATE leads l
SET pre_deal_owner_user_id = u.id
FROM latest_deal_conversion x
JOIN app_users u
    ON lower(coalesce(u.username, '')) = lower(coalesce(x.actor, ''))
    OR lower(coalesce(u.email, '')) = lower(coalesce(x.actor, ''))
WHERE l.id = x.lead_id
  AND l.pre_deal_owner_user_id IS NULL
  AND lower(coalesce(l.status, '')) = 'deal';
