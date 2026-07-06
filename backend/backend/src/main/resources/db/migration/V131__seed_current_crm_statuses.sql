INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_NEW_LEAD', 'New Lead', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('New Lead')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_ATTEMPTED', 'Attempted', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Attempted')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_INTERESTED', 'Interested', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Interested')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_BUDGET', 'Budget', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Budget')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_REQUIREMENT', 'Requirement', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Requirement')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_DESIGN', 'Design', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Design')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_DEAL', 'Deal', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Deal')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_REJECTED', 'Rejected', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Rejected')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_PAYMENT', 'Payment', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Payment')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_ALLOCATE', 'Allocate', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Allocate')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_PRODUCTION', 'Production', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Production')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_DESIGN_PRODUCTION', 'Design + Production', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Design + Production')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_STOCK_REQUEST', 'Stock Request', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Stock Request')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_STOCK_REQUESTED', 'Stock Requested', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Stock Requested')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_STOCK_UPDATED', 'Stock Updated', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Stock Updated')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_DELIVERY', 'Delivery', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Delivery')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_ACCOUNTS', 'Accounts', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Accounts')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_ACCOUNTS_REVIEW', 'Accounts Review', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Accounts Review')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_APPROVAL', 'Approval', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Approval')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_PURCHASE', 'Purchase', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Purchase')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_PRODUCTION_RESUME', 'Production Resume', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Production Resume')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_BOQ', 'Boq', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Boq')
);

INSERT INTO lead_statuses (status_id, status_name, is_deleted, created_at)
SELECT 'LDSTS_DUPLICATE', 'Duplicate', FALSE, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses WHERE LOWER(status_name) = LOWER('Duplicate')
);
