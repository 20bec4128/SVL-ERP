-- Fix Budget flow rule: remove handledByGroupId so lead stays with current owner
-- The lead should NOT be reassigned to Budget group; only budgetVerificationAssignedToUserId is set

UPDATE lead_flow_config
SET rules_json = (
  SELECT jsonb_agg(
    CASE 
      WHEN rule->>'status' = 'Budget' THEN
        -- Update Budget rule: remove handledByGroupId, keep only next transitions
        jsonb_build_object(
          'status', 'Budget',
          'next', jsonb_build_object(
            'Requirement', (SELECT id FROM user_groups WHERE lower(name) = lower('Presales') LIMIT 1),
            'Payment', (SELECT id FROM user_groups WHERE lower(name) = lower('Sales') LIMIT 1)
          )
        )
      ELSE rule
    END
  )
  FROM jsonb_array_elements(rules_json::jsonb) AS rule
)::text
WHERE (rules_json::text) LIKE '%Budget%';
