-- ============================================================
-- V135: Attendance system tables
-- ============================================================

-- 1. Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    start_time      TIME          NOT NULL,
    end_time        TIME          NOT NULL,
    early_checkin_buffer_minutes  INT NOT NULL DEFAULT 30,
    late_checkin_buffer_minutes   INT NOT NULL DEFAULT 15,
    break_allowed_minutes         INT NOT NULL DEFAULT 15,
    break_grace_minutes           INT NOT NULL DEFAULT 5,
    lunch_allowed_minutes         INT NOT NULL DEFAULT 60,
    lunch_grace_minutes           INT NOT NULL DEFAULT 10,
    is_night_shift  BOOLEAN       NOT NULL DEFAULT FALSE,
    min_work_minutes INT          NOT NULL DEFAULT 480,
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 2. Company locations (geofence anchors)
CREATE TABLE IF NOT EXISTS company_locations (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200)  NOT NULL,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    radius_meters   INT           NOT NULL DEFAULT 50,
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 3. Employee-shift assignment (maps user → shift + location)
CREATE TABLE IF NOT EXISTS employee_shifts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT        NOT NULL REFERENCES app_users(id),
    shift_id        BIGINT        NOT NULL REFERENCES shifts(id),
    location_id     BIGINT        REFERENCES company_locations(id),
    effective_from  DATE          NOT NULL DEFAULT CURRENT_DATE,
    effective_to    DATE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_shifts_user ON employee_shifts(user_id);

-- 4. Attendance (one row per user per day)
CREATE TABLE IF NOT EXISTS attendance (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT        NOT NULL REFERENCES app_users(id),
    attendance_date     DATE          NOT NULL,
    shift_id            BIGINT        REFERENCES shifts(id),
    location_id         BIGINT        REFERENCES company_locations(id),

    check_in_time       TIMESTAMP,
    check_in_lat        DOUBLE PRECISION,
    check_in_lng        DOUBLE PRECISION,
    check_in_accuracy   DOUBLE PRECISION,

    check_out_time      TIMESTAMP,
    check_out_lat       DOUBLE PRECISION,
    check_out_lng       DOUBLE PRECISION,
    check_out_accuracy  DOUBLE PRECISION,

    status              VARCHAR(30)   NOT NULL DEFAULT 'CHECKED_IN',
    -- CHECKED_IN, ON_BREAK, ON_LUNCH, CHECKED_OUT, AUTO_CHECKOUT

    total_work_minutes    INT DEFAULT 0,
    break_time_minutes    INT DEFAULT 0,
    lunch_time_minutes    INT DEFAULT 0,
    excess_break_minutes  INT DEFAULT 0,
    excess_lunch_minutes  INT DEFAULT 0,
    net_work_minutes      INT DEFAULT 0,

    is_late             BOOLEAN       NOT NULL DEFAULT FALSE,
    late_minutes        INT           DEFAULT 0,

    work_status         VARCHAR(30)   DEFAULT 'INCOMPLETE',
    -- COMPLETED, INCOMPLETE, HALF_DAY

    notes               TEXT,
    deleted             BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);

-- 5. Attendance events (immutable audit log of all punch actions)
CREATE TABLE IF NOT EXISTS attendance_events (
    id              BIGSERIAL PRIMARY KEY,
    attendance_id   BIGINT        NOT NULL REFERENCES attendance(id),
    event_type      VARCHAR(30)   NOT NULL,
    -- CHECK_IN, CHECK_OUT, BREAK_START, BREAK_END, LUNCH_START, LUNCH_END
    occurred_at     TIMESTAMP     NOT NULL,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    accuracy        DOUBLE PRECISION,
    notes           TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_events_att ON attendance_events(attendance_id);

-- 6. Attendance breaks / lunch periods
CREATE TABLE IF NOT EXISTS attendance_breaks (
    id              BIGSERIAL PRIMARY KEY,
    attendance_id   BIGINT        NOT NULL REFERENCES attendance(id),
    break_type      VARCHAR(10)   NOT NULL,
    -- BREAK, LUNCH
    start_time      TIMESTAMP     NOT NULL,
    end_time        TIMESTAMP,
    duration_minutes INT          DEFAULT 0,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_breaks_att ON attendance_breaks(attendance_id);

-- Seed a default General shift (9 AM - 6 PM)
INSERT INTO shifts (name, start_time, end_time, early_checkin_buffer_minutes, late_checkin_buffer_minutes,
                    break_allowed_minutes, break_grace_minutes, lunch_allowed_minutes, lunch_grace_minutes,
                    is_night_shift, min_work_minutes)
VALUES ('General', '09:00', '18:00', 30, 15, 15, 5, 60, 10, FALSE, 480)
ON CONFLICT DO NOTHING;

-- Seed a Night shift (10 PM - 6 AM)
INSERT INTO shifts (name, start_time, end_time, early_checkin_buffer_minutes, late_checkin_buffer_minutes,
                    break_allowed_minutes, break_grace_minutes, lunch_allowed_minutes, lunch_grace_minutes,
                    is_night_shift, min_work_minutes)
VALUES ('Night', '22:00', '06:00', 30, 15, 15, 5, 60, 10, TRUE, 480)
ON CONFLICT DO NOTHING;
