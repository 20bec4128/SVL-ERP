-- Migration 1: Shift overtime limit
ALTER TABLE shifts ADD COLUMN max_overtime_minutes INTEGER DEFAULT 120;

-- Migration 2: Attendance overtime tracking
ALTER TABLE attendance ADD COLUMN overtime_minutes INTEGER DEFAULT 0;

-- Migration 3: Attendance missed checkout flag
ALTER TABLE attendance ADD COLUMN is_missed_checkout BOOLEAN DEFAULT FALSE;

-- Migration 4: Attendance missed checkout timestamp
ALTER TABLE attendance ADD COLUMN missed_checkout_flagged_at TIMESTAMP NULL;

-- Migration 5: Backfill overtime_minutes for existing records
UPDATE attendance a
SET overtime_minutes = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (
  a.check_out_time - (
    CASE 
      WHEN s.is_night_shift = TRUE AND s.end_time <= s.start_time THEN (a.attendance_date + s.end_time + INTERVAL '1 day')
      ELSE (a.attendance_date + s.end_time)
    END
  )
)) / 60)::integer)
FROM shifts s
WHERE a.shift_id = s.id
  AND a.check_out_time IS NOT NULL 
  AND a.deleted = FALSE 
  AND a.status IN ('CHECKED_OUT', 'AUTO_CHECKOUT');
