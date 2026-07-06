INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_NOT_ATTEMPTED', 'Not Attempted', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Not Attempted')
);

UPDATE lead_flow_config
SET statuses_json = CASE
    WHEN statuses_json IS NULL OR BTRIM(statuses_json) = '' THEN statuses_json
    WHEN statuses_json::text ILIKE '%Not Attempted%' THEN statuses_json
    ELSE (
        SELECT jsonb_agg(value ORDER BY ord)::text
        FROM (
            SELECT elem AS value, ord
            FROM jsonb_array_elements_text(statuses_json::jsonb) WITH ORDINALITY AS t(elem, ord)
            UNION ALL
            SELECT 'Not Attempted', 2.5
        ) x
    )
END,
rules_json = CASE
    WHEN rules_json IS NULL OR BTRIM(rules_json) = '' THEN rules_json
    ELSE (
        SELECT (
            jsonb_agg(
                CASE
                    WHEN LOWER(rule->>'status') = 'new lead' THEN
                        jsonb_set(rule, '{next}', '{"not attempted":"Not Attempted"}'::jsonb, false)
                    WHEN LOWER(rule->>'status') = 'not attempted' THEN
                        jsonb_set(
                            rule,
                            '{next}',
                            '{"attempted":"Attempted","interested":"Interested","rejected":"Rejected"}'::jsonb,
                            false
                        )
                    ELSE rule
                END
                ORDER BY ord
            )
            ||
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements(rules_json::jsonb) AS existing(rule)
                    WHERE LOWER(existing.rule->>'status') = 'not attempted'
                ) THEN '[]'::jsonb
                ELSE jsonb_build_array(
                    jsonb_build_object(
                        'status', 'not attempted',
                        'next', jsonb_build_object(
                            'attempted', 'Attempted',
                            'interested', 'Interested',
                            'rejected', 'Rejected'
                        )
                    )
                )
            END
        )::text
        FROM jsonb_array_elements(rules_json::jsonb) WITH ORDINALITY AS t(rule, ord)
    )
END
WHERE id = 1;
