import { useState } from "react";
import { Link } from "react-router-dom";
import { changePassword } from "../../api/profileApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

function getStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "danger", "warning", "info", "success"];

export default function ProfileSettingsPage() {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength = getStrength(form.newPassword);
  const match = form.newPassword && form.confirmPassword
    ? form.newPassword === form.confirmPassword
    : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      showError("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await changePassword(form.oldPassword, form.newPassword);
      showSuccess("Password changed successfully. Please log in again.");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to change password"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div className="my-auto mb-2">
          <h6 className="fw-medium mb-0">
            <Link to="/profile" className="me-2 text-muted">
              <i className="ti ti-arrow-left" />
            </Link>
            Profile Settings
          </h6>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-6 col-lg-8">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0 d-flex align-items-center gap-2">
                <i className="ti ti-lock text-primary" />
                Change Password
              </h6>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <div className="input-group">
                    <input
                      type={showOld ? "text" : "password"}
                      className="form-control"
                      name="oldPassword"
                      value={form.oldPassword}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowOld((v) => !v)}
                      tabIndex={-1}
                    >
                      <i className={`ti ${showOld ? "ti-eye-off" : "ti-eye"}`} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <div className="input-group">
                    <input
                      type={showNew ? "text" : "password"}
                      className="form-control"
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                    >
                      <i className={`ti ${showNew ? "ti-eye-off" : "ti-eye"}`} />
                    </button>
                  </div>
                  {form.newPassword && (
                    <div className="mt-2">
                      <div className="progress" style={{ height: 4 }}>
                        <div
                          className={`progress-bar bg-${strengthColors[strength]}`}
                          style={{ width: `${strength * 25}%`, transition: "width 0.3s" }}
                        />
                      </div>
                      <small className={`text-${strengthColors[strength]}`}>
                        {strengthLabels[strength]}
                      </small>
                    </div>
                  )}
                  <div className="form-text">
                    Min 8 chars · one uppercase · one number · one special character
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Confirm New Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={`form-control${match === false ? " is-invalid" : match === true ? " is-valid" : ""}`}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      <i className={`ti ${showConfirm ? "ti-eye-off" : "ti-eye"}`} />
                    </button>
                    {match === false && (
                      <div className="invalid-feedback">Passwords do not match</div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

