import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSessionSettings, saveSessionSettings } from "../../api/sessionSettingsApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import "./LeadsPage.css";

const DEFAULT_FORM = {
  sessionTimeoutMinutes: 60,
  rememberMeDays: 30,
  maxConcurrentSessions: 5,
  preventConcurrentLogins: false,
  warningBeforeLogoutSeconds: 60,
};

export default function SessionSettingsPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getSessionSettings();
        if (!isMounted) return;
        if (data) {
          setForm({
            sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? 60,
            rememberMeDays: data.rememberMeDays ?? 30,
            maxConcurrentSessions: data.maxConcurrentSessions ?? 5,
            preventConcurrentLogins: data.preventConcurrentLogins ?? false,
            warningBeforeLogoutSeconds: data.warningBeforeLogoutSeconds ?? 60,
          });
        }
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load session settings"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [showError]);

  async function handleSave() {
    if (Number(form.sessionTimeoutMinutes) < 1) {
      showError("Session Timeout must be at least 1 minute");
      return;
    }
    if (Number(form.warningBeforeLogoutSeconds) < 1) {
      showError("Warning before logout must be at least 1 second");
      return;
    }
    if (Number(form.rememberMeDays) < 1) {
      showError("Remember Me duration must be at least 1 day");
      return;
    }
    if (Number(form.maxConcurrentSessions) < 1) {
      showError("Max Concurrent Sessions must be at least 1");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sessionTimeoutMinutes: Number(form.sessionTimeoutMinutes),
        rememberMeDays: Number(form.rememberMeDays),
        maxConcurrentSessions: Number(form.maxConcurrentSessions),
        preventConcurrentLogins: !!form.preventConcurrentLogins,
        warningBeforeLogoutSeconds: Number(form.warningBeforeLogoutSeconds),
      };
      await saveSessionSettings(payload);
      showSuccess("Session settings saved successfully");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save session settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content">
      {/* Styled Header Card */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Session Settings</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Settings</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Session Settings</li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
              onClick={handleSave}
              disabled={loading || saving}
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            >
              <i className="ti ti-device-floppy" style={{ fontSize: "1.1rem" }}></i>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <div className="card-header bg-white border-bottom p-3">
          <h5 className="mb-0" style={{ fontWeight: "600", color: "#0f172a" }}>Authentication & Session Policy</h5>
          <p className="text-muted small mb-0">Configure session lifetimes, max active connections per user, and concurrent session policies.</p>
        </div>
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4">Loading settings...</div>
          ) : (
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Session Timeout (Minutes)</label>
                  <p className="text-muted small mb-2">Duration of inactivity before a user is automatically signed out.</p>
                  <input
                    type="number"
                    min="1"
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.sessionTimeoutMinutes}
                    onChange={(e) => setForm((p) => ({ ...p, sessionTimeoutMinutes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Warning Before Logout (Seconds)</label>
                  <p className="text-muted small mb-2">Inactivity countdown popup warning duration before logging out.</p>
                  <input
                    type="number"
                    min="1"
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.warningBeforeLogoutSeconds}
                    onChange={(e) => setForm((p) => ({ ...p, warningBeforeLogoutSeconds: e.target.value }))}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Remember Me Duration (Days)</label>
                  <p className="text-muted small mb-2">Number of days a user session remains valid when "Remember Me" is enabled.</p>
                  <input
                    type="number"
                    min="1"
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.rememberMeDays}
                    onChange={(e) => setForm((p) => ({ ...p, rememberMeDays: e.target.value }))}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Max Concurrent Sessions</label>
                  <p className="text-muted small mb-2">Maximum number of active sessions allowed per user.</p>
                  <input
                    type="number"
                    min="1"
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.maxConcurrentSessions}
                    onChange={(e) => setForm((p) => ({ ...p, maxConcurrentSessions: e.target.value }))}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10, height: "100%" }}>
                  <div className="d-flex justify-content-between align-items-center" style={{ minHeight: 90 }}>
                    <div>
                      <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Prevent Concurrent Logins</label>
                      <p className="text-muted small mb-0">Blocks logging in from a new device/browser if a session is already active.</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.preventConcurrentLogins}
                        onChange={(e) => setForm((p) => ({ ...p, preventConcurrentLogins: e.target.checked }))}
                        style={{ width: "2.5em", height: "1.25em", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}