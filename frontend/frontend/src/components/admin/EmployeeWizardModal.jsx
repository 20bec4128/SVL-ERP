import { useEffect, useMemo, useState } from "react";
import "../../../public/assets/css/addModalShared.css";
import "./UserWizardModal.css";
import {
  COUNTRY_CODE_OPTIONS,
  defaultCountryOption,
  getCountryDisplayMaxLength,
  sanitizePhoneDigits,
  validatePhoneNumber,
} from "../../utils/phoneUtils";

const YES_NO_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
];

export default function EmployeeWizardModal({
  wizardStep,
  form,
  setForm,
  mode = "create",
  headOfficeId,
  setHeadOfficeId,
  branchId,
  setBranchId,
  departmentId,
  setDepartmentId,
  designationId,
  setDesignationId,
  headOffices,
  branches,
  departments,
  designations,
  loadingMasters,
  saving,
  onNext,
  onPrev,
  onSubmit,
  onClose,
}) {
  const totalSteps = 4;
  const [viewer, setViewer] = useState(null); // { title, url }
  const [viewerObjectUrl, setViewerObjectUrl] = useState(null);
  const [phoneError, setPhoneError] = useState("");

  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8082").replace(/\/+$/, ""),
    [],
  );

  const toFileUrl = (path) => {
    if (!path) return "";
    const normalized = String(path).startsWith("/") ? String(path) : `/${path}`;
    return `${apiBase}${normalized}`;
  };

  const getDisplayName = (path) => {
    if (!path) return "";
    const clean = String(path).split("?")[0];
    const parts = clean.split("/");
    return parts[parts.length - 1] || clean;
  };

  useEffect(() => {
    return () => {
      if (viewerObjectUrl) {
        URL.revokeObjectURL(viewerObjectUrl);
      }
    };
  }, [viewerObjectUrl]);

  const openViewer = async (title, fileOrPath) => {
    try {
      if (viewerObjectUrl) {
        URL.revokeObjectURL(viewerObjectUrl);
        setViewerObjectUrl(null);
      }

      if (!fileOrPath) return;

      if (fileOrPath instanceof File) {
        const objectUrl = URL.createObjectURL(fileOrPath);
        setViewerObjectUrl(objectUrl);
        setViewer({ title, url: objectUrl });
        return;
      }

      const rawPath = String(fileOrPath || "").trim();
      const employeeFileMatch = rawPath.match(/uploads\/employees\/(\d+)\/([^/]+)/i);
      const url = employeeFileMatch
        ? `${apiBase}/api/employees/${employeeFileMatch[1]}/files/${encodeURIComponent(employeeFileMatch[2])}`
        : toFileUrl(fileOrPath);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load preview");
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setViewerObjectUrl(objectUrl);
      setViewer({ title, url: objectUrl });
    } catch {
      const url = fileOrPath instanceof File ? null : toFileUrl(fileOrPath);
      if (url) {
        window.open(url, "_blank", "noreferrer");
        return;
      }
    }
  };

  const handleDeclarationDateChange = (value) => {
    setForm((prev) => {
      if (!value) {
        return { ...prev, declarationDate: "" };
      }

      const [year] = String(value).split("-");
      if (!year || year.length !== 4 || !/^\d{4}$/.test(year)) {
        return prev;
      }

      return { ...prev, declarationDate: value };
    });
  };

  useEffect(() => {
    if (!headOfficeId) {
      setBranchId("");
      setDepartmentId("");
      setDesignationId("");
    }
  }, [headOfficeId, setBranchId, setDepartmentId, setDesignationId]);

  useEffect(() => {
    if (!branchId) {
      setDepartmentId("");
      setDesignationId("");
    }
  }, [branchId, setDepartmentId, setDesignationId]);

  useEffect(() => {
    if (!departmentId) {
      setDesignationId("");
    }
  }, [departmentId, setDesignationId]);

  const stepPercent = `${((wizardStep + 1) / totalSteps) * 100}%`;

  const phoneFieldProps = (fieldKey) => ({
    value: form[fieldKey] || "",
    onChange: (e) => {
      const sanitized = sanitizePhoneDigits(e.target.value, getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value));
      setForm((p) => ({ ...p, [fieldKey]: sanitized }));
      if (phoneError) {
        setPhoneError(validatePhoneNumber(sanitized, form.countryCode || defaultCountryOption.value));
      }
    },
  });

  return (
    <>
      <div className="avm-backdrop" role="presentation">
        <div
          className="avm-modal"
          style={{ maxWidth: "980px" }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="avm-modal-header">
            <h2 className="avm-modal-title">Add Employee</h2>
            <button type="button" className="avm-modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          <div className="avm-body">
            <div className="user-wizard">
              <div className="wizard-progress-bar">
                <div className="wizard-progress" style={{ width: stepPercent }} />
              </div>

              <div className="wizard-circles-container">
                <div className="wizard-circle-item">
                  <div className={`wizard-circle ${wizardStep >= 0 ? "active" : ""}`}>
                    <i className="ti ti-sitemap" />
                  </div>
                  <div className="wizard-circle-label">Branch Deatails</div>
                </div>
                <div className="wizard-circle-item">
                  <div className={`wizard-circle ${wizardStep >= 1 ? "active" : ""}`}>
                    <i className="ti ti-user" />
                  </div>
                  <div className="wizard-circle-label">Personal</div>
                </div>
                <div className="wizard-circle-item">
                  <div className={`wizard-circle ${wizardStep >= 2 ? "active" : ""}`}>
                    <i className="ti ti-file-upload" />
                  </div>
                  <div className="wizard-circle-label">Documents</div>
                </div>
                <div className="wizard-circle-item">
                  <div className={`wizard-circle ${wizardStep >= 3 ? "active" : ""}`}>
                    <i className="ti ti-clipboard-text" />
                  </div>
                  <div className="wizard-circle-label">Other</div>
                </div>
              </div>

              <div className="wizard-content" style={{ minHeight: 300 }}>
                {wizardStep === 0 && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Head Office *</label>
                      <select
                        className="form-select user-wizard-input"
                        value={headOfficeId}
                        onChange={(e) => setHeadOfficeId(e.target.value)}
                        disabled={loadingMasters}
                      >
                        <option value="">Select</option>
                        {headOffices.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Branch *</label>
                      <select
                        className="form-select user-wizard-input"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        disabled={!headOfficeId || loadingMasters}
                      >
                        <option value="">Select</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <select
                        className="form-select user-wizard-input"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        disabled={!branchId || loadingMasters}
                      >
                        <option value="">Select</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Team / Designation *</label>
                      <select
                        className="form-select user-wizard-input"
                        value={designationId}
                        onChange={(e) => setDesignationId(e.target.value)}
                        disabled={!departmentId || loadingMasters}
                      >
                        <option value="">Select</option>
                        {designations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {wizardStep === 1 && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.nameInCaps}
                        onChange={(e) => setForm((p) => ({ ...p, nameInCaps: e.target.value.toUpperCase() }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Father’s Name</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.fatherName}
                        onChange={(e) => setForm((p) => ({ ...p, fatherName: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Mother's Name</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.motherName}
                        onChange={(e) => setForm((p) => ({ ...p, motherName: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Number *</label>
                      <div className="employee-phone-input user-wizard-phone-group">
                        <select
                          className="employee-phone-code"
                          value={form.countryCode || defaultCountryOption.value}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, countryCode: e.target.value }));
                            setPhoneError("");
                          }}
                        >
                          {COUNTRY_CODE_OPTIONS.map((option) => (
                            <option key={`${option.country}-${option.callingCode}`} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          className="employee-phone-number"
                          placeholder={`Enter ${getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value)} digit number`}
                          maxLength={getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value) || 15}
                          {...phoneFieldProps("personalContactNumber")}
                        />
                      </div>
                      {phoneError ? <div className="avm-error">{phoneError}</div> : null}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.location}
                        onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Pin Code</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.pinCode}
                        onChange={(e) => setForm((p) => ({ ...p, pinCode: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.state}
                        onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Current Address</label>
                      <textarea
                        rows={2}
                        className="form-control user-wizard-input"
                        value={form.currentAddress}
                        onChange={(e) => setForm((p) => ({ ...p, currentAddress: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Permanent Address</label>
                      <textarea
                        rows={2}
                        className="form-control user-wizard-input"
                        value={form.permanentAddress}
                        onChange={(e) => setForm((p) => ({ ...p, permanentAddress: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control user-wizard-input"
                        value={form.personalEmail}
                        onChange={(e) => setForm((p) => ({ ...p, personalEmail: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Official Email</label>
                      <input
                        type="email"
                        className="form-control user-wizard-input"
                        value={form.officialEmail}
                        onChange={(e) => setForm((p) => ({ ...p, officialEmail: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">DOB *</label>
                      <input
                        type="date"
                        className="form-control user-wizard-input"
                        value={form.dateOfBirth}
                        onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
  <label className="form-label">Blood Group</label>
  <select
    className="form-select user-wizard-input"
    value={form.bloodGroup}
    onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))}
  >
    <option value="">Select</option>
    <option value="A+">A+</option>
    <option value="A-">A-</option>
    <option value="B+">B+</option>
    <option value="B-">B-</option>
    <option value="AB+">AB+</option>
    <option value="AB-">AB-</option>
    <option value="O+">O+</option>
    <option value="O-">O-</option>
  </select>
</div>
                    <div className="col-md-6">
                      <label className="form-label">Marital Status</label>
                      <select
                        className="form-select user-wizard-input"
                        value={form.maritalStatus}
                        onChange={(e) => setForm((p) => ({ ...p, maritalStatus: e.target.value }))}
                      >
                        <option value="">Select</option>
                        <option value="MARRIED">Married</option>
                        <option value="SINGLE">Single</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                      </select>
                    </div>
                    {String(form.maritalStatus || "").toUpperCase() === "MARRIED" && (
                      <div className="col-md-6">
                        <label className="form-label">Spouse Name</label>
                        <input
                          type="text"
                          className="form-control user-wizard-input"
                          value={form.spouseName}
                          onChange={(e) => setForm((p) => ({ ...p, spouseName: e.target.value }))}
                        />
                      </div>
                    )}
                    
                    <div className="col-md-6">
                      <label className="form-label">Pan Card No</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.panCardNo}
                        onChange={(e) => setForm((p) => ({ ...p, panCardNo: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Aadhar Card No</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.aadharCardNo}
                        onChange={(e) => setForm((p) => ({ ...p, aadharCardNo: e.target.value }))}
                      />
                    </div>
                    
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Candidate Photo</label>
                      <input
                        type="file"
                        className="form-control user-wizard-input"
                        accept="image/*"
                        onChange={(e) => setForm((p) => ({ ...p, candidatePhoto: e.target.files?.[0] || null }))}
                      />
                      {(form.candidatePhoto || form.candidatePhotoPath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("Candidate Photo", form.candidatePhoto || form.candidatePhotoPath);
                            }}
                          >
                            {form.candidatePhoto ? form.candidatePhoto.name : getDisplayName(form.candidatePhotoPath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Upload Candidate Aadhar Card</label>
                      <input type="file" className="form-control user-wizard-input" onChange={(e) => setForm((p) => ({ ...p, uploadCandidateAadharCard: e.target.files?.[0] || null }))} />
                      {(form.uploadCandidateAadharCard || form.aadharCardPath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("Aadhar Card", form.uploadCandidateAadharCard || form.aadharCardPath);
                            }}
                          >
                            {form.uploadCandidateAadharCard ? form.uploadCandidateAadharCard.name : getDisplayName(form.aadharCardPath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Upload Candidate Pan Card</label>
                      <input type="file" className="form-control user-wizard-input" onChange={(e) => setForm((p) => ({ ...p, uploadCandidatePanCard: e.target.files?.[0] || null }))} />
                      {(form.uploadCandidatePanCard || form.panCardPath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("PAN Card", form.uploadCandidatePanCard || form.panCardPath);
                            }}
                          >
                            {form.uploadCandidatePanCard ? form.uploadCandidatePanCard.name : getDisplayName(form.panCardPath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Upload Bank Pass Book / Cancelled Cheque</label>
                      <input type="file" className="form-control user-wizard-input" onChange={(e) => setForm((p) => ({ ...p, uploadBankPassBookCopy: e.target.files?.[0] || null }))} />
                      {(form.uploadBankPassBookCopy || form.bankPassbookPath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("Bank Passbook / Cheque", form.uploadBankPassBookCopy || form.bankPassbookPath);
                            }}
                          >
                            {form.uploadBankPassBookCopy ? form.uploadBankPassBookCopy.name : getDisplayName(form.bankPassbookPath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Graduation Certificate</label>
                      <input type="file" className="form-control user-wizard-input" onChange={(e) => setForm((p) => ({ ...p, uploadGraduationCertificate: e.target.files?.[0] || null }))} />
                      {(form.uploadGraduationCertificate || form.graduationCertificatePath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("Graduation Certificate", form.uploadGraduationCertificate || form.graduationCertificatePath);
                            }}
                          >
                            {form.uploadGraduationCertificate ? form.uploadGraduationCertificate.name : getDisplayName(form.graduationCertificatePath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Graduation Marksheet</label>
                      <input type="file" className="form-control user-wizard-input" onChange={(e) => setForm((p) => ({ ...p, uploadGraduationMarksheet: e.target.files?.[0] || null }))} />
                      {(form.uploadGraduationMarksheet || form.graduationMarksheetPath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("Graduation Marksheet", form.uploadGraduationMarksheet || form.graduationMarksheetPath);
                            }}
                          >
                            {form.uploadGraduationMarksheet ? form.uploadGraduationMarksheet.name : getDisplayName(form.graduationMarksheetPath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">HSC Mark Sheet</label>
                      <input type="file" className="form-control user-wizard-input" onChange={(e) => setForm((p) => ({ ...p, uploadHscMarkSheet: e.target.files?.[0] || null }))} />
                      {(form.uploadHscMarkSheet || form.hscMarksheetPath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("HSC Marksheet", form.uploadHscMarkSheet || form.hscMarksheetPath);
                            }}
                          >
                            {form.uploadHscMarkSheet ? form.uploadHscMarkSheet.name : getDisplayName(form.hscMarksheetPath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">SSLC Mark Sheet</label>
                      <input type="file" className="form-control user-wizard-input" onChange={(e) => setForm((p) => ({ ...p, uploadSslcMarkSheet: e.target.files?.[0] || null }))} />
                      {(form.uploadSslcMarkSheet || form.sslcMarksheetPath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("SSLC Marksheet", form.uploadSslcMarkSheet || form.sslcMarksheetPath);
                            }}
                          >
                            {form.uploadSslcMarkSheet ? form.uploadSslcMarkSheet.name : getDisplayName(form.sslcMarksheetPath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Community Certificate</label>
                      <input type="file" className="form-control user-wizard-input" onChange={(e) => setForm((p) => ({ ...p, uploadCommunityCertificate: e.target.files?.[0] || null }))} />
                      {(form.uploadCommunityCertificate || form.communityCertificatePath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("Community Certificate", form.uploadCommunityCertificate || form.communityCertificatePath);
                            }}
                          >
                            {form.uploadCommunityCertificate ? form.uploadCommunityCertificate.name : getDisplayName(form.communityCertificatePath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Bank Account Holder Name</label>
                      <input type="text" className="form-control user-wizard-input" value={form.bankAccountHolderName} onChange={(e) => setForm((p) => ({ ...p, bankAccountHolderName: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Bank Account Number</label>
                      <input type="text" className="form-control user-wizard-input" value={form.bankAccountNumber} onChange={(e) => setForm((p) => ({ ...p, bankAccountNumber: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">IFSC Code</label>
                      <input type="text" className="form-control user-wizard-input" value={form.ifscCode} onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Bank & Branch</label>
                      <input type="text" className="form-control user-wizard-input" value={form.bankAndBranch} onChange={(e) => setForm((p) => ({ ...p, bankAndBranch: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <hr className="my-1" />
                      <h6 className="mb-0">Previous Employment</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Previous Company Joining Date</label>
                      <input
                        type="date"
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentJoiningDate}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentJoiningDate: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Relieving Date</label>
                      <input
                        type="date"
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentRelievingDate}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentRelievingDate: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Salary at the Time of Joining</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentSalaryAtJoining}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentSalaryAtJoining: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Salary at the Time of Relieving</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentSalaryAtRelieving}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentSalaryAtRelieving: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Whether Relieved with Notice Period</label>
                      <select
                        className="form-select user-wizard-input"
                        value={form.previousEmploymentRelievedWithNoticePeriod}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentRelievedWithNoticePeriod: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {YES_NO_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Whether Absconded</label>
                      <select
                        className="form-select user-wizard-input"
                        value={form.previousEmploymentAbsconded}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentAbsconded: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {YES_NO_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Designation at the Time of Joining</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentDesignationAtJoining}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentDesignationAtJoining: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Designation at the Time of Relieving</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentDesignationAtRelieving}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentDesignationAtRelieving: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Previous Company Manager Name</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentManagerName}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentManagerName: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Manager Mobile Number</label>
                      <input
                        type="tel"
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentManagerMobileNumber}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentManagerMobileNumber: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Previous Company Address</label>
                      <textarea
                        rows={2}
                        className="form-control user-wizard-input"
                        value={form.previousEmploymentCompanyAddress}
                        onChange={(e) => setForm((p) => ({ ...p, previousEmploymentCompanyAddress: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Experience Certificate</label>
                      <input
                        type="file"
                        className="form-control user-wizard-input"
                        onChange={(e) => setForm((p) => ({ ...p, uploadExperienceCertificate: e.target.files?.[0] || null }))}
                      />
                      {(form.uploadExperienceCertificate || form.experienceCertificatePath) && (
                        <div className="mt-1 small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openViewer("Experience Certificate", form.uploadExperienceCertificate || form.experienceCertificatePath);
                            }}
                          >
                            {form.uploadExperienceCertificate ? form.uploadExperienceCertificate.name : getDisplayName(form.experienceCertificatePath)} (View)
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Graduation Details *</label>
                      <select
                        className="form-select user-wizard-input"
                        value={form.graduationDetails}
                        onChange={(e) => setForm((p) => ({ ...p, graduationDetails: e.target.value }))}
                      >
                        <option value="">Select</option>
                        <option value="UG">UG</option>
                        <option value="PG">PG</option>
                        <option value="DIPLOMA">Diploma</option>
                        <option value="OTHERS">Others</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">HSC Mark & Year *</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.hscMarkAndYear}
                        onChange={(e) => setForm((p) => ({ ...p, hscMarkAndYear: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">SSLC Mark & Year *</label>
                      <input
                        type="text"
                        className="form-control user-wizard-input"
                        value={form.sslcMarkAndYear}
                        onChange={(e) => setForm((p) => ({ ...p, sslcMarkAndYear: e.target.value }))}
                      />
                    </div>

                    <div className="col-12">
                      <hr className="my-1" />
                      <h6 className="mb-0">Emergency Contacts</h6>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Name 1</label>
                      <input type="text" className="form-control user-wizard-input" value={form.emergencyContactName1} onChange={(e) => setForm((p) => ({ ...p, emergencyContactName1: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Relationship 1</label>
                      <input type="text" className="form-control user-wizard-input" value={form.emergencyContactRelation1} onChange={(e) => setForm((p) => ({ ...p, emergencyContactRelation1: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Contact No 1</label>
                      <div className="employee-phone-input user-wizard-phone-group">
                        <select
                          className="employee-phone-code"
                          value={form.countryCode || defaultCountryOption.value}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, countryCode: e.target.value }));
                            setPhoneError("");
                          }}
                        >
                          {COUNTRY_CODE_OPTIONS.map((option) => (
                            <option key={`${option.country}-${option.callingCode}`} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          className="employee-phone-number"
                          maxLength={getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value) || 15}
                          value={form.emergencyContactPhone1 || ""}
                          onChange={(e) => {
                            const sanitized = sanitizePhoneDigits(
                              e.target.value,
                              getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value)
                            );
                            setForm((p) => ({ ...p, emergencyContactPhone1: sanitized }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Name 2</label>
                      <input type="text" className="form-control user-wizard-input" value={form.emergencyContactName2} onChange={(e) => setForm((p) => ({ ...p, emergencyContactName2: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Relationship 2</label>
                      <input type="text" className="form-control user-wizard-input" value={form.emergencyContactRelation2} onChange={(e) => setForm((p) => ({ ...p, emergencyContactRelation2: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Contact No 2</label>
                      <div className="employee-phone-input user-wizard-phone-group">
                        <select
                          className="employee-phone-code"
                          value={form.countryCode || defaultCountryOption.value}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, countryCode: e.target.value }));
                            setPhoneError("");
                          }}
                        >
                          {COUNTRY_CODE_OPTIONS.map((option) => (
                            <option key={`${option.country}-${option.callingCode}`} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          className="employee-phone-number"
                          maxLength={getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value) || 15}
                          value={form.emergencyContactPhone2 || ""}
                          onChange={(e) => {
                            const sanitized = sanitizePhoneDigits(
                              e.target.value,
                              getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value)
                            );
                            setForm((p) => ({ ...p, emergencyContactPhone2: sanitized }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <hr className="my-1" />
                      <h6 className="mb-0">Friends / Ex-Colleagues</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Name 1</label>
                      <input type="text" className="form-control user-wizard-input" value={form.friendRefName1} onChange={(e) => setForm((p) => ({ ...p, friendRefName1: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact No 1</label>
                      <div className="employee-phone-input user-wizard-phone-group">
                        <select
                          className="employee-phone-code"
                          value={form.countryCode || defaultCountryOption.value}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, countryCode: e.target.value }));
                            setPhoneError("");
                          }}
                        >
                          {COUNTRY_CODE_OPTIONS.map((option) => (
                            <option key={`${option.country}-${option.callingCode}`} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          className="employee-phone-number"
                          maxLength={getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value) || 15}
                          value={form.friendRefContact1 || ""}
                          onChange={(e) => {
                            const sanitized = sanitizePhoneDigits(
                              e.target.value,
                              getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value)
                            );
                            setForm((p) => ({ ...p, friendRefContact1: sanitized }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Name 2</label>
                      <input type="text" className="form-control user-wizard-input" value={form.friendRefName2} onChange={(e) => setForm((p) => ({ ...p, friendRefName2: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact No 2</label>
                      <div className="employee-phone-input user-wizard-phone-group">
                        <select
                          className="employee-phone-code"
                          value={form.countryCode || defaultCountryOption.value}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, countryCode: e.target.value }));
                            setPhoneError("");
                          }}
                        >
                          {COUNTRY_CODE_OPTIONS.map((option) => (
                            <option key={`${option.country}-${option.callingCode}`} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          className="employee-phone-number"
                          maxLength={getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value) || 15}
                          value={form.friendRefContact2 || ""}
                          onChange={(e) => {
                            const sanitized = sanitizePhoneDigits(
                              e.target.value,
                              getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value)
                            );
                            setForm((p) => ({ ...p, friendRefContact2: sanitized }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">In Which Branch You Need to Join</label>
                      <input type="text" className="form-control user-wizard-input" value={form.branchToJoin} onChange={(e) => setForm((p) => ({ ...p, branchToJoin: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">From Which Platform You Came to Know</label>
                      <input type="text" className="form-control user-wizard-input" value={form.platformSource} onChange={(e) => setForm((p) => ({ ...p, platformSource: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">If PF Account Available (UAN)</label>
                      <input type="text" className="form-control user-wizard-input" value={form.pfUan} onChange={(e) => setForm((p) => ({ ...p, pfUan: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">ESI No (If Available)</label>
                      <input type="text" className="form-control user-wizard-input" value={form.esiNo} onChange={(e) => setForm((p) => ({ ...p, esiNo: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Declaration (Date)</label>
                      <input
                        type="date"
                        className="form-control user-wizard-input"
                        value={form.declarationDate}
                        max="9999-12-31"
                        onChange={(e) => handleDeclarationDateChange(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Declaration (Place)</label>
                      <input type="text" className="form-control user-wizard-input" value={form.declarationPlace} onChange={(e) => setForm((p) => ({ ...p, declarationPlace: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>

              <div className="wizard-nav">
                {wizardStep > 0 ? (
                  <button className="btn btn-light" onClick={onPrev} disabled={saving}>
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="wizard-nav-spacer"></div>
                {wizardStep < totalSteps - 1 ? (
                  <button className="btn btn-primary" onClick={onNext} disabled={saving}>
                    Next
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={onSubmit} disabled={saving}>
                    {saving ? "Saving..." : (mode === "edit" ? "Update" : "Create")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewer?.url && (
        <>
          <div className="modal fade show" style={{ display: "block", zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{viewer.title || "View File"}</h5>
                  <button className="btn-close" onClick={() => setViewer(null)} />
                </div>
                <div className="modal-body" style={{ height: "75vh" }}>
                  <iframe title="file-viewer" src={viewer.url} style={{ width: "100%", height: "100%", border: 0 }} />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={() => setViewer(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} onClick={() => setViewer(null)} />
        </>
      )}
    </>
  );
}


