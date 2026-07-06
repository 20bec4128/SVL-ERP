import { useState } from "react";

const EMPTY_FORM = {
  // Personal Information
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  showPassword: false,
  phone: "",
  countryCode: "+91",
  dob: "",
  // Additional Details
  type: "",
  notes: "",
  // Billing Address
  billingContactPerson: "",
  billingCompany: "",
  billingPhone: "",
  billingEmail: "",
  billingAddress1: "",
  billingAddress2: "",
  billingCity: "",
  billingState: "",
  billingPincode: "",
  billingCountry: "",
  // Shipping Address
  shippingContactPerson: "",
  shippingCompany: "",
  shippingPhone: "",
  shippingEmail: "",
  shippingAddress1: "",
  shippingAddress2: "",
  shippingCity: "",
  shippingState: "",
  shippingPincode: "",
  shippingCountry: "",
};

export const useCreateCustomerWizard = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [wizardStep, setWizardStep] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setWizardStep(0);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (wizardStep < 2) setWizardStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (wizardStep > 0) setWizardStep((prev) => prev - 1);
  };

  return {
    form,
    setForm,
    wizardStep,
    setWizardStep,
    showModal,
    setShowModal,
    updateFormField,
    nextStep,
    prevStep,
    openModal,
    closeModal,
    resetForm,
    EMPTY_FORM,
  };
};
