import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserSettings, saveUserSettings } from "../../api/userSettingsApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import "./LeadsPage.css";

const DEFAULT_FORM = {
  allowProfileEditing: true,
  allowPasswordChange: true,
  enableTwoFactorAuth: false,
  defaultLanguage: "en",
  defaultTimezone: "UTC",
};

export default function UserSettingsPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUserSettings();
        if (!isMounted) return;
        if (data) {
          setForm({
            allowProfileEditing: data.allowProfileEditing ?? true,
            allowPasswordChange: data.allowPasswordChange ?? true,
            enableTwoFactorAuth: data.enableTwoFactorAuth ?? false,
            defaultLanguage: data.defaultLanguage || "en",
            defaultTimezone: data.defaultTimezone || "UTC",
          });
        }
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load user settings"));
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
    setSaving(true);
    try {
      const payload = {
        allowProfileEditing: !!form.allowProfileEditing,
        allowPasswordChange: !!form.allowPasswordChange,
        enableTwoFactorAuth: !!form.enableTwoFactorAuth,
        defaultLanguage: form.defaultLanguage,
        defaultTimezone: form.defaultTimezone,
      };
      await saveUserSettings(payload);
      showSuccess("User settings saved successfully");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save user settings"));
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
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>User Settings</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Settings</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>User Settings</li>
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
          <h5 className="mb-0" style={{ fontWeight: "600", color: "#0f172a" }}>User Preferences & Features</h5>
          <p className="text-muted small mb-0">Control global user permissions, localization preferences, and security features.</p>
        </div>
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4">Loading settings...</div>
          ) : (
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Allow Profile Editing</label>
                      <p className="text-muted small mb-0">Allow users to edit their first name, last name, and contact details.</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.allowProfileEditing}
                        onChange={(e) => setForm((p) => ({ ...p, allowProfileEditing: e.target.checked }))}
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
                      <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Allow Password Change</label>
                      <p className="text-muted small mb-0">Enable users to change their account passwords directly.</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.allowPasswordChange}
                        onChange={(e) => setForm((p) => ({ ...p, allowPasswordChange: e.target.checked }))}
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
                      <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Enable Two-Factor Authentication</label>
                      <p className="text-muted small mb-0">Force users to verify their identity with a second security step on login.</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.enableTwoFactorAuth}
                        onChange={(e) => setForm((p) => ({ ...p, enableTwoFactorAuth: e.target.checked }))}
                        style={{ width: "2.5em", height: "1.25em", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <div>
                    <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Default Language</label>
                    <p className="text-muted small mb-2">Set the default UI localization language for newly registered users.</p>
                    <select
                      className="form-select animate-focus"
                      style={{ borderRadius: 8, height: 42 }}
                      value={form.defaultLanguage}
                      onChange={(e) => setForm((p) => ({ ...p, defaultLanguage: e.target.value }))}
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <div>
                    <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Default Timezone</label>
                    <p className="text-muted small mb-2">Set the fallback timezone for all system dates and dashboards.</p>
                    <select
                      className="form-select animate-focus"
                      style={{ borderRadius: 8, height: 42 }}
                      value={form.defaultTimezone}
                      onChange={(e) => setForm((p) => ({ ...p, defaultTimezone: e.target.value }))}
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="IST">IST (Indian Standard Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="PST">PST (Pacific Standard Time)</option>
                      <option value="GMT">GMT (Greenwich Mean Time)</option>
                      <option value="CET">CET (Central European Time)</option>
                    </select>
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