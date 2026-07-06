import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../system/ToastProvider";
import * as attendanceApi from "../../api/attendanceApi";

function formatClockParts(value) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value || "--";
  const minute = parts.find((part) => part.type === "minute")?.value || "--";
  const second = parts.find((part) => part.type === "second")?.value || "--";
  const period = parts.find((part) => part.type === "dayPeriod")?.value || "";

  return { hour, minute, second, period };
}

function formatDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function formatScheduleTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function resolveScheduleLabel(today) {
  const shiftName =
    today?.shiftName ||
    today?.shift?.name ||
    today?.scheduleName ||
    today?.assignedShiftName ||
    today?.rosterName ||
    "";

  const startTime =
    today?.shiftStartTime ||
    today?.scheduledStartTime ||
    today?.startTime ||
    today?.shift?.startTime ||
    "";

  const endTime =
    today?.shiftEndTime ||
    today?.scheduledEndTime ||
    today?.endTime ||
    today?.shift?.endTime ||
    "";

  const timeLabel =
    startTime && endTime
      ? `${formatScheduleTime(startTime)} - ${formatScheduleTime(endTime)}`
      : "";

  if (shiftName && timeLabel) return `${shiftName} - ${timeLabel}`;
  if (shiftName) return shiftName;
  if (timeLabel) return timeLabel;
  return "No schedule";
}

export default function TopbarAttendanceAction() {
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const role = String(user?.role || "").toUpperCase();
  const [slot, setSlot] = useState(null);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("check"); // check | break | lunch
  const [reason, setReason] = useState("");
  const [holdProgress, setHoldProgress] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const holdFrameRef = useRef(null);
  const holdStartRef = useRef(0);
  const holdTriggeredRef = useRef(false);

  const resolveVisibleSlot = useCallback(() => {
    const slots = Array.from(
      document.querySelectorAll("[data-topbar-attendance-slot]"),
    );

    if (!slots.length) {
      return null;
    }

    const visibleSlot = slots.find((candidate) => {
      if (!(candidate instanceof HTMLElement)) {
        return false;
      }

      if (!candidate.isConnected) {
        return false;
      }

      return candidate.getClientRects().length > 0;
    });

    return visibleSlot || slots[0] || null;
  }, []);

  // Derived values that are used in callbacks
  const attendanceStatus = String(attendanceToday?.status || "").toUpperCase();

  const canUseAttendance = useMemo(
    () =>
      role === "EMPLOYEE" ||
      role === "MANAGER" ||
      role === "TEAM_LEAD" ||
      role === "ADMIN",
    [role],
  );

  const resetHold = useCallback(() => {
    if (holdFrameRef.current) {
      window.cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    holdStartRef.current = 0;
    holdTriggeredRef.current = false;
    setHoldProgress(0);
  }, []);

  useEffect(() => {
    if (!canUseAttendance) {
      setSlot(null);
      return undefined;
    }

    const syncSlot = () => {
      const nextSlot = resolveVisibleSlot();
      if (nextSlot) {
        setSlot(nextSlot);
        return true;
      }
      return false;
    };

    // Try immediately
    if (syncSlot()) {
      return undefined;
    }

    // If not found, poll more aggressively
    const interval = window.setInterval(syncSlot, 100);

    return () => window.clearInterval(interval);
  }, [canUseAttendance]);

  // Keep the portal target fresh when the admin layout re-renders on navigation.
  useEffect(() => {
    if (!canUseAttendance) {
      return undefined;
    }

    const syncSlot = () => {
      const nextSlot = resolveVisibleSlot();
      if (nextSlot) {
        setSlot(nextSlot);
      }
    };

    if (!slot || !slot.isConnected) {
      syncSlot();
    }

    const timer = window.setTimeout(syncSlot, 100);
    return () => window.clearTimeout(timer);
  }, [canUseAttendance, location.pathname, resolveVisibleSlot, slot]);

  const loadAttendanceToday = useCallback(async () => {
    if (!canUseAttendance) {
      setAttendanceToday(null);
      setAttendanceLoading(false);
      return;
    }
    setAttendanceLoading(true);
    try {
      const todayData = await attendanceApi.getToday().catch(() => null);
      setAttendanceToday(todayData);
    } finally {
      setAttendanceLoading(false);
    }
  }, [canUseAttendance]);

  useEffect(() => {
    loadAttendanceToday();
  }, [loadAttendanceToday]);

  useEffect(() => {
    if (!showModal) {
      document.body.style.overflow = "";
      return undefined;
    }
    
    // Auto-select tab based on current status
    if (attendanceStatus === "ON_BREAK") {
      setActiveTab("break");
    } else if (attendanceStatus === "ON_LUNCH") {
      setActiveTab("lunch");
    } else {
      setActiveTab("check");
    }
    
    setReason("");
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearInterval(interval);
      document.body.style.overflow = "";
    };
  }, [showModal, attendanceStatus]);

  useEffect(() => () => resetHold(), [resetHold]);

  const getGPS = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => reject(new Error(`GPS error: ${err.message}`)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }, []);

  const completeCheckIn = useCallback(async () => {
    setAttendanceActionLoading(true);
    try {
      if (attendanceStatus === "CHECKED_IN" || attendanceStatus === "ON_BREAK" || attendanceStatus === "ON_LUNCH") {
        // Check out (backend auto-ends any open break/lunch)
        const gps = await getGPS();
        const payload = reason.trim() ? { ...gps, reason: reason.trim() } : gps;
        await attendanceApi.checkOut(payload);
        showSuccess("Checked out successfully");
      } else {
        // Check in
        const gps = await getGPS();
        const payload = reason.trim() ? { ...gps, reason: reason.trim() } : gps;
        await attendanceApi.checkIn(payload);
        showSuccess("Checked in successfully");
      }
      setShowModal(false);
      setReason("");
      await loadAttendanceToday();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Check action failed";
      showError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setAttendanceActionLoading(false);
      resetHold();
    }
  }, [getGPS, loadAttendanceToday, reason, resetHold, showError, showSuccess, attendanceStatus]);

  const completeBreak = useCallback(async (action) => {
    setAttendanceActionLoading(true);
    try {
      if (action === "start") {
        await attendanceApi.startBreak({ breakType: "BREAK" });
        showSuccess("Break started");
      } else {
        await attendanceApi.endBreak({ breakType: "BREAK" });
        showSuccess("Break ended");
      }
      setShowModal(false);
      setReason("");
      await loadAttendanceToday();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Break action failed";
      showError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setAttendanceActionLoading(false);
      resetHold();
    }
  }, [loadAttendanceToday, resetHold, showError, showSuccess]);

  const completeLunch = useCallback(async (action) => {
    setAttendanceActionLoading(true);
    try {
      if (action === "start") {
        await attendanceApi.startBreak({ breakType: "LUNCH" });
        showSuccess("Lunch started");
      } else {
        await attendanceApi.endBreak({ breakType: "LUNCH" });
        showSuccess("Lunch ended");
      }
      setShowModal(false);
      setReason("");
      await loadAttendanceToday();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Lunch action failed";
      showError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setAttendanceActionLoading(false);
      resetHold();
    }
  }, [loadAttendanceToday, resetHold, showError, showSuccess]);

  const beginHold = useCallback(() => {
    if (attendanceActionLoading) return;
    resetHold();
    holdTriggeredRef.current = false;
    holdStartRef.current = performance.now();

    const onComplete = () => {
      if (activeTab === "check") {
        completeCheckIn();
      } else if (activeTab === "break") {
        completeBreak(attendanceStatus === "ON_BREAK" ? "end" : "start");
      } else if (activeTab === "lunch") {
        completeLunch(attendanceStatus === "ON_LUNCH" ? "end" : "start");
      }
    };

    const tick = (timestamp) => {
      const elapsed = timestamp - holdStartRef.current;
      const progress = Math.min(elapsed / 900, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        holdTriggeredRef.current = true;
        holdFrameRef.current = null;
        onComplete();
        return;
      }
      holdFrameRef.current = window.requestAnimationFrame(tick);
    };

    holdFrameRef.current = window.requestAnimationFrame(tick);
  }, [attendanceActionLoading, activeTab, attendanceStatus, completeCheckIn, completeBreak, completeLunch, resetHold]);

  const cancelHold = useCallback(() => {
    if (holdTriggeredRef.current) return;
    resetHold();
  }, [resetHold]);

  if (!canUseAttendance || !slot) {
    return null;
  }

  const isCheckedIn =
    attendanceStatus === "CHECKED_IN" ||
    attendanceStatus === "ON_BREAK" ||
    attendanceStatus === "ON_LUNCH";

  const getButtonLabel = () => {
    if (!attendanceToday || attendanceStatus === "CHECKED_OUT" || attendanceStatus === "AUTO_CHECKOUT") {
      return "Check In";
    }
    return "Check Out";
  };

  const clock = formatClockParts(now);
  const scheduleLabel = resolveScheduleLabel(attendanceToday);
  const holdRing = `${Math.round(holdProgress * 360)}deg`;

  return (
    <>
      {createPortal(
        <div className="d-flex align-items-center me-2">
          {attendanceLoading ? (
            <span className="btn btn-menubar disabled">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-checkin-action"
              onClick={() => setShowModal(true)}
              disabled={attendanceActionLoading}
            >
              <i className="ti ti-fingerprint me-1"></i>
              {getButtonLabel()}
            </button>
          )}
        </div>,
        slot,
      )}

      {showModal
        ? createPortal(
            <div
              className="topbar-checkin-modal__backdrop"
              onClick={() => {
                if (attendanceActionLoading) return;
                setShowModal(false);
                resetHold();
              }}
            >
              <div
                className="topbar-checkin-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="topbar-checkin-modal__header">
                  <h5 className="mb-0">Check In</h5>
                  <button
                    type="button"
                    className="topbar-checkin-modal__close"
                    onClick={() => {
                      if (attendanceActionLoading) return;
                      setShowModal(false);
                      resetHold();
                    }}
                    aria-label="Close"
                  >
                    <i className="ti ti-x"></i>
                  </button>
                </div>

                <div className="topbar-checkin-modal__body">
                  <div className="topbar-checkin-modal__tabs">
                  <button 
                    type="button" 
                    className={activeTab === "check" ? "is-active" : ""}
                    onClick={() => setActiveTab("check")}
                  >
                    <i className="ti ti-arrow-right-circle me-1"></i>
                    {attendanceStatus === "CHECKED_IN" || attendanceStatus === "ON_BREAK" || attendanceStatus === "ON_LUNCH" ? "Check Out" : "Check In"}
                  </button>
                  <button 
                    type="button" 
                    disabled={attendanceStatus !== "CHECKED_IN" && attendanceStatus !== "ON_BREAK"}
                    className={activeTab === "break" ? "is-active" : ""}
                    onClick={() => setActiveTab("break")}
                  >
                    <i className="ti ti-coffee me-1"></i>
                    {attendanceStatus === "ON_BREAK" ? "End Break" : "Break"}
                  </button>
                  <button 
                    type="button"
                    disabled={attendanceStatus !== "CHECKED_IN" && attendanceStatus !== "ON_LUNCH"}
                    className={activeTab === "lunch" ? "is-active" : ""}
                    onClick={() => setActiveTab("lunch")}
                  >
                    <i className="ti ti-meat me-1"></i>
                    {attendanceStatus === "ON_LUNCH" ? "End Lunch" : "Lunch"}
                  </button>
                  </div>

                  <div className="topbar-checkin-modal__clock">
                    <span className="topbar-checkin-modal__period">{clock.period}</span>
                    <span className="topbar-checkin-modal__time">
                      {clock.hour}:{clock.minute}
                    </span>
                    <span className="topbar-checkin-modal__seconds">{clock.second}</span>
                  </div>

                  <div className="topbar-checkin-modal__date">{formatDateLabel(now)}</div>

                  <button
                    type="button"
                    className="topbar-checkin-modal__hold"
                    style={{ "--hold-ring": holdRing }}
                    disabled={attendanceActionLoading}
                    onMouseDown={beginHold}
                    onMouseUp={cancelHold}
                    onMouseLeave={cancelHold}
                    onTouchStart={beginHold}
                    onTouchEnd={cancelHold}
                    onTouchCancel={cancelHold}
                  >
                    <div className="topbar-checkin-modal__hold-inner">
                      {attendanceActionLoading ? (
                        <span className="spinner-border spinner-border-sm mb-2" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="ti ti-fingerprint topbar-checkin-modal__hold-icon"></i>
                      )}
                      <span>
                        {activeTab === "check" && (attendanceStatus === "CHECKED_IN" || attendanceStatus === "ON_BREAK" || attendanceStatus === "ON_LUNCH" ? "Check Out" : "Check In")}
                        {activeTab === "break" && (attendanceStatus === "ON_BREAK" ? "End Break" : "Start Break")}
                        {activeTab === "lunch" && (attendanceStatus === "ON_LUNCH" ? "End Lunch" : "Start Lunch")}
                      </span>
                    </div>
                  </button>

                  <div className="topbar-checkin-modal__hint">
                    <i className="ti ti-hand-stop me-2"></i>
                    {activeTab === "check" && "Press and hold to check in/out"}
                    {activeTab === "break" && "Press and hold to toggle break"}
                    {activeTab === "lunch" && "Press and hold to toggle lunch"}
                  </div>

                  {activeTab === "check" && (
                    <textarea
                      className="topbar-checkin-modal__reason"
                      rows={3}
                      placeholder="Reason (optional)"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      disabled={attendanceActionLoading}
                    />
                  )}

                  <div className="topbar-checkin-modal__schedule">
                    <i className="ti ti-clock-hour-4"></i>
                    <span>{scheduleLabel}</span>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
