import React from "react";

export default function IdleTimeoutModal({ show, countdown, onStayLoggedIn, onLogout }) {
  if (!show) return null;

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      className="modal fade show"
      tabIndex="-1"
      style={{
        display: "block",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1050,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 bg-warning text-dark py-3">
            <h5 className="modal-title d-flex align-items-center fw-bold">
              <span className="me-2" style={{ fontSize: "1.2rem" }}>⚠️</span>
              Session Timeout Warning
            </h5>
          </div>
          <div className="modal-body py-4 text-center">
            <p className="fs-5 mb-3 text-secondary">
              You have been inactive for a while.
            </p>
            <div className="my-4">
              <p className="mb-1 text-muted text-uppercase tracking-wider font-semibold" style={{ fontSize: "0.85rem" }}>
                Auto Logout in
              </p>
              <h2 className="display-4 fw-bold text-danger mb-0">
                {formatTime(countdown)}
              </h2>
            </div>
            <p className="text-muted small">
              Please click "Stay Logged In" to keep your session active.
            </p>
          </div>
          <div className="modal-footer border-0 bg-light py-3 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-2 fw-semibold"
              onClick={onLogout}
            >
              Logout Now
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 py-2 fw-bold"
              onClick={onStayLoggedIn}
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
