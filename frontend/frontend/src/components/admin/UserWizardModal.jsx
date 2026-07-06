import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "./UserWizardModal.css";
import {
  getCountryAllowedLengths,
  getCountryOptionByValue,
  sanitizePhoneDigits,
} from "../../utils/phoneUtils";

export default function UserWizardModal({
  wizardStep,
  form,
  setForm,
  onRoleChange,
  phoneCountryCode,
  setPhoneCountryCode,
  phoneError,
  setPhoneError,
  handlePhoneInput,
  handlePhoneBlur,
  getPhoneMaxLength,
  COUNTRY_CODE_OPTIONS,
  showCreatePassword,
  setShowCreatePassword,
  allowedAssignRoles,
  headOfficeOptions,
  selectedHeadOfficeId,
  onHeadOfficeChange,
  branchOptions,
  departmentOptions,
  teamOptions,
  selectedBranchId,
  selectedDepartmentId,
  selectedTeamId,
  onBranchChange,
  onDepartmentChange,
  onTeamChange,
  availableEmployees,
  selectedEmployeeId,
  handleSelectEmployee,
  employeeScopeReady,
  employeeScopeLoading,
  onNext,
  onPrev,
  onSubmit,
  onClose,
  saving,
}) {
  const shouldReduceMotion = useReducedMotion();
  const totalSteps = 4;
  const phonePickerRef = useRef(null);
  const [phonePickerOpen, setPhonePickerOpen] = useState(false);
  const selectedRole = String(form.role || "EMPLOYEE").toUpperCase();
  const selectedBranch = branchOptions.find((branch) => String(branch.id) === String(selectedBranchId));
  const selectedDepartment = departmentOptions.find(
    (department) => String(department.id) === String(selectedDepartmentId),
  );
  const selectedDesignation = teamOptions.find((team) => String(team.id) === String(selectedTeamId));
  const scopeItems =
    selectedRole === "ADMIN"
      ? [
          { label: "Branch", value: selectedBranch?.name || "Not selected" },
        ]
      : selectedRole === "MANAGER"
        ? [
            { label: "Branch", value: selectedBranch?.name || "Not selected" },
            { label: "Department", value: selectedDepartment?.name || "Not selected" },
          ]
        : [
            { label: "Branch", value: selectedBranch?.name || "Not selected" },
            { label: "Department", value: selectedDepartment?.name || "Not selected" },
            { label: "Designation", value: selectedDesignation?.name || "Not selected" },
          ];
  const phoneDisplayMaxLength = getPhoneMaxLength();
  const phoneLengthDisplay = useMemo(() => {
    const allowed = getCountryAllowedLengths(phoneCountryCode);
    return allowed.length ? allowed.join(" or ") : phoneDisplayMaxLength || 15;
  }, [phoneCountryCode, phoneDisplayMaxLength]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!phonePickerRef.current) return;
      if (!phonePickerRef.current.contains(event.target)) {
        setPhonePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handlePhoneCountryCodeChange = (value) => {
    const nextCode = value || "+91";
    const option = getCountryOptionByValue(nextCode);
    const lengths = getCountryAllowedLengths(nextCode);
    const maxLength = option?.maxLength || 15;

    setPhoneCountryCode(nextCode);
    setForm((prev) => ({
      ...prev,
      phone: sanitizePhoneDigits(prev.phone, maxLength, lengths),
    }));
    setPhoneError?.("");
    setPhonePickerOpen(false);
  };

  return (
    <>
      <motion.div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex="-1"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={shouldReduceMotion ? {} : { opacity: 1 }}
        exit={shouldReduceMotion ? {} : { opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <motion.div
          className="modal-dialog modal-lg"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create User</h5>
              <button className="btn-close" onClick={onClose} />
            </div>

            <div className="user-wizard">
              <div className="wizard-progress-bar">
                <motion.div
                  className="wizard-progress"
                  initial={shouldReduceMotion ? false : { width: "0%" }}
                  animate={shouldReduceMotion ? {} : { width: `${((wizardStep + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>

              <motion.div
                className="wizard-circles-container"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <div className="wizard-circle-item">
                  <motion.div
                    className={`wizard-circle ${wizardStep >= 0 ? "active" : ""}`}
                    initial={shouldReduceMotion ? false : { scale: 0.94 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.08 }}
                  >
                    <i className="ti ti-building-community" />
                  </motion.div>
                  <div className="wizard-circle-label">Scope</div>
                </div>
                <div className="wizard-circle-item">
                  <motion.div
                    className={`wizard-circle ${wizardStep >= 1 ? "active" : ""}`}
                    initial={shouldReduceMotion ? false : { scale: 0.94 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <i className="ti ti-user-search" />
                  </motion.div>
                  <div className="wizard-circle-label">Employee & Role</div>
                </div>
                <div className="wizard-circle-item">
                  <motion.div
                    className={`wizard-circle ${wizardStep >= 2 ? "active" : ""}`}
                    initial={shouldReduceMotion ? false : { scale: 0.94 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.12 }}
                  >
                    <i className="ti ti-forms" />
                  </motion.div>
                  <div className="wizard-circle-label">Details</div>
                </div>
                <div className="wizard-circle-item">
                  <motion.div
                    className={`wizard-circle ${wizardStep >= 3 ? "active" : ""}`}
                    initial={shouldReduceMotion ? false : { scale: 0.94 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.14 }}
                  >
                    <i className="ti ti-lock" />
                  </motion.div>
                  <div className="wizard-circle-label">Access</div>
                </div>
              </motion.div>

              <motion.div
                className="wizard-step-content"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.1 }}
              >
                <AnimatePresence mode="wait">
                  {wizardStep === 0 && (
                    <motion.div
                      key="step-0"
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                      exit={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="row g-3"
                    >
                      <div className="col-12">
                        <div className="border rounded-3 p-3 bg-light">
                          <div className="fw-semibold mb-2">Organization</div>
                          <div className="text-muted small mb-3">
                            Select the organization scope first. Role comes in the next step.
                          </div>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">Head Office *</label>
                              <select
                                className="form-select user-wizard-input"
                                value={selectedHeadOfficeId}
                                onChange={(e) => onHeadOfficeChange(e.target.value)}
                              >
                                <option value="">-- Select Head Office --</option>
                                {headOfficeOptions.map((headOffice) => (
                                  <option key={headOffice.id} value={headOffice.id}>
                                    {headOffice.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Branch *</label>
                              <select
                                className="form-select user-wizard-input"
                                value={selectedBranchId}
                                onChange={(e) => onBranchChange(e.target.value)}
                                disabled={!selectedHeadOfficeId}
                              >
                                <option value="">-- Select Branch --</option>
                                {branchOptions.map((branch) => (
                                  <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Department *</label>
                              <select
                                className="form-select user-wizard-input"
                                value={selectedDepartmentId}
                                onChange={(e) => onDepartmentChange(e.target.value)}
                                disabled={!selectedBranchId || departmentOptions.length === 0}
                              >
                                <option value="">-- Select Department --</option>
                                {departmentOptions.map((department) => (
                                  <option key={department.id} value={department.id}>
                                    {department.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Designation *</label>
                              <select
                                className="form-select user-wizard-input"
                                value={selectedTeamId}
                                onChange={(e) => onTeamChange(e.target.value)}
                                disabled={!selectedBranchId || !selectedDepartmentId || teamOptions.length === 0}
                              >
                                <option value="">-- Select Designation --</option>
                                {teamOptions.map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 1 && (
                    <motion.div
                      key="step-1"
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                      exit={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="row g-3"
                    >
                      <div className="col-md-6">
                        <label className="form-label">Role *</label>
                        <select
                          className="form-select user-wizard-input"
                          value={form.role}
                          onChange={(e) => onRoleChange(e.target.value)}
                        >
                          {allowedAssignRoles.map((role) => (
                            <option key={role} value={role}>
                              {role.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Select Employee *</label>
                        <select
                          className="form-select user-wizard-input"
                          value={selectedEmployeeId}
                          onChange={(e) => handleSelectEmployee(e.target.value)}
                          disabled={!employeeScopeReady || employeeScopeLoading}
                        >
                          {!employeeScopeReady ? (
                            <option value="">-- Select role and scope first --</option>
                          ) : employeeScopeLoading ? (
                            <option value="">Loading employees...</option>
                          ) : (
                            <option value="">-- Select Employee --</option>
                          )}
                          {availableEmployees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12">
                        <div className="border rounded-3 p-3 bg-light">
                          <div className="fw-semibold mb-2">Role Scope</div>
                          <div className="text-muted small mb-3">
                            {selectedRole === "ADMIN"
                              ? "Admins are assigned at branch level."
                              : selectedRole === "MANAGER"
                                ? "Managers are assigned at branch and department level."
                                : "Team leads and employees are assigned through branch, department, and designation."}
                          </div>
                          <div className="row g-3">
                            {scopeItems.map((item) => (
                              <div key={item.label} className="col-md-4">
                                <div className="border rounded-3 bg-white px-3 py-2 text-muted small">
                                  {item.label}: {item.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 2 && (
                    <motion.div
                      key="step-2"
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                      exit={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="row g-3"
                    >
                      <div className="col-md-6">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control user-wizard-input"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input
                          className="form-control user-wizard-input"
                          value={form.firstName}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input
                          className="form-control user-wizard-input"
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Mobile Number</label>
                        <div className="user-wizard-phone-field" ref={phonePickerRef}>
                          <div className="user-wizard-phone-input-wrap">
                            <button
                              type="button"
                              className="user-wizard-phone-code-trigger"
                              onClick={() => setPhonePickerOpen((prev) => !prev)}
                              aria-expanded={phonePickerOpen}
                            >
                              <span>{phoneCountryCode}</span>
                              <i className="ti ti-chevron-down" />
                            </button>
                            <input
                              type="tel"
                              className={`form-control user-wizard-input user-wizard-phone-input ${phoneError ? "is-invalid" : ""}`}
                              value={form.phone || ""}
                              onChange={(e) => handlePhoneInput(e.target.value)}
                              onBlur={handlePhoneBlur}
                              placeholder={`Enter ${phoneDisplayMaxLength || ""} digit number`}
                              inputMode="numeric"
                              pattern="\d*"
                              maxLength={phoneDisplayMaxLength || undefined}
                            />
                          </div>
                          {phonePickerOpen && (
                            <div className="user-wizard-phone-code-menu">
                              {COUNTRY_CODE_OPTIONS.length > 0 ? (
                                COUNTRY_CODE_OPTIONS.map((opt) => (
                                  <button
                                    key={`${opt.country}-${opt.callingCode}`}
                                    type="button"
                                    className={`user-wizard-phone-code-option${phoneCountryCode === opt.value ? " is-active" : ""}`}
                                    onClick={() => handlePhoneCountryCodeChange(opt.value)}
                                  >
                                    <span>{opt.label}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="user-wizard-phone-code-empty">No countries found</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="user-wizard-field-helper-row">
                          <small className="text-muted">
                            {phoneLengthDisplay ? `${phoneLengthDisplay} digits` : "Numeric value"}
                          </small>
                          {phoneError && <small className="text-danger">{phoneError}</small>}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 3 && (
                    <motion.div
                      key="step-3"
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                      exit={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="row g-3"
                  >
                      <div className="col-md-6">
                        <label className="form-label">Username *</label>
                        <input
                          className="form-control user-wizard-input"
                          value={form.username}
                          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Password *</label>
                        <div className="position-relative">
                          <input
                            type={showCreatePassword ? "text" : "password"}
                            className="form-control user-wizard-input"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="btn btn-link p-0 text-muted"
                            style={{ position: "absolute", right: 12, top: 8 }}
                            onClick={() => setShowCreatePassword((prev) => !prev)}
                            aria-label={showCreatePassword ? "Hide password" : "Show password"}
                          >
                            <i className={`ti ${showCreatePassword ? "ti-eye-off" : "ti-eye"}`} />
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Confirm Password *</label>
                        <div className="position-relative">
                          <input
                            type={showCreatePassword ? "text" : "password"}
                            className="form-control user-wizard-input"
                            value={form.confirmPassword}
                            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="btn btn-link p-0 text-muted"
                            style={{ position: "absolute", right: 12, top: 8 }}
                            onClick={() => setShowCreatePassword((prev) => !prev)}
                            aria-label={showCreatePassword ? "Hide password" : "Show password"}
                          >
                            <i className={`ti ${showCreatePassword ? "ti-eye-off" : "ti-eye"}`} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                className="wizard-nav"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: 0.18 }}
              >
                {wizardStep > 0 ? (
                  <button type="button" className="btn btn-light" onClick={onPrev} disabled={saving}>
                    Previous
                  </button>
                ) : (
                  <div />
                )}
                <div className="wizard-nav-spacer" />
                {wizardStep < totalSteps - 1 ? (
                  <button type="button" className="btn btn-primary" onClick={onNext} disabled={saving}>
                    Next
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={saving}>
                    {saving ? "Saving..." : "Create"}
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <motion.div
        className="modal-backdrop fade show user-wizard-modal-backdrop"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={shouldReduceMotion ? {} : { opacity: 1 }}
        exit={shouldReduceMotion ? {} : { opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
    </>
  );
}
