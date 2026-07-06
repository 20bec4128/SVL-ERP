import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSecurityPolicySettings, saveSecurityPolicySettings } from "../../api/securityPolicySettingsApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import "./LeadsPage.css";

const DEFAULT_FORM = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  passwordExpiryDays: 90,
};

export default function SecuritySettingsPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getSecurityPolicySettings();
        if (!isMounted) return;
        if (data) {
          setForm({
            minPasswordLength: data.minPasswordLength ?? 8,
            requireUppercase: data.requireUppercase ?? true,
            requireLowercase: data.requireLowercase ?? true,
            requireNumbers: data.requireNumbers ?? true,
            requireSpecialChars: data.requireSpecialChars ?? true,
            maxLoginAttempts: data.maxLoginAttempts ?? 5,
            lockoutDurationMinutes: data.lockoutDurationMinutes ?? 15,
            passwordExpiryDays: data.passwordExpiryDays ?? 90,
          });
        }
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load security policy settings"));
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
    if (Number(form.minPasswordLength) < 4) {
      showError("Minimum Password Length must be at least 4 characters");
      return;
    }
    if (Number(form.maxLoginAttempts) < 1) {
      showError("Maximum Login Attempts must be at least 1");
      return;
    }
    if (Number(form.lockoutDurationMinutes) < 1) {
      showError("Lockout Duration must be at least 1 minute");
      return;
    }
    if (Number(form.passwordExpiryDays) < 1) {
      showError("Password Expiry duration must be at least 1 day");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        minPasswordLength: Number(form.minPasswordLength),
        requireUppercase: !!form.requireUppercase,
        requireLowercase: !!form.requireLowercase,
        requireNumbers: !!form.requireNumbers,
        requireSpecialChars: !!form.requireSpecialChars,
        maxLoginAttempts: Number(form.maxLoginAttempts),
        lockoutDurationMinutes: Number(form.lockoutDurationMinutes),
        passwordExpiryDays: Number(form.passwordExpiryDays),
      };
      await saveSecurityPolicySettings(payload);
      showSuccess("Security policy settings saved successfully");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save security policy settings"));
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
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Security Settings</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Settings</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Security Settings</li>
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
          <h5 className="mb-0" style={{ fontWeight: "600", color: "#0f172a" }}>Password Complexity & Account Lockout</h5>
          <p className="text-muted small mb-0">Define password strength requirements, maximum failed attempts, and account lockout policies.</p>
        </div>
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4">Loading settings...</div>
          ) : (
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Minimum Password Length</label>
                  <p className="text-muted small mb-2">Set the minimum character length required for passwords.</p>
                  <input
                    type="number"
                    min="4"
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.minPasswordLength}
                    onChange={(e) => setForm((p) => ({ ...p, minPasswordLength: e.target.value }))}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Password Expiry Duration (Days)</label>
                  <p className="text-muted small mb-2">Forces users to change their password periodically.</p>
                  <input
                    type="number"
                    min="1"
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.passwordExpiryDays}
                    onChange={(e) => setForm((p) => ({ ...p, passwordExpiryDays: e.target.value }))}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Max Failed Login Attempts</label>
                  <p className="text-muted small mb-2">Number of wrong attempts allowed before temporary lockout.</p>
                  <input
                    type="number"
                    min="1"
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.maxLoginAttempts}
                    onChange={(e) => setForm((p) => ({ ...p, maxLoginAttempts: e.target.value }))}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Lockout Duration (Minutes)</label>
                  <p className="text-muted small mb-2">How long the user is blocked after exceeding failed attempts limit.</p>
                  <input
                    type="number"
                    min="1"
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.lockoutDurationMinutes}
                    onChange={(e) => setForm((p) => ({ ...p, lockoutDurationMinutes: e.target.value }))}
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <label htmlFor="requireUppercaseSwitch" className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem", cursor: "pointer" }}>Require Uppercase Letters</label>
                      <p className="text-muted small mb-0">Password must contain at least one uppercase letter (A-Z).</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        id="requireUppercaseSwitch"
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.requireUppercase}
                        onChange={(e) => setForm((p) => ({ ...p, requireUppercase: e.target.checked }))}
                        style={{ width: "2.5em", height: "1.25em", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <label htmlFor="requireLowercaseSwitch" className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem", cursor: "pointer" }}>Require Lowercase Letters</label>
                      <p className="text-muted small mb-0">Password must contain at least one lowercase letter (a-z).</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        id="requireLowercaseSwitch"
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.requireLowercase}
                        onChange={(e) => setForm((p) => ({ ...p, requireLowercase: e.target.checked }))}
                        style={{ width: "2.5em", height: "1.25em", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <label htmlFor="requireNumbersSwitch" className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem", cursor: "pointer" }}>Require Numbers</label>
                      <p className="text-muted small mb-0">Password must contain at least one digit (0-9).</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        id="requireNumbersSwitch"
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.requireNumbers}
                        onChange={(e) => setForm((p) => ({ ...p, requireNumbers: e.target.checked }))}
                        style={{ width: "2.5em", height: "1.25em", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <label htmlFor="requireSpecialCharsSwitch" className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem", cursor: "pointer" }}>Require Special Characters</label>
                      <p className="text-muted small mb-0">Password must contain at least one special character (e.g. !, @, #, $, etc.).</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        id="requireSpecialCharsSwitch"
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.requireSpecialChars}
                        onChange={(e) => setForm((p) => ({ ...p, requireSpecialChars: e.target.checked }))}
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
