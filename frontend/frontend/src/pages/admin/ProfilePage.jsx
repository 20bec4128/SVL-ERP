import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProfile, updateMyProfile, uploadProfilePhoto } from "../../api/profileApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import {
  COUNTRY_CODE_OPTIONS,
  defaultCountryOption,
  ensureCountryCodeValue,
  getCountryAllowedLengths,
  getCountryDisplayMaxLength,
  getCountryOptionByValue,
  sanitizePhoneDigits,
  validatePhoneNumber,
} from "../../utils/phoneUtils";
import { useToast } from "../../components/system/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function ProfilePage() {
  const { showSuccess, showError } = useToast();
  const { updateUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", countryCode: "" });
  const [formErrors, setFormErrors] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMyProfile()
      .then((data) => { if (active) setProfile(data); })
      .catch((err) => { if (active) showError(extractApiErrorMessage(err, "Failed to load profile")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const openEditModal = () => {
    setForm({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phone: profile?.phone || "",
      countryCode: ensureCountryCodeValue(profile?.countryCode || defaultCountryOption.value),
    });
    setFormErrors({ firstName: "", lastName: "", phone: "" });
    setShowEditModal(true);
  };

  const handlePhoneChange = (value) => {
    const option = getCountryOptionByValue(form.countryCode);
    const lengths = getCountryAllowedLengths(form.countryCode);
    setForm((prev) => ({
      ...prev,
      phone: sanitizePhoneDigits(value, option?.maxLength, lengths),
    }));
    setFormErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleCountryCodeChange = (value) => {
    const nextCode = ensureCountryCodeValue(value);
    const option = getCountryOptionByValue(nextCode);
    const lengths = getCountryAllowedLengths(nextCode);
    setForm((prev) => ({
      ...prev,
      countryCode: nextCode,
      phone: sanitizePhoneDigits(prev.phone, option?.maxLength, lengths),
    }));
    setFormErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nextErrors = {
      firstName: form.firstName.trim() ? "" : "First name is required",
      lastName: form.lastName.trim() ? "" : "Last name is required",
      phone: validatePhoneNumber(form.phone, form.countryCode),
    };
    setFormErrors(nextErrors);
    if (nextErrors.firstName || nextErrors.lastName || nextErrors.phone) {
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        countryCode: form.countryCode,
      });
      setProfile(updated);
      updateUserProfile(updated);
      setShowEditModal(false);
      showSuccess("Profile updated successfully");
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showError("Only JPEG, PNG, and WebP images are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError("Photo must be smaller than 2 MB");
      e.target.value = "";
      return;
    }

    setPhotoUploading(true);
    try {
      const updated = await uploadProfilePhoto(file);
      setProfile(updated);
      updateUserProfile(updated);
      showSuccess("Profile photo updated");
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to upload photo"));
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username
    : "—";

  const photoUrl = resolveMediaUrl(profile?.profilePhotoUrl) || "/assets/img/profiles/avatar-12.jpg";
  const selectedCountry = getCountryOptionByValue(form.countryCode || defaultCountryOption.value);
  const phoneMaxLen =
    getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value) || selectedCountry?.maxLength;
  const phoneLengthDisplay = (() => {
    const allowed = getCountryAllowedLengths(form.countryCode || defaultCountryOption.value);
    return allowed.length ? allowed.join(" or ") : phoneMaxLen || selectedCountry?.maxLength || 15;
  })();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div className="my-auto mb-2">
          <h6 className="fw-medium mb-0">My Profile</h6>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <Link to="/profile-settings" className="btn btn-primary d-flex align-items-center">
            <i className="ti ti-settings me-2" />
            Settings
          </Link>
        </div>
      </div>

      <div className="row">
        {/* ── Left sidebar card ── */}
        <div className="col-xl-4">
          <div className="card">
            <div className="card-body text-center pb-3">
              {/* Avatar with camera overlay */}
              <div
                className="position-relative d-inline-block mb-3"
                style={{ cursor: "pointer" }}
                title="Change profile photo"
                onClick={() => !photoUploading && photoInputRef.current?.click()}
              >
                <span className="avatar avatar-xl avatar-rounded border border-2 border-white d-block mx-auto">
                  {photoUploading ? (
                    <span className="d-flex align-items-center justify-content-center w-100 h-100">
                      <span className="spinner-border spinner-border-sm text-primary" />
                    </span>
                  ) : (
                    <img src={photoUrl} alt={displayName} className="w-auto h-auto" />
                  )}
                </span>
                <span
                  className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 26, height: 26 }}
                >
                  <i className="ti ti-camera text-white" style={{ fontSize: 13 }} />
                </span>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="d-none"
                onChange={handlePhotoChange}
              />

              <h5 className="mb-1">{displayName}</h5>
              {profile?.designation && (
                <span className="badge badge-soft-dark fw-medium mb-2">
                  <i className="ti ti-point-filled me-1" />
                  {profile.designation}
                </span>
              )}

              <div className="border-top pt-3 mt-3 text-start">
                {profile?.employeeCode && (
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="d-inline-flex align-items-center text-muted">
                      <i className="ti ti-id me-2" />Employee ID
                    </span>
                    <span className="text-dark fw-medium">{profile.employeeCode}</span>
                  </div>
                )}
                {profile?.departmentName && (
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="d-inline-flex align-items-center text-muted">
                      <i className="ti ti-building me-2" />Department
                    </span>
                    <span className="text-dark">{profile.departmentName}</span>
                  </div>
                )}
                {profile?.teamName && (
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="d-inline-flex align-items-center text-muted">
                      <i className="ti ti-users me-2" />Team
                    </span>
                    <span className="text-dark">{profile.teamName}</span>
                  </div>
                )}
                {profile?.joinDate && (
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="d-inline-flex align-items-center text-muted">
                      <i className="ti ti-calendar-check me-2" />Joined
                    </span>
                    <span className="text-dark">{profile.joinDate}</span>
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-dark flex-fill" onClick={openEditModal}>
                  <i className="ti ti-edit me-1" />Edit Info
                </button>
                <Link to="/profile-settings" className="btn btn-primary flex-fill">
                  <i className="ti ti-key me-1" />Password
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right detail cards ── */}
        <div className="col-xl-8">
          {/* Contact */}
          <div className="card mb-3">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h6 className="mb-0">Contact Information</h6>
              <button className="btn btn-icon btn-sm" onClick={openEditModal} title="Edit">
                <i className="ti ti-edit" />
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <InfoField icon="ti-mail" label="Work Email" value={profile?.email} />
                <InfoField
                  icon="ti-phone"
                  label="Phone"
                  value={profile?.countryCode && profile?.phone
                    ? `${profile.countryCode} ${profile.phone}`
                    : profile?.phone || "—"}
                />
              </div>
            </div>
          </div>

          {/* Work Details (HR-controlled) */}
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">
                Work Details
                <span className="badge badge-soft-secondary ms-2 fw-normal" style={{ fontSize: 11 }}>Managed by HR</span>
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <InfoField icon="ti-briefcase" label="Designation" value={profile?.designation} />
                <InfoField icon="ti-building" label="Department" value={profile?.departmentName} />
                <InfoField icon="ti-users" label="Team" value={profile?.teamName} />
                <InfoField icon="ti-school" label="Institution" value={profile?.institutionName} />
              </div>
            </div>
          </div>

          {/* Account Info (system) */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Account Information</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <InfoField icon="ti-user" label="Username" value={profile?.username} />
                <InfoField icon="ti-shield" label="Role" value={profile?.role} />
                <InfoField
                  icon="ti-circle-check"
                  label="Status"
                  value={
                    profile?.active
                      ? <span className="badge bg-success-transparent text-success">Active</span>
                      : <span className="badge bg-danger-transparent text-danger">Inactive</span>
                  }
                />
                <InfoField icon="ti-calendar-plus" label="Created" value={formatDate(profile?.createdAt)} />
                <InfoField icon="ti-login" label="Last Login" value={formatDate(profile?.lastLoginAt)} />
                <InfoField icon="ti-world" label="Registered IP" value={profile?.registeredIp} />
                <InfoField icon="ti-wifi" label="Last Active IP" value={profile?.lastActiveIp} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,.4)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Profile</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className={`form-control${formErrors.firstName ? " is-invalid" : ""}`}
                        value={form.firstName}
                        maxLength={80}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, firstName: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, firstName: "" }));
                        }}
                      />
                      {formErrors.firstName ? <div className="invalid-feedback">{formErrors.firstName}</div> : null}
                    </div>
                    <div className="col-6">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className={`form-control${formErrors.lastName ? " is-invalid" : ""}`}
                        value={form.lastName}
                        maxLength={80}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, lastName: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, lastName: "" }));
                        }}
                      />
                      {formErrors.lastName ? <div className="invalid-feedback">{formErrors.lastName}</div> : null}
                    </div>
                    <div className="col-4">
                      <label className="form-label">Country Code</label>
                      <select
                        className="form-select"
                        value={form.countryCode}
                        onChange={(e) => handleCountryCodeChange(e.target.value)}
                      >
                        {COUNTRY_CODE_OPTIONS.map((opt, idx) => (
                          <option key={`${opt.value}-${opt.country}-${idx}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-8">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className={`form-control${formErrors.phone ? " is-invalid" : ""}`}
                        value={form.phone}
                        inputMode="numeric"
                        maxLength={phoneMaxLen || 15}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />
                      {formErrors.phone ? (
                        <div className="invalid-feedback">{formErrors.phone}</div>
                      ) : (
                        <div className="form-text">Expected length: {phoneLengthDisplay}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoField({ icon, label, value }) {
  return (
    <div className="col-md-6">
      <div className="d-flex align-items-start gap-2">
        <span className="avatar avatar-xs bg-light rounded flex-shrink-0 mt-1">
          <i className={`ti ${icon} text-muted`} />
        </span>
        <div>
          <p className="text-muted mb-0" style={{ fontSize: 12 }}>{label}</p>
          <p className="mb-0 fw-medium">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
