INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_NEW_LEAD', 'New Lead', false, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('New Lead')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_ATTEMPTED', 'Attempted', false, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Attempted')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_INTERESTED', 'Interested', false, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Interested')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_REJECTED', 'Rejected', false, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Rejected')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_BOQ', 'Boq', false, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Boq')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_DUPLICATE', 'Duplicate', false, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Duplicate')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_ALLOCATE', 'Allocate', false, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Allocate')
);
