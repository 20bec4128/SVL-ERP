import { useEffect, useMemo, useState } from "react";
import { updateVendor } from "../../api/vendorsApi";
import { getVendorTypes } from "../../api/vendorTypesApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
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
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY_OF_REGISTRATION,
} from "../../constants/countries";
import { useCountryCodePicker } from "../../hooks/useCountryCodePicker";
import { useToast } from "../../components/system/ToastProvider";
import "./AddVendorModal.css";

const STEPS = [
  { label: "Basic Info" },
  { label: "Services" },
  { label: "Company" },
  { label: "Contact" },
  { label: "Bank Details" },
];

const ACCOUNT_TYPE_OPTIONS = ["Savings", "Current", "OD", "CC"];

const createEmptyBankDetail = () => ({
  bankAccountHolderName: "",
  bankName: "",
  bankAccountNumber: "",
  confirmBankAccountNumber: "",
  bankIfscCode: "",
  bankBranchName: "",
  bankAccountType: "",
  upiId: "",
  upiNumber: "",
  upiQrImage: "",
});

const trimToNull = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
};

const normalizeBankDetail = (detail) => ({
  bankAccountHolderName: trimToNull(detail.bankAccountHolderName),
  bankName: trimToNull(detail.bankName),
  bankAccountNumber: trimToNull(detail.bankAccountNumber),
  bankIfscCode: trimToNull(detail.bankIfscCode)?.toUpperCase() || null,
  bankBranchName: trimToNull(detail.bankBranchName),
  bankAccountType: trimToNull(detail.bankAccountType),
  upiId: trimToNull(detail.upiId),
  upiNumber: trimToNull(detail.upiNumber ?? detail.upiNo ?? detail.upi_number),
  upiQrImage: trimToNull(detail.upiQrImage),
});

const sanitizeBankDetails = (bankDetails) =>
  (Array.isArray(bankDetails) ? bankDetails : [])
    .map(normalizeBankDetail)
    .filter((detail) => Object.values(detail).some(Boolean));

function buildInitialBankDetails(vendor) {
  if (Array.isArray(vendor?.bankDetails) && vendor.bankDetails.length > 0) {
    return vendor.bankDetails.map((detail) => ({
      bankAccountHolderName: detail?.bankAccountHolderName || "",
      bankName: detail?.bankName || "",
      bankAccountNumber: detail?.bankAccountNumber || "",
      confirmBankAccountNumber: detail?.bankAccountNumber || "",
      bankIfscCode: detail?.bankIfscCode || "",
      bankBranchName: detail?.bankBranchName || "",
      bankAccountType: detail?.bankAccountType || "",
      upiId: detail?.upiId || "",
      upiNumber: detail?.upiNumber || detail?.upiNo || detail?.upi_number || "",
      upiQrImage: detail?.upiQrImage || "",
    }));
  }
  return [createEmptyBankDetail()];
}

function initFormFromVendor(vendor) {
  return {
    vendorName: vendor.vendorName || "",
    username: vendor.username || "",
    password: "",
    vendorTypeIds: Array.isArray(vendor.vendorTypeIds) ? vendor.vendorTypeIds : [],
    countryOfRegistration: vendor.countryOfRegistration || DEFAULT_COUNTRY_OF_REGISTRATION,
    companyRegistrationNo: vendor.companyRegistrationNo || "",
    gstNumber: vendor.gstNumber || "",
    panNumber: vendor.panNumber || "",
    companyAddress: vendor.companyAddress || "",
    companyWebsite: vendor.companyWebsite || "",
    dealsWith: vendor.dealsWith || "",
    contactPerson: vendor.contactPerson || "",
    internalRepresentative: vendor.internalRepresentative || "",
    officialEmail: vendor.officialEmail || "",
    secondaryEmail: vendor.secondaryEmail || "",
    countryCode: vendor.countryCode || defaultCountryOption.value,
    phone: vendor.phone || "",
    relationshipSince: vendor.relationshipSince || "",
    status: vendor.status || "active",
    bankDetails: buildInitialBankDetails(vendor),
  };
}

function buildServiceSelections(vendor, allTypes, categories) {
  if (!vendor?.brandIds?.length) return [];
  const results = [];
  vendor.brandIds.forEach((brandId) => {
    const numId = Number(brandId);
    const typeEntry = allTypes.find((type) => type.id === numId);
    if (!typeEntry) return;

    let typeId;
    let subtypeId;
    let categoryId;
    if (typeEntry.parentId) {
      subtypeId = numId;
      typeId = typeEntry.parentId;
      const parent = allTypes.find((type) => type.id === typeId);
      categoryId = parent?.categoryId;
    } else {
      typeId = numId;
      subtypeId = null;
      categoryId = typeEntry.categoryId;
    }

    const category = categories.find((item) => item.id === categoryId);
    const type = allTypes.find((item) => item.id === typeId);
    const subtype = subtypeId ? allTypes.find((item) => item.id === subtypeId) : null;
    const label = [category?.name, type?.name, subtype?.name].filter(Boolean).join(" > ");
    const key = `${categoryId}-${typeId}-${subtypeId || "0"}`;

    if (!results.some((result) => result.key === key)) {
      results.push({ key, label, categoryId, typeId, subtypeId: subtypeId ?? null });
    }
  });
  return results;
}

function BankDetailsSection({ bankDetails, setBankField, addBank, removeBank, onQrUpload }) {
  return (
    <div className="avm-bank-list">
      {bankDetails.map((bank, index) => (
        <div key={`bank-${index}`} className="avm-bank-card">
          <div className="avm-bank-card-header">
            <h4 className="avm-bank-card-title">Bank {index + 1}</h4>
            <button
              type="button"
              className="avm-btn light sm"
              onClick={() => removeBank(index)}
              disabled={bankDetails.length === 1}
            >
              Remove
            </button>
          </div>

          <div className="avm-bank-columns">
            <div className="avm-bank-column">
              <div className="avm-field">
                <label className="avm-label">Account Holder Name</label>
                <input
                  className="avm-input"
                  value={bank.bankAccountHolderName}
                  onChange={(e) => setBankField(index, "bankAccountHolderName", e.target.value)}
                />
              </div>
              <div className="avm-field">
                <label className="avm-label">Account Number</label>
                <input
                  className="avm-input"
                  value={bank.bankAccountNumber}
                  onChange={(e) => setBankField(index, "bankAccountNumber", e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="avm-field">
                <label className="avm-label">Confirm Account Number</label>
                <input
                  className="avm-input"
                  value={bank.confirmBankAccountNumber}
                  onChange={(e) => setBankField(index, "confirmBankAccountNumber", e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="avm-field">
                <label className="avm-label">IFSC Code</label>
                <input
                  className="avm-input"
                  value={bank.bankIfscCode}
                  onChange={(e) => setBankField(index, "bankIfscCode", e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="avm-bank-column">
              <div className="avm-field">
                <label className="avm-label">Bank Name</label>
                <input
                  className="avm-input"
                  value={bank.bankName}
                  onChange={(e) => setBankField(index, "bankName", e.target.value)}
                />
              </div>
              <div className="avm-field">
                <label className="avm-label">Branch Name</label>
                <input
                  className="avm-input"
                  value={bank.bankBranchName}
                  onChange={(e) => setBankField(index, "bankBranchName", e.target.value)}
                />
              </div>
              <div className="avm-field">
                <label className="avm-label">Account Type</label>
                <select
                  className="avm-select"
                  value={bank.bankAccountType}
                  onChange={(e) => setBankField(index, "bankAccountType", e.target.value)}
                >
                  <option value="">Select type</option>
                  {ACCOUNT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type === "OD" ? "Overdraft (OD)" : type === "CC" ? "Cash Credit (CC)" : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="avm-upi-section">
            <div className="avm-upi-title">UPI Details</div>
            <div className="avm-grid avm-upi-grid">
              <div className="avm-field">
                <label className="avm-label">UPI QR Image</label>
                <label className="avm-upi-upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="avm-upi-file-input"
                    onChange={(e) => onQrUpload(index, e.target.files?.[0])}
                  />
                  <span>{bank.upiQrImage ? "Replace QR Image" : "Upload QR Image"}</span>
                </label>
                {bank.upiQrImage && (
                  <img
                    className="avm-upi-preview"
                    src={bank.upiQrImage}
                    alt={`UPI QR for bank ${index + 1}`}
                  />
                )}
              </div>
              <div className="avm-upi-or-wrap">
                <span className="avm-upi-or">OR</span>
              </div>
              <div className="avm-field">
                <label className="avm-label">UPI ID</label>
                <input
                  className="avm-input"
                  value={bank.upiId}
                  onChange={(e) => setBankField(index, "upiId", e.target.value)}
                  placeholder="name@bank"
                />
              </div>
              <div className="avm-field">
                <label className="avm-label">UPI Number</label>
                <input
                  className="avm-input"
                  value={bank.upiNumber}
                  onChange={(e) =>
                    setBankField(index, "upiNumber", (e.target.value || "").replace(/\D/g, "").slice(0, 10))
                  }
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="UPI-linked mobile number"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="avm-btn outline" onClick={addBank}>
        + Add Another Bank
      </button>
    </div>
  );
}

export default function EditVendorModal({ open, onClose, onUpdated, vendor }) {
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [vendorTypes, setVendorTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTypes, setAllTypes] = useState([]);

  const [vendorTypePick, setVendorTypePick] = useState("");
  const [pickCategoryId, setPickCategoryId] = useState("");
  const [pickTypeId, setPickTypeId] = useState("");
  const [pickSubtypeId, setPickSubtypeId] = useState("");
  const [serviceSelections, setServiceSelections] = useState([]);

  const {
    isOpen: phonePickerOpen,
    pickerRef: phonePickerRef,
    togglePicker: togglePhonePicker,
    closePicker: closePhonePicker,
  } = useCountryCodePicker();

  const filteredCountryOptions = useMemo(() => COUNTRY_CODE_OPTIONS, []);
  const phoneDisplayMaxLength = getCountryDisplayMaxLength(form?.countryCode);

  useEffect(() => {
    if (open && vendor) {
      setStep(0);
      setForm(initFormFromVendor(vendor));
      setError("");
      setVendorTypePick("");
      setPickCategoryId("");
      setPickTypeId("");
      setPickSubtypeId("");
      setShowPassword(false);
    }
  }, [open, vendor]);

  useEffect(() => {
    if (!open) return;
    Promise.all([getVendorTypes(), getServiceCategories(), getServiceTypes()])
      .then(([types, cats, serviceTypes]) => {
        const nextVendorTypes = Array.isArray(types) ? types : [];
        const nextCategories = Array.isArray(cats) ? cats : [];
        const nextTypes = Array.isArray(serviceTypes) ? serviceTypes : [];
        setVendorTypes(nextVendorTypes);
        setCategories(nextCategories);
        setAllTypes(nextTypes);
        if (vendor) {
          setServiceSelections(buildServiceSelections(vendor, nextTypes, nextCategories));
        }
      })
      .catch(() => {});
  }, [open, vendor]);

  const typeOptions = useMemo(() => {
    if (!pickCategoryId) return [];
    return allTypes.filter(
      (type) => String(type.categoryId) === String(pickCategoryId) && !type.parentId,
    );
  }, [allTypes, pickCategoryId]);

  const subtypeOptions = useMemo(() => {
    if (!pickTypeId) return [];
    return allTypes.filter((type) => String(type.parentId) === String(pickTypeId));
  }, [allTypes, pickTypeId]);

  const hasSubtypes = subtypeOptions.length > 0;

  const handleCategoryChange = (value) => {
    setPickCategoryId(value);
    setPickTypeId("");
    setPickSubtypeId("");
  };

  const handleTypeChange = (value) => {
    setPickTypeId(value);
    setPickSubtypeId("");
  };

  const handleAddService = () => {
    if (!pickCategoryId || !pickTypeId) return;
    if (hasSubtypes && !pickSubtypeId) return;

    const category = categories.find((item) => String(item.id) === String(pickCategoryId));
    const type = allTypes.find((item) => String(item.id) === String(pickTypeId));
    const subtype = pickSubtypeId
      ? allTypes.find((item) => String(item.id) === String(pickSubtypeId))
      : null;

    const label = [category?.name, type?.name, subtype?.name].filter(Boolean).join(" > ");
    const key = `${pickCategoryId}-${pickTypeId}-${pickSubtypeId || "0"}`;

    if (!serviceSelections.some((selection) => selection.key === key)) {
      setServiceSelections((prev) => [
        ...prev,
        {
          key,
          label,
          categoryId: Number(pickCategoryId),
          typeId: Number(pickTypeId),
          subtypeId: pickSubtypeId ? Number(pickSubtypeId) : null,
        },
      ]);
    }

    setPickCategoryId("");
    setPickTypeId("");
    setPickSubtypeId("");
  };

  const handleRemoveService = (key) => {
    setServiceSelections((prev) => prev.filter((selection) => selection.key !== key));
  };

  const handlePhoneChange = (value) => {
    const lengths = getCountryAllowedLengths(form.countryCode);
    const option = getCountryOptionByValue(form.countryCode);
    setForm((prev) => ({
      ...prev,
      phone: sanitizePhoneDigits(value, option?.maxLength, lengths),
    }));
  };

  const handleQrUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({
        ...prev,
        bankDetails: prev.bankDetails.map((bank, bankIndex) =>
          bankIndex === index ? { ...bank, upiQrImage: base64 } : bank,
        ),
      }));
    };
    reader.readAsDataURL(file);
  };

  const validate = (currentStep) => {
    if (currentStep === 0 && !form?.vendorName?.trim()) {
      return "Vendor Name is required";
    }
    if (currentStep === 2) {
      if (!form?.countryOfRegistration?.trim()) return "Country of Registration is required";
      if (form?.gstNumber?.trim() && form.gstNumber.trim().length !== 15) {
        return "GST Number must be exactly 15 characters";
      }
    }
    if (currentStep === 3) {
      if (!form?.officialEmail?.trim()) return "Official Email is required";
      const phoneErr = form?.phone?.trim()
        ? validatePhoneNumber(form.phone, form.countryCode)
        : null;
      if (phoneErr) return phoneErr;
    }
    if (currentStep === 4) {
      const mismatchIndex = form.bankDetails.findIndex((bank) => {
        const accountNumber = bank.bankAccountNumber.trim();
        const confirmAccountNumber = bank.confirmBankAccountNumber.trim();
        if (!accountNumber && !confirmAccountNumber) return false;
        return accountNumber !== confirmAccountNumber;
      });
      if (mismatchIndex >= 0) {
        return `Bank ${mismatchIndex + 1}: account number and confirm account number must match`;
      }
      const invalidUpiNumberIndex = form.bankDetails.findIndex((bank) => {
        const upiNumber = (bank.upiNumber || "").trim();
        if (!upiNumber) return false;
        return !/^\d{10}$/.test(upiNumber);
      });
      if (invalidUpiNumberIndex >= 0) {
        return `Bank ${invalidUpiNumberIndex + 1}: UPI number must be exactly 10 digits`;
      }
    }
    return "";
  };

  const handleNext = () => {
    const nextError = validate(step);
    if (nextError) {
      setError(nextError);
      return;
    }
    setError("");
    setStep((current) => current + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((current) => current - 1);
  };

  const normalizeWebsiteUrl = (raw) => {
    const value = (raw || "").trim();
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  };

  const handleSubmit = async () => {
    const submitError = validate(4);
    if (submitError) {
      setError(submitError);
      return;
    }

    setError("");
    setSaving(true);

    const productIds = [...new Set(serviceSelections.map((selection) => selection.categoryId))];
    const brandIds = [...new Set(
      serviceSelections.map((selection) => selection.subtypeId ?? selection.typeId).filter(Boolean),
    )];
    const bankDetails = sanitizeBankDetails(form.bankDetails);

    try {
      await updateVendor(vendor.id, {
        vendorName: form.vendorName.trim(),
        username: form.username.trim() || undefined,
        password: form.password || undefined,
        vendorTypeIds: form.vendorTypeIds,
        productIds,
        brandIds,
        countryOfRegistration: form.countryOfRegistration.trim(),
        companyRegistrationNo: form.companyRegistrationNo.trim() || null,
        gstNumber: form.gstNumber.trim().toUpperCase() || null,
        panNumber: form.panNumber.trim(),
        companyAddress: form.companyAddress.trim(),
        companyWebsite: normalizeWebsiteUrl(form.companyWebsite),
        dealsWith: form.dealsWith.trim(),
        contactPerson: form.contactPerson.trim(),
        internalRepresentative: form.internalRepresentative.trim(),
        officialEmail: form.officialEmail.trim(),
        secondaryEmail: form.secondaryEmail.trim(),
        countryCode: form.countryCode,
        phone: form.phone.trim(),
        relationshipSince: form.relationshipSince || null,
        status: form.status || "active",
        materialsSupplied: vendor.materialsSupplied || [],
        email: vendor.email || "",
        address: vendor.address || "",
        bankDetails,
        bankAccountHolderName: bankDetails[0]?.bankAccountHolderName || null,
        bankName: bankDetails[0]?.bankName || null,
        bankAccountNumber: bankDetails[0]?.bankAccountNumber || null,
        bankIfscCode: bankDetails[0]?.bankIfscCode || null,
        bankBranchName: bankDetails[0]?.bankBranchName || null,
        bankAccountType: bankDetails[0]?.bankAccountType || null,
      });
      showSuccess("Vendor updated successfully", { title: "Vendors" });
      onUpdated?.();
      onClose();
    } catch (e) {
      const message = extractApiErrorMessage(e, "Failed to update vendor");
      showError(message, { title: "Vendors" });
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setBankField = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      bankDetails: prev.bankDetails.map((bank, bankIndex) =>
        bankIndex === index ? { ...bank, [key]: value } : bank,
      ),
    }));
  };

  const addBank = () => {
    setForm((prev) => ({
      ...prev,
      bankDetails: [...prev.bankDetails, createEmptyBankDetail()],
    }));
  };

  const removeBank = (index) => {
    setForm((prev) => {
      if (prev.bankDetails.length === 1) return prev;
      return {
        ...prev,
        bankDetails: prev.bankDetails.filter((_, bankIndex) => bankIndex !== index),
      };
    });
  };

  if (!open || !vendor || !form) return null;

  return (
    <div className="avm-backdrop">
      <div className="avm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avm-modal-header">
          <h2 className="avm-modal-title">Edit Vendor</h2>
          <button type="button" className="avm-modal-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="avm-steps">
          {STEPS.map((item, index) => (
            <div
              key={item.label}
              className={`avm-step${index === step ? " active" : ""}${index < step ? " done" : ""}`}
            >
              <div className="avm-step-dot">{index < step ? "✓" : index + 1}</div>
              <span className="avm-step-label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="avm-body">
          {step === 0 && (
            <>
              <div className="avm-section-title">Basic Information</div>
              <div className="avm-grid">
                <div className="avm-field full">
                  <label className="avm-label">Vendor / Company Name  <span className="req">*</span></label>
                  <input
                    className="avm-input"
                    value={form.vendorName}
                    onChange={(e) => setField("vendorName", e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">Username</label>
                  <input
                    className="avm-input"
                    value={form.username}
                    onChange={(e) => setField("username", e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">New Password <span style={{ color: "#9aa5b4", fontWeight: 400 }}>(leave blank to keep)</span></label>
                  <div className="avm-password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="avm-input"
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="avm-password-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      tabIndex={-1}
                    >
                      <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
             
              

              <div className="avm-section-title">Product Details</div>
              <div className={`avm-cascade-row${hasSubtypes ? " three-cols" : ""}`}>
                <div className="avm-field">
                  <label className="avm-label">Product Category</label>
                  <select
                    className="avm-select"
                    value={pickCategoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="avm-field">
                  <label className="avm-label">Product Type</label>
                  <select
                    className="avm-select"
                    value={pickTypeId}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    disabled={!pickCategoryId}
                  >
                    <option value="">Select type</option>
                    {typeOptions.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                {hasSubtypes && (
                  <div className="avm-field">
                    <label className="avm-label">Sub-Type</label>
                    <select
                      className="avm-select"
                      value={pickSubtypeId}
                      onChange={(e) => setPickSubtypeId(e.target.value)}
                      disabled={!pickTypeId}
                    >
                      <option value="">Select sub-type</option>
                      {subtypeOptions.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <button
                  type="button"
                  className="avm-btn outline sm"
                  onClick={handleAddService}
                  disabled={!pickCategoryId || !pickTypeId || (hasSubtypes && !pickSubtypeId)}
                >
                  + Add Service
                </button>
              </div>
              {serviceSelections.length > 0 && (
                <div className="avm-chip-wrap">
                  {serviceSelections.map((service) => (
                    <span key={service.key} className="avm-chip">
                      {service.label}
                      <button
                        type="button"
                        className="avm-chip-remove"
                        onClick={() => handleRemoveService(service.key)}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="avm-section-title">Company Information</div>
              <div className="avm-field" style={{ marginBottom: "1.25rem" }}>
                <label className="avm-label">Vendor / Company Type</label>
                <select
                  className="avm-select"
                  value={vendorTypePick}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (!id) return;
                    if (!form.vendorTypeIds.includes(id)) {
                      setField("vendorTypeIds", [...form.vendorTypeIds, id]);
                    }
                    setVendorTypePick("");
                  }}
                >
                  <option value="">Select vendor / Company type</option>
                  {vendorTypes.map((vendorType) => (
                    <option key={vendorType.id} value={vendorType.id}>
                      {vendorType.typeName}
                    </option>
                  ))}
                </select>
                {form.vendorTypeIds.length > 0 && (
                  <div className="avm-chip-wrap">
                    {form.vendorTypeIds.map((id) => {
                      const name = vendorTypes.find((item) => item.id === id)?.typeName;
                      if (!name) return null;
                      return (
                        <span key={id} className="avm-chip">
                          {name}
                          <button
                            type="button"
                            className="avm-chip-remove"
                            onClick={() =>
                              setField("vendorTypeIds", form.vendorTypeIds.filter((value) => value !== id))
                            }
                          >
                            x
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="avm-grid">
                <div className="avm-field">
                  <label className="avm-label">Country of Registration <span className="req">*</span></label>
                  <select
                    className="avm-select"
                    value={form.countryOfRegistration}
                    onChange={(e) => setField("countryOfRegistration", e.target.value)}
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="avm-field">
                  <label className="avm-label">MSME / Udyam Registration Number</label>
                  <input
                    className="avm-input"
                    value={form.companyRegistrationNo}
                    onChange={(e) => setField("companyRegistrationNo", e.target.value)}
                    placeholder="Enter MSME / Udyam registration number"
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">GST Number</label>
                  <input
                    className="avm-input"
                    value={form.gstNumber}
                    maxLength={15}
                    onChange={(e) => setField("gstNumber", e.target.value.toUpperCase())}
                    placeholder="Enter GST number if available"
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">PAN Number</label>
                  <input
                    className="avm-input"
                    value={form.panNumber}
                    onChange={(e) => setField("panNumber", e.target.value.toUpperCase())}
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">Company Website</label>
                  <input
                    className="avm-input"
                    value={form.companyWebsite}
                    onChange={(e) => setField("companyWebsite", e.target.value)}
                    inputMode="url"
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">Deals With</label>
                  <input
                    className="avm-input"
                    value={form.dealsWith}
                    onChange={(e) => setField("dealsWith", e.target.value)}
                  />
                </div>
                <div className="avm-field full">
                  <label className="avm-label">Company Address</label>
                  <textarea
                    className="avm-textarea"
                    rows={3}
                    value={form.companyAddress}
                    onChange={(e) => setField("companyAddress", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="avm-section-title">Contact Information</div>
              <div className="avm-grid">
                <div className="avm-field">
                  <label className="avm-label">Contact Person</label>
                  <input
                    className="avm-input"
                    value={form.contactPerson}
                    onChange={(e) => setField("contactPerson", e.target.value)}
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">Internal Representative</label>
                  <input
                    className="avm-input"
                    value={form.internalRepresentative}
                    onChange={(e) => setField("internalRepresentative", e.target.value)}
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">Official Email <span className="req">*</span></label>
                  <input
                    type="email"
                    className="avm-input"
                    value={form.officialEmail}
                    onChange={(e) => setField("officialEmail", e.target.value)}
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">Secondary Email</label>
                  <input
                    type="email"
                    className="avm-input"
                    value={form.secondaryEmail}
                    onChange={(e) => setField("secondaryEmail", e.target.value)}
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">Relationship Since</label>
                  <input
                    type="date"
                    className="avm-input"
                    value={form.relationshipSince}
                    onChange={(e) => setField("relationshipSince", e.target.value)}
                  />
                </div>
                <div className="avm-field">
                  <label className="avm-label">Mobile Number</label>
                  <div className="avm-phone-field" ref={phonePickerRef}>
                    <div className="avm-phone-wrap">
                      <button
                        type="button"
                        className="avm-phone-code-trigger"
                        onClick={togglePhonePicker}
                        aria-expanded={phonePickerOpen}
                      >
                        <span>{form.countryCode}</span>
                        <i className="ti ti-chevron-down" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="avm-phone-input"
                        value={form.phone}
                        maxLength={phoneDisplayMaxLength || undefined}
                        placeholder={phoneDisplayMaxLength ? `${phoneDisplayMaxLength} digits` : "Phone number"}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />
                    </div>
                    {phonePickerOpen && (
                      <div className="avm-phone-code-menu">
                        {filteredCountryOptions.map((option) => (
                          <button
                            key={`${option.country}-${option.callingCode}`}
                            type="button"
                            className={`avm-phone-code-option${form.countryCode === option.value ? " is-active" : ""}`}
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                countryCode: ensureCountryCodeValue(option.value),
                                phone: "",
                              }));
                              closePhonePicker();
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="avm-section-title">Bank Details</div>
              <BankDetailsSection
                bankDetails={form.bankDetails}
                setBankField={setBankField}
                addBank={addBank}
                removeBank={removeBank}
                onQrUpload={handleQrUpload}
              />
            </>
          )}

          {error && <div className="avm-error" style={{ marginTop: "0.75rem" }}>{error}</div>}
        </div>

        <div className="avm-footer">
          <div>
            {step > 0 && (
              <button type="button" className="avm-btn light" onClick={handleBack}>
                ← Back
              </button>
            )}
          </div>
          <div className="avm-footer-right">
            <button type="button" className="avm-btn light" onClick={onClose}>
              Cancel
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="avm-btn primary" onClick={handleNext}>
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="avm-btn primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
