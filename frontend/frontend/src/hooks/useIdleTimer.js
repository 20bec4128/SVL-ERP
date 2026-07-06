import { useEffect, useRef, useState } from "react";

/**
 * useIdleTimer Hook
 * 
 * @param {number} timeoutMs Total idle time before action is triggered (default 15 minutes)
 * @param {number} warningMs Time before timeout to show warning/start countdown (default 2 minutes)
 * @param {function} onTimeout Callback triggered when the total idle time is reached
 */
export function useIdleTimer({ timeoutMs = 15 * 60 * 1000, warningMs = 2 * 60 * 1000, onTimeout, enabled = true }) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(Math.floor(warningMs / 1000));

  const timeoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep callback updated to avoid closure issues
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const showWarningRef = useRef(showWarning);
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setShowWarning(false);
    setCountdown(Math.floor(warningMs / 1000));

    if (!enabled) {
      return;
    }

    const warningTriggerDelay = timeoutMs - warningMs;

    timeoutTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, warningTriggerDelay);
  };

  const startCountdown = () => {
    let remaining = Math.floor(warningMs / 1000);
    setCountdown(remaining);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        if (onTimeoutRef.current) {
          onTimeoutRef.current();
        }
      }
    }, 1000);
  };

  // Keep resetTimer function updated in a ref so useEffect listeners use a stable callback
  const resetTimerRef = useRef(resetTimer);
  useEffect(() => {
    resetTimerRef.current = resetTimer;
  }, [resetTimer]);

  useEffect(() => {
    // List of events that define user activity
    const activityEvents = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "scroll",
      "click",
    ];

    const handleActivity = () => {
      // If warning modal is already showing, we don't automatically reset the timer 
      // on trivial movement, requiring the user to explicitly interact with the modal.
      if (!showWarningRef.current) {
        resetTimerRef.current();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };

    // Bind event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial start
    resetTimerRef.current();

    // Cleanup
    return () => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timeoutMs, warningMs, enabled]);

  return {
    showWarning,
    countdown,
    resetTimer,
  };
}
