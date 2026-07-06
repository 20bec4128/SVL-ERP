import React, { useState, useCallback, useMemo } from "react";

const AddressFormModal = ({
  show,
  onClose,
  onSubmit,
  addressType,
  loading,
  countryCodeOptions,
  getCountryOptionByValue,
  getCountryAllowedLengths,
  sanitizePhoneDigits,
}) => {
  // Single state object instead of 15 separate useState calls
  const [formData, setFormData] = useState({
    contactPersonName: "",
    companyName: "",
    gstin: "",
    countryCode: "+91",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isPrimary: false,
  });

  const [phoneError, setPhoneError] = useState("");

  // Generic field change handler with memoization
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setPhoneError("");
  }, []);

  // Phone-specific handler with validation
  const handlePhoneChange = useCallback(
    (value) => {
      const maxLen =
        getCountryOptionByValue(formData.countryCode)?.maxLength || 15;
      const allowed = getCountryAllowedLengths(formData.countryCode);
      const sanitized = sanitizePhoneDigits(value, maxLen, allowed);
      setFormData((prev) => ({
        ...prev,
        phone: sanitized,
      }));
      setPhoneError("");
    },
    [formData.countryCode, getCountryOptionByValue, getCountryAllowedLengths, sanitizePhoneDigits]
  );

  // Country code change handler
  const handleCountryCodeChange = useCallback(
    (value) => {
      const maxLen = getCountryOptionByValue(value)?.maxLength || 15;
      const allowed = getCountryAllowedLengths(value);
      const sanitized = sanitizePhoneDigits(formData.phone, maxLen, allowed);
      setFormData((prev) => ({
        ...prev,
        countryCode: value,
        phone: sanitized,
      }));
      setPhoneError("");
    },
    [formData.phone, getCountryOptionByValue, getCountryAllowedLengths, sanitizePhoneDigits]
  );

  // Memoized validation
  const isFormValid = useMemo(() => {
    return (
      formData.contactPersonName.trim() &&
      formData.addressLine1.trim() &&
      formData.city.trim() &&
      formData.state.trim() &&
      formData.pincode.trim() &&
      formData.country.trim() &&
      formData.phone.trim()
    );
  }, [formData]);

  // Reset form handler
  const resetForm = useCallback(() => {
    setFormData({
      contactPersonName: "",
      companyName: "",
      gstin: "",
      countryCode: "+91",
      phone: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isPrimary: false,
    });
    setPhoneError("");
  }, []);

  // Handle close with reset
  const handleCloseModal = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Handle submit
  const handleFormSubmit = useCallback(() => {
    onSubmit(formData);
    resetForm();
  }, [formData, onSubmit, resetForm]);

  // Memoized phone length display
  const phoneLengthDisplay = useMemo(() => {
    const allowed = getCountryAllowedLengths(formData.countryCode);
    return allowed.length
      ? allowed.join(" or ")
      : getCountryOptionByValue(formData.countryCode)?.maxLength;
  }, [formData.countryCode, getCountryAllowedLengths, getCountryOptionByValue]);

  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
      style={{ zIndex: 1100 }}
    >
      <div
        className="card shadow-lg"
        style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}
      >
        <div className="card-header d-flex align-items-center justify-content-between sticky-top bg-white">
          <h5 className="mb-0">
            Add {addressType === "BILLING" ? "Billing" : "Shipping"} Address
          </h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={handleCloseModal}
          />
        </div>
        <div className="card-body">
          {/* Contact Person Name */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Contact Person Name *</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.contactPersonName}
              onChange={(e) => handleFieldChange("contactPersonName", e.target.value)}
              placeholder="Contact person name"
            />
          </div>

          {/* Company Name */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Company Name</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleFieldChange("companyName", e.target.value)}
              placeholder="Company name"
            />
          </div>

          {/* GSTIN */}
          <div className="mb-3">
            <label className="form-label">
              <strong>GSTIN</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.gstin}
              onChange={(e) =>
                handleFieldChange("gstin", e.target.value.toUpperCase())
              }
              placeholder="12-digit alphanumeric"
              maxLength="12"
            />
            <small className="text-muted">
              Format: 12 alphanumeric characters
            </small>
          </div>

          {/* Phone */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Phone Number *</strong>
            </label>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                style={{ maxWidth: "160px" }}
                value={formData.countryCode}
                onChange={(e) => handleCountryCodeChange(e.target.value)}
              >
                {countryCodeOptions.map((opt, idx) => (
                  <option key={`${opt.value}-${opt.country}-${idx}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                className="form-control"
                type="text"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter phone"
                maxLength={
                  getCountryOptionByValue(formData.countryCode)?.maxLength || 15
                }
              />
            </div>
            {phoneError ? (
              <small className="text-danger">{phoneError}</small>
            ) : (
              <small className="text-muted">
                Expected length: {phoneLengthDisplay}
              </small>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Email</strong>
            </label>
            <input
              className="form-control"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              placeholder="Email address"
            />
          </div>

          {/* Address Line 1 */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Address Line 1 *</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.addressLine1}
              onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
              placeholder="Street address"
            />
          </div>

          {/* Address Line 2 */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Address Line 2</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.addressLine2}
              onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
              placeholder="Apartment, suite, etc."
            />
          </div>

          {/* City */}
          <div className="mb-3">
            <label className="form-label">
              <strong>City *</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              placeholder="City"
            />
          </div>

          {/* State */}
          <div className="mb-3">
            <label className="form-label">
              <strong>State/Province *</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.state}
              onChange={(e) => handleFieldChange("state", e.target.value)}
              placeholder="State or Province"
            />
          </div>

          {/* Pincode */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Pincode/Zip Code *</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.pincode}
              onChange={(e) => handleFieldChange("pincode", e.target.value)}
              placeholder="Postal code"
            />
          </div>

          {/* Country */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Country *</strong>
            </label>
            <input
              className="form-control"
              type="text"
              value={formData.country}
              onChange={(e) => handleFieldChange("country", e.target.value)}
              placeholder="Country"
            />
          </div>

          {/* Primary Address */}
          <div className="mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => handleFieldChange("isPrimary", e.target.checked)}
              />
              <label className="form-check-label" htmlFor="isPrimary">
                <strong>Set as primary address</strong>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-secondary"
              onClick={handleCloseModal}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleFormSubmit}
              disabled={loading || !isFormValid}
            >
              {loading ? "Adding..." : "Add Address"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AddressFormModal);
