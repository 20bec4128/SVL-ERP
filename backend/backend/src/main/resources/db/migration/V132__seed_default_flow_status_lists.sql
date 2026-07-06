INSERT INTO lead_flow_config (id)
VALUES (2)
ON CONFLICT (id) DO NOTHING;

UPDATE lead_flow_config
SET statuses_json = '["New Lead","Attempted","Interested","Budget","Requirement","Design","Deal","Rejected"]'
WHERE id = 1
  AND (statuses_json IS NULL OR BTRIM(statuses_json) = '');

UPDATE lead_flow_config
SET statuses_json = '["Payment","Allocate","Design","Production","Design + Production","Stock Request","Stock Updated","Delivery","Accounts","Accounts Review","Approval","Purchase","Production Resume"]'
WHERE id = 2
  AND (statuses_json IS NULL OR BTRIM(statuses_json) = '');
