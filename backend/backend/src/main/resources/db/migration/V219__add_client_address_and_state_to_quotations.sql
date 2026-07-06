ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS client_address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS client_state VARCHAR(100);

UPDATE quotations q
SET
  client_address = COALESCE(NULLIF(q.client_address, ''), l.street_address),
  client_state = COALESCE(NULLIF(q.client_state, ''), l.lead_state)
FROM leads l
WHERE q.lead_id = l.id
  AND (q.client_address IS NULL OR q.client_address = '' OR q.client_state IS NULL OR q.client_state = '');
