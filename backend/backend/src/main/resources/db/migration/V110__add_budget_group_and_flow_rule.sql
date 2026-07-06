-- Add Budget user group if not exists
INSERT INTO user_groups (name, group_level, is_system_group, member_scope)
SELECT 'Budget', 5, FALSE, 'NONE'
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE lower(name) = lower('Budget'));

-- Update flow rules to include Budget status
-- Budget status does NOT change assigned_group_id; the lead stays with its current owner/group
-- Only budgetVerificationAssignedToUserId is set via round-robin to budget employees
UPDATE lead_flow_config
SET rules_json = (
  rules_json::jsonb || jsonb_build_array(
    jsonb_build_object(
      'status', 'Budget',
      'next', jsonb_build_object(
        'Requirement', (SELECT id FROM user_groups WHERE lower(name) = lower('Presales') LIMIT 1),
        'Payment', (SELECT id FROM user_groups WHERE lower(name) = lower('Sales') LIMIT 1)
      )
    )
  )
)::text
WHERE (rules_json::text) NOT LIKE '%Budget%';
