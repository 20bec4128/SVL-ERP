import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getLeadByCustomerUserId, getLeadById, getLeads, createLead, getAssignableLeadGroups } from "../../api/leadsApi";
import { getPrimarySources } from "../../api/primarySourceApi";
import { getRequirementsByLeadId } from "../../api/requirementApi";
import { approveQuotation, getQuotationById, saveQuotation } from "../../api/quotationApi";
import { getPriceList, normalizePriceListEntries } from "../../api/priceListApi";
import { getActiveGstMasters, createGstMaster } from "../../api/gstMasterApi";
import { getUsers } from "../../api/userAdminApi";
import "./QuotationPage.css";
import AddItemModal from "./AddItemModal";
import {
  QUOTATION_STATUS_APPROVED,
  QUOTATION_STATUS_DRAFT,
  QUOTATION_STATUS_VERIFICATION_PENDING,
  buildDesignFeePricing,
  clearQuotationDraft,
  createQuotationPayload,
  buildQuotationTaxSummary,
  extractTaxGroupCode,
  getQuotationDraft,
  normalizeQuotationLineItem,
  quotationResponseToDraft,
} from "../../utils/quotationUtils";
import { getCustomSizeSummary } from "../../utils/customSizeUtils";

function safeJsonParse(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  const trimmed = String(value).trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
}

function parseNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function formatIndianMobileNumber(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  return `+91 ${digits}`;
}

function toKeyValueSummary(value) {
  const source = value && typeof value === "object" ? value : null;
  if (!source) return "";

  const parts = Object.entries(source)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: ${v.filter(Boolean).join(", ")}`;
      if (typeof v === "object") return `${k}: ${JSON.stringify(v)}`;
      return `${k}: ${String(v)}`;
    });

  if (!parts.length) return "";
  const shown = parts.slice(0, 6).join(", ");
  return parts.length > 6 ? `${shown} +${parts.length - 6} more` : shown;
}


function getVariantSummary(variantFields) {
  const source = variantFields || {};
  const skipKeys = new Set([
    "customWidth",
    "customHeight",
    "customDepth",
    "customUnit",
    "customDimensions",
    ...Object.keys(source).filter((key) => key.startsWith("customSize_")),
  ]);
  const entries = Object.entries(source)
    .filter(([key, value]) =>
      !key.endsWith("Custom") && !key.endsWith("Text") &&
      !skipKeys.has(key) && value !== "" && value != null
    )
    .map(([key, value]) => {
      if (value === "Custom") {
        if (key === "size") {
          const summary = getCustomSizeSummary({ customDimensions: source.customDimensions }, source);
          if (summary) return [key, summary];
        }
        if (source[`${key}Custom`]) return [key, source[`${key}Custom`]];
      }
      return [key, value];
    });
  if (!entries.length) return "";
  const shown = entries.slice(0, 3).map(([, v]) => v).join(", ");
  return entries.length > 3 ? `${shown} +${entries.length - 3} more` : shown;
}

function designLabel(status) {
  if (status === "design_only")
    return { label: "Design only", color: "#7c3aed", bg: "#f5f3ff" };
  if (status === "production_only")
    return { label: "Production only", color: "#b45309", bg: "#fffbeb" };
  if (status === "design_production")
    return { label: "Design + prod", color: "#065f46", bg: "#ecfdf5" };
  return null;
}

function getDesignOnlyPrice(priceMatch) {
  if (!priceMatch?.quantitySlabs?.length) return null;
  return Number(priceMatch.quantitySlabs[0].pricePerPiece);
}

function fullSpecsSummary(specs) {
  const raw = typeof specs === "string"
    ? (() => { try { return JSON.parse(specs); } catch { return {}; } })()
    : (specs || {});
  const SKIP = new Set([
    "customWidth",
    "customHeight",
    "customDepth",
    "customUnit",
    "customDimensions",
    ...Object.keys(raw).filter((key) => key.startsWith("customSize_")),
  ]);
  const entries = Object.entries(raw)
    .filter(([key, v]) =>
      !key.endsWith("Custom") && !key.endsWith("Text") &&
      !SKIP.has(key) && v !== "" && v != null
    )
    .map(([key, v]) => {
      if (v === "Custom") {
        if (key === "size") {
          const summary = getCustomSizeSummary({ customDimensions: raw.customDimensions }, raw);
          if (summary) return summary;
        }
        if (raw[`${key}Custom`]) return raw[`${key}Custom`];
      }
      return String(v);
    })
    .filter(Boolean);
  return entries.join(" · ");
}

function getEditVal(editingPrices, itemId, field, item) {
  if (editingPrices[itemId]?.[field] !== undefined) {
    return editingPrices[itemId][field];
  }
  if (field === "unitPrice") {
    const v = Number(item.pricePerUnit || item.unitPrice || 0);
    return v > 0 ? String(v) : "";
  }
  if (field === "discountPct") return String(Number(item.discountPct ?? item.discountPercent ?? 0));
  if (field === "gstPct") return String(Number(item.gstPct ?? item.gstPercent ?? 0));
  if (field === "quantity")  return String(item.quantity || 1);
  return "";
}

function normalizeLineItem(item, options = {}) {
  return normalizeQuotationLineItem(item, options);
}

function buildLineItemsFromRequirements(requirements, priceList, options = {}) {
  return (requirements || []).map((req, index) => {
    const matchedPrice = (priceList || []).find((entry) =>
      Number(entry.typeId) === Number(req.typeId) &&
      (entry.subtypeId == null
        ? req.subtypeId == null
        : Number(entry.subtypeId) === Number(req.subtypeId))
    ) || null;

    const quantity = Number(req.quantity) || 1;
    const slab = matchedPrice?.quantitySlabs?.find((item) =>
      quantity >= Number(item.minQty) && quantity <= Number(item.maxQty)
    ) || null;

    const unitPrice = slab ? Number(slab.pricePerPiece) : 0;
    const pricingStatus = slab ? "PRICED" : "UNPRICED";
    const variantSummary = matchedPrice ? getVariantSummary(matchedPrice.variantFields) : "";
    const productName = [req.typeName, req.subtypeName].filter(Boolean).join(" - ") || "Unknown Product";

    const rawLineItem = req.designStatus === "design_only"
      ? {
          id: `req-auto-${req.id}-${index}`,
          productId: matchedPrice?.id ?? null,
          categoryId: req.categoryId ?? null,
          typeId: req.typeId,
          subtypeId: req.subtypeId ?? null,
          typeName: req.typeName,
          subtypeName: req.subtypeName ?? null,
          productName,
          quantity: 0,
          unitPrice: 0,
          pricePerUnit: 0,
          designCost: 0,
          lineTotal: 0,
          pricingStatus,
          specs: safeJsonParse(req.specs, {}),
          variantFields: matchedPrice?.variantFields ?? {},
          variantSummary,
          sourceRequirementId: req.id,
          designStatus: req.designStatus || null,
          priceEntryId: matchedPrice?.id ?? null,
        }
      : {
          id: `req-auto-${req.id}-${index}`,
          productId: matchedPrice?.id ?? null,
          categoryId: req.categoryId ?? null,
          typeId: req.typeId,
          subtypeId: req.subtypeId ?? null,
          typeName: req.typeName,
          subtypeName: req.subtypeName ?? null,
          productName,
          quantity,
          unitPrice,
          pricePerUnit: unitPrice,
          designCost: 0,
          lineTotal: quantity * unitPrice,
          pricingStatus,
          specs: safeJsonParse(req.specs, {}),
          variantFields: matchedPrice?.variantFields ?? {},
          optionsSummary: variantSummary,
          priceListEntryId: matchedPrice?.id ?? null,
          requirementId: req.id,
          designStatus: req.designStatus || null,
        };

    return normalizeLineItem(rawLineItem, options);
  });
}

function applyEdit(itemId, field, rawValue, setLineItems, setEditingPrices, options = {}) {
  const num = parseFloat(rawValue);
  const safe = Number.isFinite(num) && num >= 0 ? num : 0;
  setLineItems((prev) => prev.map((item) => {
    if (item.id !== itemId) return item;
    const next = { ...item };
    if (field === "quantity") next.quantity = safe;
    if (field === "unitPrice") next.unitPrice = safe;
    if (field === "discountPct") next.discountPct = safe;
    if (field === "gstPct") next.gstPct = safe;
    return normalizeLineItem(next, options);
  }));
}

function mergePendingPriceEdits(lineItems, editingPrices, options = {}) {
  const toSafeNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  return lineItems.map((item) => {
    const pending = editingPrices[item.id];
    if (!pending) return normalizeLineItem(item, options);

    const quantity = pending.quantity !== undefined
      ? toSafeNumber(pending.quantity)
      : Number(item.quantity || 0);
    const unitPrice = pending.unitPrice !== undefined
      ? toSafeNumber(pending.unitPrice)
      : Number(item.pricePerUnit || item.unitPrice || 0);
    const discountPct = pending.discountPct !== undefined
      ? toSafeNumber(pending.discountPct)
      : Number(item.discountPct ?? item.discountPercent ?? 0);
    const gstPct = pending.gstPct !== undefined
      ? toSafeNumber(pending.gstPct)
      : Number(item.gstPct ?? item.gstPercent ?? 0);

    return normalizeLineItem({
      ...item,
      quantity,
      unitPrice,
      pricePerUnit: unitPrice,
      discountPct,
      gstPct,
    }, options);
  });
}

function createEmptyDraft() {
  return {
    id: null,
    quotationNumber: "",
    status: QUOTATION_STATUS_DRAFT,
    verificationRequestedAt: null,
    verificationRequestedById: null,
    verificationRequestedByName: null,
    verificationRequestedByRole: null,
    verificationRequestNotes: "",
    approvedAt: null,
    approvedById: null,
    approvedByName: null,
    approvedByRole: null,
    approvalNotes: "",
    createdById: null,
    createdByName: null,
    createdByEmail: null,
    createdByRole: null,
    createdByTeam: null,
    partyMode: "lead",
    selectedLead: null,
    leadSearch: "",
    lineItems: [],
    discountPct: 0,
    includeDesignFee: false,
    designFeeAmount: 0,
    designFeeDiscountPct: 0,
    designFeeGstPct: 0,
    gstPct: 0,
    gstRows: [],
  };
}

function isTamilNaduState(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  return (
    normalized === "tn" ||
    normalized === "tamilnadu" ||
    normalized === "tamilnasu" ||
    normalized.startsWith("tamilna")
  );
}

function formatLeadState(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = raw.toLowerCase().replace(/[^a-z]/g, "");
  const stateNames = {
    ap: "Andhra Pradesh",
    ar: "Arunachal Pradesh",
    as: "Assam",
    br: "Bihar",
    cg: "Chhattisgarh",
    ga: "Goa",
    gj: "Gujarat",
    hr: "Haryana",
    hp: "Himachal Pradesh",
    jh: "Jharkhand",
    ka: "Karnataka",
    kl: "Kerala",
    mp: "Madhya Pradesh",
    mh: "Maharashtra",
    mn: "Manipur",
    ml: "Meghalaya",
    mz: "Mizoram",
    nl: "Nagaland",
    or: "Odisha",
    pb: "Punjab",
    rj: "Rajasthan",
    sk: "Sikkim",
    tn: "Tamil Nadu",
    ts: "Telangana",
    tr: "Tripura",
    up: "Uttar Pradesh",
    uk: "Uttarakhand",
    wb: "West Bengal",
    dl: "Delhi",
    jk: "Jammu & Kashmir",
    la: "Ladakh",
    ch: "Chandigarh",
    dn: "Dadra & Nagar Haveli",
    dd: "Daman & Diu",
    ld: "Lakshadweep",
    py: "Puducherry",
  };

  if (stateNames[normalized]) {
    return stateNames[normalized];
  }

  if (normalized === "tamilnadu" || normalized.startsWith("tamilna")) {
    return "Tamil Nadu";
  }

  return raw
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeQuotationLead(lead) {
  if (!lead) return null;

  const address = String(lead.address || lead.streetAddress || "").trim();
  const leadState = String(lead.leadState || lead.state || "").trim();

  return {
    ...lead,
    leadId: lead.leadId ?? lead.id ?? "",
    address,
    streetAddress: lead.streetAddress ?? address,
    leadState,
    state: lead.state ?? leadState,
  };
}

function normalizeQuotationCustomer(user) {
  if (!user) return null;

  const firstName = String(user.firstName || "").trim();
  const lastName = String(user.lastName || "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ").trim()
    || String(user.username || "").trim()
    || String(user.email || "").trim();

  return {
    id: null,
    customerId: user.id ?? null,
    leadId: null,
    name,
    email: String(user.email || "").trim(),
    mobile: String(user.mobile || user.phone || "").trim(),
    company: String(user.company || user.companyName || "").trim(),
    address: "",
    streetAddress: "",
    leadState: "",
    state: "",
    gstin: "",
    username: String(user.username || "").trim(),
    active: Boolean(user.active),
    role: String(user.role || "CUSTOMER").toUpperCase(),
  };
}

function createEmptyGstRow() {
  return {
    id: `gst-row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gstMasterId: "",
    taxName: "",
    taxPercent: 0,
  };
}

export default function QuotationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userRole = String(user?.role || "").toUpperCase();
  const isEmployee = userRole === "EMPLOYEE";
  const [isViewOnly, setIsViewOnly] = useState(Boolean(location.state?.viewOnly));

  const [partyMode, setPartyMode] = useState("lead");
  const [activeTab, setActiveTab] = useState("lead");
  const [allLeads, setAllLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadSuggestions, setLeadSuggestions] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerLeadId, setCustomerLeadId] = useState(null);
  const [customerLeadLoading, setCustomerLeadLoading] = useState(false);
  const [quotationId, setQuotationId] = useState(null);
  const [quotationNumber, setQuotationNumber] = useState("");
  const [quotationCreatedAt, setQuotationCreatedAt] = useState("");
  const [quotationStatus, setQuotationStatus] = useState(QUOTATION_STATUS_DRAFT);
  const [verificationRequestedAt, setVerificationRequestedAt] = useState(null);
  const [verificationRequestedById, setVerificationRequestedById] = useState(null);
  const [verificationRequestedByName, setVerificationRequestedByName] = useState(null);
  const [verificationRequestedByRole, setVerificationRequestedByRole] = useState(null);
  const [verificationRequestNotes, setVerificationRequestNotes] = useState("");
  const [approvedAt, setApprovedAt] = useState(null);
  const [approvedById, setApprovedById] = useState(null);
  const [approvedByName, setApprovedByName] = useState(null);
  const [approvedByRole, setApprovedByRole] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveDialogNotes, setApproveDialogNotes] = useState("");
  const [createdById, setCreatedById] = useState(null);
  const [createdByName, setCreatedByName] = useState(null);
  const [createdByEmail, setCreatedByEmail] = useState(null);
  const [createdByRole, setCreatedByRole] = useState(null);
  const [createdByTeam, setCreatedByTeam] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [requirementsError, setRequirementsError] = useState("");
  const [priceList, setPriceList] = useState([]);
  const [priceListLoading, setPriceListLoading] = useState(false);
  const [gstMasters, setGstMasters] = useState([]);
  const [gstMastersLoading, setGstMastersLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [configError, setConfigError] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newItems = [...lineItems];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setLineItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const [editingPrices, setEditingPrices] = useState({});
  const [discountPct, setDiscountPct] = useState("0");
  const [includeDesignFee, setIncludeDesignFee] = useState(false);
  const [designFeeAmount, setDesignFeeAmount] = useState("");
  const [designFeeDiscountPct, setDesignFeeDiscountPct] = useState("0");
  const [designFeeGstPct, setDesignFeeGstPct] = useState("0");
  const [designFeeGstMasterId, setDesignFeeGstMasterId] = useState("");

  useEffect(() => {
    if (Array.isArray(gstMasters) && gstMasters.length > 0 && designFeeGstPct) {
      const match = gstMasters.find(m => Number(m.taxPercent) === Number(designFeeGstPct));
      if (match) {
        setDesignFeeGstMasterId(String(match.id));
      } else {
        setDesignFeeGstMasterId("");
      }
    }
  }, [gstMasters, designFeeGstPct]);

  const [gstPct, setGstPct] = useState("0");
  const [gstRows, setGstRows] = useState([]);
  const [gstAddPopupOpen, setGstAddPopupOpen] = useState(false);
  const [unfilledPricesPopupOpen, setUnfilledPricesPopupOpen] = useState(false);
  const [unfilledPricesList, setUnfilledPricesList] = useState([]);
  const [gstAddPercent, setGstAddPercent] = useState("");
  const [gstAddSaving, setGstAddSaving] = useState(false);
  const [gstAddError, setGstAddError] = useState("");
  const [gstAddContext, setGstAddContext] = useState({ mode: "summary", itemId: null });
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const suggestionRef = useRef(null);
  const customerSuggestionRef = useRef(null);
  const skipAutoGenerateRef = useRef(false);
  const restoringDraftRef = useRef(false);
  const hydratedQuotationIdRef = useRef(null);
  const hydratedLeadIdRef = useRef(null);

  const customerName =
    selectedLead?.name ||
    [selectedCustomer?.firstName, selectedCustomer?.lastName].filter(Boolean).join(" ").trim() ||
    selectedCustomer?.username ||
    selectedCustomer?.email ||
    "";
  const leadStateValue = selectedLead?.leadState || selectedLead?.state || "";
  const leadStateDisplay = useMemo(() => formatLeadState(leadStateValue), [leadStateValue]);
  const leadAddressDisplay = selectedLead?.address || selectedLead?.streetAddress || "";
  const quotationDate = new Date().toISOString().slice(0, 10);

  const applyQuotationDraft = (source) => {
    if (!source) return;

    const initial = { ...createEmptyDraft(), ...source };
    const draftLead = normalizeQuotationLead(initial.selectedLead);
    const draftLeadState = draftLead?.leadState || draftLead?.state || initial.clientState || initial.leadState || "";
    const draftIsTamilNadu = isTamilNaduState(draftLeadState);
    const legacyDiscountPct = parseNonNegativeNumber(initial.discountPct, 0);
    const legacyGstPct = parseNonNegativeNumber(
      initial.gstPct ?? initial.gstPercent ?? initial.gstPctTotal ?? (
        Array.isArray(initial.gstRows) && initial.gstRows.length
          ? initial.gstRows.reduce((sum, row) => sum + Number(row?.taxPercent || 0), 0)
          : 0
      ),
      0,
    );
    const legacyItemTaxSeed =
      Array.isArray(initial.lineItems) &&
      initial.lineItems.length > 0 &&
      (legacyDiscountPct > 0 || legacyGstPct > 0) &&
      initial.lineItems.every((item) =>
        Number(item?.discountPct ?? item?.discountPercent ?? 0) === 0 &&
        Number(item?.gstPct ?? item?.gstPercent ?? item?.gstPctTotal ?? 0) === 0
      );
    setQuotationId(initial.id);
    setQuotationNumber(initial.quotationNumber || "");
    setQuotationCreatedAt(initial.createdAt || "");
    setQuotationStatus(initial.status || QUOTATION_STATUS_DRAFT);
    setVerificationRequestedAt(initial.verificationRequestedAt || null);
    setVerificationRequestedById(initial.verificationRequestedById || null);
    setVerificationRequestedByName(initial.verificationRequestedByName || null);
    setVerificationRequestedByRole(initial.verificationRequestedByRole || null);
    setVerificationRequestNotes(initial.verificationRequestNotes || "");
    setApprovedAt(initial.approvedAt || null);
    setApprovedById(initial.approvedById || null);
    setApprovedByName(initial.approvedByName || null);
    setApprovedByRole(initial.approvedByRole || null);
    setApprovalNotes(initial.approvalNotes || "");
    setCreatedById(initial.createdById || null);
    setCreatedByName(initial.createdByName || null);
    setCreatedByEmail(initial.createdByEmail || null);
    setCreatedByRole(initial.createdByRole || null);
    setCreatedByTeam(initial.createdByTeam || null);
    setPartyMode(initial.partyMode || "lead");
    setSelectedLead(draftLead);
    setLeadSearch(
      initial.leadSearch ||
        (initial.selectedLead
          ? `${initial.selectedLead.leadId} - ${initial.selectedLead.name}`
          : "")
    );
    setCustomerSearch(
      initial.partyMode === "customer"
        ? (initial.customerSearch || initial.selectedLead?.name || initial.clientName || "")
        : ""
    );
    setLineItems(
        Array.isArray(initial.lineItems)
          ? initial.lineItems.map((item) => normalizeLineItem(item, {
            isTamilNadu: draftIsTamilNadu,
            defaultDiscountPct: legacyDiscountPct,
            defaultGstPct: legacyGstPct,
            preferFallbackWhenZero: legacyItemTaxSeed,
            defaultGstMasterId,
          }))
        : []
    );
    setDiscountPct(String(legacyDiscountPct));
    setIncludeDesignFee(initial.includeDesignFee || false);
    setDesignFeeAmount(String(initial.designFeeAmount || ""));
    setDesignFeeDiscountPct(String(initial.designFeeDiscountPct || 0));
    setDesignFeeGstPct(String(Number(initial.designFeeGstPct || 0) > 0 ? initial.designFeeGstPct : legacyGstPct));
    setGstPct(String(legacyGstPct));
    setGstRows(
      Array.isArray(initial.gstRows) && initial.gstRows.length
        ? initial.gstRows.map((row, index) => ({
            id: row.id || `gst-row-restored-${index}`,
            gstMasterId: row.gstMasterId || "",
            taxName: row.taxName || "",
            taxPercent: Number(row.taxPercent || 0),
          }))
        : []
    );
    if (Array.isArray(initial.lineItems) && initial.lineItems.length > 0) {
      skipAutoGenerateRef.current = true;
    }
  };

  const isTamilNadu = useMemo(
    () => isTamilNaduState(leadStateValue),
    [leadStateValue],
  );
  const designFeePricing = useMemo(
    () => buildDesignFeePricing({
      includeDesignFee,
      designFeeAmount: Number(designFeeAmount || 0),
      designFeeDiscountPct: parseNonNegativeNumber(designFeeDiscountPct, 0),
      designFeeGstPct: parseNonNegativeNumber(designFeeGstPct, 0),
      isTamilNadu,
    }),
    [includeDesignFee, designFeeAmount, designFeeDiscountPct, designFeeGstPct, isTamilNadu],
  );
  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + Number(item.baseAmount ?? (Number(item.quantity || 0) * Number(item.unitPrice || item.pricePerUnit || 0))), 0) + designFeePricing.baseAmount,
    [lineItems, designFeePricing.baseAmount],
  );
  const discountAmt = useMemo(
    () => lineItems.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0) + designFeePricing.discountAmount,
    [lineItems, designFeePricing.discountAmount],
  );
  const afterDiscount = useMemo(() => subtotal - discountAmt, [subtotal, discountAmt]);
  const taxSummary = useMemo(
    () => buildQuotationTaxSummary(lineItems, {
      isTamilNadu,
      includeDesignFee,
      designFeeAmount: designFeePricing.baseAmount,
      designFeeDiscountPct: designFeePricing.discountPct,
      designFeeGstPct: designFeePricing.gstPct,
    }),
    [lineItems, isTamilNadu, includeDesignFee, designFeePricing],
  );
  const taxAmt = useMemo(() => taxSummary.totalTaxAmount, [taxSummary]);
  const cgstAmt = useMemo(() => taxSummary.totalCgstAmount, [taxSummary]);
  const sgstAmt = useMemo(() => taxSummary.totalSgstAmount, [taxSummary]);
  const igstAmt = useMemo(() => taxSummary.totalIgstAmount, [taxSummary]);
  const showHsnSacColumn = useMemo(
    () => lineItems.some((item) => Boolean(extractTaxGroupCode(item))),
    [lineItems],
  );
  const grandTotal = useMemo(
    () => afterDiscount + taxAmt,
    [afterDiscount, taxAmt],
  );
  const gstMasterMap = useMemo(
    () => new Map(gstMasters.map((item) => [String(item.id), item])),
    [gstMasters],
  );
  const defaultGstMaster = useMemo(() => {
    const helperPercent = parseNonNegativeNumber(gstPct, 0);
    const matchedMaster = gstMasters.find(
      (item) => parseNonNegativeNumber(item.taxPercent, 0) === helperPercent,
    );
    return matchedMaster || gstMasters[0] || null;
  }, [gstMasters, gstPct]);
  const defaultGstMasterId = defaultGstMaster?.id ?? null;

  const totals = {
    subtotal,
    discountAmt,
    afterDiscount,
    taxAmt,
    cgstAmt,
    sgstAmt,
    igstAmt,
    grandTotal,
  };

  const selectedCustomerDisplayName = useMemo(() => {
    if (!selectedCustomer) return "";
    return [selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(" ").trim()
      || selectedCustomer.username
      || selectedCustomer.email
      || "";
  }, [selectedCustomer]);
  const selectedCustomerEmail = selectedCustomer?.email || "";
  const selectedCustomerUsername = selectedCustomer?.username || "";

  const lineItemCellBase = {
    padding: "12px 8px",
    borderBottom: "1px solid #f3f4f6",
    borderRight: "1px solid #f0f1f3",
    verticalAlign: "middle",
  };
  const taxHeadCell = {
    padding: "8px 8px 10px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.7px",
    textTransform: "uppercase",
    color: "#9ca3af",
    whiteSpace: "nowrap",
  };
  const taxCellBase = {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "middle",
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: "#0f172a",
  };

  useEffect(() => {
    setLeadsLoading(true);
    getLeads()
      .then((data) => setAllLeads(Array.isArray(data) ? data : []))
      .catch(() => setAllLeads([]))
      .finally(() => setLeadsLoading(false));
  }, []);

  useEffect(() => {
    setCustomersLoading(true);
    getUsers(0, 1000)
      .then((data) => {
        const rows = Array.isArray(data?.items) ? data.items : [];
        setAllCustomers(rows.filter((user) => String(user.role || "").toUpperCase() === "CUSTOMER"));
      })
      .catch(() => setAllCustomers([]))
      .finally(() => setCustomersLoading(false));
  }, []);

  useEffect(() => {
    const draft = getQuotationDraft();
    if (!draft) {
      return;
    }

    restoringDraftRef.current = true;
    applyQuotationDraft(draft);
    clearQuotationDraft();
  }, []);

  useEffect(() => {
    const numericQuotationId = Number(quotationId);
    if (!Number.isFinite(numericQuotationId) || numericQuotationId <= 0) {
      return;
    }

    if (hydratedQuotationIdRef.current === numericQuotationId) {
      return;
    }

    let ignore = false;
    getQuotationById(numericQuotationId)
      .then((quotation) => {
        if (ignore || !quotation) return;

        const hydratedDraft = quotationResponseToDraft(quotation);
        if (!hydratedDraft) return;

        hydratedQuotationIdRef.current = numericQuotationId;
        restoringDraftRef.current = true;
        applyQuotationDraft(hydratedDraft);
      })
      .catch(() => {
        // Keep the cached draft if the backend fetch fails.
      });

    return () => {
      ignore = true;
    };
  }, [quotationId]);

  useEffect(() => {
    const prefill = location.state?.prefillLead;
    if (!prefill) return;
    setPartyMode("lead");
    setActiveTab("lead");
    setSelectedLead(normalizeQuotationLead(prefill));
    setLeadSearch(`${prefill.leadId} - ${prefill.name}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const prefillCustomer = location.state?.prefillCustomer;
    if (!prefillCustomer) return;
    setPartyMode("customer");
    setActiveTab("customer");
    setSelectedCustomer(prefillCustomer);
    const name = [prefillCustomer.firstName, prefillCustomer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || prefillCustomer.username || prefillCustomer.email || "";
    setCustomerSearch(name);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsViewOnly(Boolean(location.state?.viewOnly));
  }, [location.state?.viewOnly]);

  useEffect(() => {
    const leadId = selectedLead?.id;
    if (!leadId) return;
    if (hydratedLeadIdRef.current === leadId) return;

    let ignore = false;
    getLeadById(leadId)
      .then((lead) => {
        if (ignore || !lead) return;
        hydratedLeadIdRef.current = leadId;
        setSelectedLead((current) => normalizeQuotationLead({ ...current, ...lead }));
      })
      .catch(() => {
        // Keep the existing selected lead if the lookup fails.
      });

    return () => {
      ignore = true;
    };
  }, [selectedLead?.id]);

  useEffect(() => {
    if (partyMode !== "customer") {
      return;
    }

    const customerId = selectedCustomer?.id;
    if (!customerId) {
      setCustomerLeadId(null);
      setCustomerLeadLoading(false);
      return;
    }

    let ignore = false;
    setCustomerLeadLoading(true);
    setRequirementsError("");

    getLeadByCustomerUserId(customerId)
      .then((lead) => {
        if (ignore) return;
        if (lead) {
          setSelectedLead(normalizeQuotationLead(lead));
          setCustomerLeadId(lead.id ?? null);
        } else {
          setSelectedLead(null);
          setCustomerLeadId(null);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSelectedLead(null);
          setCustomerLeadId(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setCustomerLeadLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [partyMode, selectedCustomer?.id]);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerSuggestions([]);
      return;
    }

    const query = customerSearch.toLowerCase();
    const filtered = allCustomers.filter((customer) => {
      const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").toLowerCase();
      const email = String(customer.email || "").toLowerCase();
      const username = String(customer.username || "").toLowerCase();
      return name.includes(query) || email.includes(query) || username.includes(query);
    });

    setCustomerSuggestions(filtered.slice(0, 8));
  }, [customerSearch, allCustomers]);

  useEffect(() => {
    setPriceListLoading(true);
    // Load the full price list for quotation building so newly added entries are available immediately.
    getPriceList({ page: 0, size: 5000 })
      .then((data) => setPriceList(normalizePriceListEntries(data)))
      .catch(() => setPriceList([]))
      .finally(() => setPriceListLoading(false));
  }, []);

  useEffect(() => {
    setGstMastersLoading(true);
    getActiveGstMasters()
      .then((data) => setGstMasters(Array.isArray(data) ? data : []))
      .catch(() => setGstMasters([]))
      .finally(() => setGstMastersLoading(false));
  }, []);

  useEffect(() => {
    if (!gstMasters.length || !lineItems.length) {
      return;
    }

    setLineItems((previous) => {
      let changed = false;
      const updated = previous.map((item) => {
        if (!item || item.designStatus === "design_only" || item.gstMasterId) {
          return item;
        }

        const currentPercent = parseNonNegativeNumber(item.gstPct ?? item.gstPercent ?? 0, 0);
        const matchedMaster = gstMasters.find(
          (master) => parseNonNegativeNumber(master.taxPercent, 0) === currentPercent,
        ) || gstMasters.find((master) => String(master.id) === String(defaultGstMasterId));
        if (!matchedMaster) {
          return item;
        }

        changed = true;
        return normalizeLineItem({
          ...item,
          gstMasterId: matchedMaster.id,
          gstPct: Number(matchedMaster.taxPercent || 0),
          gstPercent: Number(matchedMaster.taxPercent || 0),
        }, {
          isTamilNadu,
          defaultDiscountPct: 0,
          defaultGstPct: parseNonNegativeNumber(gstPct, 0),
          defaultGstMasterId,
        });
      });

      return changed ? updated : previous;
    });
  }, [gstMasters, isTamilNadu, gstPct, lineItems.length, defaultGstMasterId]);

  useEffect(() => {
    if (!leadSearch.trim()) {
      setLeadSuggestions([]);
      return;
    }

    const query = leadSearch.toLowerCase();
    const filtered = allLeads.filter((lead) =>
      [lead.leadId, lead.name].some((value) => String(value || "").toLowerCase().includes(query)),
    );

    setLeadSuggestions(filtered.slice(0, 8));
  }, [leadSearch, allLeads]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (customerSuggestionRef.current && !customerSuggestionRef.current.contains(event.target)) {
        setShowCustomerSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (restoringDraftRef.current && !selectedLead?.id) {
      return;
    }

    const numericId = selectedLead?.id;
    if (!numericId || (partyMode !== "lead" && partyMode !== "customer")) {
      setRequirements([]);
      setRequirementsError("");
      if (!skipAutoGenerateRef.current) {
        setLineItems([]);
      }
      return;
    }

    setRequirementsLoading(true);
    setRequirementsError("");

    getRequirementsByLeadId(numericId)
      .then((data) => {
        const reqs = Array.isArray(data) ? data : [];
        setRequirements(reqs);
      })
      .catch(() => {
        setRequirements([]);
        setRequirementsError("Failed to load requirements for this lead.");
      })
      .finally(() => setRequirementsLoading(false));
  }, [selectedLead?.id, partyMode]);

  useEffect(() => {
    const numericId = selectedLead?.id;
    if (!numericId || (partyMode !== "lead" && partyMode !== "customer") || priceListLoading) {
      return;
    }

    if (skipAutoGenerateRef.current) {
      skipAutoGenerateRef.current = false;
      restoringDraftRef.current = false;
      return;
    }

    if (!requirements.length) {
      setLineItems([]);
      setEditingPrices({});
      return;
    }

    const autoItems = buildLineItemsFromRequirements(requirements, priceList, {
      isTamilNadu,
      defaultDiscountPct: 0,
      defaultGstPct: parseNonNegativeNumber(gstPct, 0),
      defaultGstMasterId,
    });

    setLineItems(autoItems);
    setEditingPrices({});
  }, [selectedLead?.id, partyMode, priceListLoading, requirements, priceList, isTamilNadu, gstPct, defaultGstMasterId]);

  const handleLeadSelect = (lead) => {
    setSelectedLead(lead);
    setLeadSearch(`${lead.leadId} - ${lead.name}`);
    setShowSuggestions(false);
    setSaveMessage("");
  };

  const handleLeadSearchChange = (event) => {
    setLeadSearch(event.target.value);
    setSelectedLead(null);
    setLineItems([]);
    setShowSuggestions(true);
    setSaveMessage("");
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedLead(null);
    setCustomerLeadId(null);
    setRequirements([]);
    setRequirementsError("");
    setLineItems([]);
    setCustomerLeadLoading(true);
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim()
      || customer.username
      || customer.email
      || "";
    setCustomerSearch(name);
    setShowCustomerSuggestions(false);
    setSaveMessage("");
  };

  const handleCustomerSearchChange = (event) => {
    setCustomerSearch(event.target.value);
    setSelectedCustomer(null);
    setSelectedLead(null);
    setLineItems([]);
    setShowCustomerSuggestions(true);
    setSaveMessage("");
  };

  const handlePartyModeChange = (mode) => {
    setPartyMode(mode);
    setActiveTab(mode);
    setSelectedLead(null);
    setSelectedCustomer(null);
    setCustomerLeadId(null);
    setCustomerLeadLoading(false);
    setLeadSearch("");
    setLeadSuggestions([]);
    setShowSuggestions(false);
    setCustomerSearch("");
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
    setSaveMessage("");
    setRequirements([]);
    setRequirementsError("");
    setLineItems([]);
  };

  function buildPrefill(req) {
    return {
      categoryId: req.categoryId ?? null,
      typeId: req.typeId,
      subtypeId: req.subtypeId ?? null,
      typeName: req.typeName,
      subtypeName: req.subtypeName ?? null,
      quantity: req.quantity,
      specs: safeJsonParse(req.specs, {}),
      productId: null,
    };
  }

  function openAddModal(prefill) {
    setEditingItem(prefill ?? null);
    setConfigError("");
    setSaveMessage("");
    setAddModalOpen(true);
  }

  function closeAddModal() {
    setAddModalOpen(false);
    setEditingItem(null);
  }

  const handleRemoveItem = (itemId) => {
    setLineItems(previous => previous.filter(item => item.id !== itemId));
    setEditingPrices(prev => { const n = { ...prev }; delete n[itemId]; return n; });
    setSaveMessage("");
  };

  const handleOpenGstAddPopup = ({ mode = "summary", itemId = null, prefillPercent = "" } = {}) => {
    setGstAddPercent(String(prefillPercent ?? ""));
    setGstAddError("");
    setGstAddContext({ mode, itemId });
    setGstAddPopupOpen(true);
  };

  const handleSaveNewGst = async () => {
    const pct = Number(gstAddPercent);
    if (!gstAddPercent || isNaN(pct) || pct < 0) { setGstAddError("Enter a valid GST %."); return; }
    setGstAddSaving(true);
    setGstAddError("");
    try {
      const createdGst = await createGstMaster({ taxName: `GST ${pct}%`, taxPercent: pct, active: true });
      const updated = await getActiveGstMasters();
      setGstMasters(Array.isArray(updated) ? updated : []);
      setGstAddPopupOpen(false);
      const createdMasterId = createdGst?.id ? String(createdGst.id) : "";
      const fallbackMatchId = Array.isArray(updated)
        ? String(
            updated.find((item) => parseNonNegativeNumber(item.taxPercent, 0) === pct)?.id || ""
          )
        : "";
      const nextMasterId = createdMasterId || fallbackMatchId;

      if (nextMasterId) {
        if (gstAddContext.mode === "line-item" && gstAddContext.itemId != null) {
          handleLineItemGstMasterChange(gstAddContext.itemId, nextMasterId);
        } else if (gstAddContext.mode === "design-fee") {
          setDesignFeeGstMasterId(nextMasterId);
          setDesignFeeGstPct(String(pct));
        }
      }
    } catch {
      setGstAddError("Failed to save. Please try again.");
    } finally {
      setGstAddContext({ mode: "summary", itemId: null });
      setGstAddSaving(false);
    }
  };

  const handleLineItemGstMasterChange = (itemId, gstMasterId) => {
    const selectedMaster = gstMasters.find((item) => String(item.id) === String(gstMasterId));

    setLineItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return normalizeLineItem({
          ...item,
          gstMasterId: selectedMaster?.id ?? null,
          gstPct: Number(selectedMaster?.taxPercent ?? 0),
          gstPercent: Number(selectedMaster?.taxPercent ?? 0),
        }, {
          isTamilNadu,
          defaultDiscountPct: 0,
          defaultGstPct: parseNonNegativeNumber(gstPct, 0),
          defaultGstMasterId,
        });
      })
    );

    setSaveMessage("");
  };

  const buildCurrentQuotation = () =>
    createQuotationPayload({
      id: quotationId,
      quotationNumber,
      quotationDate,
      customerName,
      partyMode,
      selectedLead,
      lineItems: mergePendingPriceEdits(lineItems, editingPrices, {
        isTamilNadu,
        defaultDiscountPct: 0,
        defaultGstPct: parseNonNegativeNumber(gstPct, 0),
        defaultGstMasterId,
      }),
      discountPct: 0,
      includeDesignFee,
      designFeeAmount: includeDesignFee ? Number(designFeeAmount || 0) : 0,
      designFeeDiscountPct: includeDesignFee ? parseNonNegativeNumber(designFeeDiscountPct, 0) : 0,
      designFeeGstPct: includeDesignFee ? parseNonNegativeNumber(designFeeGstPct, 0) : 0,
      gstRows: gstRows.map((row) => ({
        gstMasterId: row.gstMasterId ? Number(row.gstMasterId) : null,
        taxName: row.taxName || "",
        taxPercent: Number(row.taxPercent || 0),
      })),
      gstPct: parseNonNegativeNumber(gstPct, 0),
      cgstPct: isTamilNadu ? parseNonNegativeNumber(gstPct, 0) / 2 : 0,
      sgstPct: isTamilNadu ? parseNonNegativeNumber(gstPct, 0) / 2 : 0,
      igstPct: isTamilNadu ? 0 : parseNonNegativeNumber(gstPct, 0),
      totals,
      status: quotationStatus,
      verificationRequestedAt,
      verificationRequestedById,
      verificationRequestedByName,
      verificationRequestedByRole,
      verificationRequestNotes,
      approvedAt,
      approvedById,
      approvedByName,
      approvedByRole,
      approvalNotes,
      createdBy: user?.name || user?.email || null,
      createdById: createdById || user?.id || null,
      createdByName:
        createdByName ||
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        user?.username ||
        user?.email ||
        null,
      createdByEmail: createdByEmail || user?.email || null,
      createdByRole: createdByRole || userRole || null,
      createdByTeam: createdByTeam || user?.team || null,
      createdAt: quotationCreatedAt || undefined,
    });

  const executeSaveQuotation = async () => {
    console.log("Creating quotation with leadId:", resolvedLeadId, "customerId:", selectedCustomer?.id);
    setIsSaving(true);
    try {
      const payload = buildCurrentQuotation();
      const savedQuotation = await saveQuotation(payload);

      setQuotationId(savedQuotation.id);
      setQuotationNumber(savedQuotation.quotationNumber || "");
      setQuotationCreatedAt(savedQuotation.createdAt || "");
      setQuotationStatus(savedQuotation.status || QUOTATION_STATUS_DRAFT);
      setVerificationRequestedAt(savedQuotation.verificationRequestedAt || null);
      setVerificationRequestedById(savedQuotation.verificationRequestedById || null);
      setVerificationRequestedByName(savedQuotation.verificationRequestedByName || null);
      setVerificationRequestedByRole(savedQuotation.verificationRequestedByRole || null);
      setVerificationRequestNotes(savedQuotation.verificationRequestNotes || "");
      setApprovedAt(savedQuotation.approvedAt || null);
      setApprovedById(savedQuotation.approvedById || null);
      setApprovedByName(savedQuotation.approvedByName || null);
      setApprovedByRole(savedQuotation.approvedByRole || null);
      setApprovalNotes(savedQuotation.approvalNotes || "");
      setCreatedById(savedQuotation.createdById || null);
      setCreatedByName(savedQuotation.createdByName || null);
      setCreatedByEmail(savedQuotation.createdByEmail || null);
      setCreatedByRole(savedQuotation.createdByRole || null);
      setCreatedByTeam(savedQuotation.createdByTeam || null);
      setSaveMessage("Quotation saved successfully.");
      setConfigError("");
      navigate("/quotation-list", { state: { successMessage: "Quotation saved successfully." } });
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to save quotation.";
      setConfigError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuotation = async () => {
    if (!customerName.trim()) {
      setConfigError(partyMode === "customer" ? "Please select a customer first." : "Please select a lead first.");
      return;
    }

    if (partyMode === "lead" && !selectedLead?.id) {
      setConfigError("No lead selected. Cannot create quotation.");
      return;
    }

    if (partyMode === "customer" && !selectedCustomer) {
      setConfigError("No customer selected. Cannot create quotation.");
      return;
    }

    if (!lineItems.length) {
      setConfigError("Please add at least one item before saving.");
      return;
    }

    const unfilledItems = lineItems.filter(item => Number(item.unitPrice || 0) === 0);
    if (unfilledItems.length > 0) {
      const names = unfilledItems.map(item => item.productName || "Unnamed item");
      setUnfilledPricesList(names);
      setUnfilledPricesPopupOpen(true);
      return;
    }

    await executeSaveQuotation();
  };

  const handleGoToList = () => {
    navigate("/quotation-list");
  };

  const canEditQuotation = !isViewOnly && !(isEmployee && quotationStatus !== QUOTATION_STATUS_DRAFT && quotationStatus !== "NEGOTIATING");
  const canApproveAsManager = ["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  const canApproveAsTeamLead =
    userRole === "TEAM_LEAD" &&
    String(createdByRole || "").toUpperCase() === "EMPLOYEE" &&
    String(createdByTeam || "").trim().toLowerCase() === String(user?.team || "").trim().toLowerCase();
  const canApproveCurrentQuotation =
    !isViewOnly &&
    quotationStatus === QUOTATION_STATUS_VERIFICATION_PENDING &&
    (canApproveAsManager || canApproveAsTeamLead);

  const resolvedLeadId = selectedLead?.id ?? customerLeadId ?? null;

  const handleApproveFromEdit = async (notesValue) => {
    if (!canApproveCurrentQuotation) {
      return;
    }

    if (!quotationId) {
      setConfigError("Save quotation before approving.");
      return;
    }

    try {
      const approvedQuotation = await approveQuotation(quotationId, String(notesValue || "").trim());
      setQuotationStatus(approvedQuotation.status || QUOTATION_STATUS_APPROVED);
      setApprovedAt(approvedQuotation.approvedAt || null);
      setApprovedById(approvedQuotation.approvedById || null);
      setApprovedByName(approvedQuotation.approvedByName || null);
      setApprovedByRole(approvedQuotation.approvedByRole || null);
      setApprovalNotes(approvedQuotation.approvalNotes || "");
      setSaveMessage("Quotation approved successfully.");
      setConfigError("");
      setApproveDialogOpen(false);
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to approve quotation.";
      setConfigError(message);
    }
  };

  const openApproveDialog = () => {
    setApproveDialogNotes(approvalNotes || "");
    setApproveDialogOpen(true);
  };

  return (
    <div className="qp-page">

      {/* ── Header ── */}
      <div className="qp-header">
        <div style={{ display: "flex", gap: 8 }}>
          <button className="qp-btn-ghost" onClick={handleGoToList}>
            <i className="ti ti-layout-list" style={{ fontSize: 14 }} />
            Quotation List
          </button>
          <button className="qp-btn-ghost" onClick={() => navigate("/quotation-template")}>
            <i className="ti ti-settings" style={{ fontSize: 14 }} />
            Template
          </button>
        </div>

        <div className="qp-header-center">
          <div className="qp-title">{isViewOnly ? "View Quotation" : "Create Quotation"}</div>
          <div className="qp-subtitle">
            {isViewOnly ? "Review the saved quotation" : "Build, save and download quotations"}
          </div>
        </div>

        <div className="qp-mode-toggle">
          <div className="qp-mode-item" onClick={() => handlePartyModeChange("lead")}>
            <div className={`qp-mode-circle${partyMode === "lead" ? " active" : ""}`}>
              <i className="ti ti-building-community" />
            </div>
            <div className="qp-mode-label">Lead</div>
          </div>
          <div className="qp-mode-item" onClick={() => handlePartyModeChange("customer")}>
            <div className={`qp-mode-circle${partyMode === "customer" ? " active" : ""}`}>
              <i className="ti ti-users" />
            </div>
            <div className="qp-mode-label">Customer</div>
          </div>
        </div>
      </div>

      {/* ── Status alert (non-draft) ── */}
      {quotationStatus !== QUOTATION_STATUS_DRAFT && (
        <div className="qp-status-alert info">
          <i className="ti ti-info-circle" style={{ fontSize: 16 }} />
          <span>
            Status: <strong>
              {quotationStatus === QUOTATION_STATUS_APPROVED ? "Approved" : "Verification Pending"}
            </strong>
            {verificationRequestNotes && (
              <span className="ms-2">· Employee notes: {verificationRequestNotes}</span>
            )}
            {approvalNotes && (
              <span className="ms-2">· Approval notes: {approvalNotes}</span>
            )}
          </span>
        </div>
      )}

      {/* ── Error / success ── */}
      {configError && (
        <div className="qp-status-alert danger">
          <i className="ti ti-alert-circle" style={{ fontSize: 16 }} />
          {configError}
        </div>
      )}
      {saveMessage && (
        <div className="qp-status-alert success">
          <i className="ti ti-circle-check" style={{ fontSize: 16 }} />
          {saveMessage}
        </div>
      )}

      <fieldset disabled={!canEditQuotation} style={{ border: "none", padding: 0, margin: 0 }}>

        {/* ── LEAD MODE ── */}
        {partyMode === "lead" && (
          <>
            {/* Lead details */}
            <div className="qp-card">
              <div className="qp-card-label">Lead details</div>
              <div className="qp-fields-grid">
                <div className="qp-field-group" ref={suggestionRef} style={{ position: "relative" }}>
                  <div className="qp-field-label">Enquiry ID / Name *</div>
                  <input
                    className="qp-field-input"
                    type="text"
                    placeholder={leadsLoading ? "Loading leads..." : "Type enquiry ID or name"}
                    value={leadSearch}
                    onChange={handleLeadSearchChange}
                    onFocus={() => leadSearch && setShowSuggestions(true)}
                    autoComplete="off"
                  />
                  {showSuggestions && leadSuggestions.length > 0 && (
                    <ul className="qp-suggestions">
                      {leadSuggestions.map((lead) => (
                        <li
                          key={lead.id || lead.leadId}
                          className="qp-suggestion-item"
                          onMouseDown={() => handleLeadSelect(lead)}
                        >
                          <span className="qp-suggestion-id">{lead.leadId}</span>
                          {lead.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">Name</div>
                  <div className="qp-field-readonly">{selectedLead?.name || "—"}</div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">Email</div>
                  <div className="qp-field-readonly">{selectedLead?.email || "—"}</div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">Address</div>
                  <div className="qp-field-readonly qp-field-readonly-multiline">
                    {leadAddressDisplay || "—"}
                  </div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">Phone</div>
                  <div className="qp-field-readonly">{formatIndianMobileNumber(selectedLead?.mobile)}</div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">State</div>
                  <div className="qp-field-readonly">{leadStateDisplay || "—"}</div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">GSTIN</div>
                  <div className="qp-field-readonly">{selectedLead?.gstin || "—"}</div>
                </div>
              </div>
              <div className="qp-meta-row">
                <div className="qp-meta-chip">
                  Date <span>{quotationDate}</span>
                </div>
                <div className="qp-meta-chip">
                  Quotation No. <span>{quotationNumber || "Generated on save"}</span>
                </div>
              </div>
            </div>

            {/* Requirements summary */}
            <div className="qp-card">
              <div className="qp-card-label">Requirements</div>
              {!selectedLead?.leadId ? (
                <div className="qp-empty">Select a lead to load its requirements.</div>
              ) : requirementsLoading ? (
                <div className="qp-empty">
                  <span className="spinner-border spinner-border-sm me-2" />
                  Loading requirements...
                </div>
              ) : requirementsError ? (
                <div className="qp-status-alert danger">{requirementsError}</div>
              ) : requirements.length === 0 ? (
                <div className="qp-empty">
                  No requirements found for this lead. Add items manually below.
                </div>
              ) : (
                <div className="qp-req-summary">
                  <div className="qp-req-icon">
                    <i className="ti ti-circle-check" />
                  </div>
                  <div>
                    <div className="qp-req-title">
                      {requirements.length} requirement{requirements.length !== 1 ? "s" : ""} loaded as line items
                    </div>
                    <div className="qp-req-sub">
                      {(() => {
                        const designOnly = lineItems.filter(i => i.designStatus === "design_only").length;
                        const unpriced = lineItems.filter(i =>
                          i.pricingStatus === "UNPRICED" && i.designStatus !== "design_only"
                        ).length;
                        const parts = [];
                        if (designOnly > 0) parts.push(`${designOnly} design-only item(s) — enter total price`);
                        if (unpriced > 0)   parts.push(`${unpriced} item(s) need manual unit price`);
                        if (parts.length === 0) return "All items priced from price list";
                        return parts.join(" · ");
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CUSTOMER MODE ── */}
      {partyMode === "customer" && (
            <>
            <div className="qp-card">
              <div className="qp-card-label">Customer details</div>
              <div className="qp-fields-grid">
                <div className="qp-field-group" ref={customerSuggestionRef} style={{ position: "relative" }}>
                  <div className="qp-field-label">Customer Account *</div>
                  <input
                    className="qp-field-input"
                    type="text"
                    placeholder={customersLoading ? "Loading customers..." : "Type customer name, email, or username"}
                    value={customerSearch}
                    onChange={handleCustomerSearchChange}
                    onFocus={() => customerSearch && setShowCustomerSuggestions(true)}
                    autoComplete="off"
                  />
                  {showCustomerSuggestions && customerSuggestions.length > 0 && (
                    <ul className="qp-suggestions">
                      {customerSuggestions.map((customer) => (
                        <li
                          key={customer.id}
                          className="qp-suggestion-item"
                          onMouseDown={() => handleCustomerSelect(customer)}
                        >
                          <span className="qp-suggestion-id">{customer.username || customer.id}</span>
                          {[customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() || customer.email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">Name</div>
                  <div className="qp-field-readonly">{selectedCustomerDisplayName || selectedLead?.name || "—"}</div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">Email / Username</div>
                  <div className="qp-field-readonly">
                    {selectedCustomerEmail || selectedCustomerUsername || selectedLead?.email || "—"}
                  </div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">Linked Lead ID</div>
                  <div className="qp-field-readonly">{selectedLead?.leadId || "—"}</div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">Address</div>
                  <div className="qp-field-readonly qp-field-readonly-multiline">
                    {selectedLead?.address || selectedLead?.streetAddress || "—"}
                  </div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">State</div>
                  <div className="qp-field-readonly">{leadStateDisplay || "—"}</div>
                </div>
                <div className="qp-field-group">
                  <div className="qp-field-label">GSTIN</div>
                  <div className="qp-field-readonly">{selectedLead?.gstin || "—"}</div>
                </div>
              </div>
              <div className="qp-meta-row">
                <div className="qp-meta-chip">
                  Date <span>{quotationDate}</span>
                </div>
                <div className="qp-meta-chip">
                  Quotation No. <span>{quotationNumber || "Generated on save"}</span>
                </div>
              </div>
              {selectedCustomer && customerLeadLoading ? (
                <div className="qp-status-alert info mt-3">
                  <i className="ti ti-info-circle" style={{ fontSize: 16 }} />
                  Loading the linked lead for this customer...
                </div>
              ) : null}
            </div>

            <div className="qp-card">
              <div className="qp-card-label">Customer quotation note</div>
              <div className="qp-empty">
                Select a customer account to load the linked lead snapshot (optional).
              </div>
            </div>
          </>
        )}

        {/* ── Line Items ── */}
        <div className="qp-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="qp-card-label" style={{ marginBottom: 0 }}>Line items</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Custom Multi-select Dropdown for Fees */}
              <div className="qp-dropdown-container" style={{ position: "relative", display: "inline-block" }}>
                <button
                  type="button"
                  className="qp-btn-ghost"
                  disabled={!canEditQuotation}
                  onClick={(e) => {
                    e.stopPropagation();
                    const dropdown = document.getElementById("additional-charges-dropdown");
                    if (dropdown) {
                      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    cursor: canEditQuotation ? "pointer" : "default",
                    padding: "6px 12px",
                    border: "1.5px solid #d1d5db",
                    borderRadius: 6,
                    background: "#fff",
                  }}
                >
                  <i className="ti ti-settings" style={{ fontSize: 14 }} />
                  Include Fees (
                  {lineItems.filter(item => {
                    const specs = item.specs || {};
                    return specs.isAdditionalCharge || item.isAdditionalCharge || false;
                  }).length} selected)
                  <i className="ti ti-chevron-down" style={{ fontSize: 12, marginLeft: 2 }} />
                </button>
                <div
                  id="additional-charges-dropdown"
                  style={{
                    display: "none",
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    zIndex: 1000,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    padding: "8px 0",
                    minWidth: 220,
                    marginTop: 4,
                  }}
                >
                  {[
                    "Design Charge",
                    "Packing / Bundle Charge",
                    "Courier Charge",
                    "Die Charge",
                    "Screen Charge",
                    "Cutting Charge",
                    "Scoring / Greasing Charge",
                    "Screen Printing Charge"
                  ].map((chargeName) => {
                    const currentCount = lineItems.filter(item => 
                      (item.productName === chargeName) && 
                      (item.isAdditionalCharge || item.specs?.isAdditionalCharge || false)
                    ).length;

                    const handleAddCharge = (e) => {
                      e.stopPropagation();
                      const newChargeItem = normalizeLineItem({
                        id: `additional-charge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        productName: chargeName,
                        quantity: 1,
                        unitPrice: 0,
                        discountPct: 0,
                        gstPct: Number(gstPct || 0),
                        isAdditionalCharge: true,
                        specs: { isAdditionalCharge: true },
                      }, {
                        isTamilNadu,
                        defaultDiscountPct: 0,
                        defaultGstPct: parseNonNegativeNumber(gstPct, 0),
                        defaultGstMasterId,
                      });
                      setLineItems(prev => [...prev, newChargeItem]);
                    };

                    return (
                      <div
                        key={chargeName}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "8px 16px",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#374151",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          userSelect: "none",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        onClick={handleAddCharge}
                      >
                        <span style={{ flex: 1, display: "flex", alignItems: "center" }}>
                          {(chargeName === "Die Charge" || chargeName === "Screen Charge") ? `${chargeName} (OneTime Investment)` : chargeName}
                          {currentCount > 0 && (
                            <span style={{
                              marginLeft: 8,
                              background: "#e0e7ff",
                              color: "#4f46e5",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 12,
                              display: "inline-block"
                            }}>
                              x{currentCount}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: "1px solid #ddd6fe",
                            background: "#faf5ff",
                            color: "#7c3aed",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 700,
                            padding: 0,
                            lineHeight: 1,
                          }}
                          onClick={handleAddCharge}
                        >
                          +
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <script>
                {`
                  document.addEventListener("click", () => {
                    const dropdown = document.getElementById("additional-charges-dropdown");
                    if (dropdown) dropdown.style.display = "none";
                  });
                `}
              </script>

              <button
                type="button"
                className="qp-btn-ghost"
                onClick={() => openAddModal()}
                disabled={!canEditQuotation || (partyMode === "customer" && customerLeadLoading)}
              >
                <i className="ti ti-plus" style={{ fontSize: 13 }} />
                Add item
              </button>
            </div>
          </div>

          {lineItems.length === 0 && !includeDesignFee ? (
            <div className="qp-empty">No items yet. Click "Add item" to start.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <colgroup>
                  <col style={{ width: 36 }} />
                  <col />
                  {showHsnSacColumn && <col style={{ width: 88 }} />}
                  <col style={{ width: 72 }} />
                  <col style={{ width: 96 }} />
                  <col style={{ width: 86 }} />
                  <col style={{ width: 152 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 60 }} />
                </colgroup>

                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    {[
                      { label: "#",          align: "center" },
                      { label: "Product",    align: "left"   },
                      ...(showHsnSacColumn ? [{ label: "HSN/SAC", align: "left" }] : []),
                      { label: "Qty",        align: "right"  },
                      { label: "Unit price", align: "right"  },
                      { label: "Discount %", align: "right"  },
                       { label: "GST Master", align: "right"  },
                      { label: "Total",      align: "right"  },
                      { label: "",           align: "right"  },
                    ].map((col, i) => (
                      <th key={i} style={{
                        padding: "0 8px 10px",
                        fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.7px",
                        textTransform: "uppercase",
                        color: "#9ca3af",
                        textAlign: col.align,
                        whiteSpace: "nowrap",
                        borderRight: "1px solid #e5e7eb",
                      }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Render all items in unified draggable loop */}
                  {(() => {
                    return lineItems.map((item, index) => {
                      const isAddCharge = item.isAdditionalCharge || item.specs?.isAdditionalCharge || false;

                      if (isAddCharge) {
                        const discountAmount = Number(item.discountAmount || 0);

                        return (
                          <tr
                            key={item.id}
                            style={{
                              background: "#faf5ff",
                              opacity: draggedIndex === index ? 0.5 : 1,
                              cursor: isViewOnly ? "default" : "move"
                            }}
                            draggable={!isViewOnly}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <td style={{ ...lineItemCellBase, textAlign: "center", cursor: (!isViewOnly) ? "grab" : "default" }}>
                              {!isViewOnly && <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 4 }}>⋮⋮</span>}
                              <span style={{ fontSize: 12, color: "#7c3aed", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                                {index + 1}
                              </span>
                            </td>
                            <td style={{ ...lineItemCellBase }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>
                                {(() => {
                                  const name = item.productName || "";
                                  const lower = name.toLowerCase();
                                  if ((lower === "die charge" || lower === "screen charge") && !lower.includes("onetime investment")) {
                                    return `${name} (OneTime Investment)`;
                                  }
                                  return name;
                                })()}
                              </div>
                              {discountAmount > 0 && (
                                <div style={{
                                  fontSize: 11,
                                  color: "#059669",
                                  marginTop: 3,
                                  lineHeight: 1.4,
                                  fontFamily: "'DM Mono', monospace",
                                  wordBreak: "break-word",
                                  fontWeight: 600,
                                }}>
                                  Discounted Amount: ₹{discountAmount.toFixed(2)}
                                </div>
                              )}
                              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                                Additional charge
                              </div>
                            </td>
                            {showHsnSacColumn && (
                              <td style={{ ...lineItemCellBase, textAlign: "left" }}>
                                <span style={{ fontSize: 12, color: "#d1d5db", fontFamily: "'DM Mono', monospace" }}>
                                  —
                                </span>
                              </td>
                            )}
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              <input
                                type="number" min="1"
                                disabled={isViewOnly}
                                style={{
                                  border: "1.5px solid #ddd6fe",
                                  borderRadius: 6, padding: "5px 7px",
                                  fontSize: 13, fontFamily: "'DM Mono', monospace",
                                  background: "#faf5ff", color: "#7c3aed",
                                  fontWeight: 600, outline: "none",
                                  width: "100%", textAlign: "right",
                                }}
                                value={getEditVal(editingPrices, item.id, "quantity", item)}
                                onChange={e => {
                                  setEditingPrices(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], quantity: e.target.value },
                                  }));
                                  applyEdit(item.id, "quantity", e.target.value, setLineItems, setEditingPrices, {
                                    isTamilNadu,
                                    defaultGstPct: parseNonNegativeNumber(gstPct, 0),
                                    defaultGstMasterId,
                                  });
                                }}
                                onFocus={e => e.target.select()}
                              />
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              <input
                                type="number" min="0" step="0.01"
                                disabled={isViewOnly}
                                style={{
                                  border: "1.5px solid #ddd6fe",
                                  borderRadius: 6, padding: "5px 7px",
                                  fontSize: 13, fontFamily: "'DM Mono', monospace",
                                  background: "#faf5ff", color: "#7c3aed",
                                  fontWeight: 600, outline: "none",
                                  width: "100%", textAlign: "right",
                                }}
                                value={getEditVal(editingPrices, item.id, "unitPrice", item)}
                                onChange={e => {
                                  setEditingPrices(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], unitPrice: e.target.value },
                                  }));
                                  applyEdit(item.id, "unitPrice", e.target.value, setLineItems, setEditingPrices, {
                                    isTamilNadu,
                                    defaultGstPct: parseNonNegativeNumber(gstPct, 0),
                                    defaultGstMasterId,
                                  });
                                }}
                                onFocus={e => e.target.select()}
                                placeholder="₹ charge"
                              />
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              <input
                                type="number" min="0" step="0.01"
                                disabled={isViewOnly}
                                style={{
                                  border: "1.5px solid #ddd6fe",
                                  borderRadius: 6, padding: "5px 7px",
                                  fontSize: 13, fontFamily: "'DM Mono', monospace",
                                  background: "#faf5ff", color: "#7c3aed",
                                  fontWeight: 600, outline: "none",
                                  width: "100%", textAlign: "right",
                                }}
                                value={getEditVal(editingPrices, item.id, "discountPct", item)}
                                onChange={e => {
                                  setEditingPrices(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], discountPct: e.target.value },
                                  }));
                                  applyEdit(item.id, "discountPct", e.target.value, setLineItems, setEditingPrices, {
                                    isTamilNadu,
                                    defaultGstPct: parseNonNegativeNumber(gstPct, 0),
                                    defaultGstMasterId,
                                  });
                                }}
                                onFocus={e => e.target.select()}
                                placeholder="0"
                              />
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "left" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <select
                                    disabled={gstMastersLoading || isViewOnly}
                                    style={{
                                      border: "1.5px solid #ddd6fe",
                                      borderRadius: 6, padding: "5px 7px",
                                      fontSize: 13, fontFamily: "'DM Mono', monospace",
                                      background: "#faf5ff", color: "#7c3aed",
                                      fontWeight: 600, outline: "none",
                                      flex: 1, minWidth: 0, textAlign: "left",
                                      appearance: "auto",
                                    }}
                                    value={item.gstMasterId ? String(item.gstMasterId) : ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const selectedMaster = gstMasters.find((g) => String(g.id) === String(val));
                                      
                                      setLineItems((prev) =>
                                        prev.map((li) => {
                                          if (li.id !== item.id) return li;
                                          return normalizeLineItem({
                                            ...li,
                                            gstMasterId: selectedMaster?.id ?? null,
                                            gstPct: Number(selectedMaster?.taxPercent ?? 0),
                                            gstPercent: Number(selectedMaster?.taxPercent ?? 0),
                                          }, {
                                            isTamilNadu,
                                            defaultDiscountPct: 0,
                                            defaultGstPct: parseNonNegativeNumber(gstPct, 0),
                                            defaultGstMasterId,
                                          });
                                        })
                                      );
                                    }}
                                  >
                                    <option value="">{gstMastersLoading ? "Loading..." : "Select GST master"}</option>
                                    {gstMasters.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        GST {Number(option.taxPercent || 0)}%
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="qp-item-btn"
                                    disabled={isViewOnly}
                                    onClick={() => handleOpenGstAddPopup({
                                      mode: "line-item",
                                      itemId: item.id,
                                      prefillPercent: Number(item.gstPct ?? 0),
                                    })}
                                    title="Add GST master"
                                  >
                                    <i className="ti ti-plus" style={{ fontSize: 13 }} />
                                  </button>
                                </div>
                                <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>
                                  GST {Number(item.gstPct ?? 0).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#7c3aed" }}>
                                ₹{Number(item.lineTotal || 0).toFixed(2)}
                              </span>
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className="qp-item-btn danger"
                                  disabled={isViewOnly}
                                  onClick={() => handleRemoveItem(item.id)}
                                  title="Remove"
                                >
                                  <i className="ti ti-trash" style={{ fontSize: 13 }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      } else {
                        const isDesignOnly  = item.designStatus === "design_only";
                        const isUnpriced    = String(item.pricingStatus || "").toUpperCase() === "UNPRICED";
                        const noSlabWarning = !isDesignOnly && isUnpriced;
                        const specText      = fullSpecsSummary(item.specs);

                        const inBase = {
                          borderWidth: "1.5px",
                          borderStyle: "solid",
                          borderColor: "#e5e7eb",
                          borderRadius: 6,
                          padding: "5px 7px",
                          fontSize: 13,
                          fontFamily: "'DM Mono', monospace",
                          background: "#fafafa",
                          color: "#0f172a",
                          outline: "none",
                          width: "100%",
                          textAlign: "right",
                          display: "block",
                        };
                        const inWarn   = { ...inBase, borderColor: "#fca5a5", background: "#fff8f8" };

                        const rowBg = noSlabWarning
                          ? { background: "#fffcf5", borderLeft: "3px solid #f0ad4e" }
                          : {};

                        return (
                          <tr
                            key={item.id}
                            style={{
                              ...rowBg,
                              opacity: draggedIndex === index ? 0.5 : 1,
                              cursor: isViewOnly ? "default" : "move"
                            }}
                            draggable={!isViewOnly}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <td style={{ ...lineItemCellBase, textAlign: "center", cursor: (!isViewOnly) ? "grab" : "default" }}>
                              {!isViewOnly && <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 4 }}>⋮⋮</span>}
                              <span style={{
                                fontSize: 12, fontWeight: 700,
                                color: "#d1d5db",
                                fontFamily: "'DM Mono', monospace",
                              }}>
                                {index + 1}
                              </span>
                            </td>
                            <td style={{ ...lineItemCellBase }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                                {(() => {
                                  const name = item.productName || "";
                                  const lower = name.toLowerCase();
                                  if ((lower === "die charge" || lower === "screen charge") && !lower.includes("onetime investment")) {
                                    return `${name} (OneTime Investment)`;
                                  }
                                  return name;
                                })()}
                              </div>
                              {specText && (
                                <div style={{
                                  fontSize: 11, color: "#6b7280",
                                  marginTop: 3, lineHeight: 1.5,
                                  fontFamily: "'DM Mono', monospace",
                                  wordBreak: "break-word",
                                }}>
                                  {specText}
                                </div>
                              )}
                              {Number(item.discountAmount || 0) > 0 && !isDesignOnly && (
                                <div style={{
                                  fontSize: 11,
                                  color: "#059669",
                                  marginTop: 3,
                                  lineHeight: 1.4,
                                  fontFamily: "'DM Mono', monospace",
                                  wordBreak: "break-word",
                                  fontWeight: 600,
                                }}>
                                  Discounted Amount: ₹{Number(item.discountAmount || 0).toFixed(2)}
                                </div>
                              )}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                                {(() => {
                                  const d = designLabel(item.designStatus);
                                  if (!d) return null;
                                  return (
                                    <span style={{
                                      fontSize: 10, fontWeight: 700,
                                      background: d.bg, color: d.color,
                                      border: `1px solid ${d.color}44`,
                                      borderRadius: 4, padding: "2px 5px",
                                      display: "inline-block", whiteSpace: "nowrap",
                                    }}>
                                      {d.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            {showHsnSacColumn && (
                              <td style={{ ...lineItemCellBase }}>
                                <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: "#374151" }}>
                                  {isDesignOnly ? <span style={{ color: "#d1d5db" }}>—</span> : (extractTaxGroupCode(item) || <span style={{ color: "#d1d5db" }}>—</span>)}
                                </span>
                              </td>
                            )}
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              {isDesignOnly ? (
                                <span style={{ color: "#d1d5db" }}>—</span>
                              ) : (
                                <input
                                  type="number" min="1"
                                  disabled={isViewOnly}
                                  style={inBase}
                                  value={getEditVal(editingPrices, item.id, "quantity", item)}
                                  onChange={e => {
                                    setEditingPrices(prev => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], quantity: e.target.value },
                                    }));
                                    applyEdit(item.id, "quantity", e.target.value, setLineItems, setEditingPrices, {
                                      isTamilNadu,
                                      defaultGstPct: parseNonNegativeNumber(gstPct, 0),
                                      defaultGstMasterId,
                                    });
                                  }}
                                  onFocus={e => e.target.select()}
                                />
                              )}
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              {isDesignOnly ? (
                                <span style={{ color: "#d1d5db" }}>—</span>
                              ) : (
                                <input
                                  type="number" min="0" step="0.01"
                                  disabled={isViewOnly}
                                  style={noSlabWarning && !getEditVal(editingPrices, item.id, "unitPrice", item)
                                    ? inWarn : inBase}
                                  value={getEditVal(editingPrices, item.id, "unitPrice", item)}
                                  onChange={e => {
                                    setEditingPrices(prev => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], unitPrice: e.target.value },
                                    }));
                                    applyEdit(item.id, "unitPrice", e.target.value, setLineItems, setEditingPrices, {
                                      isTamilNadu,
                                      defaultGstPct: parseNonNegativeNumber(gstPct, 0),
                                      defaultGstMasterId,
                                    });
                                  }}
                                  onFocus={e => e.target.select()}
                                  placeholder="₹"
                                />
                              )}
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              {isDesignOnly ? (
                                <span style={{ color: "#d1d5db" }}>—</span>
                              ) : (
                                <input
                                  type="number" min="0" step="0.01"
                                  disabled={isViewOnly}
                                  style={inBase}
                                  value={getEditVal(editingPrices, item.id, "discountPct", item)}
                                  onChange={e => {
                                    setEditingPrices(prev => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], discountPct: e.target.value },
                                    }));
                                    applyEdit(
                                      item.id,
                                      "discountPct",
                                      e.target.value,
                                      setLineItems,
                                      setEditingPrices,
                                      { isTamilNadu, defaultGstPct: parseNonNegativeNumber(gstPct, 0), defaultGstMasterId }
                                    );
                                  }}
                                  onFocus={e => e.target.select()}
                                />
                              )}
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              {isDesignOnly ? (
                                <span style={{ color: "#d1d5db" }}>—</span>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <select
                                      className="qp-field-input"
                                      style={{
                                        ...inBase,
                                        flex: 1,
                                        minWidth: 0,
                                        textAlign: "left",
                                        appearance: "auto",
                                        fontFamily: "'DM Sans', sans-serif",
                                        padding: "5px 7px",
                                      }}
                                      value={item.gstMasterId ? String(item.gstMasterId) : ""}
                                      onChange={(e) => handleLineItemGstMasterChange(item.id, e.target.value)}
                                      disabled={gstMastersLoading || isViewOnly}
                                    >
                                      <option value="">{gstMastersLoading ? "Loading..." : "Select GST master"}</option>
                                      {gstMasters.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          GST {Number(option.taxPercent || 0)}%
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      className="qp-item-btn"
                                      disabled={isViewOnly}
                                      onClick={() => handleOpenGstAddPopup({
                                        mode: "line-item",
                                        itemId: item.id,
                                        prefillPercent: Number(item.gstPct ?? 0),
                                      })}
                                      title="Add GST master for this product"
                                    >
                                      <i className="ti ti-plus" style={{ fontSize: 13 }} />
                                    </button>
                                  </div>
                                  <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>
                                    GST {Number(item.gstPct ?? 0).toFixed(2)}%
                                  </span>
                                </div>
                              )}
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                                <span style={{
                                  fontSize: 13, fontWeight: 700,
                                  fontFamily: "'DM Mono', monospace",
                                  color: isUnpriced ? "#dc2626" : "#0f172a",
                                }}>
                                  ₹{Number(item.lineTotal || 0).toFixed(2)}
                                </span>
                                <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'DM Mono', monospace" }}>
                                  Base ₹{Number(item.baseAmount || 0).toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className="qp-item-btn"
                                  onClick={() => openAddModal(item)}
                                  disabled={isViewOnly}
                                  title="Edit"
                                >
                                  <i className="ti ti-edit" style={{ fontSize: 13 }} />
                                </button>
                                <button
                                  type="button"
                                  className="qp-item-btn danger"
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={isViewOnly}
                                  title="Remove"
                                >
                                  <i className="ti ti-trash" style={{ fontSize: 13 }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    });
                  })()}
                  {includeDesignFee && (
                    <tr style={{ background: "#faf5ff" }}>
                      <td style={{ ...lineItemCellBase, textAlign: "center" }}>
                        <span style={{ fontSize: 12, color: "#7c3aed", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                          {lineItems.length + 1}
                        </span>
                      </td>
                      <td style={{ ...lineItemCellBase }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>
                          Design Fee
                        </div>
                        {Number(designFeePricing.discountAmount || 0) > 0 && (
                          <div style={{
                            fontSize: 11,
                            color: "#059669",
                            marginTop: 3,
                            lineHeight: 1.4,
                            fontFamily: "'DM Mono', monospace",
                            wordBreak: "break-word",
                            fontWeight: 600,
                          }}>
                            Discounted Amount: ₹{Number(designFeePricing.discountAmount || 0).toFixed(2)}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          One-time design charge
                        </div>
                      </td>
                      {showHsnSacColumn && (
                        <td style={{ ...lineItemCellBase, textAlign: "left" }}>
                          <span style={{ fontSize: 12, color: "#d1d5db", fontFamily: "'DM Mono', monospace" }}>
                            —
                          </span>
                        </td>
                      )}
                      <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed", fontFamily: "'DM Mono', monospace" }}>
                          1
                        </span>
                      </td>
                      <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                        <input
                          type="number" min="0" step="0.01"
                          disabled={!canEditQuotation}
                          style={{
                            border: "1.5px solid #ddd6fe",
                            borderRadius: 6, padding: "5px 7px",
                            fontSize: 13, fontFamily: "'DM Mono', monospace",
                            background: "#faf5ff", color: "#7c3aed",
                            fontWeight: 600, outline: "none",
                            width: "100%", textAlign: "right",
                          }}
                          value={designFeeAmount}
                          onChange={e => setDesignFeeAmount(e.target.value)}
                          onFocus={e => e.target.select()}
                          placeholder="? fee"
                        />
                      </td>
                      <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                        <input
                          type="number" min="0" step="0.01"
                          disabled={!canEditQuotation}
                          style={{
                            border: "1.5px solid #ddd6fe",
                            borderRadius: 6, padding: "5px 7px",
                            fontSize: 13, fontFamily: "'DM Mono', monospace",
                            background: "#faf5ff", color: "#7c3aed",
                            fontWeight: 600, outline: "none",
                            width: "100%", textAlign: "right",
                          }}
                          value={designFeeDiscountPct}
                          onChange={e => setDesignFeeDiscountPct(e.target.value)}
                          onFocus={e => e.target.select()}
                          placeholder="0"
                        />
                      </td>
                      <td style={{ ...lineItemCellBase, textAlign: "left" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <select
                              disabled={gstMastersLoading || !canEditQuotation}
                              style={{
                                border: "1.5px solid #ddd6fe",
                                borderRadius: 6, padding: "5px 7px",
                                fontSize: 13, fontFamily: "'DM Mono', monospace",
                                background: "#faf5ff", color: "#7c3aed",
                                fontWeight: 600, outline: "none",
                                flex: 1, minWidth: 0, textAlign: "left",
                                appearance: "auto",
                              }}
                              value={designFeeGstMasterId ? String(designFeeGstMasterId) : ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDesignFeeGstMasterId(val);
                                const selectedMaster = gstMasters.find((item) => String(item.id) === String(val));
                                setDesignFeeGstPct(String(selectedMaster?.taxPercent ?? 0));
                              }}
                            >
                              <option value="">{gstMastersLoading ? "Loading..." : "Select GST master"}</option>
                              {gstMasters.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.taxName
                                    ? `GST ${Number(option.taxPercent || 0)}%`
                                    : `GST ${Number(option.taxPercent || 0)}%`}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="qp-item-btn"
                              disabled={!canEditQuotation}
                              onClick={() => handleOpenGstAddPopup({
                                mode: "design-fee",
                                prefillPercent: Number(designFeeGstPct || 0),
                              })}
                              title="Add GST master for design fee"
                            >
                              <i className="ti ti-plus" style={{ fontSize: 13 }} />
                            </button>
                          </div>
                          <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>
                            GST {Number(designFeeGstPct ?? 0).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ ...lineItemCellBase, textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#7c3aed" }}>
                          ₹{designFeePricing.lineTotal.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ ...lineItemCellBase }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

                {/* ── Tax & Totals ── */}
        <div className="qp-card">
          <div className="qp-card-label">Tax &amp; summary</div>
          <div style={{ marginTop: 14, overflowX: "auto" }}>
            <table style={{
              width: "100%",
              minWidth: isTamilNadu ? 760 : 540,
              borderCollapse: "collapse",
              tableLayout: "fixed",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <colgroup>
                <col style={{ width: isTamilNadu ? 180 : 190 }} />
                <col style={{ width: 98 }} />
                {isTamilNadu ? (
                  <>
                    <col style={{ width: 70 }} />
                    <col style={{ width: 98 }} />
                    <col style={{ width: 92 }} />
                    <col style={{ width: 98 }} />
                    <col style={{ width: 108 }} />
                  </>
                ) : (
                  <>
                    <col style={{ width: 72 }} />
                    <col style={{ width: 102 }} />
                    <col style={{ width: 114 }} />
                  </>
                )}
              </colgroup>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ ...taxHeadCell, textAlign: "left" }}>{taxSummary.hasHsnCodes ? "HSN/SAC" : "Products"}</th>
                  <th style={{ ...taxHeadCell, textAlign: "right" }}>Taxable Value</th>
                  {isTamilNadu ? (
                    <>
                      <th style={{ ...taxHeadCell, textAlign: "right" }}>CGST %</th>
                      <th style={{ ...taxHeadCell, textAlign: "right" }}>CGST Amt</th>
                      <th style={{ ...taxHeadCell, textAlign: "right" }}>SGST/UTGST %</th>
                      <th style={{ ...taxHeadCell, textAlign: "right" }}>SGST/UTGST Amt</th>
                      <th style={{ ...taxHeadCell, textAlign: "right" }}>Tax Amount</th>
                    </>
                  ) : (
                    <>
                      <th style={{ ...taxHeadCell, textAlign: "right" }}>IGST %</th>
                      <th style={{ ...taxHeadCell, textAlign: "right" }}>IGST Amt</th>
                      <th style={{ ...taxHeadCell, textAlign: "right" }}>Tax Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {taxSummary.rows.length === 0 ? (
                  <tr>
                    <td colSpan={isTamilNadu ? 7 : 5} style={{
                      ...taxCellBase,
                      textAlign: "center",
                      color: "#9ca3af",
                    }}>
                      No taxable product rows yet.
                    </td>
                  </tr>
                ) : (
                  <>
                    {taxSummary.rows.map((row) => (
                      <tr key={`gst-row-${row.gstPct}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ ...taxCellBase, textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                            {row.displayText || row.serialText || row.primaryText}
                          </div>
                        </td>
                        <td style={{ ...taxCellBase, textAlign: "right" }}>₹{row.taxableAmount.toFixed(2)}</td>
                        {isTamilNadu ? (
                          <>
                            <td style={{ ...taxCellBase, textAlign: "right" }}>{row.cgstRate.toFixed(2)}%</td>
                            <td style={{ ...taxCellBase, textAlign: "right" }}>₹{row.cgstAmount.toFixed(2)}</td>
                            <td style={{ ...taxCellBase, textAlign: "right" }}>{row.sgstRate.toFixed(2)}%</td>
                            <td style={{ ...taxCellBase, textAlign: "right" }}>₹{row.sgstAmount.toFixed(2)}</td>
                            <td style={{ ...taxCellBase, textAlign: "right" }}>₹{row.taxTotalAmount.toFixed(2)}</td>
                          </>
                        ) : (
                          <>
                            <td style={{ ...taxCellBase, textAlign: "right" }}>{row.igstRate.toFixed(2)}%</td>
                            <td style={{ ...taxCellBase, textAlign: "right" }}>₹{row.igstAmount.toFixed(2)}</td>
                            <td style={{ ...taxCellBase, textAlign: "right" }}>₹{row.taxTotalAmount.toFixed(2)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid #d1d5db", background: "#fafafa" }}>
                      <td style={{ ...taxCellBase, fontWeight: 700 }}>Total</td>
                      <td style={{ ...taxCellBase, textAlign: "right", fontWeight: 700 }}>₹{taxSummary.productTaxableAmount.toFixed(2)}</td>
                      {isTamilNadu ? (
                        <>
                          <td style={{ ...taxCellBase }} />
                          <td style={{ ...taxCellBase, textAlign: "right", fontWeight: 700 }}>₹{taxSummary.totalCgstAmount.toFixed(2)}</td>
                          <td style={{ ...taxCellBase }} />
                          <td style={{ ...taxCellBase, textAlign: "right", fontWeight: 700 }}>₹{taxSummary.totalSgstAmount.toFixed(2)}</td>
                          <td style={{ ...taxCellBase, textAlign: "right", fontWeight: 700 }}>₹{taxSummary.productTaxAmount.toFixed(2)}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ ...taxCellBase }} />
                          <td style={{ ...taxCellBase, textAlign: "right", fontWeight: 700 }}>₹{taxSummary.totalIgstAmount.toFixed(2)}</td>
                          <td style={{ ...taxCellBase, textAlign: "right", fontWeight: 700 }}>₹{taxSummary.productTaxAmount.toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="qp-totals-block">
            <div className="qp-total-line">
              <div className="qp-total-label">Subtotal</div>
              <div className="qp-total-value"><span className="rupee-symbol">₹</span>{subtotal.toFixed(2)}</div>
            </div>
            <div className="qp-total-line discount">
              <div className="qp-total-label">Discount Amount</div>
              <div className="qp-total-value">−<span className="rupee-symbol">₹</span>{discountAmt.toFixed(2)}</div>
            </div>
            <div className="qp-total-line">
              <div className="qp-total-label">GST total</div>
              <div className="qp-total-value">+<span className="rupee-symbol">₹</span>{taxAmt.toFixed(2)}</div>
            </div>
            {isTamilNadu ? (
              <>
                <div className="qp-total-line">
                  <div className="qp-total-label">CGST</div>
                  <div className="qp-total-value">+<span className="rupee-symbol">₹</span>{cgstAmt.toFixed(2)}</div>
                </div>
                <div className="qp-total-line">
                  <div className="qp-total-label">SGST</div>
                  <div className="qp-total-value">+<span className="rupee-symbol">₹</span>{sgstAmt.toFixed(2)}</div>
                </div>
              </>
            ) : (
              <div className="qp-total-line">
                <div className="qp-total-label">IGST</div>
                <div className="qp-total-value">+<span className="rupee-symbol">₹</span>{igstAmt.toFixed(2)}</div>
              </div>
            )}
            <div className="qp-total-line grand">
              <div className="qp-total-label">Grand total</div>
              <div className="qp-total-value"><span className="rupee-symbol">₹</span>{grandTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* ── Actions bar ── */}
        <div className="qp-actions-bar">
          <div>
            <div className="qp-actions-bar-left">Grand total</div>
            <div className="qp-actions-bar-amount"><span className="rupee-symbol">₹</span>{grandTotal.toFixed(2)}</div>
          </div>
          <div className="qp-actions-bar-btns">
            {canApproveCurrentQuotation && (
              <button
                type="button"
                className="qp-btn-approve"
                onClick={openApproveDialog}
              >
                <i className="ti ti-circle-check" style={{ fontSize: 14 }} />
                Approve
              </button>
            )}
            <button
              type="button"
              className="qp-btn-save"
              onClick={handleSaveQuotation}
              disabled={!canEditQuotation || isSaving}
            >
              <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />
              {isViewOnly ? "View Only" : isSaving ? "Saving..." : "Save Quotation"}
            </button>
          </div>
        </div>

      </fieldset>

      {/* ── Add GST popup ── */}
      {gstAddPopupOpen && (
        <div className="qp-modal-overlay" onClick={() => setGstAddPopupOpen(false)}>
          <div className="qp-gst-popup" onClick={(e) => e.stopPropagation()}>
            <div className="qp-modal-title">Add GST</div>
            <input
              className="qp-field-input"
              type="number"
              min="0"
              placeholder="Enter GST %"
              value={gstAddPercent}
              onChange={(e) => setGstAddPercent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNewGst()}
              autoFocus
            />
            {gstAddError && <div className="qp-field-error">{gstAddError}</div>}
            <div className="qp-gst-popup-actions">
              <button type="button" className="qp-btn-ghost" onClick={() => setGstAddPopupOpen(false)} disabled={gstAddSaving}>
                Cancel
              </button>
              <button type="button" className="qp-btn-primary" onClick={handleSaveNewGst} disabled={gstAddSaving}>
                {gstAddSaving ? "Saving…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AddItemModal — unchanged ── */}
      <AddItemModal
        open={addModalOpen}
        priceList={priceList}
        prefill={editingItem}
        leadId={resolvedLeadId}
        onRequirementSaved={() => {
          if (resolvedLeadId) {
            getRequirementsByLeadId(resolvedLeadId).then(setRequirements);
          }
        }}
        onConfirm={(lineItem) => {
          const normalizedLineItem = normalizeLineItem(lineItem, {
            isTamilNadu,
            defaultDiscountPct: 0,
            defaultGstPct: parseNonNegativeNumber(gstPct, 0),
            defaultGstMasterId: editingItem?.gstMasterId ?? defaultGstMasterId,
          });
          if (editingItem?.id) {
            setLineItems((prev) => prev.map((i) => (i.id === editingItem.id ? normalizedLineItem : i)));
          } else {
            setLineItems((prev) => [...prev, normalizedLineItem]);
          }
          closeAddModal();
        }}
        onClose={closeAddModal}
      />

      {/* ── Approve dialog ── */}
      {approveDialogOpen && (
        <div className="qp-modal-overlay">
          <div className="qp-modal">
            <div className="qp-modal-title">Approve Quotation</div>
            <div className="qp-field-label" style={{ marginBottom: 6 }}>
              Approval notes (optional)
            </div>
            <textarea
              className="qp-field-input"
              rows={4}
              style={{ resize: "none" }}
              value={approveDialogNotes}
              onChange={(e) => setApproveDialogNotes(e.target.value)}
              placeholder="Add notes..."
            />
            <div className="qp-modal-actions">
              <button
                type="button"
                className="qp-btn-ghost"
                onClick={() => setApproveDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="qp-btn-primary"
                onClick={() => handleApproveFromEdit(approveDialogNotes)}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Unfilled Prices warning popup ── */}
      {unfilledPricesPopupOpen && (
        <div className="qp-modal-overlay">
          <div className="qp-modal" style={{ maxWidth: 450 }}>
            <div className="qp-modal-title" style={{ color: "#ef4444" }}>Unfilled Prices Warning</div>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 16, lineHeight: "1.5" }}>
              Price is not filled for these products: <strong>{unfilledPricesList.join(", ")}</strong>.<br />
              These items will <strong>not</strong> reflect on the quotation PDF.
            </div>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 20 }}>
              Do you want to continue anyway?
            </div>
            <div className="qp-modal-actions">
              <button
                type="button"
                className="qp-btn-ghost"
                onClick={() => setUnfilledPricesPopupOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="qp-btn-primary"
                style={{ background: "#ef4444", borderColor: "#ef4444", color: "#ffffff" }}
                onClick={() => {
                  setUnfilledPricesPopupOpen(false);
                  executeSaveQuotation();
                }}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


