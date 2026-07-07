import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import "./LeadEditPage.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getLeadById,
  updateLeadRowStatus,
  updateLeadDetails,
  getLeadLog,
  getAssignableAllocators,
  getAssignableLeadGroups,
  updateLeadAllocator,
  getLeadChatMessages,
  sendLeadChatAttachment,
  downloadLeadChatAttachment,
  uploadLeadPaymentProof,
} from "../../api/leadsApi";
import { getAddressesbyLeadId, createAddress, getAddressesByLeadIdAndType, getAddressById } from "../../api/addressApi";
import { createStockRequest, getStockItems } from "../../api/stocksApi";
import { getLeadFlow } from "../../api/flowApi";
import { getLeadStatuses, DEFAULT_LEAD_STATUSES } from "../../api/leadStatusApi";
import { getLeadTypes } from "../../api/leadTypeApi";
import { createProject, getProjects } from "../../api/projectApi";
import { getProjectStatuses } from "../../api/projectStatusApi";
import { getProjectTypes } from "../../api/projectTypeApi";
import { Country, State, City } from "country-state-city";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { COUNTRY_CODE_OPTIONS, defaultCountryOption, ensureCountryCodeValue, getCountryAllowedLengths, getCountryDisplayMaxLength, getCountryOptionByValue, sanitizePhoneDigits, validatePhoneNumber } from "../../utils/phoneUtils";
import { pickFlowAssignee, pickGroupAssignee } from "../../utils/flowAssignment";
import { validateStatusTransition } from "../../utils/statusValidation";
import { formatStatusLabel, uniqueStatusOptions, normalizeStatusLabelKey, getStatusStyle } from "../../utils/statusLabels";
import { useCountryCodePicker } from "../../hooks/useCountryCodePicker";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import StockRequestFormModal from "../../components/system/StockRequestFormModal";
import FilePreviewModal from "../../components/admin/FilePreviewModal";
import PaymentVerificationModal from "./PaymentVerificationModal";
import AddressFormModal from "./AddressFormModal";
import RequirementFormModal from "./RequirementFormModal";
import { deleteRequirement, getRequirementsByLeadId } from "../../api/requirementApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import { getPrimarySources } from "../../api/primarySourceApi";
import { getSecondarySources } from "../../api/secondarySourceApi";
import api from "../../utils/api";
import { ATTEMPTED_REASON_OPTIONS, NOT_ATTEMPTED_REASON_OPTIONS, INTERESTED_REASON_OPTIONS } from "../../constants/leadFlowStatuses";

const CUSTOMER_CHAT_DISABLED = true;

function formatDateTime(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  } catch {
    return String(value);
  }
}

function formatDateOnly(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
  } catch {
    return String(value);
  }
}

function pickText(row, keys = []) {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim();
      if (/^select\s+allocat/i.test(trimmed)) {
        continue;
      }
      return trimmed;
    }
    if (typeof value === "number" && !Number.isNaN(value)) {
      return String(value);
    }
  }
  return "";
}

function toOptionNames(rows, keys) {
  const names = (Array.isArray(rows) ? rows : [])
    .map((row) => pickText(row, keys))
    .filter(Boolean);
  return Array.from(new Set(names));
}

function getLeadSourceName(row, keys) {
  return pickText(row, keys);
}

function parseProductionBrief(briefJson) {
  if (!briefJson) return null;
  try {
    if (typeof briefJson === "string") {
      return JSON.parse(briefJson);
    }
    return briefJson;
  } catch {
    return null;
  }
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeCountryCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+${raw}`;
}

function normalizeLeadStateValue(countryIso, stateValue) {
  const raw = String(stateValue || "").trim();
  if (!countryIso || !raw) return "";
  const states = State.getStatesOfCountry(countryIso);
  const directMatch = states.find(
    (state) =>
      String(state.isoCode || "").toUpperCase() === raw.toUpperCase() ||
      String(state.name || "").toLowerCase() === raw.toLowerCase(),
  );
  return directMatch?.isoCode || raw;
}

const DEFAULT_CUSTOMER_LOGIN_PASSWORD = "Customer@123";

export default function LeadEditPage({ leadIdOverride } = {}) {
  const params = useParams();
  const id = leadIdOverride || params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const { showSuccess, showError } = useToast();
  const [lead, setLead] = useState(null);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  const [leadTypeValue, setLeadTypeValue] = useState("");
  const [typeSaving, setTypeSaving] = useState(false);
  const [alternatePhone, setAlternatePhone] = useState("");
  const [alternateEmail, setAlternateEmail] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [occupation, setOccupation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [productType, setProductType] = useState("");
  const [variant, setVariant] = useState("");
  const [quantity, setQuantity] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadMobile, setLeadMobile] = useState("");
  const [primarySourceRows, setPrimarySourceRows] = useState([]);
  const [secondarySourceRows, setSecondarySourceRows] = useState([]);
  const [sourceOptionsLoaded, setSourceOptionsLoaded] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [projectTypes, setProjectTypes] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const countryPickerButtonRef = useRef(null);
  const [leadCountry, setLeadCountry] = useState("");
  const [leadState, setLeadState] = useState("");
  const [leadCity, setLeadCity] = useState("");
  const [leadPincode, setLeadPincode] = useState("");
  const [leadGstin, setLeadGstin] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [flowRules, setFlowRules] = useState([]);
  const [attemptedOpenReason, setAttemptedOpenReason] = useState("");
  const [attemptedCallStatus, setAttemptedCallStatus] = useState("");
  const [attemptedCallRemarks, setAttemptedCallRemarks] = useState("");
  const [attemptedFollowUpDate, setAttemptedFollowUpDate] = useState("");
  const [notAttemptedCallStatus, setNotAttemptedCallStatus] = useState("");
  const [notAttemptedCallRemarks, setNotAttemptedCallRemarks] = useState("");
  const [interestedFollowUpDate, setInterestedFollowUpDate] = useState("");
  const [interestedCallStatus, setInterestedCallStatus] = useState("");
  const [interestedCallRemarks, setInterestedCallRemarks] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");
  const [rejectedReasonSubtype, setRejectedReasonSubtype] = useState("");
  const [statusErrors, setStatusErrors] = useState({});
  const [leadLogs, setLeadLogs] = useState([]);
  const [leadGroupOptions, setLeadGroupOptions] = useState([]);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateOptions, setAllocateOptions] = useState([]);
  const [allocateOwnerId, setAllocateOwnerId] = useState("");
  const [allocateGroupId, setAllocateGroupId] = useState(null);
  const [allocateGroupName, setAllocateGroupName] = useState("");
  const [autoStatusHandled, setAutoStatusHandled] = useState(false);
  const [showDesignDurationModal, setShowDesignDurationModal] = useState(false);
  const [designMessages, setDesignMessages] = useState([]);
  const [showStockRequestModal, setShowStockRequestModal] = useState(false);
  const [stockRequestSubmitting, setStockRequestSubmitting] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [designUploadFile, setDesignUploadFile] = useState(null);
  const [finalDesignMessage, setFinalDesignMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [previewFile, setPreviewFile] = useState(null);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPaidAmount, setVerifyPaidAmount] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const initialValuesRef = useRef(null);
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyFileName, setVerifyFileName] = useState("");
  const [showLeadLogModal, setShowLeadLogModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [pendingRequirementStatus, setPendingRequirementStatus] = useState("");
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [requirementModalKey, setRequirementModalKey] = useState(0);
  const [viewingSpecs, setViewingSpecs] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  
  // Address-related state for payment verification
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState(null);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState(null);
  const [shipSame, setShipSame] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [newAddressType, setNewAddressType] = useState("BILLING");
  const [streetAddress, setStreetAddress] = useState("");
  const requirementFlowHandledRef = useRef(false);
  const showVariantQuantityFields =
    String(variant || "").trim() !== "" || String(quantity || "").trim() !== "";

  const {
    isOpen: generalCountryPickerOpen,
    pickerRef: generalCountryPickerRef,
    closePicker: closeGeneralCountryPicker,
    togglePicker: toggleGeneralCountryPicker,
    searchQuery: generalCountrySearch,
  } = useCountryCodePicker();

  const filteredGeneralCountryOptions = useMemo(() => {
    if (!generalCountrySearch.trim()) return COUNTRY_CODE_OPTIONS;
    const searchLower = generalCountrySearch.toLowerCase();
    return COUNTRY_CODE_OPTIONS.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.callingCode.includes(searchLower),
    );
  }, [generalCountrySearch]);

  const DESIGN_THREAD_MARKER = "[[design-thread]]";
  function hasDesignThreadMarker(value) {
    return String(value || "").trimStart().startsWith(DESIGN_THREAD_MARKER);
  }
  function stripDesignThreadMarker(value) {
    const raw = String(value || "");
    if (!hasDesignThreadMarker(raw)) return raw;
    const startTrimmed = raw.trimStart();
    const withoutMarker = startTrimmed.slice(DESIGN_THREAD_MARKER.length);
    return withoutMarker.replace(/^\s+/, "");
  }

  function parseDesignMessageSummary(message) {
    const text = stripDesignThreadMarker(message || "").trim();
    const lower = text.toLowerCase();

    if (lower.startsWith("customer selected: accept")) {
      return { heading: "Design Accepted", type: "accept" };
    }

    if (lower.startsWith("customer selected: reject")) {
      const match = text.match(/\(([^)]+)\)\s*$/);
      return {
        heading: "Design Rejected",
        type: "reject",
        value: match?.[1]?.trim() || "",
      };
    }

    if (lower.startsWith("customer requested change:")) {
      return {
        heading: "Design Change",
        type: "change",
        value: text.slice("Customer requested change:".length).trim(),
      };
    }

    return null;
  }

  function isFinalDesignUploadMessage(row) {
    const text = stripDesignThreadMarker(row?.message || "").trim().toLowerCase();
    return text === "final design uploaded" && !!row?.attachmentName;
  }

  function getDesignDurationDays(startValue, endValue) {
    if (!startValue || !endValue) return "";
    const start = new Date(startValue);
    const end = new Date(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "";
    return String(Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [budgetInvoiceSent, setBudgetInvoiceSent] = useState(false);
  const [paymentInvoiceSent, setPaymentInvoiceSent] = useState(false);
  const [designStartAt, setDesignStartAt] = useState("");
  const [designEndAt, setDesignEndAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);

  const isFormDirty = useMemo(() => {
    if (!initialValuesRef.current) return false;
    const init = initialValuesRef.current;
    if (leadMobile !== init.leadMobile) return true;
    if (alternatePhone !== init.alternatePhone) return true;
    if (alternateEmail !== init.alternateEmail) return true;
    if (countryCode !== init.countryCode) return true;
    if (occupation !== init.occupation) return true;
    if (companyName !== init.companyName) return true;
    if (productType !== init.productType) return true;
    if (variant !== init.variant) return true;
    if (quantity !== init.quantity) return true;
    if (leadEmail !== init.leadEmail) return true;
    if (selectedProjectId !== init.selectedProjectId) return true;
    if (leadCountry !== init.leadCountry) return true;
    if (leadState !== init.leadState) return true;
    if (leadCity !== init.leadCity) return true;
    if (leadPincode !== init.leadPincode) return true;
    if (streetAddress !== init.streetAddress) return true;
    if (leadGstin !== init.leadGstin) return true;
    return false;
  }, [
    leadMobile,
    alternatePhone,
    alternateEmail,
    countryCode,
    occupation,
    companyName,
    productType,
    variant,
    quantity,
    leadEmail,
    selectedProjectId,
    leadCountry,
    leadState,
    leadCity,
    leadPincode,
    streetAddress,
    leadGstin,
  ]);

  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getScrollContainer = () => {
    const anchor = document.getElementById("general");
    let node = anchor?.parentElement || null;

    while (node) {
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        node.scrollHeight > node.clientHeight
      ) {
        return node;
      }
      node = node.parentElement;
    }

    return window;
  };

  const flowScopeByGroupId = useMemo(() => {
    const map = new Map();
    (leadGroupOptions || []).forEach((group) => {
      if (group?.id == null) return;
      const institutionName = String(group?.institutionName || "").trim();
      if (!institutionName) return;
      map.set(String(group.id), institutionName);
    });
    return map;
  }, [leadGroupOptions]);

  useEffect(() => {
    if (loading) return;
    const sectionIds = [
      "general",
      "not_attempted",
      "attempted",
      "interested",
      "requirement",
      "rejected",
    ];

    const getCurrentActiveSection = () => {
      const elements = sectionIds
        .map((secId) => document.getElementById(secId))
        .filter(Boolean);

      if (!elements.length) return "general";

      let currentActive = elements[0].id;
      const triggerPoint = 240;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const docHeight = Math.max(
        document.body?.scrollHeight || 0,
        document.documentElement?.scrollHeight || 0,
      );
      const isNearBottom = scrollTop + viewportHeight >= docHeight - 24;

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerPoint) {
          currentActive = el.id;
        }
      }

      if (isNearBottom) {
        currentActive = elements[elements.length - 1].id;
      }

      return currentActive;
    };

    const handleScroll = () => {
      const nextActive = getCurrentActiveSection();
      setActiveTab((prev) => (prev === nextActive ? prev : nextActive));
    };

    const scrollContainer = getScrollContainer();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [loading]);

  useEffect(() => {
    let isMounted = true;
    const loadLead = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [leadData, statusRows, typeRows, logRows] = await Promise.all([
          getLeadById(id),
          getLeadStatuses(),
          getLeadTypes(),
          getLeadLog(id),
        ]);
        if (!isMounted) return;
        setLead(leadData);
        setLeadLogs(Array.isArray(logRows) ? logRows : []);
        const normalizedStatuses = Array.isArray(statusRows)
          ? statusRows
              .map((item) => item?.leadStatus || item?.name || item?.status || "")
              .filter(Boolean)
              .filter((item) => !/site\s*visit/i.test(item))
          : [];
        setLeadStatuses(
          normalizedStatuses.length ? normalizedStatuses : DEFAULT_LEAD_STATUSES,
        );
        const normalizedTypes = Array.isArray(typeRows)
          ? typeRows
              .map((item) => item?.leadType || item?.name || item?.type || "")
              .filter(Boolean)
          : [];
        setLeadTypeOptions(normalizedTypes);
        setLeadTypeValue(
          pickText(leadData, ["leadType", "lead_type", "type", "leadTypeName"]) ||
            "",
        );
        setAlternatePhone(
          pickText(leadData, [
            "alternatePhone",
            "alternateMobile",
            "altPhone",
            "altMobile",
            "secondaryPhone",
          ]) || "",
        );
        setAlternateEmail(
          pickText(leadData, ["alternateEmail", "altEmail", "secondaryEmail"]) || "",
        );
        setCountryCode(
          normalizeCountryCode(
            pickText(leadData, ["countryCode", "country_code", "dialCode", "dial_code"]),
          ),
        );
        setFollowUpDate(
          leadData?.followUpDate ? toInputDateTime(leadData.followUpDate) : "",
        );
        setAttemptedFollowUpDate(
          leadData?.followUpDate ? toInputDateTime(leadData.followUpDate) : "",
        );
        setOccupation(
          pickText(leadData, ["occupation", "jobTitle", "job_title"]) || "",
        );
        setCompanyName(
          pickText(leadData, ["companyName", "company", "organization", "organisation"]) || "",
        );
        setProductType(pickText(leadData, ["productType", "product_type"]) || "");
        setVariant(pickText(leadData, ["variant"]) || "");
        setQuantity(pickText(leadData, ["quantity"]) || "");
        setLeadEmail(pickText(leadData, ["email"]) || "");
        setLeadMobile(pickText(leadData, ["mobile", "phone", "phoneNumber", "phone_number"]) || "");
        setSelectedProjectId(pickText(leadData, ["projectId", "project_id"]) || "");
        const savedCountry = pickText(leadData, ["leadCountry", "country"]) || "";
        let resolvedLeadCountry = savedCountry;
        if (savedCountry) {
          setLeadCountry(savedCountry);
        } else {
          // derive from phone country code
          const phone = normalizeCountryCode(
            pickText(leadData, ["countryCode", "country_code", "dialCode", "dial_code"]),
          ).replace("+", "");
          const matched = Country.getAllCountries().find((c) => c.phonecode === phone);
          if (matched) {
            resolvedLeadCountry = matched.isoCode;
            setLeadCountry(matched.isoCode);
          }
        }
        // If country is still unknown but we have state data, default to India
        const rawState = pickText(leadData, ["leadState", "state"]) || "";
        if (!resolvedLeadCountry && rawState) {
          resolvedLeadCountry = "IN";
          setLeadCountry("IN");
        }
        setLeadState(
          normalizeLeadStateValue(
            resolvedLeadCountry,
            rawState,
          ),
        );
        setLeadCity(pickText(leadData, ["leadCity", "city"]) || "");
        setLeadPincode(pickText(leadData, ["leadPincode", "lead_pincode", "pincode", "pinCode"]) || "");
        setLeadGstin(pickText(leadData, ["gstin"]) || "");
        setStreetAddress(
          pickText(leadData, ["streetAddress", "street_address", "addressLine1", "address_line1"]) ||
            "",
        );
        setAttemptedOpenReason(
          pickText(leadData, ["attemptedOpenReason", "attempted_open_reason"]) || "",
        );
        setAttemptedCallStatus(
          pickText(leadData, ["attemptedCallStatus", "attempted_call_status"]) || "",
        );
        setAttemptedCallRemarks(
          pickText(leadData, ["attemptedCallRemarks", "attempted_call_remarks"]) || "",
        );
        setNotAttemptedCallStatus(
          pickText(leadData, ["notAttemptedCallStatus", "not_attempted_call_status"]) || "",
        );
        setNotAttemptedCallRemarks(
          pickText(leadData, ["notAttemptedCallRemarks", "not_attempted_call_remarks"]) || "",
        );
        setInterestedFollowUpDate(
          leadData?.interestedFollowUpDate
            ? toInputDateTime(leadData.interestedFollowUpDate)
            : "",
        );
        setInterestedCallStatus(
          pickText(leadData, ["interestedCallStatus", "interested_call_status"]) || "",
        );
        setInterestedCallRemarks(
          pickText(leadData, ["interestedCallRemarks", "interested_call_remarks"]) || "",
        );
        setRejectedReason(
          pickText(leadData, ["rejectedReason", "rejected_reason"]) || "",
        );
        setRejectedReasonSubtype(
          pickText(leadData, ["rejectedReasonSubtype", "rejected_reason_subtype"]) || "",
        );
        setTotalAmount(
          pickText(leadData, ["totalAmount", "total_amount"]) || "",
        );
        const loadedTotal = pickText(leadData, ["totalAmount", "total_amount"]) || "";
        const loadedPaid = pickText(leadData, ["paidAmount", "paid_amount"]) || "0";
        const loadedRemaining = pickText(leadData, ["remainingAmount", "remaining_amount"]);

        setTotalAmount(loadedTotal);
        setPaidAmount(loadedPaid);
        setRemainingAmount(
          loadedRemaining || String(Math.max(0, Number(loadedTotal || 0) - Number(loadedPaid || 0))),
        );
        setBudgetInvoiceSent(leadData?.budgetInvoiceSent || false);
        setPaymentInvoiceSent(leadData?.paymentInvoiceSent || false);
        // design timing fields may be added during payment chat
        setDesignStartAt(
          leadData?.designStartAt ? toInputDateTime(leadData.designStartAt) : "",
        );
        setDesignEndAt(
          leadData?.designEndAt ? toInputDateTime(leadData.designEndAt) : "",
        );
        setStatusValue("");
        initialValuesRef.current = {
          leadMobile: pickText(leadData, ["mobile", "phone", "phoneNumber", "phone_number"]) || "",
          alternatePhone: pickText(leadData, ["alternatePhone", "alternate_phone"]) || "",
          alternateEmail: pickText(leadData, ["alternateEmail", "alternate_email"]) || "",
          countryCode: pickText(leadData, ["countryCode", "country_code"]) || "",
          occupation: pickText(leadData, ["occupation", "jobTitle", "job_title"]) || "",
          companyName: pickText(leadData, ["companyName", "company", "organization", "organisation"]) || "",
          productType: pickText(leadData, ["productType", "product_type"]) || "",
          variant: pickText(leadData, ["variant"]) || "",
          quantity: pickText(leadData, ["quantity"]) || "",
          leadEmail: pickText(leadData, ["email"]) || "",
          selectedProjectId: pickText(leadData, ["projectId", "project_id"]) || "",
          leadCountry: resolvedLeadCountry || "",
          leadState: normalizeLeadStateValue(resolvedLeadCountry, rawState) || "",
          leadCity: pickText(leadData, ["leadCity", "city"]) || "",
          leadPincode: pickText(leadData, ["leadPincode", "lead_pincode", "pincode", "pinCode"]) || "",
          streetAddress: pickText(leadData, ["streetAddress", "street_address", "addressLine1", "address_line1"]) || "",
          leadGstin: pickText(leadData, ["gstin"]) || "",
        };
      } catch (e) {
        if (!isMounted) return;
        showError(extractApiErrorMessage(e, "Failed to load lead"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadLead();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const refreshLeadLogs = async (leadId = lead?.id) => {
    if (!leadId) return;
    try {
      const rows = await getLeadLog(leadId);
      setLeadLogs(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.warn("Failed to refresh lead logs", error);
    }
  };

  // Auto-refresh lead + invoice when the browser tab regains focus (e.g. after admin approves on another page).
  // Throttled to once per 10 seconds to avoid excessive API calls.
  useEffect(() => {
    if (!id) return;
    let lastFetch = 0;
    const handleFocus = async () => {
      const now = Date.now();
      if (now - lastFetch < 10000) return;
      lastFetch = now;
      try {
        const fresh = await getLeadById(id);
        if (fresh) setLead(prev => ({ ...(prev || {}), ...fresh }));
      } catch { /* silent */ }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [id]);

  const effectiveStatus = String(lead?.status || "").trim();
  const statusLower = effectiveStatus.toLowerCase();

  useEffect(() => {
    if (!lead?.id || autoStatusHandled) return;
    const params = new URLSearchParams(location.search || "");
    const nextStatus = String(params.get("status") || "").trim();
    if (!nextStatus) return;
    const nextKey = nextStatus.toLowerCase();
    setStatusValue(nextStatus);
    if (nextKey === "rejected" && statusNeedsModal(nextKey)) {
      setShowRejectedModal(true);
    } else if (nextKey === "allocate") {
      setShowAllocateModal(true);
    }
    setAutoStatusHandled(true);
  }, [lead?.id, location.search, autoStatusHandled]);

  useEffect(() => {
    if (!lead?.id) return;
    const params = new URLSearchParams(location.search || "");
    const shouldOpenRequirement = params.get("openRequirement") === "1";
    if (!shouldOpenRequirement) {
      requirementFlowHandledRef.current = false;
      return;
    }
    if (requirementFlowHandledRef.current) return;
    requirementFlowHandledRef.current = true;
    params.delete("openRequirement");
    params.delete("pendingRequirementStatus");
    navigate(`/requirements/add?leadId=${lead.id}`, { replace: true });
  }, [lead?.id, location.search, navigate]);

  // Fetch primary and secondary source options on mount
  useEffect(() => {
    const fetchSourceOptions = async () => {
      try {
        const [primarySources, secondarySources] = await Promise.all([
          getPrimarySources(),
          getSecondarySources(),
        ]);
        setPrimarySourceRows(Array.isArray(primarySources) ? primarySources : []);
        setSecondarySourceRows(Array.isArray(secondarySources) ? secondarySources : []);
        setSourceOptionsLoaded(true);
      } catch (error) {
        console.error("Failed to fetch source options:", error);
      }
    };
    fetchSourceOptions();
  }, []);

  const primarySourceOptions = useMemo(
    () => toOptionNames(primarySourceRows, ["primarySource", "name", "label"]),
    [primarySourceRows],
  );

  const selectedPrimarySourceRow = useMemo(() => {
    const selected = String(lead?.primarySource || "").trim().toLowerCase();
    if (!selected) return null;
    return (Array.isArray(primarySourceRows) ? primarySourceRows : []).find((row) =>
      String(getLeadSourceName(row, ["primarySource", "name", "label"])).trim().toLowerCase() === selected,
    ) || null;
  }, [lead?.primarySource, primarySourceRows]);

  const secondarySourceOptions = useMemo(() => {
    const selectedPrimaryId = selectedPrimarySourceRow?.id == null ? "" : String(selectedPrimarySourceRow.id);
    if (!selectedPrimaryId) return [];
    const filteredRows = (Array.isArray(secondarySourceRows) ? secondarySourceRows : []).filter(
      (row) => row?.primarySourceId == null || String(row?.primarySourceId ?? "") === selectedPrimaryId,
    );
    return toOptionNames(filteredRows, ["secondarySource", "name", "label"]);
  }, [secondarySourceRows, selectedPrimarySourceRow]);

  useEffect(() => {
    if (!sourceOptionsLoaded) return;
    if (!lead?.secondarySource) return;
    if (secondarySourceOptions.includes(lead.secondarySource)) return;
    setLead((prev) => ({ ...(prev || {}), secondarySource: "" }));
  }, [lead?.secondarySource, secondarySourceOptions, sourceOptionsLoaded]);

  // Fetch addresses whenverify modal opens
  useEffect(() => {
    if (!showVerifyModal || !lead?.id || addressLoading) return;
    
    const fetchAddresses = async () => {
      setAddressLoading(true);
      try {
        const billingList = await getAddressesByLeadIdAndType(lead.id, "BILLING");
        const shippingList = await getAddressesByLeadIdAndType(lead.id, "SHIPPING");
        setBillingAddresses(billingList || []);
        setShippingAddresses(shippingList || []);
        
        // Auto-select primary billing address
        const primaryBilling = billingList?.find(a => a.isPrimary);
        if (primaryBilling) {
          setSelectedBillingAddressId(primaryBilling.id);
        } else if (billingList?.length > 0) {
          setSelectedBillingAddressId(billingList[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch addresses:", e);
      } finally {
        setAddressLoading(false);
      }
    };
    
    fetchAddresses();
  }, [showVerifyModal, lead?.id]);

  // Fetch service categories and types once on mount
  useEffect(() => {
    const fetchServiceMasterData = async () => {
      try {
        const [cats, types] = await Promise.all([
          getServiceCategories(),
          getServiceTypes(),
        ]);
        setServiceCategories(Array.isArray(cats) ? cats : []);
        setServiceTypes(Array.isArray(types) ? types : []);
      } catch {
        // silent
      }
    };
    fetchServiceMasterData();
  }, []);

  const resolveNextGroupIdForStatus = (status) => {
    if (!Array.isArray(flowRules)) return null;
    const targetRule = flowRules.find(
      (rule) =>
        normalizeStatusLabelKey(rule?.status) ===
        normalizeStatusLabelKey(status),
    );
    return targetRule?.handledByGroupId ?? null;
  };

  const syncRequirementStatusIfNeeded = async (requirementRows, successMessage = "") => {
    const rows = Array.isArray(requirementRows) ? requirementRows : [];
    if (!lead?.id || rows.length === 0) return null;
    if (String(lead?.status || "").trim().toLowerCase() === "requirement") return null;

    try {
      const updatedLead = await updateLeadRowStatus(
        lead.id,
        "Requirement",
        resolveNextGroupIdForStatus("Requirement"),
      );
      setLead((prev) => ({ ...(prev || {}), ...updatedLead }));
      setStatusValue((prev) => (String(prev || "").trim() ? prev : "Requirement"));
      setActiveTab("requirement");
      await refreshLeadLogs(lead.id);
      if (successMessage) {
        showSuccess(successMessage);
      }
      return updatedLead;
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update status"));
      return null;
    }
  };

  // Fetch requirements for this lead
  useEffect(() => {
    if (!lead?.id) return;
    refreshRequirements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  const refreshRequirements = async (successMessage = "") => {
    if (!lead?.id) return [];
    try {
      const data = await getRequirementsByLeadId(lead.id);
      const rows = Array.isArray(data) ? data : [];
      setRequirements(rows);
      await syncRequirementStatusIfNeeded(rows, successMessage);
      return rows;
    } catch {
      // silent
      return [];
    }
  };

  const openRequirementModal = (nextStatus = "") => {
    navigate(`/requirements/add?leadId=${id}`);
  };

  const openAddRequirementModal = () => {
    navigate(`/requirements/add?leadId=${id}`);
  };

  const openEditRequirementModal = (requirement) => {
    navigate(`/requirements/${requirement.id}/edit?leadId=${id}`);
  };

  const handleDeleteRequirement = async (requirement) => {
    if (!requirement?.id) return;
    const confirmed = window.confirm("Delete this requirement?");
    if (!confirmed) return;
    try {
      await deleteRequirement(requirement.id);
      await refreshRequirements();
      showSuccess("Requirement deleted");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete requirement"));
    }
  };

  const normalizeKey = (s) => normalizeStatusLabelKey(s);
  // appearing.  the stage order reflects progression through the flow.
  const leadStageOrder = [
    "new lead",
    "attempted",
    "interested",
    "requirement",
    "budget",
    "design",
    "payment",
    "deal",
    "production",
  ];
  const currentStageIndex = leadStageOrder.indexOf(statusLower);
  const hasReachedStage = (stage) => {
    const targetIndex = leadStageOrder.indexOf(String(stage || "").toLowerCase());
    if (targetIndex === -1 || currentStageIndex === -1) return false;
    return currentStageIndex >= targetIndex;
  };

  // determine if the modal for a given status should be shown based on existing lead data
  const statusNeedsModal = (status) => {
    if (!lead) return true;
    const key = String(status || "").trim().toLowerCase();
    switch (key) {
      case "not attempted":
        return !lead.notAttemptedCallStatus || !lead.notAttemptedCallRemarks;
      case "attempted":
        return !lead.attemptedOpenReason || !lead.attemptedCallRemarks;
      case "interested":
        return !lead.interestedCallStatus || !lead.interestedFollowUpDate || !lead.interestedCallRemarks;
      case "rejected":
        return !lead.rejectedReason;
      case "requirement":
      case "budget":
        return requirements.length === 0;
      default:
        return true;
    }
  };

  // Computed status flags
  const isNewLead = statusLower === "new lead";
  const isNotAttempted = statusLower === "not attempted";
  const isAttempted = statusLower === "attempted";
  const isInterested = statusLower === "interested";
  const isRejected = statusLower === "rejected";
  const isDesign = statusLower === "design";
  const isPayment = statusLower === "payment";
  const isProduction = statusLower === "production";
  const isConverted = statusLower === "deal";
  const isLeadReadOnly = isConverted;
  const isEmployeeDesignView = role === "EMPLOYEE" && statusLower === "design";
  const lockAfterAttempted = hasReachedStage("interested") || isRejected;
  const canEditAllGeneralInfo =
    role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER" || role === "TEAM_LEAD";
  const isGeneralInfoReadOnly = !canEditAllGeneralInfo && (lockAfterAttempted || isLeadReadOnly);
  const generalAddressCountry = leadCountry || (isNewLead ? "IN" : "");
  // Only elevated roles can edit these fields: Mobile, Primary Source, Secondary Source
  const isElevatedOnlyField = !["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes(role);
  const hasAttemptedData = Boolean(
    lead?.attemptedOpenReason || lead?.attemptedCallRemarks,
  );
  const hasNotAttemptedData = Boolean(
    lead?.notAttemptedCallStatus || lead?.notAttemptedCallRemarks,
  );
  const hasInterestedData = Boolean(
    lead?.interestedCallStatus || lead?.interestedFollowUpDate || lead?.interestedCallRemarks,
  );
  const hasRequirementData = requirements.length > 0;
    const hasDesignData = Boolean(
      lead?.designStartAt || lead?.designEndAt || finalDesignMessage?.id,
    );
  const hasPaymentData = Boolean(
    lead?.totalAmount != null ||
      lead?.paidAmount != null ||
      lead?.remainingAmount != null ||
      lead?.paymentOwnerId != null,
  );
  const hasPaymentVerificationData = Boolean(
    lead?.paymentVerificationStatus ||
      lead?.paymentVerificationAmount != null ||
      lead?.paymentProofFileName ||
      lead?.paymentProofFilePath ||
      lead?.paymentProofNotes,
  );
  const alternatePhoneCountryOption = getCountryOptionByValue(countryCode);
  const alternatePhoneAllowedLengths = getCountryAllowedLengths(countryCode);
  const alternatePhoneDisplayMaxLength = getCountryDisplayMaxLength(countryCode);

  const showNotAttemptedSummary = hasNotAttemptedData || isNotAttempted;
  const showAttemptedSummary = hasAttemptedData || isAttempted;
  const showInterestedSummary = hasInterestedData || isInterested;
  const showRequirementSummary =
    hasRequirementData || hasReachedStage("requirement");
  const hasReachedPaymentStage = hasReachedStage("payment");
  const showPaymentSummary =
    hasPaymentData ||
    hasPaymentVerificationData ||
    hasReachedPaymentStage;

  const visibleTabs = useMemo(() => {
    const tabs = ["general"];
    if (showNotAttemptedSummary) tabs.push("not_attempted");
    if (showAttemptedSummary) tabs.push("attempted");
    if (showInterestedSummary) tabs.push("interested");
    if (showRequirementSummary) tabs.push("requirement");
    if (isRejected) tabs.push("rejected");
    return tabs;
  }, [showNotAttemptedSummary, showAttemptedSummary, showInterestedSummary, showRequirementSummary, isRejected]);

  const wizardProgress = useMemo(() => {
    const idx = visibleTabs.indexOf(activeTab);
    if (idx < 0 || visibleTabs.length <= 1) return 0;
    return (idx / (visibleTabs.length - 1)) * 100;
  }, [visibleTabs, activeTab]);

  const parsedInvoice = (() => {
    if (!lead?.invoiceData) return null;
    try { return JSON.parse(lead.invoiceData); } catch { return null; }
  })();


  const handleDownloadInvoice = async () => {
    if (!parsedInvoice) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageMargin = 10;
      const invoiceNumber = `INV-${lead.leadId || lead.id}`;
      const isPaymentType = parsedInvoice.type === "payment";

      // Header
      doc.setFontSize(18);
      doc.text(isPaymentType ? "PAYMENT APPROVAL INVOICE" : "INVOICE", pageMargin, 15);

      // Company details
      doc.setFontSize(10);
      doc.text("SVL Printing and Packaging", pageMargin, 25);
      doc.text("GSTIN: 07AABCS1234H1Z0", pageMargin, 30);
      doc.text("103-A, Industrial Complex, SVL Business Park", pageMargin, 35);
      doc.text("Bangalore, Karnataka, 560001, India", pageMargin, 40);
      if (isPaymentType) {
        doc.text("Email: billing@svlprinting.com | Phone: +91-080-41234567", pageMargin, 45);
      }

      doc.setFontSize(9);
      doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - pageMargin - 60, 25);
      doc.text(`Date: ${parsedInvoice.createdAt ? new Date(parsedInvoice.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}`, pageWidth - pageMargin - 60, 30);
      doc.text(`Lead: ${lead.name}`, pageWidth - pageMargin - 60, 35);

      let tableStartY = 55;

      // Addresses section for payment invoices
      if (isPaymentType) {
        const formatAddress = (address) => {
          if (!address) return "-";
          const parts = [
            address.companyName || address.company_name,
            address.contactPersonName || address.contact_person_name,
            address.addressLine1 || address.address_line1,
            address.addressLine2 || address.address_line2,
            address.city,
            address.state,
            address.pincode,
            address.country,
          ].filter(Boolean);
          return parts.join(", ");
        };

        let billingAddr = null;
        let shippingAddr = null;
        try {
          if (lead.paymentVerificationBillingAddressId) {
            billingAddr = await getAddressById(lead.id, lead.paymentVerificationBillingAddressId);
          }
          if (lead.paymentVerificationShippingAddressId) {
            shippingAddr = await getAddressById(lead.id, lead.paymentVerificationShippingAddressId);
          }
        } catch (e) { /* addresses optional */ }

        const blockY = 55;
        const blockHeight = 30;
        const blockWidth = (pageWidth - pageMargin * 3) / 2;
        const billingX = pageMargin;
        const shippingX = pageMargin + blockWidth + pageMargin;
        const titleY = blockY + 3;
        const textY = blockY + 9;

        const billingLines = doc.splitTextToSize(formatAddress(billingAddr), blockWidth - 4);
        const shippingLines = doc.splitTextToSize(formatAddress(shippingAddr), blockWidth - 4);

        doc.rect(billingX, blockY, blockWidth, blockHeight);
        doc.rect(shippingX, blockY, blockWidth, blockHeight);

        doc.setFontSize(8.5);
        doc.text("BILLING ADDRESS", billingX + 2, titleY);
        doc.text("SHIPPING ADDRESS", shippingX + 2, titleY);
        doc.setFontSize(8);
        doc.text(billingLines, billingX + 2, textY);
        doc.text(shippingLines, shippingX + 2, textY);

        tableStartY = blockY + blockHeight + 6;
      }

      const itemsWithTotals = (parsedInvoice.items || []).map(item => ({
        ...item,
        subtotal: item.subtotal ?? (Number(item.quantity) * Number(item.unitPrice)),
      }));
      autoTable(doc, {
        startY: tableStartY,
        head: [["#", "Description", "HSN", "Qty", "Unit Price", "Amount"]],
        body: itemsWithTotals.map((item, idx) => [
          String(idx + 1),
          item.description,
          item.hsn || "",
          Number(item.quantity).toFixed(2),
          Number(item.unitPrice).toFixed(2),
          Number(item.subtotal).toFixed(2),
        ]),
        margin: { left: pageMargin, right: pageMargin },
        styles: { fontSize: 7.8, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: { 0: { halign: "center", cellWidth: 10 }, 3: { halign: "right", cellWidth: 18 }, 4: { halign: "right", cellWidth: 28 }, 5: { halign: "right", cellWidth: 28 } },
      });
      const t = parsedInvoice.totals || {};
      const finalY = (doc.lastAutoTable?.finalY || tableStartY) + 5;
      const sx = pageWidth - 72;
      const sv = pageWidth - pageMargin;
      const gap = 4.2;
      doc.setFontSize(8.5);
      doc.text("Subtotal:", sx, finalY);
      doc.text(`Rs ${Number(t.subtotal || 0).toFixed(2)}`, sv, finalY, { align: "right" });
      doc.text(`CGST (${Number(t.cgstPercent || 0).toFixed(2)}%):`, sx, finalY + gap);
      doc.text(`Rs ${Number(t.cgst || 0).toFixed(2)}`, sv, finalY + gap, { align: "right" });
      doc.text(`SGST (${Number(t.sgstPercent || 0).toFixed(2)}%):`, sx, finalY + gap * 2);
      doc.text(`Rs ${Number(t.sgst || 0).toFixed(2)}`, sv, finalY + gap * 2, { align: "right" });
      doc.setFontSize(9);
      doc.text("Grand Total:", sx, finalY + gap * 3);
      doc.text(`Rs ${Number(t.grandTotal || 0).toFixed(2)}`, sv, finalY + gap * 3, { align: "right" });

      if (isPaymentType) {
        const verifiedAmt = Number(t.verificationAmount || 0);
        const totalPaid = Number(lead.paidAmount || 0);
        const remaining = Math.max(0, Number(t.grandTotal || 0) - totalPaid);

        doc.text("Amount Verified (This Payment):", sx, finalY + gap * 4.2);
        doc.text(`Rs ${verifiedAmt.toFixed(2)}`, sv, finalY + gap * 4.2, { align: "right" });
        doc.text("Total Paid Amount:", sx, finalY + gap * 5.2);
        doc.text(`Rs ${totalPaid.toFixed(2)}`, sv, finalY + gap * 5.2, { align: "right" });
        doc.text("Remaining:", sx, finalY + gap * 6.2);
        doc.text(`Rs ${remaining.toFixed(2)}`, sv, finalY + gap * 6.2, { align: "right" });

        // Footer
        doc.setFontSize(8);
        doc.text("Payment Approved", pageMargin, pageHeight - 10);
      }

      doc.save(`${isPaymentType ? "Payment-Approved" : "Invoice"}-${invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Failed to generate invoice PDF:", err);
    }
  };

  const handleExportGeneralInfoPDF = () => {
    if (!lead) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("General Info", 14, 18);
    doc.setFontSize(10);
    doc.text(lead.name || "", 14, 26);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 31);
    const rows = [
      ["Enquiry Id", pickText(lead, ["enquiryId", "enquiryID", "leadId", "leadID", "lead_id", "enquiryCode", "enquiry_code"]) || "-"],
      ["EUID", pickText(lead, ["euid"]) || "-"],
      ["Enquiry Name", lead.name || "-"],
      ["Country Code", countryCode || "-"],
      ["Mobile Number", lead.mobile || "-"],
      ["Email", lead.email || "-"],
      ["Enquiry Project", lead.projectName || "-"],
      ["Alternate No.", alternatePhone || "-"],
      ["Alternate Email", alternateEmail || "-"],
      ["Occupation", occupation || "-"],
      ["Company Name", companyName || "-"],
      ["Lead Group", pickText(lead, ["leadGroupName", "groupName"]) || "-"],
      ["Rating", leadTypeValue || "-"],
      ["Allocator", pickText(lead, ["Allocator", "allocator", "allocatorName", "createdByName", "createdBy", "createdByUsername", "creator"]) || "-"],
      ["Lead Owner", pickText(lead, ["ownerName", "owner", "ownerUsername", "ownerUserName"]) || "-"],
      ["Enquiry Status", formatStatusLabel(lead.status) || "-"],
    ];
    autoTable(doc, {
      startY: 36,
      head: [["Field", "Value"]],
      body: rows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    });
    doc.save(`GeneralInfo-${lead.name || lead.id || "lead"}.pdf`);
  };

  const handleExportGeneralInfoExcel = () => {
    if (!lead) return;
    const rows = [
      ["Field", "Value"],
      ["Enquiry Id", pickText(lead, ["enquiryId", "enquiryID", "leadId", "leadID", "lead_id", "enquiryCode", "enquiry_code"]) || ""],
      ["EUID", pickText(lead, ["euid"]) || ""],
      ["Enquiry Name", lead.name || ""],
      ["Country Code", countryCode || ""],
      ["Mobile Number", lead.mobile || ""],
      ["Email", lead.email || ""],
      ["Enquiry Project", lead.projectName || ""],
      ["Alternate No.", alternatePhone || ""],
      ["Alternate Email", alternateEmail || ""],
      ["Occupation", occupation || ""],
      ["Company Name", companyName || ""],
      ["Lead Group", pickText(lead, ["leadGroupName", "groupName"]) || ""],
      ["Rating", leadTypeValue || ""],
      ["Allocator", pickText(lead, ["Allocator", "allocator", "allocatorName", "createdByName", "createdBy", "createdByUsername", "creator"]) || ""],
      ["Lead Owner", pickText(lead, ["ownerName", "owner", "ownerUsername", "ownerUserName"]) || ""],
      ["Enquiry Status", formatStatusLabel(lead.status) || ""],
    ];
    const csvContent = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GeneralInfo-${lead.name || lead.id || "lead"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Set active tab based on current lead status
  useEffect(() => {
    if (!lead?.id) return;

    let tabToActivate = "general";

    if (statusLower === "attempted") {
      tabToActivate = "attempted";
    } else if (statusLower === "interested") {
      tabToActivate = "interested";
    } else if (statusLower === "rejected") {
      tabToActivate = "rejected";
    }
    
    setActiveTab(tabToActivate);
  }, [lead?.id, effectiveStatus]);

  useEffect(() => {
    if (CUSTOMER_CHAT_DISABLED) {
      setDesignMessages([]);
      setFinalDesignMessage(null);
      return;
    }
    if (!lead?.id) return;
    const statusKey = effectiveStatus.toLowerCase();
    if (statusKey !== "design" && statusKey !== "payment" && statusKey !== "production") return;
    getLeadChatMessages(lead.id, "CUSTOMER")
      .then((rows) => {
        const source = Array.isArray(rows) ? rows : [];
        const list = source.filter((m) => {
          if (m.senderRole !== "CUSTOMER") return false;
          const msg = String(m?.message || "");
          const lower = msg.trim().toLowerCase();
          const isCustomerChoice =
            lower.startsWith("customer selected:") ||
            lower.startsWith("customer requested change");
          return hasDesignThreadMarker(msg) || isCustomerChoice;
        });
        const finalUpload = [...source].reverse().find((m) => isFinalDesignUploadMessage(m)) || null;
        setDesignMessages(list);
        setFinalDesignMessage(finalUpload);
      })
      .catch((err) => {
        if (err?.response?.status !== 404) {
          console.error("failed to load design messages", err);
        }
        setDesignMessages([]);
        setFinalDesignMessage(null);
      });
  }, [lead?.id, effectiveStatus]);


  useEffect(() => {
    let active = true;
    const loadGroups = async () => {
      try {
        const groups = await getAssignableLeadGroups();
        if (!active) return;
        setLeadGroupOptions(Array.isArray(groups) ? groups : []);
      } catch (e) {
        if (!active) return;
        setLeadGroupOptions([]);
      }
    };
    loadGroups();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadFlow = async () => {
      try {
        const groupId = lead?.leadGroupId ?? lead?.assignedGroupId ?? null;
        const institutionName = groupId != null ? flowScopeByGroupId.get(String(groupId)) : "";
        const flow = await getLeadFlow(institutionName ? { institutionName } : {}).catch(() => ({}));
        if (!active) return;
        setFlowRules(Array.isArray(flow?.rules) ? flow.rules : []);
      } catch (e) {
        if (!active) return;
        setFlowRules([]);
      }
    };
    loadFlow();
    return () => {
      active = false;
    };
  }, [lead?.leadGroupId, lead?.assignedGroupId, flowScopeByGroupId]);

  useEffect(() => {
    getProjects().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const loadItems = async () => {
      try {
        const rows = await getStockItems();
        if (!active) return;
        setStockItems(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("failed to load stock items", e);
      }
    };
    loadItems();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!showAllocateModal || !lead?.id) return;
    let active = true;
    const loadOptions = async () => {
      try {
        const currentStatus = String(lead?.status || "").trim().toLowerCase();
        const findRule = (status) =>
          Array.isArray(flowRules)
            ? flowRules.find(
                (r) =>
                  String(r?.status || "").trim().toLowerCase() ===
                  String(status || "").trim().toLowerCase(),
              )
            : null;
        const currentRule = findRule(currentStatus);
        let nextGroupId = null;
        if (currentRule?.next && typeof currentRule.next === "object") {
          const allocateKey = Object.keys(currentRule.next).find(
            (key) =>
              String(key || "").trim().toLowerCase() === "allocate",
          );
          if (allocateKey) {
            nextGroupId = currentRule.next[allocateKey] ?? null;
          }
        }
        if (nextGroupId == null) {
          const allocateRule = findRule("allocate");
          if (allocateRule?.handledByGroupId != null) {
            nextGroupId = allocateRule.handledByGroupId;
          }
        }
        setAllocateGroupId(nextGroupId);
        setAllocateGroupName("");
        if (nextGroupId != null) {
          try {
            const groups = await getAssignableLeadGroups();
            const match = groups.find(
              (group) => String(group.id) === String(nextGroupId),
            );
            if (match?.name) {
              setAllocateGroupName(match.name);
            }
          } catch (e) {
            setAllocateGroupName("");
          }
        }
        const rows = await getAssignableAllocators(
          lead.id,
          nextGroupId ? { groupId: nextGroupId } : {},
        );
        if (!active) return;
        setAllocateOptions(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!active) return;
        showError(extractApiErrorMessage(e, "Failed to load employees"));
      }
    };
    loadOptions();
    return () => {
      active = false;
    };
  }, [showAllocateModal, lead?.id]);

  const orderedLeadStatuses = Array.from(
    new Set(
      [
        ...(Array.isArray(flowRules)
          ? flowRules.flatMap((rule) => {
              const base = String(rule?.status || "").trim();
              const next =
                rule?.next && typeof rule.next === "object"
                  ? Object.keys(rule.next).map((k) => String(k || "").trim())
                  : [];
              return [base, ...next];
            })
          : []),
        String(lead?.status || "").trim(),
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  );

  const timelineEntries = (() => {
    const order = [
      "new lead",
      "not attempted",
      "attempted",
      "interested",
      "requirement",
      "budget",
      "design",
      "payment",
      "deal",
      "production",
    ];
    const labelMap = {
      "new lead": "New Lead",
      "not attempted": "Not Attempted",
      attempted: "Attempted",
      interested: "Interested",
      requirement: "Requirements Collected",
      budget: "Budget",
      design: "Design",
      payment: "Payment",
      deal: "Deal",
      production: "Production",
    };
    const extractStatus = (action) => {
      const text = String(action || "").trim();
      if (!text) return "";
      const match = text.match(/status\s+(?:changed|updated)\s+to\s+(.+)$/i);
      return match?.[1] ? String(match[1]).trim().replace(/[.]+$/, "") : "";
    };
    return (Array.isArray(leadLogs) ? leadLogs : [])
      .slice()
      .sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0))
      .map((log, index) => {
        const rawStatus = extractStatus(log?.action);
        const statusKey = rawStatus.toLowerCase();
        if (!statusKey || !order.includes(statusKey)) return null;
        return {
          key: log?.id || `${statusKey}-${log?.createdAt || index}-${index}`,
          statusKey,
          label: labelMap[statusKey] || rawStatus,
          createdAt: log?.createdAt || null,
          actor: log?.actor || null,
        };
      })
      .filter(Boolean)
      .filter((entry, index, arr) => arr.findIndex((item) => item.statusKey === entry.statusKey && item.createdAt === entry.createdAt) === index)
      .concat(
        (() => {
          const currentKey = String(effectiveStatus || "").trim().toLowerCase();
          if (!currentKey) return [];
          if (order.includes(currentKey) && (Array.isArray(leadLogs) ? leadLogs : []).some((log) => extractStatus(log?.action).toLowerCase() === currentKey)) {
            return [];
          }
          return [{
            key: `current-status-${currentKey}`,
            statusKey: currentKey,
            label: labelMap[currentKey] || effectiveStatus,
            createdAt: null,
          }];
        })(),
      );
  })();

  const timelineStatuses = timelineEntries.map((entry) => entry.label);

  const currentTimelineIndex = (() => {
    const currentKey = String(effectiveStatus || "").trim().toLowerCase();
    if (!currentKey) return -1;
    for (let i = timelineEntries.length - 1; i >= 0; i -= 1) {
      if (timelineEntries[i]?.statusKey === currentKey) return i;
    }
    return timelineStatuses.findIndex(
      (item) => item.toLowerCase() === currentKey,
    );
  })();

  const allowedStatusOptions = (() => {
    const current = normalizeStatusLabelKey(lead?.status);
    if (!current) {
      return orderedLeadStatuses;
    }
    
    // Find the flow rule for the current status
    const rule = Array.isArray(flowRules)
      ? flowRules.find(
          (r) =>
            normalizeStatusLabelKey(r?.status) === current,
        )
      : null;
    
    // Rule exists — only show explicitly configured next statuses
    if (rule) {
      if (rule.next && typeof rule.next === "object") {
        const nextKeys = Object.keys(rule.next);
        if (nextKeys.length > 0) {
          return nextKeys
            .map((item) => String(item || "").trim())
            .filter(Boolean);
        }
      }
      // Rule exists but no next statuses configured -> block transitions.
      return [];
    }
    
    // No flow rule at all for this status -> show the configured flow statuses
    return orderedLeadStatuses;
  })();
  const displayStatusOptions = useMemo(
    () => uniqueStatusOptions(allowedStatusOptions),
    [allowedStatusOptions],
  );


  const saveStatus = async () => {
    if (!lead?.id) return;
    const errors = {};
    if (!statusValue) {
      errors.statusValue = true;
      setStatusErrors(errors);
      showError("Please select a status");
      setStatusSaving(false);
      return;
    }
    const currentKey = String(lead?.status || "").trim().toLowerCase();
    if (
      currentKey === "design" &&
      statusValue &&
      String(statusValue || "").trim().toLowerCase() !== "design"
    ) {
      if (!finalDesignMessage?.id) {
        showError("Please upload the final design before changing status from Design");
        setStatusSaving(false);
        return;
      }
    }
    const normalizedKey = String(statusValue || "").trim().toLowerCase();
    if (normalizedKey === "requirement" || normalizedKey === "requirements collected") {
      setShowStatusModal(false);
      setStatusSaving(false);
      openRequirementModal("Requirement");
      return;
    }

    // Validate Attempted form fields if transitioning to Attempted
    if (normalizedKey === "attempted" && statusNeedsModal(normalizedKey)) {
      if (!attemptedOpenReason) errors.attemptedOpenReason = true;
      if (!attemptedCallRemarks) errors.attemptedCallRemarks = true;
      if (Object.keys(errors).length > 0) {
        setStatusErrors(errors);
        showError("Please complete Attempted Reason and Manual Details for Attempted status");
        setStatusSaving(false);
        return;
      }
    }

    if (normalizedKey === "not attempted" && statusNeedsModal(normalizedKey)) {
      if (!notAttemptedCallStatus) errors.notAttemptedCallStatus = true;
      if (!notAttemptedCallRemarks) errors.notAttemptedCallRemarks = true;
      if (Object.keys(errors).length > 0) {
        setStatusErrors(errors);
        showError("Please complete Not Attempted Reason and Manual Details for Not Attempted status");
        setStatusSaving(false);
        return;
      }
    }

    // Validate Interested form fields if transitioning to Interested
    if (normalizedKey === "interested" && statusNeedsModal(normalizedKey)) {
      if (!interestedCallStatus) errors.interestedCallStatus = true;
      if (!interestedFollowUpDate) errors.interestedFollowUpDate = true;
      if (!interestedCallRemarks) errors.interestedCallRemarks = true;
      if (Object.keys(errors).length > 0) {
        setStatusErrors(errors);
        showError("Please complete Interested Reason, Date, and Manual Details for Interested status");
        setStatusSaving(false);
        return;
      }
    }

    // Validate Rejected form fields if transitioning to Rejected
    if (normalizedKey === "rejected" && statusNeedsModal(normalizedKey)) {
      if (!rejectedReason) {
        errors.rejectedReason = true;
        setStatusErrors(errors);
        showError("Please select Rejected Reason");
        setStatusSaving(false);
        return;
      }
    }
    setStatusErrors({});
    if (normalizedKey === "allocate") {
      setShowAllocateModal(true);
      return;
    }

    // Validate status transition based on flow rules
    const validation = validateStatusTransition(
      statusValue,
      flowRules,
      lead,
      {
        total: totalAmount || lead?.totalAmount,
        paid: paidAmount || lead?.paidAmount,
        remaining: remainingAmount || lead?.remainingAmount,
      }
    );

    if (!validation.isValid) {
      showError(validation.message);
      setStatusSaving(false);
      return;
    }

    setSaving(true);
    try {
      // Determine the nextGroupId based on flow rules for the target status
      let nextGroupId = null;
      if (Array.isArray(flowRules)) {
        const targetRule = flowRules.find(
          (r) =>
            String(r?.status || "").trim().toLowerCase() ===
            String(statusValue || "").trim().toLowerCase(),
        );
        if (targetRule?.handledByGroupId != null) {
          nextGroupId = targetRule.handledByGroupId;
        }
      }

      const updated = await updateLeadRowStatus(lead.id, statusValue, nextGroupId);
      let key = normalizedKey;
      if (key === "payment") {
        // nothing special needed when moving to payment
      }
      const mergedLead = { ...(lead || {}), ...updated };

      // Update lead details with Attempted/Interested/Rejected data
      if (normalizedKey === "attempted") {
        await updateLeadDetails(lead.id, {
          attemptedOpenReason: attemptedOpenReason || null,
          attemptedCallStatus: null,
          attemptedCallRemarks: attemptedCallRemarks || null,
          attemptedFollowUpDate: null,
          notAttemptedCallStatus: null,
          notAttemptedCallRemarks: null,
        });
      } else if (normalizedKey === "not attempted") {
        await updateLeadDetails(lead.id, {
          notAttemptedCallStatus: notAttemptedCallStatus || null,
          notAttemptedCallRemarks: notAttemptedCallRemarks || null,
        });
      } else if (normalizedKey === "interested") {
        await updateLeadDetails(lead.id, {
          interestedCallStatus: interestedCallStatus || null,
          interestedFollowUpDate: interestedFollowUpDate
            ? new Date(interestedFollowUpDate).toISOString()
            : null,
          interestedCallRemarks: interestedCallRemarks || null,
        });
      } else if (normalizedKey === "rejected") {
        await updateLeadDetails(lead.id, {
          rejectedReason: rejectedReason || null,
          rejectedReasonSubtype: rejectedReasonSubtype || null,
        });
      }

      setLead(mergedLead);
      await refreshLeadLogs(lead.id);
      showSuccess("Lead status updated");
      setShowStatusModal(false);
      if (normalizedKey === "requirement" && statusNeedsModal("requirement")) {
        setActiveTab("requirement");
        setEditingRequirement(null);
        setRequirementModalKey((k) => k + 1);
        setShowRequirementModal(true);
      }
      if (exitEditIfOwnershipMoved(mergedLead)) return;
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update status"));
    } finally {
      setSaving(false);
      setStatusSaving(false);
    }
  };

  const exitEditIfOwnershipMoved = (nextLead) => {
    if (role !== "EMPLOYEE") return false;
    const nextOwnerId = nextLead?.ownerUserId;
    const currentUserId = user?.id;
    if (!nextOwnerId || !currentUserId) return false;
    if (String(nextOwnerId) === String(currentUserId)) return false;
    navigate("/leads");
    return true;
  };



  const submitAllocate = async () => {
    if (!lead?.id) return;
    if (!allocateOwnerId) {
      showError("Please select an employee");
      return;
    }
    setSaving(true);
    try {
      const ownerUpdated = await updateLeadAllocator(
        lead.id,
        Number(allocateOwnerId),
        allocateGroupId,
      );
      
      // Determine nextGroupId from flow rules
      let nextGroupId = null;
      if (Array.isArray(flowRules)) {
        const targetRule = flowRules.find(
          (r) =>
            String(r?.status || "").trim().toLowerCase() ===
            String(statusValue || "").trim().toLowerCase(),
        );
        if (targetRule?.handledByGroupId != null) {
          nextGroupId = targetRule.handledByGroupId;
        }
      }
      
      const statusUpdated = await updateLeadRowStatus(lead.id, statusValue, nextGroupId);
      const mergedLead = { ...(lead || {}), ...ownerUpdated, ...statusUpdated };
      setLead(mergedLead);
      showSuccess("Lead allocated");
      setShowAllocateModal(false);
      if (exitEditIfOwnershipMoved(mergedLead)) return;
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to allocate lead"));
    } finally {
      setSaving(false);
    }
  };

  const downloadProtectedFile = async (filePath, fileName, fallbackMessage) => {
    if (!filePath || !fileName) return;
    try {
      const response = await api.get(filePath, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      const message = extractApiErrorMessage(e, fallbackMessage);
      showError(message);
    }
  };


  const handleStatusChange = (newStatus) => {
    setStatusValue(newStatus);
    if (newStatus && statusErrors.statusValue) {
      setStatusErrors((prev) => ({ ...prev, statusValue: false }));
    }

    // Open appropriate modal based on selected status
    if (!newStatus) return;

    const normalizedStatus = String(newStatus || "").trim().toLowerCase();

    if (normalizedStatus === "rejected") {
      setShowRejectedModal(true);
    } else if (normalizedStatus === "allocate") {
      setShowAllocateModal(true);
    }
  }; // handleStatusChange


  const uploadFinalDesign = async () => {
    if (!lead?.id) return;
    if (!designUploadFile) {
      showError("Please choose a design file");
      return;
    }
    setSaving(true);
    try {
      const response = await sendLeadChatAttachment(lead.id, {
        threadType: "CUSTOMER",
        message: `${DESIGN_THREAD_MARKER}\nFinal design uploaded`,
        file: designUploadFile,
      });
      setFinalDesignMessage({
        id: response?.id,
        attachmentName: designUploadFile?.name || "",
        message: response?.message,
      });
      setDesignUploadFile(null);
      showSuccess("Final design uploaded");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to upload final design"));
    } finally {
      setSaving(false);
    }
  };


  const handleViewFinalDesign = async () => {
    if (!lead?.id || !finalDesignMessage?.id) {
      showError("Final design file not available");
      return;
    }
    try {
      const blob = await downloadLeadChatAttachment(lead.id, finalDesignMessage.id);
      if (!blob) {
        showError("Final design file not available");
        return;
      }
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to open final design file"));
    }
  };

  const submitDesignDuration = async () => {
    if (!lead?.id) return;
    if (!designStartAt || !designEndAt) {
      showError("Please select design start and end");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateLeadDetails(lead.id, {
        designStartAt,
        designEndAt,
      });
      setLead((prev) => ({
        ...(prev || {}),
        ...updated,
        designStartAt: updated?.designStartAt || designStartAt,
        designEndAt: updated?.designEndAt || designEndAt,
      }));
      setDesignStartAt(toInputDateTime(updated?.designStartAt || designStartAt));
      setDesignEndAt(toInputDateTime(updated?.designEndAt || designEndAt));
      showSuccess("Design duration updated");
      setShowDesignDurationModal(false);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update design duration"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = useCallback(async (addressFormData) => {
    if (!lead?.id) return;

    // Validate phone number using configured country rules
    const phoneValidationError = validatePhoneNumber(addressFormData.phone, addressFormData.countryCode);
    if (phoneValidationError) {
      showError(phoneValidationError);
      return;
    }

    // Validate GSTIN if provided (12 alphanumeric)
    if (addressFormData.gstin && !/^[A-Za-z0-9]{12}$/.test(addressFormData.gstin)) {
      showError("GSTIN must be 12 alphanumeric characters");
      return;
    }

    // Validate email if provided
    if (addressFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressFormData.email)) {
      showError("Invalid email format");
      return;
    }

    setAddressLoading(true);
    try {
      const payload = {
        type: newAddressType,
        contactPersonName: addressFormData.contactPersonName,
        companyName: addressFormData.companyName || null,
        gstin: addressFormData.gstin || null,
        countryCode: addressFormData.countryCode,
        phone: addressFormData.phone,
        email: addressFormData.email || null,
        addressLine1: addressFormData.addressLine1,
        addressLine2: addressFormData.addressLine2 || null,
        city: addressFormData.city,
        state: addressFormData.state,
        pincode: addressFormData.pincode,
        country: addressFormData.country,
        isPrimary: addressFormData.isPrimary,
      };

      const newAddress = await createAddress(lead.id, payload);

      // Refresh addresses list
      const type = newAddressType;
      if (type === "BILLING") {
        const addressesResponse = await getAddressesByLeadIdAndType(lead.id, "BILLING");
        setBillingAddresses(addressesResponse);
        // Auto-select the new address
        setSelectedBillingAddressId(newAddress.id);
      } else {
        const addressesResponse = await getAddressesByLeadIdAndType(lead.id, "SHIPPING");
        setShippingAddresses(addressesResponse);
        // Auto-select the new address
        setSelectedShippingAddressId(newAddress.id);
      }

      showSuccess(`${newAddressType === "BILLING" ? "Billing" : "Shipping"} address added successfully`);
      setShowAddAddressModal(false);
    } catch (e) {
      showError(extractApiErrorMessage(e, `Failed to add ${newAddressType === "BILLING" ? "billing" : "shipping"} address`));
    } finally {
      setAddressLoading(false);
    }
  }, [lead?.id, newAddressType, showError, showSuccess]);

  const submitVerifyDetails = async () => {
    if (!lead?.id) return;
    if (!selectedBillingAddressId) {
      showError("Please select a billing address");
      return;
    }
    if (!parsedInvoice && !verifyFile) {
      showError("Invoice not found. Please upload a payment proof file or ensure invoice exists");
      return;
    }
    setSaving(true);
    try {
      let uploadedProof = null;
      let invoiceAttachment = null;

      // Upload invoice PDF automatically
      if (parsedInvoice) {
        try {
          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageMargin = 15;
          const invoiceNumber = `INV-${lead.leadId || lead.id}`;

          doc.text("INVOICE", pageMargin, 15);
          doc.text(`Company: ${lead.companyName || ""}`, pageMargin, 22);
          doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - pageMargin - 60, 25);
          doc.text(`Date: ${parsedInvoice.createdAt ? new Date(parsedInvoice.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}`, pageWidth - pageMargin - 60, 30);

          const itemsWithTotals = (parsedInvoice.items || []).map(item => ({
            description: item.description || "",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: (item.quantity || 1) * (item.unitPrice || 0),
          }));

          autoTable(doc, {
            startY: 40,
            head: [["Description", "Qty", "Unit Price", "Total"]],
            body: itemsWithTotals.map(item => [
              item.description,
              item.quantity,
              item.unitPrice,
              item.total,
            ]),
            margin: { left: pageMargin, right: pageMargin },
          });

          const finalY = (doc.lastAutoTable?.finalY) || 100;
          const t = parsedInvoice.totals || {};
          doc.text(`Subtotal: ${(t.subtotal || 0).toFixed(2)}`, pageWidth - pageMargin - 40, finalY + 10);
          doc.text(`CGST (${lead.invoiceCgstPercent || 0}%): ${(t.cgst || 0).toFixed(2)}`, pageWidth - pageMargin - 40, finalY + 17);
          doc.text(`SGST (${lead.invoiceSgstPercent || 0}%): ${(t.sgst || 0).toFixed(2)}`, pageWidth - pageMargin - 40, finalY + 24);
          doc.text(`Total: ${(t.total || 0).toFixed(2)}`, pageWidth - pageMargin - 40, finalY + 31);

          const pdfBlob = doc.output("blob");
          const pdfFile = new File([pdfBlob], `Invoice-${invoiceNumber}.pdf`, { type: "application/pdf" });

          invoiceAttachment = await sendLeadChatAttachment(lead.id, {
            threadType: "INTERNAL",
            message: "Invoice attached for payment verification",
            file: pdfFile,
          });
        } catch (invoiceErr) {
          console.warn("Failed to generate/attach invoice PDF", invoiceErr);
        }
      }

      // Upload payment proof if provided
      if (verifyFile) {
        uploadedProof = await uploadLeadPaymentProof(lead.id, verifyFile);
      }

      const payload = {
        paymentProofFileName: uploadedProof?.fileName || verifyFileName || null,
        paymentProofFilePath: uploadedProof?.filePath || null,
        paymentProofNotes: verifyNotes || null,
        paymentVerificationStatus: "PENDING",
        paymentVerificationBillingAddressId: selectedBillingAddressId,
        paymentVerificationShippingAddressId: shipSame ? selectedBillingAddressId : selectedShippingAddressId,
        // Store the amount being verified - backend will add it to paidAmount on APPROVE
        paymentVerificationAmount: verifyPaidAmount ? Number(verifyPaidAmount) : null,
        // Snapshot the current invoice as the payment verified invoice (overrides on resubmit)
        paymentVerifiedInvoiceData: lead.invoiceData || null,
      };
      const updated = await updateLeadDetails(lead.id, payload);
      setLead((prev) => ({ ...(prev || {}), ...updated }));
      showSuccess("Verification sent with invoice");
      setShowVerifyModal(false);
      setActiveTab("general");
      // Reset form
      setShipSame(false);
      setSelectedBillingAddressId(null);
      setSelectedShippingAddressId(null);
      setVerifyFile(null);
      setVerifyFileName("");
      setVerifyNotes("");
      if (exitEditIfOwnershipMoved(updated)) return;
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to submit payment verification"));
    } finally {
      setSaving(false);
    }
  };

  // Memoized event handlers for payment verification modal to prevent unnecessary re-renders
  const handleVerifyPaidAmountChange = useCallback((e) => {
    setVerifyPaidAmount(e.target.value);
  }, []);

  const handleVerifyNotesChange = useCallback((e) => {
    setVerifyNotes(e.target.value);
  }, []);

  const handleVerifyFileChange = useCallback((e) => {
    const file = e.target.files?.[0] || null;
    setVerifyFile(file);
    setVerifyFileName(file?.name || "");
  }, []);

  const handleBillingAddressChange = useCallback(
    (id) => {
      setSelectedBillingAddressId(id);
      if (shipSame) {
        setSelectedShippingAddressId(id);
      }
    },
    [shipSame]
  );

  const handleShipSameChange = useCallback((e) => {
    const checked = e.target.checked;
    setShipSame(checked);
    setSelectedShippingAddressId(checked ? selectedBillingAddressId : null);
  }, [selectedBillingAddressId]);

  const handleShippingAddressChange = useCallback((id) => {
    setSelectedShippingAddressId(id);
  }, []);

  const handleAddBillingAddress = useCallback(() => {
    setNewAddressType("BILLING");
    setShowAddAddressModal(true);
  }, []);

  const handleAddShippingAddress = useCallback(() => {
    setNewAddressType("SHIPPING");
    setShowAddAddressModal(true);
  }, []);

  const handleCloseVerifyModal = useCallback(() => {
    setShowVerifyModal(false);
  }, []);

  const submitMoneyDetails = async () => {
    if (!lead?.id) return;
    setSaving(true);
    try {
      const updated = await updateLeadDetails(lead.id, {
        totalAmount: totalAmount || null,
        paidAmount: paidAmount || null,
        remainingAmount: remainingAmount || null,
      });
      setLead((prev) => ({ ...(prev || {}), ...updated }));
      showSuccess("Money details updated");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update money details"));
    } finally {
      setSaving(false);
    }
  };

  const saveLeadType = async (nextValue) => {
    if (!lead?.id) return;
    setTypeSaving(true);
    try {
      const updated = await updateLeadDetails(lead.id, { leadType: nextValue });
      setLead((prev) => ({ ...(prev || {}), ...updated }));
      showSuccess("Lead type updated");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update lead type"));
    } finally {
      setTypeSaving(false);
    }
  };

  // Auto-select country ISO code based on phone country code
  useEffect(() => {
    if (!countryCode) return;
    const phone = countryCode.replace("+", "");
    const matched = Country.getAllCountries().find((c) => c.phonecode === phone);
    if (matched && !leadCountry) {
      setLeadCountry(matched.isoCode);
    }
  }, [countryCode, leadCountry]);

  const openAddProjectModal = async () => {
    setNewProjectName("");
    setNewProjectType("");
    setNewProjectStatus("");
    setNewProjectDescription("");
    setShowAddProjectModal(true);
    try {
      const [types, statuses] = await Promise.all([getProjectTypes(), getProjectStatuses()]);
      setProjectTypes(types);
      setProjectStatuses(statuses);
    } catch {
      // non-critical, dropdowns will be empty
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) { showError("Project name is required"); return; }
    setProjectSaving(true);
    try {
      await createProject({
        projectName: newProjectName.trim(),
        projectType: newProjectType || null,
        projectStatus: newProjectStatus || null,
        description: newProjectDescription.trim() || null,
      });
      showSuccess("Project created successfully");
      setShowAddProjectModal(false);
      getProjects().then(setProjects).catch(() => {});
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to create project"));
    } finally {
      setProjectSaving(false);
    }
  };

  const saveLeadDetails = async () => {
    if (!lead?.id) return;
    const alternatePhoneValue = String(alternatePhone || "").trim();
    if (alternatePhoneValue) {
      const alternatePhoneValidation = validatePhoneNumber(alternatePhoneValue, countryCode);
      if (alternatePhoneValidation) {
        showError(alternatePhoneValidation);
        return;
      }
    }
    setDetailsSaving(true);
    try {
      const payload = {
        mobile: leadMobile || null,
        primarySource: lead?.primarySource || null,
        secondarySource: lead?.secondarySource || null,
        alternatePhone: alternatePhoneValue || null,
        alternateEmail: alternateEmail || null,
        countryCode: countryCode || null,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
        occupation: occupation || null,
        companyName: companyName || null,
        productType: productType || null,
        variant: variant || null,
        quantity: quantity ? Number(quantity) : null,
        email: leadEmail || null,
        projectId: selectedProjectId || null,
        leadCountry: leadCountry || null,
        leadState: leadState || null,
        leadCity: leadCity || null,
        leadPincode: leadPincode || null,
        streetAddress: streetAddress || null,
        gstin: leadGstin || null,
        attemptedOpenReason: isAttempted ? attemptedOpenReason || null : null,
        attemptedCallStatus: null,
        attemptedCallRemarks: isAttempted ? attemptedCallRemarks || null : null,
        attemptedFollowUpDate: null,
        notAttemptedCallStatus: isNotAttempted ? notAttemptedCallStatus || null : null,
        notAttemptedCallRemarks: isNotAttempted ? notAttemptedCallRemarks || null : null,
        interestedCallStatus: isInterested ? interestedCallStatus || null : null,
        interestedFollowUpDate: isInterested
          ? interestedFollowUpDate
            ? new Date(interestedFollowUpDate).toISOString()
            : null
          : null,
        interestedCallRemarks: isInterested ? interestedCallRemarks || null : null,
        rejectedReason: isRejected ? rejectedReason || null : null,
        rejectedReasonSubtype: isRejected ? rejectedReasonSubtype || null : null,
        totalAmount: totalAmount || null,
        paidAmount: paidAmount || null,
        remainingAmount: remainingAmount || null,
        budgetInvoiceSent: budgetInvoiceSent,
        paymentInvoiceSent: paymentInvoiceSent,
        designStartAt: designStartAt || null,
        designEndAt: designEndAt || null,
      };
      const updated = await updateLeadDetails(lead.id, payload);
      setLead((prev) => ({
        ...(prev || {}),
        ...updated,
        mobile: leadMobile || null,
        primarySource: lead?.primarySource || null,
        secondarySource: lead?.secondarySource || null,
        email: leadEmail || null,
        projectId: selectedProjectId || null,
        leadCountry: leadCountry || null,
        leadState: leadState || null,
        leadCity: leadCity || null,
        leadPincode: leadPincode || null,
        streetAddress: streetAddress || null,
        gstin: leadGstin || null,
        // Preserve the current status here; save details should not move the lead.
        // The dedicated status workflow handles status transitions.
        status: prev?.status ?? updated?.status ?? null,
      }));
      showSuccess("Lead details updated");
      initialValuesRef.current = {
        leadMobile: leadMobile || "",
        alternatePhone: alternatePhone || "",
        alternateEmail: alternateEmail || "",
        countryCode: countryCode || "",
        occupation: occupation || "",
        companyName: companyName || "",
        productType: productType || "",
        variant: variant || "",
        quantity: quantity || "",
        leadEmail: leadEmail || "",
        selectedProjectId: selectedProjectId || "",
        leadCountry: leadCountry || "",
        leadState: leadState || "",
        leadCity: leadCity || "",
        leadPincode: leadPincode || "",
        streetAddress: streetAddress || "",
        leadGstin: leadGstin || "",
      };
      navigate("/leads");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update lead details"));
    } finally {
      setDetailsSaving(false);
    }
  };

  const handleStockRequestSubmit = async ({ leadId, leadName, items }) => {
    if (!leadId) return;
    setStockRequestSubmitting(true);
    try {
      const payload = {
        leadId,
        leadName: leadName || lead?.leadName || lead?.name || "",
        requestedBy: user?.id,
        items,
      };
      const req = await createStockRequest(payload);
      if (req?.id) {
        // Update lead status to "Stock Request"
        try {
          await updateLeadRowStatus(leadId, "Stock Request");
        } catch (statusErr) {
          console.error("Failed to update lead status to Stock Request:", statusErr);
          // Continue anyway - stock request was created successfully
        }
        setShowStockRequestModal(false);
      }
    } catch (err) {
      const message = extractApiErrorMessage(err, "Failed to create stock request");
      showError(message);
    } finally {
      setStockRequestSubmitting(false);
    }
  };

  return (
    <div className="container-fluid lead-edit-page">

      <div className="lead-edit-sticky-header">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-2 flex-nowrap text-nowrap">
            <h3 className="mb-0 fs-5 text-primary fw-bold d-flex align-items-center gap-2">
              <i className="ti ti-user-circle"></i>
              {lead?.leadName || lead?.name || "Loading..."}
            </h3>
            <div className="vr d-none d-md-block" style={{ height: "24px", alignSelf: "center" }}></div>
            <span className="text-secondary d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-3 border">
              <i className="ti ti-phone text-muted"></i>
              <strong>{leadMobile || lead?.mobile || lead?.phone || "-"}</strong>
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center w-100 w-md-auto justify-content-start justify-content-md-end">
            <span
              className="status-pill px-3 fw-semibold"
              style={{
                ...getStatusStyle(lead?.isDuplicate ? "duplicate" : (lead?.status || "")),
                height: "38px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                fontSize: "0.88rem",
              }}
            >
              {lead?.isDuplicate ? "Duplicate" : (formatStatusLabel(lead?.status || "-") || "-")}
            </span>
            {!lead?.isDuplicate && (
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-1"
                style={{ height: "38px" }}
                onClick={() => {
                  setStatusValue("");
                  setAttemptedOpenReason("");
                  setAttemptedCallStatus("");
                  setAttemptedCallRemarks("");
                  setAttemptedFollowUpDate("");
                  setNotAttemptedCallStatus("");
                  setNotAttemptedCallRemarks("");
                  setInterestedFollowUpDate("");
                  setInterestedCallStatus("");
                  setInterestedCallRemarks("");
                  setRejectedReason("");
                  setRejectedReasonSubtype("");
                  setShowStatusModal(true);
                  setStatusErrors({});
                }}
                title="Update status"
              >
                <i className="ti ti-transfer-out"></i>Update Status
              </button>
            )}
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              style={{ height: "38px" }}
              onClick={() => setShowLeadLogModal(true)}
              title="View activity log"
            >
              <i className="ti ti-history"></i>
              Log
            </button>
            <button 
              className="btn btn-outline-secondary d-flex align-items-center gap-1" 
              style={{ height: "38px" }}
              onClick={() => {
                if (isFormDirty) {
                  setShowUnsavedModal(true);
                } else {
                  navigate("/leads");
                }
              }}
            >
              <i className="ti ti-arrow-left"></i>
              Back
            </button>
          </div>
        </div>

        {isConverted && (
          <div className="alert alert-success mb-3" role="alert">
            <strong>Lead converted to Deal.</strong> This lead is now locked. Continue the process from the Deals page.
          </div>
        )}

        {!loading && lead && !isEmployeeDesignView && (
          <div className="lead-edit-wizard">
            {/* Progress Bar */}
            <div className="lead-edit-wizard-progress-bar">
              <motion.div
                className="lead-edit-wizard-progress"
                initial={{ width: "0%" }}
                animate={{ width: `${wizardProgress}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>

            {/* Step Circles */}
            <motion.div className="lead-edit-wizard-circles" layoutId="circles-container">
              <div className="lead-edit-wizard-circle-item" onClick={() => scrollToSection("general")}>
                <motion.div className={`lead-edit-wizard-circle${activeTab === "general" ? " active" : ""}`}>
                  <i className="ti ti-user" />
                </motion.div>
                <div className="lead-edit-wizard-circle-label">General Info</div>
              </div>

              {showNotAttemptedSummary && (
                <div className="lead-edit-wizard-circle-item" onClick={() => scrollToSection("not_attempted")}>
                  <motion.div className={`lead-edit-wizard-circle${activeTab === "not_attempted" ? " active" : ""}`}>
                    <i className="ti ti-phone-off" />
                  </motion.div>
                  <div className="lead-edit-wizard-circle-label">Not Attempted</div>
                </div>
              )}

              {showAttemptedSummary && (
                <div className="lead-edit-wizard-circle-item" onClick={() => scrollToSection("attempted")}>
                  <motion.div className={`lead-edit-wizard-circle${activeTab === "attempted" ? " active" : ""}`}>
                    <i className="ti ti-phone" />
                  </motion.div>
                  <div className="lead-edit-wizard-circle-label">Attempted</div>
                </div>
              )}

              {showInterestedSummary && (
                <div className="lead-edit-wizard-circle-item" onClick={() => scrollToSection("interested")}>
                  <motion.div className={`lead-edit-wizard-circle${activeTab === "interested" ? " active" : ""}`}>
                    <i className="ti ti-heart" />
                  </motion.div>
                  <div className="lead-edit-wizard-circle-label">Interested</div>
                </div>
              )}

              {showRequirementSummary && (
                <div className="lead-edit-wizard-circle-item" onClick={() => scrollToSection("requirement")}>
                  <motion.div className={`lead-edit-wizard-circle${activeTab === "requirement" ? " active" : ""}`}>
                    <i className="ti ti-list" />
                  </motion.div>
                  <div className="lead-edit-wizard-circle-label">Requirements Collected</div>
                </div>
              )}

              {false && ((statusLower === "budget" || lead?.budgetVerificationStatus) && (
                <div className="lead-edit-wizard-circle-item" onClick={() => scrollToSection("budget")}>
                  <motion.div className={`lead-edit-wizard-circle${activeTab === "budget" ? " active" : ""}`}>
                    <i className="ti ti-currency-dollar" />
                  </motion.div>
                  <div className="lead-edit-wizard-circle-label">Budget</div>
                </div>
              ))}

              {isRejected && (
                <div className="lead-edit-wizard-circle-item" onClick={() => scrollToSection("rejected")}>
                  <motion.div className={`lead-edit-wizard-circle${activeTab === "rejected" ? " active" : ""}`}>
                    <i className="ti ti-x" />
                  </motion.div>
                  <div className="lead-edit-wizard-circle-label">Rejected</div>
                </div>
              )}

              {false && (showPaymentSummary && statusLower !== "budget" && (
                <div className="lead-edit-wizard-circle-item" onClick={() => setActiveTab("payment")}>
                  <motion.div className={`lead-edit-wizard-circle${activeTab === "payment" ? " active" : ""}`}>
                    <i className="ti ti-receipt" />
                  </motion.div>
                  <div className="lead-edit-wizard-circle-label">{isProduction ? "Production" : "Payment"}</div>
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : !lead ? (
        <div className="text-muted">Lead not found.</div>
      ) : (
        <div>
          <div className="row g-4">
          <div className="col-12 lead-edit-tab-shell">
            <div className="lead-edit-wizard-step-panel">
              <div className="mb-4">
                <div className="row g-4 align-items-start">
                  <div className="col-12 d-flex flex-column gap-4">
                        {/* Card 1: Lead Information */}
                        <div className="lead-info-section" id="general" style={{ scrollMarginTop: "100px" }}>
                          <h6 className="lead-info-section-title d-flex align-items-center gap-2 mb-3">
                            📋 Lead Information
                          </h6>
                          <div className="row g-3">
                            <div className="col-md-3">
                              <label className="form-label">Enquiry Id</label>
                              <input
                                className="form-control"
                                value={
                                  pickText(lead, [
                                    "enquiryId",
                                    "enquiryID",
                                    "leadId",
                                    "leadID",
                                    "lead_id",
                                    "enquiryCode",
                                    "enquiry_code",
                                  ]) || "-"
                                }
                                readOnly
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Enquiry Name</label>
                              <input className="form-control" value={lead.name || "-"} readOnly />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Primary Source</label>
                              <select
                                className="form-select"
                                value={lead?.primarySource || ""}
                                onChange={(e) =>
                                  setLead((prev) => ({
                                    ...(prev || {}),
                                    primarySource: e.target.value,
                                    secondarySource: "",
                                  }))
                                }
                                disabled={isGeneralInfoReadOnly || isElevatedOnlyField}
                              >
                                <option value="">Select Primary Source</option>
                                {primarySourceOptions.map((source) => (
                                  <option key={source} value={source}>
                                    {source}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Secondary Source</label>
                              <select
                                className="form-select"
                                value={lead?.secondarySource || ""}
                                onChange={(e) => setLead((prev) => ({ ...(prev || {}), secondarySource: e.target.value }))}
                                disabled={isGeneralInfoReadOnly || isElevatedOnlyField}
                              >
                                <option value="">Select Secondary Source</option>
                                {secondarySourceOptions.map((source) => (
                                  <option key={source} value={source}>
                                    {source}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Type of Product</label>
                              <input
                                className="form-control"
                                placeholder="e.g. Software, Hardware, Service"
                                value={productType}
                                onChange={(e) => setProductType(e.target.value)}
                                readOnly={isGeneralInfoReadOnly}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Lead Allocator</label>
                              <input
                                className="form-control"
                                placeholder="Lead allocator name"
                                value={lead?.allocator || lead?.allocatorName || lead?.allocatedTo || lead?.assignedTo || "-"}
                                readOnly
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Lead Owner</label>
                              <input
                                className="form-control"
                                placeholder="Lead owner name"
                                value={lead?.ownerName || lead?.owner || "-"}
                                readOnly
                              />
                            </div>
                            {showVariantQuantityFields && (
                              <>
                                <div className="col-md-3">
                                  <label className="form-label">Variant</label>
                                  <input
                                    className="form-control"
                                    placeholder="e.g. Size, Color, Style"
                                    value={variant}
                                    onChange={(e) => setVariant(e.target.value)}
                                    readOnly={isGeneralInfoReadOnly}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label">Quantity</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder="e.g. 100"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    readOnly={isGeneralInfoReadOnly}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Card 2: Contact Information */}
                        <div className="lead-info-section" style={{ scrollMarginTop: "100px" }}>
                          <h6 className="lead-info-section-title d-flex align-items-center gap-2 mb-3">
                            👤 Contact Information
                          </h6>
                          <div className="row g-3">
                            <div className="col-md-3">
                              <label className="form-label">Mobile Number</label>
                              <div className="lead-phone-field" ref={generalCountryPickerRef}>
                                <div className="lead-phone-input-wrap">
                                  <button
                                    ref={countryPickerButtonRef}
                                    type="button"
                                    className="lead-phone-code-trigger"
                                    onClick={toggleGeneralCountryPicker}
                                    aria-expanded={generalCountryPickerOpen}
                                    disabled={isGeneralInfoReadOnly}
                                  >
                                    <span>{countryCode || defaultCountryOption.value}</span>
                                    <i className="ti ti-chevron-down" />
                                  </button>
                                  <input
                                    className="lead-phone-input"
                                    value={leadMobile}
                                    onChange={(e) => setLeadMobile(e.target.value)}
                                    readOnly={isGeneralInfoReadOnly || isElevatedOnlyField}
                                  />
                                </div>

                                {generalCountryPickerOpen && !isGeneralInfoReadOnly && (
                                  <div className="lead-phone-code-menu">
                                    {filteredGeneralCountryOptions.length > 0 ? (
                                      filteredGeneralCountryOptions.map((option) => (
                                        <button
                                          key={`${option.country}-${option.callingCode}`}
                                          type="button"
                                          className={`lead-phone-code-option${countryCode === option.value ? " is-active" : ""}`}
                                          onClick={() => {
                                            setCountryCode(ensureCountryCodeValue(option.value));
                                            setAlternatePhone((currentValue) =>
                                              sanitizePhoneDigits(
                                                currentValue,
                                                getCountryOptionByValue(option.value)?.maxLength,
                                                getCountryAllowedLengths(option.value),
                                              ),
                                            );
                                            closeGeneralCountryPicker();
                                          }}
                                        >
                                          <span>{option.label}</span>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="lead-phone-code-empty">No countries found</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Alternate No.</label>
                              <input
                                className="form-control"
                                value={alternatePhone}
                                onChange={(e) =>
                                  setAlternatePhone(
                                    sanitizePhoneDigits(
                                      e.target.value,
                                      alternatePhoneCountryOption?.maxLength,
                                      alternatePhoneAllowedLengths,
                                    ),
                                  )
                                }
                                maxLength={alternatePhoneDisplayMaxLength || undefined}
                                readOnly={isGeneralInfoReadOnly}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Email</label>
                              <input
                                className="form-control"
                                value={leadEmail}
                                onChange={(e) => setLeadEmail(e.target.value)}
                                readOnly={isGeneralInfoReadOnly}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Alternate Email</label>
                              <input
                                className="form-control"
                                value={alternateEmail}
                                onChange={(e) => setAlternateEmail(e.target.value)}
                                readOnly={isGeneralInfoReadOnly}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Company & Address */}
                        <div className="lead-info-section" style={{ scrollMarginTop: "100px" }}>
                          <h6 className="lead-info-section-title d-flex align-items-center gap-2 mb-3">
                            🏢 Company & Address
                          </h6>
                          <div className="row g-3">
                            <div className="col-md-3">
                              <label className="form-label">Company Name</label>
                              <input
                                className="form-control"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                readOnly={isGeneralInfoReadOnly}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">GSTIN Number</label>
                              <input
                                className="form-control"
                                value={leadGstin}
                                onChange={(e) => setLeadGstin(e.target.value)}
                                readOnly={isGeneralInfoReadOnly}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Street Address</label>
                              <input
                                className="form-control"
                                value={streetAddress}
                                onChange={(e) => setStreetAddress(e.target.value)}
                                readOnly={isGeneralInfoReadOnly}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">State</label>
                              <select
                                className="form-select"
                                value={leadState}
                                onChange={(e) => {
                                  if (!leadCountry && generalAddressCountry) {
                                    setLeadCountry(generalAddressCountry);
                                  }
                                  setLeadState(e.target.value);
                                  setLeadCity("");
                                }}
                                disabled={isGeneralInfoReadOnly || !generalAddressCountry}
                              >
                                <option value="">Select State</option>
                                {State.getStatesOfCountry(generalAddressCountry).map((s) => (
                                  <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">City</label>
                              <select
                                className="form-select"
                                value={leadCity}
                                onChange={(e) => {
                                  if (!leadCountry && generalAddressCountry) {
                                    setLeadCountry(generalAddressCountry);
                                  }
                                  setLeadCity(e.target.value);
                                }}
                                disabled={isGeneralInfoReadOnly || !leadState}
                              >
                                <option value="">Select City</option>
                                {City.getCitiesOfState(generalAddressCountry, leadState).map((c) => (
                                  <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">Pin Code</label>
                              <input
                                className="form-control"
                                value={leadPincode}
                                onChange={(e) => setLeadPincode(e.target.value)}
                                readOnly={isGeneralInfoReadOnly}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card 4: Not Attempted Details */}
                        {showNotAttemptedSummary && (
                          <div className="lead-info-section" id="not_attempted" style={{ scrollMarginTop: "100px" }}>
                            <h6 className="lead-info-section-title d-flex align-items-center gap-2 mb-3">
                              🔕 Not Attempted Details
                            </h6>
                            <div className="row g-3">
                              <div className="col-md-3">
                                <label className="form-label">Not Attempted Reason</label>
                                {isNotAttempted ? (
                                  <select
                                    className="form-select"
                                    value={notAttemptedCallStatus}
                                    onChange={(e) => setNotAttemptedCallStatus(e.target.value)}
                                  >
                                    <option value="">Select Not Attempted Reason</option>
                                    {NOT_ATTEMPTED_REASON_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input className="form-control" value={notAttemptedCallStatus || "-"} readOnly />
                                )}
                              </div>
                              <div className="col-md-3">
                                <label className="form-label">Manual Details</label>
                                {isNotAttempted ? (
                                  <textarea
                                    className="form-control"
                                    rows={3}
                                    value={notAttemptedCallRemarks}
                                    onChange={(e) => setNotAttemptedCallRemarks(e.target.value)}
                                    placeholder="Enter manual details"
                                  />
                                ) : (
                                  <textarea
                                    className="form-control"
                                    rows={3}
                                    value={notAttemptedCallRemarks || "-"}
                                    readOnly
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Card 5: Attempted Details */}
                        {showAttemptedSummary && (
                          <div className="lead-info-section" id="attempted" style={{ scrollMarginTop: "100px" }}>
                            <h6 className="lead-info-section-title d-flex align-items-center gap-2 mb-3">
                              📞 Attempted Details
                            </h6>
                            <div className="row g-3">
                              <div className="col-md-3">
                                <label className="form-label">Attempted Reason</label>
                                {isAttempted ? (
                                  <select
                                    className="form-select"
                                    value={attemptedOpenReason}
                                    onChange={(e) => setAttemptedOpenReason(e.target.value)}
                                  >
                                    <option value="">Select Attempted Reason</option>
                                    {ATTEMPTED_REASON_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    className="form-control"
                                    value={attemptedOpenReason || "-"}
                                    readOnly
                                  />
                                )}
                              </div>
                              <div className="col-md-3">
                                <label className="form-label">Manual Details</label>
                                {isAttempted ? (
                                  <textarea
                                    className="form-control"
                                    rows={3}
                                    value={attemptedCallRemarks}
                                    onChange={(e) => setAttemptedCallRemarks(e.target.value)}
                                    placeholder="Enter manual details"
                                  />
                                ) : (
                                  <textarea
                                    className="form-control"
                                    rows={3}
                                    value={attemptedCallRemarks || "-"}
                                    readOnly
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Card 6: Interested Details */}
                        {showInterestedSummary && (
                          <div className="lead-info-section" id="interested" style={{ scrollMarginTop: "100px" }}>
                            <h6 className="lead-info-section-title d-flex align-items-center gap-2 mb-3">
                              ❤️ Interested Details
                            </h6>
                            <div className="row g-3">
                              <div className="col-md-3">
                                <label className="form-label">Interested Reason</label>
                                {isInterested ? (
                                  <select
                                    className="form-select"
                                    value={interestedCallStatus}
                                    onChange={(e) => setInterestedCallStatus(e.target.value)}
                                  >
                                    <option value="">Select Interested Reason</option>
                                    {INTERESTED_REASON_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input className="form-control" value={interestedCallStatus || "-"} readOnly />
                                )}
                              </div>
                              <div className="col-md-3">
                                <label className="form-label">Follow Up Date</label>
                                <input
                                  className="form-control"
                                  type="datetime-local"
                                  value={interestedFollowUpDate}
                                  onChange={(e) => setInterestedFollowUpDate(e.target.value)}
                                  readOnly={isLeadReadOnly}
                                />
                              </div>
                              <div className="col-md-12">
                                <label className="form-label">Manual Details</label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  value={interestedCallRemarks}
                                  onChange={(e) => setInterestedCallRemarks(e.target.value)}
                                  placeholder="Enter manual details"
                                  readOnly={isLeadReadOnly}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Card 7: Requirements Collected */}
                        {showRequirementSummary && (
                          <div className="lead-info-section" id="requirement" style={{ scrollMarginTop: "100px" }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="lead-info-section-title d-flex align-items-center gap-2 mb-0">
                                📋 Requirements Collected
                              </h6>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => navigate("/quotation", { state: { prefillLead: lead } })}
                                  disabled={!lead}
                                >
                                  <i className="ti ti-file-invoice me-1" />
                                  Create Quotation
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={openAddRequirementModal}
                                >
                                  <i className="ti ti-plus me-1" />
                                  Add Requirement
                                </button>
                              </div>
                            </div>

                            {requirements.length === 0 && (
                              <div className="alert alert-info py-2">
                                No requirements added yet. Click &quot;Add Requirement&quot; to create one.
                              </div>
                            )}

                            {requirements.length > 0 && (
                              <div className="table-responsive">
                                <table className="table table-bordered table-striped align-middle">
                                  <thead className="table-light">
                                    <tr>
                                      <th>#</th>
                                      <th>Category</th>
                                      <th>Product</th>
                                      <th>Sub-type</th>
                                      <th>Quantity</th>
                                      <th>Specifications</th>
                                      <th>Design Mode</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {requirements.map((req, index) => {
                                      let parsedSpecs = null;
                                      try {
                                        parsedSpecs = req.specs ? JSON.parse(req.specs) : null;
                                      } catch {
                                        parsedSpecs = null;
                                      }
                                      return (
                                        <tr key={req.id}>
                                          <td>{index + 1}</td>
                                          <td>{req.categoryName || "-"}</td>
                                          <td>{req.typeName || "-"}</td>
                                          <td>{req.subtypeName || "-"}</td>
                                          <td>{req.quantity || "-"}</td>
                                          <td style={{ minWidth: 260 }}>
                                            {parsedSpecs && Object.keys(parsedSpecs).length > 0 ? (
                                              <button
                                                type="button"
                                                className="spec-view-btn"
                                                onClick={() => setViewingSpecs({ specs: parsedSpecs, req })}
                                              >
                                                <i className="ti ti-eye" /> View
                                              </button>
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )}
                                          </td>
                                          <td>
                                            {req.designStatus ? (
                                              <span className="badge bg-info">
                                                {req.designStatus === "design_only"
                                                  ? "Design Only"
                                                  : req.designStatus === "production_only"
                                                  ? "Production Only"
                                                  : req.designStatus === "design_production"
                                                  ? "Design + Production"
                                                  : req.designStatus}
                                              </span>
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )}
                                          </td>
                                          <td>
                                            <div className="d-flex gap-2">
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => openEditRequirementModal(req)}
                                              >
                                                Edit
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDeleteRequirement(req)}
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card 8: Rejected Details */}
                        {isRejected && (
                          <div className="lead-info-section" id="rejected" style={{ scrollMarginTop: "100px" }}>
                            <h6 className="lead-info-section-title d-flex align-items-center gap-2 mb-3">
                              ❌ Rejected Details
                            </h6>
                            <div className="row g-3">
                              <div className="col-md-3">
                                <label className="form-label">Rejected Reason</label>
                                <select
                                  className="form-select"
                                  value={rejectedReason}
                                  onChange={(e) => setRejectedReason(e.target.value)}
                                >
                                  <option value="">Select Reject Reason</option>
                                  <option value="Budget Too High">Budget Too High</option>
                                  <option value="Not Interested">Not Interested</option>
                                  <option value="Already Purchased">Already Purchased</option>
                                  <option value="Chose Competitor">Chose Competitor</option>
                                  <option value="Decision Postponed">Decision Postponed</option>
                                  <option value="No Requirement Now">No Requirement Now</option>
                                  <option value="Not Reachable">Not Reachable</option>
                                  <option value="Wrong Contact">Wrong Contact</option>
                                  <option value="Invalid/Incomplete Details">Invalid/Incomplete Details</option>
                                  <option value="Location Not Serviceable">Location Not Serviceable</option>
                                  <option value="Timeline Mismatch">Timeline Mismatch</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div className="col-md-12">
                                <label className="form-label">Rejected Reason Subtype</label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  value={rejectedReasonSubtype}
                                  onChange={(e) => setRejectedReasonSubtype(e.target.value)}
                                  placeholder="Rejected Reason Subtype / Details"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Save/Update buttons at bottom right */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top pb-4">
              <button
                className="btn btn-primary"
                style={{ minWidth: "140px", fontWeight: "600" }}
                onClick={saveLeadDetails}
                disabled={detailsSaving || typeSaving}
                title="Save all changes"
              >
                <i className="ti ti-device-floppy me-1"></i>
                {detailsSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          
        </div>
      )}

      {showDesignDurationModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "520px" }}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Design Duration</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowDesignDurationModal(false)}
              />
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Design Start</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={designStartAt}
                  onChange={(e) => setDesignStartAt(e.target.value)}
                  disabled={!!lead?.designStartAt}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Design End</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={designEndAt}
                  onChange={(e) => setDesignEndAt(e.target.value)}
                  disabled={!!lead?.designEndAt}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Days</label>
                <input
                  className="form-control"
                  value={getDesignDurationDays(designStartAt, designEndAt) || "-"}
                  readOnly
                />
              </div>
              <div className="d-flex justify-content-end">
                <button className="btn btn-primary" onClick={submitDesignDuration} disabled={saving}>
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <PaymentVerificationModal
        show={showVerifyModal}
        onClose={handleCloseVerifyModal}
        saving={saving}
        onSubmit={submitVerifyDetails}
        verifyPaidAmount={verifyPaidAmount}
        onPaidAmountChange={handleVerifyPaidAmountChange}
        verifyNotes={verifyNotes}
        onNotesChange={handleVerifyNotesChange}
        verifyFileName={verifyFileName}
        onFileChange={handleVerifyFileChange}
        parsedInvoice={parsedInvoice}
        selectedBillingAddressId={selectedBillingAddressId}
        onBillingAddressChange={handleBillingAddressChange}
        billingAddresses={billingAddresses}
        onAddBillingAddress={handleAddBillingAddress}
        addressLoading={addressLoading}
        shipSame={shipSame}
        onShipSameChange={handleShipSameChange}
        selectedShippingAddressId={selectedShippingAddressId}
        onShippingAddressChange={handleShippingAddressChange}
        shippingAddresses={shippingAddresses}
        onAddShippingAddress={handleAddShippingAddress}
      />

      {viewingSpecs && (
        <div className="spec-viewer-backdrop" onClick={() => setViewingSpecs(null)}>
          <div className="spec-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spec-viewer-header">
              <h2 className="spec-viewer-title">Specifications</h2>
              <button type="button" className="spec-viewer-close" onClick={() => setViewingSpecs(null)}>✕</button>
            </div>
            <div className="spec-viewer-body">
              {(viewingSpecs.req.categoryName || viewingSpecs.req.typeName || viewingSpecs.req.subtypeName) && (
                <div className="spec-viewer-meta">
                  {viewingSpecs.req.categoryName && <span className="spec-viewer-meta-chip">{viewingSpecs.req.categoryName}</span>}
                  {viewingSpecs.req.typeName && <span className="spec-viewer-meta-chip">{viewingSpecs.req.typeName}</span>}
                  {viewingSpecs.req.subtypeName && <span className="spec-viewer-meta-chip">{viewingSpecs.req.subtypeName}</span>}
                </div>
              )}
              <div className="spec-viewer-grid">
                {Object.entries(viewingSpecs.specs).map(([k, v]) => (
                  <div key={k} className="spec-viewer-field">
                    <span className="spec-viewer-label">{k}</span>
                    <span className="spec-viewer-value">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      <AddressFormModal
        show={showAddAddressModal}
        onClose={() => setShowAddAddressModal(false)}
        onSubmit={handleAddAddress}
        addressType={newAddressType}
        loading={addressLoading}
        countryCodeOptions={COUNTRY_CODE_OPTIONS}
        getCountryOptionByValue={getCountryOptionByValue}
        getCountryAllowedLengths={getCountryAllowedLengths}
        sanitizePhoneDigits={sanitizePhoneDigits}
      />
      <FilePreviewModal 
        show={Boolean(previewFile)} 
        fileName={previewFile?.fileName} 
        filePath={previewFile?.filePath} 
        onClose={() => setPreviewFile(null)} 
      />

      {showAddProjectModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1060 }}>
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "460px" }}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Add Project</h5>
              <button type="button" className="btn-close" onClick={() => setShowAddProjectModal(false)} />
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Project Name <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select className="form-select" value={newProjectType} onChange={(e) => setNewProjectType(e.target.value)}>
                  <option value="">Select Type</option>
                  {projectTypes.map((t) => (
                    <option key={t.id ?? t} value={t.projectType ?? t}>{t.projectType ?? t}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" value={newProjectStatus} onChange={(e) => setNewProjectStatus(e.target.value)}>
                  <option value="">Select Status</option>
                  {projectStatuses.map((s) => (
                    <option key={s.id ?? s} value={s.projectStatus ?? s}>{s.projectStatus ?? s}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Enter project description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddProjectModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleCreateProject} disabled={projectSaving}>
                {projectSaving ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAllocateModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "520px" }}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Allocate Lead</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowAllocateModal(false)}
              />
            </div>
            <div className="card-body">
              {allocateGroupId && (
                <div className="mb-3">
                  <label className="form-label">Allocate Group</label>
                  <div className="form-control bg-light">
                    {allocateGroupName || `Group #${allocateGroupId}`}
                  </div>
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={allocateOwnerId}
                  onChange={(e) => setAllocateOwnerId(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {allocateOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.username} {item.role ? `(${item.role})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex justify-content-end">
                <button className="btn btn-primary" onClick={submitAllocate} disabled={saving}>
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <StockRequestFormModal
        open={showStockRequestModal}
        leadId={lead?.id}
        initialLeadName={lead?.leadName || lead?.name || ""}
        leadOptions={
          lead?.id
            ? [{ id: lead.id, name: lead?.leadName || lead?.name || "" }]
            : []
        }
        itemOptions={stockItems}
        onClose={() => setShowStockRequestModal(false)}
        onSubmit={handleStockRequestSubmit}
        submitting={stockRequestSubmitting}
      />

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "500px" }}>
            <div className="card-header d-flex align-items-center justify-content-between bg-light">
              <h5 className="mb-0">
                <i className="ti ti-transfer-out me-2"></i>Update Lead Status
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusLead(null);
                  setStatusValue("");
                  setAttemptedOpenReason("");
                  setAttemptedCallStatus("");
                  setAttemptedCallRemarks("");
                  setAttemptedFollowUpDate("");
                  setNotAttemptedCallStatus("");
                  setNotAttemptedCallRemarks("");
                  setInterestedFollowUpDate("");
                  setInterestedCallStatus("");
                  setInterestedCallRemarks("");
                  setRejectedReason("");
                  setRejectedReasonSubtype("");
                  setStatusErrors({});
                }}
              />
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Select New Status</label>
                <select
                  className="form-select"
                  value={statusValue}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{ padding: "0.625rem 0.875rem", fontSize: "0.95rem", borderRadius: "0.75rem", ...(statusErrors.statusValue ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}) }}
                >
                  <option value="">Select Status</option>
                {displayStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
                </select>
              </div>
              {allowedStatusOptions.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Available Options:</label>
                  <div className="d-flex flex-wrap gap-2">
                    {displayStatusOptions.map((item) => (
                      <span
                        key={item}
                        className={`badge ${normalizeStatusLabelKey(item) === normalizeStatusLabelKey(statusValue) ? "bg-primary" : "bg-light text-dark"}`}
                        style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem", cursor: "pointer" }}
                        onClick={() => handleStatusChange(item)}
                      >
                        {formatStatusLabel(item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attempted Status Form */}
              {String(statusValue || "").trim().toLowerCase() === "not attempted" && (
                <div className="border-top pt-3 mt-3">
                  <h6 className="mb-3 text-primary">Not Attempted Details</h6>
                  <div className="mb-3">
                    <label className="form-label">Not Attempted Reason</label>
                    <select
                      className="form-select"
                      value={notAttemptedCallStatus}
                      onChange={(e) => {
                        setNotAttemptedCallStatus(e.target.value);
                        if (e.target.value && statusErrors.notAttemptedCallStatus) {
                          setStatusErrors((prev) => ({ ...prev, notAttemptedCallStatus: false }));
                        }
                      }}
                      style={statusErrors.notAttemptedCallStatus ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                    >
                      <option value="">Select Not Attempted Reason</option>
                      {NOT_ATTEMPTED_REASON_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Manual Details</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={notAttemptedCallRemarks}
                      onChange={(e) => {
                        setNotAttemptedCallRemarks(e.target.value);
                        if (e.target.value.trim() && statusErrors.notAttemptedCallRemarks) {
                          setStatusErrors((prev) => ({ ...prev, notAttemptedCallRemarks: false }));
                        }
                      }}
                      placeholder="Enter manual details"
                      style={statusErrors.notAttemptedCallRemarks ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                    />
                  </div>
                </div>
              )}

              {/* Attempted Status Form */}
              {String(statusValue || "").trim().toLowerCase() === "attempted" && (
                <div className="border-top pt-3 mt-3">
                  <h6 className="mb-3 text-primary">Attempted Details</h6>
                      <div className="mb-3">
                        <label className="form-label">Attempted Reason</label>
                        <select
                          className="form-select"
                          value={attemptedOpenReason}
                          onChange={(e) => {
                            setAttemptedOpenReason(e.target.value);
                            if (e.target.value && statusErrors.attemptedOpenReason) {
                              setStatusErrors((prev) => ({ ...prev, attemptedOpenReason: false }));
                            }
                          }}
                          style={statusErrors.attemptedOpenReason ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                        >
                          <option value="">Select Attempted Reason</option>
                          {ATTEMPTED_REASON_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Manual Details</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={attemptedCallRemarks}
                          onChange={(e) => {
                            setAttemptedCallRemarks(e.target.value);
                            if (e.target.value.trim() && statusErrors.attemptedCallRemarks) {
                              setStatusErrors((prev) => ({ ...prev, attemptedCallRemarks: false }));
                            }
                          }}
                          placeholder="Enter manual details"
                          style={statusErrors.attemptedCallRemarks ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                        />
                      </div>
                    </div>
              )}

              {/* Interested Status Form */}
              {String(statusValue || "").trim().toLowerCase() === "interested" && (
                <div className="border-top pt-3 mt-3">
                  <h6 className="mb-3 text-primary">Interested Details</h6>
                  <div className="mb-3">
                    <label className="form-label">Interested Reason</label>
                    <select
                      className="form-select"
                      value={interestedCallStatus}
                      onChange={(e) => {
                        setInterestedCallStatus(e.target.value);
                        if (e.target.value && statusErrors.interestedCallStatus) {
                          setStatusErrors((prev) => ({ ...prev, interestedCallStatus: false }));
                        }
                      }}
                      style={statusErrors.interestedCallStatus ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                    >
                      <option value="">Select Interested Reason</option>
                      {INTERESTED_REASON_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Follow Up Date</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      value={interestedFollowUpDate}
                      onChange={(e) => {
                        setInterestedFollowUpDate(e.target.value);
                        if (e.target.value && statusErrors.interestedFollowUpDate) {
                          setStatusErrors((prev) => ({ ...prev, interestedFollowUpDate: false }));
                        }
                      }}
                      style={statusErrors.interestedFollowUpDate ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Manual Details</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={interestedCallRemarks}
                      onChange={(e) => {
                        setInterestedCallRemarks(e.target.value);
                        if (e.target.value.trim() && statusErrors.interestedCallRemarks) {
                          setStatusErrors((prev) => ({ ...prev, interestedCallRemarks: false }));
                        }
                      }}
                      placeholder="Enter manual details"
                      style={statusErrors.interestedCallRemarks ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                    />
                  </div>
                </div>
              )}

              {/* Rejected Status Form */}
              {String(statusValue || "").trim().toLowerCase() === "rejected" && (
                <div className="border-top pt-3 mt-3">
                  <h6 className="mb-3 text-primary">Rejected Details</h6>
                  <div className="mb-3">
                    <label className="form-label">Rejected Reason</label>
                    <select
                      className="form-select"
                      value={rejectedReason}
                      onChange={(e) => {
                        setRejectedReason(e.target.value);
                        if (e.target.value && statusErrors.rejectedReason) {
                          setStatusErrors((prev) => ({ ...prev, rejectedReason: false }));
                        }
                      }}
                      style={statusErrors.rejectedReason ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                    >
                      <option value="">Select Reject Reason</option>
                      <option value="Budget Too High">Budget Too High</option>
                      <option value="Not Interested">Not Interested</option>
                      <option value="Already Purchased">Already Purchased</option>
                      <option value="Chose Competitor">Chose Competitor</option>
                      <option value="Decision Postponed">Decision Postponed</option>
                      <option value="No Requirement Now">No Requirement Now</option>
                      <option value="Not Reachable">Not Reachable</option>
                      <option value="Wrong Contact">Wrong Contact</option>
                      <option value="Invalid/Incomplete Details">Invalid/Incomplete Details</option>
                      <option value="Location Not Serviceable">Location Not Serviceable</option>
                      <option value="Timeline Mismatch">Timeline Mismatch</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rejected Reason Subtype</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={rejectedReasonSubtype}
                      onChange={(e) => setRejectedReasonSubtype(e.target.value)}
                      placeholder="Rejected Reason Subtype / Details"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusLead(null);
                  setStatusValue("");
                  setAttemptedOpenReason("");
                  setAttemptedCallStatus("");
                  setAttemptedCallRemarks("");
                  setAttemptedFollowUpDate("");
                  setNotAttemptedCallStatus("");
                  setNotAttemptedCallRemarks("");
                  setInterestedFollowUpDate("");
                  setInterestedCallStatus("");
                  setInterestedCallRemarks("");
                  setRejectedReason("");
                  setRejectedReasonSubtype("");
                  setStatusErrors({});
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={saveStatus}
                disabled={statusSaving}
              >
                {statusSaving ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Log Modal */}
      {showLeadLogModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="card-header d-flex align-items-center justify-content-between bg-light">
              <h5 className="mb-0">
                <i className="ti ti-history me-2"></i>Activity Log
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowLeadLogModal(false)}
              />
            </div>
            <div className="card-body" style={{ maxHeight: "calc(80vh - 120px)", overflowY: "auto" }}>
              {leadLogs.length === 0 ? (
                <div className="text-muted text-center py-4">No activity log yet.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {leadLogs.map((log, index) => (
                    <div
                      key={`log-${index}`}
                      className="border-bottom pb-3"
                      style={{ borderColor: "#eef2f7" }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1" style={{ color: "#45597a", fontWeight: 600 }}>
                            {log.action || "Action"}
                          </h6>
                          <p className="text-muted mb-2" style={{ fontSize: "0.875rem" }}>
                            {log.actor && <span>By: <strong>{log.actor}</strong></span>}
                            {log.actor && log.createdAt && <span className="mx-2">â€¢</span>}
                            {log.createdAt && <span>{formatDateTime(log.createdAt)}</span>}
                          </p>
                          {log.details && (
                            <p className="mb-0" style={{ fontSize: "0.875rem", color: "#34393f" }}>
                              {log.details}
                            </p>
                          )}
                          {log.filePath && (
                            <a
                              href={resolveMediaUrl(log.filePath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="small"
                              style={{ display: "inline-block", marginTop: "0.5rem" }}
                            >
                              <i className="ti ti-download me-1"></i>Download File
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowLeadLogModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1055 }}>
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "420px" }}>
            <div className="card-header d-flex align-items-center justify-content-between bg-light">
              <h5 className="mb-0 text-danger fw-bold d-flex align-items-center gap-2">
                <i className="ti ti-alert-triangle"></i>Unsaved Changes
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowUnsavedModal(false)}
              />
            </div>
            <div className="card-body">
              <p className="mb-0 text-secondary">
                You have unsaved changes on this page. What would you like to do?
              </p>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  setShowUnsavedModal(false);
                  await saveLeadDetails();
                }}
              >
                Save & Exit
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => {
                  setShowUnsavedModal(false);
                  navigate("/leads");
                }}
              >
                Exit Anyway
              </button>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={() => setShowUnsavedModal(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


