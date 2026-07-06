ALTER TABLE promotions
    ADD COLUMN IF NOT EXISTS employee_id BIGINT;

UPDATE promotions p
SET employee_id = e.id
FROM employees e
WHERE p.employee_id IS NULL
  AND lower(p.employee_name) = lower(e.name)
  AND (e.deleted IS FALSE OR e.deleted IS NULL);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM promotions WHERE employee_id IS NULL) THEN
        ALTER TABLE promotions ALTER COLUMN employee_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_promotions_employee_id ON promotions(employee_id);
