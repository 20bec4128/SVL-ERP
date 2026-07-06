import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRegistrationSettings, saveRegistrationSettings } from "../../api/registrationSettingsApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import "./LeadsPage.css";

const DEFAULT_FORM = {
  allowSelfRegistration: true,
  requireEmailVerification: false,
  requireAdminApproval: false,
  allowedDomains: "",
  defaultRole: "EMPLOYEE",
};

export default function RegistrationSettingsPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getRegistrationSettings();
        if (!isMounted) return;
        if (data) {
          setForm({
            allowSelfRegistration: data.allowSelfRegistration ?? true,
            requireEmailVerification: data.requireEmailVerification ?? false,
            requireAdminApproval: data.requireAdminApproval ?? false,
            allowedDomains: data.allowedDomains || "",
            defaultRole: data.defaultRole || "EMPLOYEE",
          });
        }
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load registration settings"));
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
        allowSelfRegistration: !!form.allowSelfRegistration,
        requireEmailVerification: !!form.requireEmailVerification,
        requireAdminApproval: !!form.requireAdminApproval,
        allowedDomains: String(form.allowedDomains || "").trim(),
        defaultRole: form.defaultRole,
      };
      await saveRegistrationSettings(payload);
      showSuccess("Registration settings saved successfully");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save registration settings"));
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
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Registration Settings</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Settings</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Registration Settings</li>
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
          <h5 className="mb-0" style={{ fontWeight: "600", color: "#0f172a" }}>User Sign-up Configuration</h5>
          <p className="text-muted small mb-0">Manage how users self-register, default authorization roles, and domains allowed for registration.</p>
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
                      <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Allow Self-Registration</label>
                      <p className="text-muted small mb-0">Allow visitors to create an account by themselves.</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.allowSelfRegistration}
                        onChange={(e) => setForm((p) => ({ ...p, allowSelfRegistration: e.target.checked }))}
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
                      <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Require Email Verification</label>
                      <p className="text-muted small mb-0">Users must verify their email address before logging in.</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.requireEmailVerification}
                        onChange={(e) => setForm((p) => ({ ...p, requireEmailVerification: e.target.checked }))}
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
                      <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Require Admin Approval</label>
                      <p className="text-muted small mb-0">New accounts must be manually activated by an administrator.</p>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!form.requireAdminApproval}
                        onChange={(e) => setForm((p) => ({ ...p, requireAdminApproval: e.target.checked }))}
                        style={{ width: "2.5em", height: "1.25em", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border p-3" style={{ borderRadius: 10, height: "100%" }}>
                  <div>
                    <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "0.95rem" }}>Default Role</label>
                    <p className="text-muted small mb-2">The default security role assigned to newly registered users.</p>
                    <select
                      className="form-select animate-focus"
                      style={{ borderRadius: 8, height: 42 }}
                      value={form.defaultRole}
                      onChange={(e) => setForm((p) => ({ ...p, defaultRole: e.target.value }))}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="CUSTOMER">Customer</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="card border p-3" style={{ borderRadius: 10 }}>
                  <label className="form-label fw-bold text-dark" style={{ fontSize: "0.95rem" }}>Allowed Email Domains</label>
                  <p className="text-muted small mb-2">Restricted to specific domains (comma separated). Leave empty to allow all domains (e.g. <code>mycompany.com, clientcorp.org</code>).</p>
                  <input
                    className="form-control animate-focus"
                    style={{ borderRadius: 8, height: 42 }}
                    value={form.allowedDomains}
                    onChange={(e) => setForm((p) => ({ ...p, allowedDomains: e.target.value }))}
                    placeholder="e.g. company.com, partner.org"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}