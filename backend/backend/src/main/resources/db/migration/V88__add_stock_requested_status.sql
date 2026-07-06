INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_STOCK_REQUESTED', 'Stock Requested', false, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Stock Requested')
);
