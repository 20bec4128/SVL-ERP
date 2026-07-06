import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "./CustomerWizardModal.css";
import { useCountryCodePicker } from "../../hooks/useCountryCodePicker";
import {
  COUNTRY_CODE_OPTIONS,
  ensureCountryCodeValue,
  getCountryAllowedLengths,
  getCountryDisplayMaxLength,
  sanitizePhoneDigits,
} from "../../utils/phoneUtils";

export default function CustomerWizardModal({
  wizardStep,
  form,
  setForm,
  onNext,
  onPrev,
  onSubmit,
  onClose,
  saving,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const handleSameAsBillingChange = (checked) => {
    setSameAsBilling(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        shippingContactPerson: prev.billingContactPerson || "",
        shippingCompany: prev.billingCompany || "",
        shippingAddress1: prev.billingAddress1 || "",
        shippingAddress2: prev.billingAddress2 || "",
        shippingCity: prev.billingCity || "",
        shippingState: prev.billingState || "",
        shippingPincode: prev.billingPincode || "",
        shippingCountry: prev.billingCountry || "",
        shippingPhone: prev.billingPhone || "",
        shippingEmail: prev.billingEmail || "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        shippingContactPerson: "",
        shippingCompany: "",
        shippingAddress1: "",
        shippingAddress2: "",
        shippingCity: "",
        shippingState: "",
        shippingPincode: "",
        shippingCountry: "",
        shippingPhone: "",
        shippingEmail: "",
      }));
    }
  };

  useEffect(() => {
    if (wizardStep !== 2) {
      setSameAsBilling(false);
    }
  }, [wizardStep]);

  const [phoneInputVal, setPhoneInputVal] = useState(() => {
    if (form.phone) {
      return `${form.countryCode || "+91"} ${form.phone}`;
    }
    return "";
  });

  useEffect(() => {
    if (!form.phone) {
      setPhoneInputVal("");
    } else {
      setPhoneInputVal(`${form.countryCode || "+91"} ${form.phone}`);
    }
  }, [form.phone, form.countryCode]);

  const handlePhoneInputChange = (value) => {
    setPhoneInputVal(value);

    let raw = value.trim();
    if (raw.startsWith("+")) {
      const sortedOptions = [...COUNTRY_CODE_OPTIONS].sort((a, b) => b.value.length - a.value.length);
      const matched = sortedOptions.find(opt => raw.startsWith(opt.value));
      if (matched) {
        const remaining = raw.slice(matched.value.length).replace(/\D/g, "");
        const limitLength = getCountryDisplayMaxLength(matched.value);
        const slicedPhone = limitLength ? remaining.slice(0, limitLength) : remaining;
        setForm((prev) => ({
          ...prev,
          countryCode: matched.value,
          phone: slicedPhone,
        }));
        return;
      }
    }
    const digitsOnly = value.replace(/\D/g, "");
    const currentCode = form.countryCode || "+91";
    const limitLength = getCountryDisplayMaxLength(currentCode);
    const slicedPhone = limitLength ? digitsOnly.slice(0, limitLength) : digitsOnly;
    setForm((prev) => ({
      ...prev,
      phone: slicedPhone,
    }));
  };

  return (
    <>
      <motion.div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex="-1"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={shouldReduceMotion ? {} : { opacity: 1 }}
        exit={shouldReduceMotion ? false : { opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <motion.div
          className="modal-dialog modal-lg"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create Customer</h5>
              <button className="btn-close" onClick={onClose} />
            </div>

            <div className="customer-wizard">
              {/* Progress Bar */}
              <div className="wizard-progress-bar">
                <motion.div
                  className="wizard-progress"
                  initial={shouldReduceMotion ? false : { width: "0%" }}
                  animate={shouldReduceMotion ? {} : { width: `${((wizardStep + 1) / 3) * 100}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>

              {/* Progress Circles */}
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
                    <i className="ti ti-user" />
                  </motion.div>
                  <div className="wizard-circle-label">Basic Info</div>
                </div>
                <div className="wizard-circle-item">
                  <motion.div
                    className={`wizard-circle ${wizardStep >= 1 ? "active" : ""}`}
                    initial={shouldReduceMotion ? false : { scale: 0.94 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <i className="ti ti-map" />
                  </motion.div>
                  <div className="wizard-circle-label">Billing</div>
                </div>
                <div className="wizard-circle-item">
                  <motion.div
                    className={`wizard-circle ${wizardStep >= 2 ? "active" : ""}`}
                    initial={shouldReduceMotion ? false : { scale: 0.94 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.12 }}
                  >
                    <i className="ti ti-truck" />
                  </motion.div>
                  <div className="wizard-circle-label">Shipping</div>
                </div>
              </motion.div>

              {/* Step Content */}
              <motion.div
                className="wizard-step-content"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.1 }}
              >
                <AnimatePresence mode="wait">
                  {/* Step 0: Basic Info */}
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
                        <h6 className="fw-600 text-secondary mb-3">Personal Information</h6>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.firstName}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                          placeholder="Enter last name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control customer-wizard-input"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="Enter email"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Password</label>
                        <div className="position-relative">
                          <input
                            type={form.showPassword ? "text" : "password"}
                            className="form-control customer-wizard-input"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            className="btn btn-link p-0 text-muted"
                            style={{ position: "absolute", right: 12, top: 8 }}
                            onClick={() => setForm((f) => ({ ...f, showPassword: !f.showPassword }))}
                            aria-label={form.showPassword ? "Hide password" : "Show password"}
                          >
                            <i className={`ti ${form.showPassword ? "ti-eye-off" : "ti-eye"}`} />
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          style={{ borderRadius: "2rem", height: "40px" }}
                          value={phoneInputVal}
                          placeholder="e.g. +91 9876543210"
                          onChange={(e) => handlePhoneInputChange(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control customer-wizard-input"
                          value={form.dob}
                          onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Type</label>
                        <select
                          className="form-select customer-wizard-input"
                          value={form.type}
                          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                        >
                          <option value="">-- Select Type --</option>
                          <option value="individual">Individual</option>
                          <option value="business">Business</option>
                          <option value="enterprise">Enterprise</option>
                          <option value="retail">Retail</option>
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Notes</label>
                        <textarea
                          className="form-control customer-wizard-input"
                          value={form.notes}
                          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                          placeholder="Enter any additional notes"
                          rows="3"
                          style={{ borderRadius: "0.75rem", minHeight: "80px" }}
                        ></textarea>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 1: Billing Address */}
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
                        <label className="form-label">Contact Person</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.billingContactPerson}
                          onChange={(e) => setForm((f) => ({ ...f, billingContactPerson: e.target.value }))}
                          placeholder="Enter contact person name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Company Name</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.billingCompany}
                          onChange={(e) => setForm((f) => ({ ...f, billingCompany: e.target.value }))}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Address Line 1 *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.billingAddress1}
                          onChange={(e) => setForm((f) => ({ ...f, billingAddress1: e.target.value }))}
                          placeholder="Enter address"
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Address Line 2</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.billingAddress2}
                          onChange={(e) => setForm((f) => ({ ...f, billingAddress2: e.target.value }))}
                          placeholder="Enter additional address details"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.billingCity}
                          onChange={(e) => setForm((f) => ({ ...f, billingCity: e.target.value }))}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">State *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.billingState}
                          onChange={(e) => setForm((f) => ({ ...f, billingState: e.target.value }))}
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Pincode *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.billingPincode}
                          onChange={(e) => setForm((f) => ({ ...f, billingPincode: e.target.value }))}
                          placeholder="Enter pincode"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Country *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.billingCountry}
                          onChange={(e) => setForm((f) => ({ ...f, billingCountry: e.target.value }))}
                          placeholder="Enter country"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control customer-wizard-input"
                          value={form.billingPhone}
                          onChange={(e) => setForm((f) => ({ ...f, billingPhone: e.target.value }))}
                          placeholder="Enter phone"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control customer-wizard-input"
                          value={form.billingEmail}
                          onChange={(e) => setForm((f) => ({ ...f, billingEmail: e.target.value }))}
                          placeholder="Enter email"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Shipping Address */}
                  {wizardStep === 2 && (
                    <motion.div
                      key="step-2"
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                      exit={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="row g-3"
                    >
                      <div className="col-12 mb-2">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="sameAsBillingCheckbox"
                            checked={sameAsBilling}
                            onChange={(e) => handleSameAsBillingChange(e.target.checked)}
                          />
                          <label className="form-check-label fw-semibold text-secondary" htmlFor="sameAsBillingCheckbox" style={{ cursor: "pointer" }}>
                            Same as billing address
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Contact Person</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.shippingContactPerson}
                          onChange={(e) => setForm((f) => ({ ...f, shippingContactPerson: e.target.value }))}
                          placeholder="Enter contact person name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Company Name</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.shippingCompany}
                          onChange={(e) => setForm((f) => ({ ...f, shippingCompany: e.target.value }))}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Address Line 1 *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.shippingAddress1}
                          onChange={(e) => setForm((f) => ({ ...f, shippingAddress1: e.target.value }))}
                          placeholder="Enter address"
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Address Line 2</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.shippingAddress2}
                          onChange={(e) => setForm((f) => ({ ...f, shippingAddress2: e.target.value }))}
                          placeholder="Enter additional address details"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.shippingCity}
                          onChange={(e) => setForm((f) => ({ ...f, shippingCity: e.target.value }))}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">State *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.shippingState}
                          onChange={(e) => setForm((f) => ({ ...f, shippingState: e.target.value }))}
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Pincode *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.shippingPincode}
                          onChange={(e) => setForm((f) => ({ ...f, shippingPincode: e.target.value }))}
                          placeholder="Enter pincode"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Country *</label>
                        <input
                          type="text"
                          className="form-control customer-wizard-input"
                          value={form.shippingCountry}
                          onChange={(e) => setForm((f) => ({ ...f, shippingCountry: e.target.value }))}
                          placeholder="Enter country"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control customer-wizard-input"
                          value={form.shippingPhone}
                          onChange={(e) => setForm((f) => ({ ...f, shippingPhone: e.target.value }))}
                          placeholder="Enter phone"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control customer-wizard-input"
                          value={form.shippingEmail}
                          onChange={(e) => setForm((f) => ({ ...f, shippingEmail: e.target.value }))}
                          placeholder="Enter email"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Navigation Buttons */}
              <motion.div
                className="wizard-nav"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: 0.18 }}
              >
                {wizardStep > 0 ? (
                  <button className="btn btn-light" onClick={onPrev} disabled={saving}>
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="wizard-nav-spacer"></div>
                {wizardStep < 2 ? (
                  <button className="btn btn-primary" onClick={onNext} disabled={saving}>
                    Next
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={onSubmit} disabled={saving}>
                    {saving ? "Saving..." : "Create"}
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <motion.div
        className="modal-backdrop fade show customer-wizard-modal-backdrop"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={shouldReduceMotion ? {} : { opacity: 1 }}
        exit={shouldReduceMotion ? false : { opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
    </>
  );
}
