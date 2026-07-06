import { useState } from "react";
import { COUNTRY_CODE_OPTIONS, validatePhoneNumber, getCountryAllowedLengths, getCountryDisplayMaxLength, defaultCountryOption } from "../utils/phoneUtils";

const EMPTY_FORM = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "EMPLOYEE",
  password: "",
  newPassword: "",
  confirmPassword: "",
};

export const useCreateUserWizard = () => {
  const MAX_WIZARD_STEP = 3;
  const [form, setForm] = useState(EMPTY_FORM);
  const [wizardStep, setWizardStep] = useState(0);
  const [phoneCountryCode, setPhoneCountryCode] = useState(defaultCountryOption?.value || "+91");
  const [phoneError, setPhoneError] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Reset form state
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setWizardStep(0);
    setPhoneCountryCode(defaultCountryOption?.value || "+91");
    setPhoneError("");
    setShowCreatePassword(false);
  };

  // Open modal
  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Update form field
  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle phone input
  const handlePhoneInput = (value) => {
    const digits = value.replace(/\D/g, "");
    const allowedLengths = getCountryAllowedLengths(phoneCountryCode);
    const maxLength = allowedLengths.length > 0
      ? Math.max(...allowedLengths)
      : getCountryDisplayMaxLength(phoneCountryCode) || 15;
    const limited = digits.slice(0, maxLength);
    setForm((prev) => ({ ...prev, phone: limited }));
    setPhoneError("");
  };

  // Handle phone blur - validate
  const handlePhoneBlur = () => {
    const error = validatePhoneNumber(form.phone, phoneCountryCode);
    setPhoneError(error);
  };

  // Validate phone before submit
  const validatePhoneForSubmit = () => {
    if (form.phone && form.phone.trim()) {
      const error = validatePhoneNumber(form.phone, phoneCountryCode);
      if (error) {
        return { isValid: false, message: error };
      }
    }
    return { isValid: true, message: "" };
  };

  // Get country max length for input field
  const getPhoneMaxLength = () => getCountryDisplayMaxLength(phoneCountryCode) || 15;

  // Navigate to next step
  const nextStep = () => {
    if (wizardStep < MAX_WIZARD_STEP) {
      setWizardStep((prev) => prev + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (wizardStep > 0) {
      setWizardStep((prev) => prev - 1);
    }
  };

  // Format phone with country code for API
  const getFormattedPhone = () => {
    return form.phone ? `${phoneCountryCode}${form.phone}` : "";
  };

  return {
    // Form state
    form,
    setForm,
    wizardStep,
    setWizardStep,
    phoneCountryCode,
    setPhoneCountryCode,
    phoneError,
    setPhoneError,
    showCreatePassword,
    setShowCreatePassword,
    showModal,
    setShowModal,

    // Form methods
    updateFormField,
    handlePhoneInput,
    handlePhoneBlur,
    validatePhoneForSubmit,
    nextStep,
    prevStep,
    openModal,
    closeModal,
    resetForm,
    getPhoneMaxLength,
    getFormattedPhone,

    // Constants
    COUNTRY_CODE_OPTIONS,
    EMPTY_FORM,
  };
};
