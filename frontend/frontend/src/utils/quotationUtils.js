import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getCustomSizeSummary } from "./customSizeUtils";

function fullSpecsSummary(specs) {
  const raw = typeof specs === "string"
    ? (() => { try { return JSON.parse(specs); } catch { return {}; } })()
    : (specs || {});

  const skip = new Set([
    "customWidth",
    "customHeight",
    "customDepth",
    "customUnit",
    "customDimensions",
    ...Object.keys(raw).filter((key) => key.startsWith("customSize_")),
  ]);

  const entries = Object.entries(raw)
    .filter(([key, value]) =>
      !key.endsWith("Custom") &&
      !key.endsWith("Text") &&
      !skip.has(key) &&
      value !== "" &&
      value != null
    )
    .map(([key, value]) => {
      if (value === "Custom") {
        if (key === "size") {
          const summary = getCustomSizeSummary({ customDimensions: raw.customDimensions }, raw);
          if (summary) return summary;
        }
        return raw[`${key}Custom`] || null;
      }

      const stringValue = String(value).trim();
      return !stringValue || stringValue === "0" ? null : stringValue;
    })
    .filter(Boolean);

  return entries.join(" · ");
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

export const QUOTATION_STORAGE_KEY = "svl_quotations";
export const QUOTATION_DRAFT_STORAGE_KEY = "svl_quotation_draft";
export const QUOTATION_STATUS_DRAFT = "DRAFT";
export const QUOTATION_STATUS_VERIFICATION_PENDING = "VERIFICATION_PENDING";
export const QUOTATION_STATUS_APPROVED = "APPROVED";
export const QUOTATION_STATUS_SENT = "QUOTATION_SENT";
export const QUOTATION_STATUS_NEGOTIATING = "NEGOTIATING";
export const QUOTATION_STATUS_REJECTED = "QUOTATION_REJECTED";
export const QUOTATION_STATUS_ACCEPTED = "QUOTATION_ACCEPTED";

export function sanitizeFilenamePart(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function numberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n) {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ` ${ones[n % 10]}` : "");
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred${n % 100 !== 0 ? ` ${convert(n % 100)}` : ""}`;
    if (n < 100000) return `${convert(Math.floor(n / 1000))} Thousand${n % 1000 !== 0 ? ` ${convert(n % 1000)}` : ""}`;
    if (n < 10000000) return `${convert(Math.floor(n / 100000))} Lakh${n % 100000 !== 0 ? ` ${convert(n % 100000)}` : ""}`;
    return `${convert(Math.floor(n / 10000000))} Crore${n % 10000000 !== 0 ? ` ${convert(n % 10000000)}` : ""}`;
  }

  return convert(num) || "Zero";
}

function amountToWords(amount, { includePaise = false } = {}) {
  const numericAmount = Number(amount || 0);
  const absoluteAmount = Math.abs(numericAmount);
  const rupees = Math.floor(absoluteAmount);
  const paise = Math.round((absoluteAmount - rupees) * 100);
  const rupeeWords = numberToWords(rupees);
  const rupeeLabel = rupees === 1 ? "Rupee" : "Rupees";
  const paiseWords = paise > 0 ? `${numberToWords(paise)} Paise` : "";
  const signPrefix = numericAmount < 0 ? "Minus " : "";

  if (includePaise) {
    return `${signPrefix}${rupeeWords} ${rupeeLabel}${paiseWords ? ` and ${paiseWords}` : ""} Only`;
  }

  return `${signPrefix}${rupeeWords} ${rupeeLabel} Only`;
}

function readLocalStorageJson(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorageJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function clampNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function scalePercent(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export function normalizeQuotationLineItem(item, options = {}) {
  if (!item) return {};
  const {
    isTamilNadu = false,
    defaultDiscountPct = 0,
    defaultGstPct = 0,
    defaultGstMasterId = null,
    preferFallbackWhenZero = false,
  } = options;

  const designStatus = String(item.designStatus || "").toLowerCase();
  const isDesignOnly = designStatus === "design_only";
  const quantity = isDesignOnly ? 0 : clampNonNegativeNumber(item.quantity, 0);
  const unitPrice = isDesignOnly ? 0 : clampNonNegativeNumber(item.unitPrice ?? item.pricePerUnit, 0);
  const rawDiscountPct = item.discountPct ?? item.discountPercent;
  const rawGstPct = item.gstPct ?? item.gstPercent ?? item.gstPctTotal;
  const gstMasterId = item.gstMasterId ?? item.gstMaster?.id ?? defaultGstMasterId ?? null;
  const discountPct = isDesignOnly
    ? 0
    : scalePercent(
        rawDiscountPct == null || (preferFallbackWhenZero && Number(rawDiscountPct) === 0 && Number(defaultDiscountPct) > 0)
          ? defaultDiscountPct
          : rawDiscountPct,
        0,
      );
  const gstPct = isDesignOnly
    ? 0
    : scalePercent(
        rawGstPct == null || (preferFallbackWhenZero && Number(rawGstPct) === 0 && Number(defaultGstPct) > 0)
          ? defaultGstPct
          : rawGstPct,
        0,
      );
  const baseAmount = quantity * unitPrice;
  const discountAmount = baseAmount * (discountPct / 100);
  const taxableAmount = Math.max(0, baseAmount - discountAmount);
  const gstAmount = taxableAmount * (gstPct / 100);
  const cgstAmount = isTamilNadu ? gstAmount / 2 : 0;
  const sgstAmount = isTamilNadu ? gstAmount / 2 : 0;
  const igstAmount = isTamilNadu ? 0 : gstAmount;
  const lineTotal = taxableAmount + gstAmount;

  return {
    ...item,
    quantity,
    unitPrice,
    pricePerUnit: unitPrice,
    gstMasterId,
    discountPct,
    discountPercent: discountPct,
    gstPct,
    gstPercent: gstPct,
    baseAmount,
    discountAmount,
    taxableAmount,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    lineTotal,
    pricingStatus: lineTotal > 0 ? "PRICED" : "UNPRICED",
  };
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function resolveLegacyCompatibleDesignFeeGstPct(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Number(fallback || 0);
  }
  return parsed;
}

export function buildDesignFeePricing(options = {}) {
  const {
    includeDesignFee = false,
    designFeeAmount = 0,
    designFeeDiscountPct = 0,
    designFeeGstPct = 0,
    isTamilNadu = false,
  } = options;

  if (!includeDesignFee) {
    return {
      includeDesignFee: false,
      baseAmount: 0,
      discountPct: 0,
      discountAmount: 0,
      taxableAmount: 0,
      gstPct: 0,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      lineTotal: 0,
    };
  }

  const baseAmount = roundMoney(Number(designFeeAmount || 0));
  const discountPct = roundMoney(Number(designFeeDiscountPct || 0));
  const discountAmount = roundMoney(baseAmount * (discountPct / 100));
  const taxableAmount = roundMoney(Math.max(0, baseAmount - discountAmount));
  const gstPct = roundMoney(Number(designFeeGstPct || 0));
  const gstAmount = roundMoney(taxableAmount * (gstPct / 100));
  const cgstAmount = isTamilNadu ? roundMoney(gstAmount / 2) : 0;
  const sgstAmount = isTamilNadu ? roundMoney(gstAmount / 2) : 0;
  const igstAmount = isTamilNadu ? 0 : gstAmount;
  const lineTotal = roundMoney(taxableAmount + gstAmount);

  return {
    includeDesignFee: true,
    baseAmount,
    discountPct,
    discountAmount,
    taxableAmount,
    gstPct,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    lineTotal,
  };
}

export function extractTaxGroupCode(item) {
  // Parse specs — may arrive as:
  //   • a plain object  (from AddItemModal → live UI line items)
  //   • a JSON string   (item.specs from backend response)
  //   • absent, with item.specsJson holding the string (PDF payload path via createQuotationPayload)
  const specs = (() => {
    if (item?.specs && typeof item.specs === "object") return item.specs;
    const raw = item?.specs || item?.specsJson || item?.variantFields;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  })();

  const candidates = [
    // Product Field Config stores the value under the configured key (snake_case)
    specs?.hsn_sac,
    specs?.hsn,
    specs?.hsnSac,
    specs?.sac,
    specs?.sacCode,
    specs?.hsnCode,
    specs?.hsnSacCode,
    // Top-level properties — kept for backward compatibility with older saved quotations
    item?.hsnSac,
    item?.hsnSacCode,
    item?.hsnCode,
    item?.hsn,
    item?.sacCode,
    item?.sac,
    item?.productHsn,
    item?.productSac,
    item?.hsnSacNumber,
  ];

  const match = candidates.find((value) => String(value || "").trim() !== "");
  return match == null ? "" : String(match).trim();
}

function summarizeTaxGroupItem(item) {
  const productName = String(item?.productName || "").trim();
  const variantSummary = String(item?.variantSummary || item?.specsSummary || "").trim();
  const specSummary = String(item?.specsSummary || "").trim();
  const tail = variantSummary || specSummary;

  if (productName && tail) {
    return `${productName} - ${tail}`;
  }
  return productName || tail || "";
}

export function buildQuotationTaxSummary(lineItems = [], options = {}) {
  const {
    isTamilNadu = false,
    designFeeAmount = 0,
    designFeeDiscountPct = 0,
    designFeeGstPct = 0,
    includeDesignFee = false,
  } = options;

  const groupsByRate = new Map();
  let productSerial = 0;
  const addGroupEntry = ({
    key,
    gstPct,
    taxableAmount,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    code = "",
    label = "",
    displayPart = "",
  }) => {
    const existing = groupsByRate.get(key) || {
      gstPct,
      taxableAmount: 0,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      codes: new Set(),
      items: [],
      displayParts: [],
    };

    existing.taxableAmount = roundMoney(existing.taxableAmount + taxableAmount);
    existing.gstAmount = roundMoney(existing.gstAmount + gstAmount);
    existing.cgstAmount = roundMoney(existing.cgstAmount + cgstAmount);
    existing.sgstAmount = roundMoney(existing.sgstAmount + sgstAmount);
    existing.igstAmount = roundMoney(existing.igstAmount + igstAmount);
    if (code) existing.codes.add(code);
    if (label) existing.items.push(label);
    if (displayPart) existing.displayParts.push(displayPart);
    groupsByRate.set(key, existing);
  };

  (Array.isArray(lineItems) ? lineItems : []).forEach((item, index) => {
    if (!item) return;
    const isDesignOnly = String(item.designStatus || "").toLowerCase() === "design_only";
    const specs = (() => {
      if (item.specs && typeof item.specs === "object") return item.specs;
      const raw = item.specs || item.specsJson || item.variantFields;
      if (!raw) return {};
      if (typeof raw === "object") return raw;
      try { return JSON.parse(raw); } catch { return {}; }
    })();
    const isAddCharge = specs?.isAdditionalCharge || item.isAdditionalCharge || false;
    
    if (isDesignOnly) return;
    
    const itemSerialNum = index + 1;
    const gstPct = roundMoney(item.gstPct ?? item.gstPercent ?? 0);
    const key = gstPct.toFixed(2);
    const taxableAmount = roundMoney(
      item.taxableAmount ??
      (Number(item.baseAmount || 0) - Number(item.discountAmount || 0))
    );
    const gstAmount = roundMoney(item.gstAmount ?? taxableAmount * (gstPct / 100));
    const cgstAmount = isTamilNadu ? roundMoney(item.cgstAmount ?? gstAmount / 2) : 0;
    const sgstAmount = isTamilNadu ? roundMoney(item.sgstAmount ?? gstAmount / 2) : 0;
    const igstAmount = isTamilNadu ? 0 : roundMoney(item.igstAmount ?? gstAmount);
    const code = isAddCharge ? "" : extractTaxGroupCode(item);
    const label = isAddCharge ? item.productName : summarizeTaxGroupItem(item);

    addGroupEntry({
      key,
      gstPct,
      taxableAmount,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      code,
      label,
      displayPart: String(itemSerialNum),
    });
  });

  const designFeePricing = buildDesignFeePricing({
    includeDesignFee,
    designFeeAmount,
    designFeeDiscountPct,
    designFeeGstPct,
    isTamilNadu,
  });

  if (designFeePricing.includeDesignFee && designFeePricing.taxableAmount > 0) {
    productSerial += 1;
    const key = designFeePricing.gstPct.toFixed(2);
    addGroupEntry({
      key,
      gstPct: designFeePricing.gstPct,
      taxableAmount: designFeePricing.taxableAmount,
      gstAmount: designFeePricing.gstAmount,
      cgstAmount: designFeePricing.cgstAmount,
      sgstAmount: designFeePricing.sgstAmount,
      igstAmount: designFeePricing.igstAmount,
      label: "Design Fee",
      displayPart: String(productSerial),
    });
  }

  const rows = Array.from(groupsByRate.values())
    .sort((a, b) => a.gstPct - b.gstPct)
    .map((group) => {
      const codes = Array.from(group.codes);
      const itemLabels = Array.from(new Set(group.items.filter(Boolean)));
      const codeText = codes.length ? codes.join(", ") : `GST ${group.gstPct.toFixed(2)}%`;
      const displayParts = Array.from(new Set(group.displayParts.filter(Boolean)));
      const serialText = displayParts.join(", ");
      const displayText = codes.length ? codes.join(", ") : serialText;
      return {
        gstPct: roundMoney(group.gstPct),
        taxableAmount: roundMoney(group.taxableAmount),
        gstAmount: roundMoney(group.gstAmount),
        cgstRate: isTamilNadu ? roundMoney(group.gstPct / 2) : 0,
        cgstAmount: roundMoney(group.cgstAmount),
        sgstRate: isTamilNadu ? roundMoney(group.gstPct / 2) : 0,
        sgstAmount: roundMoney(group.sgstAmount),
        igstRate: isTamilNadu ? 0 : roundMoney(group.gstPct),
        igstAmount: roundMoney(group.igstAmount),
        taxTotalAmount: roundMoney(group.gstAmount),
        primaryText: codeText,
        secondaryText: codes.length ? "" : itemLabels.join("\n"),
        itemLabels,
        codes,
        serialText,
        displayText,
      };
    });

  // True when at least one row carries an HSN/SAC code — used to
  // switch the first column label from "Products" to "HSN/SAC".
  const hasHsnCodes = rows.some((row) => row.codes.length > 0);

  const productTaxableAmount = rows.reduce((sum, row) => sum + Number(row.taxableAmount || 0), 0);
  const productTaxAmount = rows.reduce((sum, row) => sum + Number(row.gstAmount || 0), 0);
  const productCgstAmount = rows.reduce((sum, row) => sum + Number(row.cgstAmount || 0), 0);
  const productSgstAmount = rows.reduce((sum, row) => sum + Number(row.sgstAmount || 0), 0);
  const productIgstAmount = rows.reduce((sum, row) => sum + Number(row.igstAmount || 0), 0);

  const designFeeTaxAmount = designFeePricing.gstAmount;
  const designFeeCgstAmount = designFeePricing.cgstAmount;
  const designFeeSgstAmount = designFeePricing.sgstAmount;
  const designFeeIgstAmount = designFeePricing.igstAmount;

  const totalTaxAmount = roundMoney(productTaxAmount);
  const totalCgstAmount = roundMoney(productCgstAmount);
  const totalSgstAmount = roundMoney(productSgstAmount);
  const totalIgstAmount = roundMoney(productIgstAmount);

  return {
    rows,
    hasHsnCodes,
    productTaxableAmount,
    productTaxAmount,
    productCgstAmount,
    productSgstAmount,
    productIgstAmount,
    designFeeTaxAmount,
    designFeeCgstAmount,
    designFeeSgstAmount,
    designFeeIgstAmount,
    designFeePricing,
    totalTaxAmount,
    totalCgstAmount,
    totalSgstAmount,
    totalIgstAmount,
  };
}

function formatIndianMobileNumber(value) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  return `+91 ${digits}`;
}

export function getStoredQuotations() {
  const stored = readLocalStorageJson(QUOTATION_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

export function saveStoredQuotations(quotations) {
  writeLocalStorageJson(QUOTATION_STORAGE_KEY, quotations);
}

export function upsertStoredQuotation(quotation) {
  const quotations = getStoredQuotations();
  const existingIndex = quotations.findIndex((item) => item.id === quotation.id);

  if (existingIndex >= 0) {
    quotations[existingIndex] = quotation;
  } else {
    quotations.unshift(quotation);
  }

  saveStoredQuotations(quotations);
  return quotation;
}

export function deleteStoredQuotation(quotationId) {
  const quotations = getStoredQuotations().filter((item) => item.id !== quotationId);
  saveStoredQuotations(quotations);
  return quotations;
}

export function getQuotationDraft() {
  return readLocalStorageJson(QUOTATION_DRAFT_STORAGE_KEY, null);
}

export function setQuotationDraft(draft) {
  writeLocalStorageJson(QUOTATION_DRAFT_STORAGE_KEY, draft);
}

export function clearQuotationDraft() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(QUOTATION_DRAFT_STORAGE_KEY);
  }
}

function normalizeQuotationResponseLineItem(item, options = {}) {
  if (!item) return {};
  // Parse specs from specsJson if specs object is not directly available
  let specs = item.specs;
  if (!specs && item.specsJson) {
    try { specs = JSON.parse(item.specsJson); } catch { specs = {}; }
  }
  return normalizeQuotationLineItem({
    ...item,
    id: item.id || `quotation-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    requirementId: item.requirementId ?? null,
    categoryId: item.categoryId ?? null,
    typeId: item.typeId ?? null,
    subtypeId: item.subtypeId ?? null,
    typeName: item.typeName || "",
    subtypeName: item.subtypeName || null,
    productName: item.productName || "",
    specsSummary: item.specsSummary || "",
    specsJson: item.specsJson || "",
    specs: specs || {},
    sortOrder: item.sortOrder ?? 0,
    designStatus: item.designStatus || "",
    pricingStatus: item.pricingStatus || "",
    priceListEntryId: item.priceListEntryId ?? null,
  }, options);
}

export function quotationResponseToDraft(quotation) {
  if (!quotation) return null;

  const selectedLead = quotation.selectedLead || (quotation.leadId || quotation.clientName
    ? {
        id: quotation.leadId ?? null,
        leadId: quotation.leadId ?? null,
        name: quotation.clientName || "",
        email: quotation.clientEmail || "",
        mobile: quotation.clientMobile || "",
        company: quotation.clientCompany || "",
        address: quotation.clientAddress || quotation.address || "",
        streetAddress: quotation.streetAddress || quotation.clientAddress || quotation.address || "",
        leadState: quotation.clientState || quotation.leadState || "",
        state: quotation.clientState || quotation.state || quotation.leadState || "",
      }
    : null);

  const gstRows = Array.isArray(quotation.gstRows)
    ? quotation.gstRows.map((row, index) => ({
        id: row.id || `gst-row-restored-${index}`,
        gstMasterId: row.gstMasterId || "",
        taxName: row.taxName || "",
        taxPercent: Number(row.taxPercent || 0),
      }))
    : [];

  const legacyDiscountPct = clampNonNegativeNumber(quotation.discountPercent ?? quotation.discountPct ?? 0, 0);
  const legacyGstPct = clampNonNegativeNumber(
    quotation.gstPct ?? quotation.gstPercent ?? quotation.gstPctTotal ?? (
      Array.isArray(gstRows) && gstRows.length > 0
        ? gstRows.reduce((sum, row) => sum + Number(row.taxPercent || 0), 0)
        : 0
    ),
    0,
  );
  const isTN = isTamilNaduState(selectedLead?.leadState || selectedLead?.state || quotation.clientState || quotation.leadState || "");
  const rawLineItems = Array.isArray(quotation.items)
    ? quotation.items
    : (Array.isArray(quotation.lineItems) ? quotation.lineItems : []);
  const shouldSeedLegacyItemTaxes =
    rawLineItems.length > 0 &&
    (legacyDiscountPct > 0 || legacyGstPct > 0) &&
    rawLineItems.every((item) =>
      Number(item?.discountPct ?? item?.discountPercent ?? 0) === 0 &&
      Number(item?.gstPct ?? item?.gstPercent ?? item?.gstPctTotal ?? 0) === 0
    );
  const lineItems = rawLineItems.map((item) => normalizeQuotationResponseLineItem(item, {
    isTamilNadu: isTN,
    defaultDiscountPct: legacyDiscountPct,
    defaultGstPct: legacyGstPct,
    preferFallbackWhenZero: shouldSeedLegacyItemTaxes,
  }));

  return {
    id: quotation.id || null,
    quotationNumber: quotation.quotationNumber || "",
    createdAt: quotation.createdAt || "",
    status: quotation.status || QUOTATION_STATUS_DRAFT,
    verificationRequestedAt: quotation.verificationRequestedAt || null,
    verificationRequestedById: quotation.verificationRequestedById || null,
    verificationRequestedByName: quotation.verificationRequestedByName || null,
    verificationRequestedByRole: quotation.verificationRequestedByRole || null,
    verificationRequestNotes: quotation.verificationRequestNotes || "",
    approvedAt: quotation.approvedAt || null,
    approvedById: quotation.approvedById || null,
    approvedByName: quotation.approvedByName || null,
    approvedByRole: quotation.approvedByRole || null,
    approvalNotes: quotation.approvalNotes || "",
    createdById: quotation.createdById || null,
    createdByName: quotation.createdByName || null,
    createdByEmail: quotation.createdByEmail || null,
    createdByRole: quotation.createdByRole || null,
    createdByTeam: quotation.createdByTeam || null,
    partyMode: quotation.partyMode || "lead",
    selectedLead,
    leadSearch: selectedLead ? `${selectedLead.leadId || selectedLead.id || ""} - ${selectedLead.name || ""}`.trim() : "",
    lineItems,
    discountPct: legacyDiscountPct,
    includeDesignFee: Boolean(quotation.includeDesignFee),
    designFeeAmount: Number(quotation.designFeeAmount ?? 0),
    designFeeDiscountPct: Number(quotation.designFeeDiscountPct ?? 0),
    designFeeGstPct: resolveLegacyCompatibleDesignFeeGstPct(quotation.designFeeGstPct, legacyGstPct),
    gstPct: legacyGstPct,
    gstRows,
  };
}

export function createQuotationPayload({
  id,
  quotationNumber,
  quotationDate,
  customerName,
  partyMode,
  selectedLead,
  lineItems,
  discountPct,
  includeDesignFee,
  designFeeAmount,
  designFeeDiscountPct,
  designFeeGstPct,
  gstRows,
  gstPct,
  cgstPct,
  sgstPct,
  igstPct,
  totals,
  status,
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
  createdBy,
  createdById,
  createdByName,
  createdByEmail,
  createdByRole,
  createdByTeam,
  createdAt,
}) {
  const now = new Date().toISOString();
  const resolvedId = id || `quotation-${Date.now()}`;
  const clientName = customerName || selectedLead?.name || "";
  const clientMobile = selectedLead?.mobile || selectedLead?.phone || "";
  const clientEmail = selectedLead?.email || "";
  const clientCompany = selectedLead?.company || selectedLead?.companyName || "";
  const clientAddress = String(selectedLead?.address || selectedLead?.streetAddress || "").trim();
  const clientState = String(selectedLead?.leadState || selectedLead?.state || "").trim();
  const clientGstin = selectedLead?.gstin || selectedLead?.gstinCode || "";
  const items = Array.isArray(lineItems)
    ? lineItems.map((item) => ({
        requirementId: item.requirementId ?? item.sourceRequirementId ?? null,
        productName: item.productName || "",
        specsSummary: item.specsSummary || item.variantSummary || "",
        specsJson: item.specsJson || JSON.stringify(item.specs || item.variantFields || {}),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice ?? item.pricePerUnit ?? 0),
        discountPct: Number(item.discountPct ?? item.discountPercent ?? 0),
        gstPct: Number(item.gstPct ?? item.gstPercent ?? 0),
        gstMasterId: item.gstMasterId ?? null,
      }))
    : [];

  return {
    id: resolvedId,
    leadId: selectedLead?.id ?? null,
    quotationNumber: quotationNumber || "DRAFT",
    quotationDate,
    customerName,
    clientName,
    clientMobile,
    clientEmail,
    clientCompany,
    clientAddress,
    streetAddress: clientAddress,
    clientState,
    leadState: clientState,
    clientGstin,
    partyMode,
    selectedLead,
    lineItems,
    items,
    discountPct,
    discountPercent: clampNonNegativeNumber(discountPct, 0),
    includeDesignFee: includeDesignFee || false,
    designFeeAmount: Number(designFeeAmount || 0),
    designFeeDiscountPct: Number(designFeeDiscountPct || 0),
    designFeeGstPct: Number(designFeeGstPct || 0),
    gstRows: Array.isArray(gstRows) ? gstRows : [],
    gstPct,
    gstPercent: gstPct,
    gstPctTotal: gstPct,
    cgstPct,
    sgstPct,
    igstPct,
    totals,
    status: status || QUOTATION_STATUS_DRAFT,
    verificationRequestedAt: verificationRequestedAt || null,
    verificationRequestedById: verificationRequestedById || null,
    verificationRequestedByName: verificationRequestedByName || null,
    verificationRequestedByRole: verificationRequestedByRole || null,
    verificationRequestNotes: verificationRequestNotes || "",
    approvedAt: approvedAt || null,
    approvedById: approvedById || null,
    approvedByName: approvedByName || null,
    approvedByRole: approvedByRole || null,
    approvalNotes: approvalNotes || "",
    createdBy: createdBy || null,
    createdById: createdById || null,
    createdByName: createdByName || null,
    createdByEmail: createdByEmail || null,
    createdByRole: createdByRole || null,
    createdByTeam: createdByTeam || null,
    updatedAt: now,
    createdAt: createdAt || now,
  };
}

function formatLeadState(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "tn" || normalized === "tamilnadu" || normalized.startsWith("tamilna")) {
    return "Tamil Nadu";
  }
  return raw.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function deriveStateCode(stateValue) {
  if (!stateValue) return "";
  const normalized = String(stateValue).trim().toUpperCase().replace(/[^A-Z]/g, "");
  const map = {
    TN: "33", TAMILNADU: "33", TAMILNASU: "33",
    KA: "29", KARNATAKA: "29",
    MH: "27", MAHARASHTRA: "27",
    DL: "07", DELHI: "07", NEWDELHI: "07",
    GJ: "24", GUJARAT: "24",
    RJ: "08", RAJASTHAN: "08",
    UP: "09", UTTARPRADESH: "09",
    WB: "19", WESTBENGAL: "19",
    AP: "37", ANDHRAPRADESH: "37",
    TS: "36", TELANGANA: "36",
    KL: "32", KERALA: "32",
    MP: "23", MADHYAPRADESH: "23",
    HR: "06", HARYANA: "06",
    PB: "03", PUNJAB: "03",
    OR: "21", ODISHA: "21",
  };
  return map[normalized] || "";
}

const STATE_NAMES = {
  ap: "Andhra Pradesh", andhra: "Andhra Pradesh",
  ar: "Arunachal Pradesh",
  as: "Assam",
  br: "Bihar",
  cg: "Chhattisgarh", chattisgarh: "Chhattisgarh",
  ga: "Goa",
  gj: "Gujarat", gujarat: "Gujarat",
  hr: "Haryana",
  hp: "Himachal Pradesh",
  jh: "Jharkhand",
  ka: "Karnataka", karnataka: "Karnataka",
  kl: "Kerala", kerala: "Kerala",
  mp: "Madhya Pradesh",
  mh: "Maharashtra", maharashtra: "Maharashtra",
  mn: "Manipur",
  ml: "Meghalaya",
  mz: "Mizoram",
  nl: "Nagaland",
  or: "Odisha", odisha: "Odisha",
  pb: "Punjab",
  rj: "Rajasthan", rajasthan: "Rajasthan",
  sk: "Sikkim",
  tn: "Tamil Nadu", tamilnadu: "Tamil Nadu", tamil: "Tamil Nadu",
  ts: "Telangana", telangana: "Telangana",
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

function expandStateName(raw) {
  if (!raw) return "";
  const key = raw.trim().toLowerCase().replace(/[^a-z]/g, "");
  return STATE_NAMES[key] || raw;
}

function asText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeQuotationLeadForPdf(quotation = {}) {
  const rawLead = quotation.selectedLead && typeof quotation.selectedLead === "object"
    ? quotation.selectedLead
    : {};
  const address = String(
    rawLead.address ||
    rawLead.streetAddress ||
    quotation.clientAddress ||
    quotation.streetAddress ||
    quotation.address ||
    ""
  ).trim();
  const leadState = String(
    rawLead.leadState ||
    rawLead.state ||
    quotation.clientState ||
    quotation.leadState ||
    quotation.state ||
    ""
  ).trim();

  return {
    ...quotation,
    selectedLead: {
      ...rawLead,
      id: rawLead.id ?? quotation.leadId ?? null,
      leadId: rawLead.leadId ?? quotation.leadId ?? "",
      name: rawLead.name || quotation.customerName || quotation.clientName || "",
      mobile: rawLead.mobile || quotation.clientMobile || "",
      email: rawLead.email || quotation.clientEmail || "",
      company: rawLead.company || rawLead.companyName || quotation.clientCompany || "",
      address,
      streetAddress: rawLead.streetAddress || address,
      leadState,
      state: rawLead.state || leadState,
      gstin: rawLead.gstin || quotation.clientGstin || "",
    },
  };
}

function formatPdfDate(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function safeAddImage(doc, dataUrl, x, y, maxW, maxH) {
  if (!dataUrl || typeof dataUrl !== "string") return false;
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return false;
  const b64 = dataUrl.slice(comma + 1).trim();
  if (!b64 || b64.length < 100) return false;
  try {
    // Detect format from data URL prefix
    const prefix = dataUrl.slice(0, comma).toLowerCase();
    let fmt = "PNG";
    if (prefix.includes("jpeg") || prefix.includes("jpg")) fmt = "JPEG";
    else if (b64.startsWith("/9j/")) fmt = "JPEG"; // JPEG magic bytes in base64

    const props = doc.getImageProperties(b64);
    if (!props || !props.width || !props.height) return false;
    const ratio = props.width / props.height;
    let rW = maxW, rH = rW / ratio;
    if (rH > maxH) { rH = maxH; rW = rH * ratio; }
    rW = Math.max(rW, 1); rH = Math.max(rH, 1);
    doc.addImage(b64, fmt, x, y, rW, rH);
    return true;
  } catch (_e) {
    return false;
  }
}

function safeAddImageFill(doc, dataUrl, x, y, width, height) {
  if (!dataUrl || typeof dataUrl !== "string") return false;
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return false;
  const b64 = dataUrl.slice(comma + 1).trim();
  if (!b64 || b64.length < 100) return false;
  try {
    const prefix = dataUrl.slice(0, comma).toLowerCase();
    let fmt = "PNG";
    if (prefix.includes("jpeg") || prefix.includes("jpg")) fmt = "JPEG";
    else if (b64.startsWith("/9j/")) fmt = "JPEG";
    doc.addImage(b64, fmt, x, y, width, height);
    return true;
  } catch (_e) {
    return false;
  }
}

export async function buildQuotationPdf({
  customerName,
  clientName,
  clientMobile,
  clientEmail,
  clientCompany,
  leadId,
  selectedLead: rawSelectedLead,
  quotationDate,
  createdAt,
  quotationNumber,
  lineItems = [],
  items,
  includeDesignFee = false,
  designFeeAmount = 0,
  designFeeDiscountPct = 0,
  designFeeGstPct = 0,
  gstPct,
  gstPercent,
  gstPctTotal,
  cgstPct,
  sgstPct,
  igstPct,
  gstRows = [],
  totals = {},
  subtotal: rootSubtotal,
  discountPercent,
  discountPct,
  grandTotal: rootGrandTotal,
  createdByName,
  createdByRole,
  approvedByName,
  template = {},
  quotationType,
  dispatchThrough,
  dispatchDetails,
  consigneeDeliveryShipping,
  clientGstin,
}) {
  // Build a selectedLead fallback from root-level client* fields (API response from list page)
  const selectedLead = rawSelectedLead || {
    leadId: leadId || "",
    name: clientName || customerName || "",
    mobile: clientMobile || "",
    email: clientEmail || "",
    company: clientCompany || "",
    address: "",
    streetAddress: "",
    leadState: "",
    state: "",
  };
  const resolvedCustomerName = customerName || clientName || selectedLead?.name || "";
  const resolvedDate = quotationDate || (createdAt ? new Date(createdAt).toISOString().slice(0, 10) : "") || "";
  const resolvedLineItems = ((lineItems && lineItems.length) ? lineItems : (items || [])).filter(
    (item) => Number(item.unitPrice || 0) !== 0
  );

  const resolvedTemplate = {
    companyName: "",
    companyTagline: "",
    address: "",
    phone1: "",
    phone2: "",
    workPhone: "",
    email: "",
    website: "",
    gstin: "",
    stateCode: "",
    stateName: "",
    udyamNumber: "",
    logoBase64: null,
    signatureBase64: null,
    watermarkBase64: null,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    validityDays: 30,
    preparedByDefault: "",
    approvedByDefault: "",
    policyText: "",
    letterheadMode: "separate",
    singleBgImageBase64: null,
    topImageBase64: null,
    bottomImageBase64: null,
    ...template,
  };

  const premiumBlue = [20, 57, 132];
  const premiumBlueDark = [9, 44, 108];
  const premiumNavyBanner = [13, 38, 90];
  const premiumGold = [212, 175, 55];
  const premiumBorder = [215, 223, 235];
  const premiumSoft = [245, 248, 252];
  const premiumMuted = [75, 85, 99];
  const premiumText = [15, 23, 42];
  const isPremiumTemplate = String(resolvedTemplate.templateVariant || "").toLowerCase() === "premium";

  const drawCard = (x, y, w, h, fillColor = [255, 255, 255], strokeColor = premiumBorder) => {
    doc.setFillColor(...fillColor);
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
  };

  const drawKeyValueLines = (pairs, x, y, keyWidth, valWidth, lineH = 4) => {
    let cy = y;
    pairs.forEach(([key, val]) => {
      doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...premiumMuted);
      doc.text(String(key), x, cy);
      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...premiumText);
      const valStr = String(val ?? "-");
      const wrapped = doc.splitTextToSize(valStr, valWidth);
      wrapped.forEach((line, idx) => {
        doc.text(line, x + keyWidth, cy + (idx * 3.2));
      });
      cy += lineH + (Math.max(0, wrapped.length - 1) * 3.2);
    });
  };

  const drawBodyText = (lines, x, y, maxW, lineH = 3.8, fontSize = 7.2) => {
    doc.setFont("helvetica", "normal").setFontSize(fontSize).setTextColor(...premiumText);
    let cy = y;
    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(String(line), maxW);
      wrapped.forEach((part) => {
        doc.text(part, x, cy);
        cy += lineH;
      });
      cy += 0.8;
    });
  };

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 14;
  const right = pageWidth - 14;
  const contentWidth = right - left;
  const isSingleMode = resolvedTemplate.letterheadMode === "single";
  let topHeight = 0;
  if (!isSingleMode && resolvedTemplate.topImageBase64) {
    const imgData = resolvedTemplate.topImageBase64;
    const comma = imgData.indexOf(",");
    if (comma !== -1) {
      const b64 = imgData.slice(comma + 1).trim();
      try {
        const props = doc.getImageProperties(b64);
        if (props && props.width && props.height) {
          const ratio = props.width / props.height;
          topHeight = pageWidth / ratio;
        }
      } catch (e) {}
    }
    if (topHeight <= 0) {
      topHeight = 35;
    }
  }
  const firstSectionStartY = topHeight > 0 ? 60 : 18;
  const bottomHeight = (!isSingleMode && resolvedTemplate.bottomImageBase64) ? 20 : 0;

  const topMargin = topHeight > 0 ? 60 : 15;
  const bottomMargin = bottomHeight > 0 ? 25 : 15;
  const tableMargin = { left: 14, right: 14, top: topMargin, bottom: bottomMargin };
  const tableWidth = 182;
  const tableLineColor = [180, 180, 180];
  const tableLineWidth = 0.3;
  const companyNameText = String(resolvedTemplate.companyName || "");
  const drawnWatermarkPages = new Set();

  const drawIcon = (doc, type, x, y) => {
    const oldFill = doc.getFillColor();
    const oldDraw = doc.getDrawColor();
    const oldLineWidth = doc.getLineWidth();
    
    doc.setFillColor(30, 30, 30);
    doc.circle(x, y, 1.8, "F");
    doc.setDrawColor(255, 255, 255);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.25);

    if (type === "address") {
      // Location pin
      doc.circle(x, y - 0.4, 0.6, "F");
      doc.triangle(x - 0.6, y - 0.4, x + 0.6, y - 0.4, x, y + 1.1, "F");
      doc.setFillColor(30, 30, 30);
      doc.circle(x, y - 0.4, 0.25, "F");
    } else if (type === "phone" || type === "landline") {
      // Phone / Landline
      doc.setFillColor(255, 255, 255);
      doc.circle(x - 0.6, y - 0.3, 0.45, "F");
      doc.circle(x + 0.6, y + 0.3, 0.45, "F");
      doc.setLineWidth(0.4);
      doc.line(x - 0.6, y - 0.3, x + 0.6, y + 0.3);
    } else if (type === "email") {
      // Envelope
      doc.rect(x - 1.1, y - 0.8, 2.2, 1.6, "F");
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.2);
      doc.line(x - 1.1, y - 0.8, x, y - 0.1);
      doc.line(x + 1.1, y - 0.8, x, y - 0.1);
    } else if (type === "website") {
      // Globe
      doc.setDrawColor(255, 255, 255);
      doc.circle(x, y, 1.1, "S");
      doc.line(x - 1.1, y, x + 1.1, y);
      doc.line(x, y - 1.1, x, y + 1.1);
    } else if (type === "gstin") {
      const oldFont = doc.getFont();
      const oldFontSize = doc.getFontSize();
      const oldTextColor = doc.getTextColor();
      doc.setFont("helvetica", "bold").setFontSize(3.5).setTextColor(255, 255, 255);
      doc.text("GST", x, y + 1.1, { align: "center" });
      doc.setFont(oldFont.fontName, oldFont.fontStyle).setFontSize(oldFontSize).setTextColor(oldTextColor);
    } else if (type === "udyam") {
      const oldFont = doc.getFont();
      const oldFontSize = doc.getFontSize();
      const oldTextColor = doc.getTextColor();
      doc.setFont("helvetica", "bold").setFontSize(3.2).setTextColor(255, 255, 255);
      doc.text("UDY", x, y + 1.1, { align: "center" });
      doc.setFont(oldFont.fontName, oldFont.fontStyle).setFontSize(oldFontSize).setTextColor(oldTextColor);
    }
    
    doc.setFillColor(oldFill);
    doc.setDrawColor(oldDraw);
    doc.setLineWidth(oldLineWidth);
  };

  const drawPageWatermark = () => {
    const pageInfo = doc.internal.getCurrentPageInfo?.();
    const pageNumber = pageInfo?.pageNumber || doc.getNumberOfPages();
    if (drawnWatermarkPages.has(pageNumber)) return;
    drawnWatermarkPages.add(pageNumber);

    if (resolvedTemplate.letterheadMode === "single" && resolvedTemplate.singleBgImageBase64) {
      // 1. Draw Single Background covering full page
      const imgData = resolvedTemplate.singleBgImageBase64;
      const comma = imgData.indexOf(",");
      if (comma !== -1) {
        const b64 = imgData.slice(comma + 1).trim();
        if (b64 && b64.length >= 100) {
          try {
            const prefix = imgData.slice(0, comma).toLowerCase();
            let fmt = "PNG";
            if (prefix.includes("jpeg") || prefix.includes("jpg")) fmt = "JPEG";
            doc.addImage(b64, fmt, 0, 0, pageWidth, pageHeight);
          } catch (_e) {}
        }
      }
    } else {
      // 2a. Center Watermark
      if (resolvedTemplate.watermarkBase64) {
        const watermarkBase64 = resolvedTemplate.watermarkBase64;
        if (watermarkBase64 && typeof watermarkBase64 === "string") {
          const comma = watermarkBase64.indexOf(",");
          if (comma !== -1) {
            const b64 = watermarkBase64.slice(comma + 1).trim();
            if (b64 && b64.length >= 100) {
              try {
                const prefix = watermarkBase64.slice(0, comma).toLowerCase();
                let fmt = "PNG";
                if (prefix.includes("jpeg") || prefix.includes("jpg")) fmt = "JPEG";
                const props = doc.getImageProperties(b64);
                if (props && props.width && props.height) {
                  const imgRatio = props.width / props.height;
                  const pageRatio = pageWidth / pageHeight;
                  let w, h;
                  if (imgRatio > pageRatio) {
                    h = pageHeight * 0.45;
                    w = h * imgRatio;
                  } else {
                    w = pageWidth * 0.45;
                    h = w / imgRatio;
                  }
                  w = Math.max(w, 1);
                  h = Math.max(h, 1);
                  const x = (pageWidth - w) / 2;
                  const y = (pageHeight - h) / 2;
                  doc.addImage(b64, fmt, x, y, w, h);
                }
              } catch (_e) {}
            }
          }
        }
      }


      // 2b. Top Header Banner
      if (
        isPremiumTemplate &&
        pageNumber > 1 &&
        !resolvedTemplate.topImageBase64 &&
        (resolvedTemplate.logoBase64 || resolvedTemplate.companyName)
      ) {
        // Premium page 2+ compact banner (no logo image, text only)
        doc.setFillColor(...premiumNavyBanner);
        doc.rect(0, 0, pageWidth, 13, "F");
        doc.setFillColor(...premiumGold);
        doc.rect(0, 12, pageWidth, 1.5, "F");
        doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(255, 255, 255);
        doc.text(companyNameText || "Quotation", left, 8.5);
        doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(255, 255, 255);
        doc.text("QUOTATION", right, 8.5, { align: "right" });
      }

      if (resolvedTemplate.topImageBase64) {
        const imgData = resolvedTemplate.topImageBase64;
        const comma = imgData.indexOf(",");
        if (comma !== -1) {
          const b64 = imgData.slice(comma + 1).trim();
          if (b64 && b64.length >= 100) {
            try {
              const prefix = imgData.slice(0, comma).toLowerCase();
              let fmt = "PNG";
              if (prefix.includes("jpeg") || prefix.includes("jpg")) fmt = "JPEG";
              
              const rW = pageWidth;
              const rH = topHeight;
              const imgX = 0;
              const imgY = 0;
              doc.addImage(b64, fmt, imgX, imgY, rW, rH);

              // Dynamic text with icons in white banner area
              doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(30, 30, 30);
              
              const addrText = resolvedTemplate.address;
              if (addrText) {
                drawIcon(doc, "address", 31, 34);
                doc.text(addrText, 35, 35, { maxWidth: 155 });
              }
              
              const ph1Text = resolvedTemplate.phone1;
              if (ph1Text) {
                drawIcon(doc, "phone", 31, 40);
                doc.text(`Ph: ${ph1Text}`, 35, 41);
              }
              const emailText = resolvedTemplate.email;
              if (emailText) {
                drawIcon(doc, "email", 86, 40);
                doc.text(emailText, 90, 41);
              }
              const gstinText = resolvedTemplate.gstin;
              if (gstinText) {
                drawIcon(doc, "gstin", 146, 40);
                doc.text(`GSTIN: ${gstinText}`, 150, 41);
              }
              
              const ph2Text = resolvedTemplate.phone2 || resolvedTemplate.workPhone;
              if (ph2Text) {
                drawIcon(doc, "landline", 31, 46);
                doc.text(`Ph: ${ph2Text}`, 35, 47);
              }
              const webText = resolvedTemplate.website;
              if (webText) {
                drawIcon(doc, "website", 86, 46);
                doc.text(webText, 90, 47);
              }
              const udyamText = resolvedTemplate.udyamNumber;
              if (udyamText) {
                drawIcon(doc, "udyam", 146, 46);
                doc.text(`UDYAM: ${udyamText}`, 150, 47);
              }
            } catch (_e) {}
          }
        }
      }

      // 2c. Bottom Footer Banner
      if (resolvedTemplate.bottomImageBase64) {
        const imgData = resolvedTemplate.bottomImageBase64;
        const comma = imgData.indexOf(",");
        if (comma !== -1) {
          const b64 = imgData.slice(comma + 1).trim();
          if (b64 && b64.length >= 100) {
            try {
              const prefix = imgData.slice(0, comma).toLowerCase();
              let fmt = "PNG";
              if (prefix.includes("jpeg") || prefix.includes("jpg")) fmt = "JPEG";
              
              const rW = pageWidth * 0.5;
              const rH = 20;
              const imgX = pageWidth * 0.5;
              const imgY = pageHeight - 20;
              doc.addImage(b64, fmt, imgX, imgY, rW, rH);
            } catch (_e) {}
          }
        }
      }
    }
  };

  const addWatermarkedPage = () => {
    doc.addPage();
    drawPageWatermark();
  };

  const tableHookOptions = {
    willDrawPage: () => drawPageWatermark(),
    margin: tableMargin,
    willDrawCell: (data) => {
      const fill = data.cell.styles.fillColor;
      if (fill && fill !== false) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.65 }));
        if (Array.isArray(fill)) {
          doc.setFillColor.apply(doc, fill);
        } else {
          doc.setFillColor(fill);
        }
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
        doc.restoreGraphicsState();
        // Prevent autoTable from filling the cell automatically and making text transparent
        data.cell.styles.fillColor = false;
      }
    },
    didDrawCell: (data) => {},
  };

  // ── GST LOGIC ──
  const leadStateValue = selectedLead?.leadState || selectedLead?.state || "";
  const leadStateDisplay = formatLeadState(leadStateValue);
  const leadStateCode = deriveStateCode(leadStateValue);
  const isTN = isTamilNaduState(leadStateValue);
  const leadAddress = selectedLead?.address || selectedLead?.streetAddress || "";
  const legacyDiscountPct = clampNonNegativeNumber(discountPercent ?? discountPct ?? 0, 0);
  const legacyGstPct = clampNonNegativeNumber(
    gstPct ?? gstPercent ?? gstPctTotal ?? (
      Array.isArray(gstRows) && gstRows.length > 0
        ? gstRows.reduce((sum, r) => sum + Number(r.taxPercent || 0), 0)
        : 0
    ),
    0,
  );
  const shouldSeedLegacyItemTaxes =
    resolvedLineItems.length > 0 &&
    (legacyDiscountPct > 0 || legacyGstPct > 0) &&
    resolvedLineItems.every((item) =>
      Number(item?.discountPct ?? item?.discountPercent ?? 0) === 0 &&
      Number(item?.gstPct ?? item?.gstPercent ?? item?.gstPctTotal ?? 0) === 0
    );
  const normalizedLineItems = resolvedLineItems.map((item) =>
    normalizeQuotationLineItem(item, {
      isTamilNadu: isTN,
      defaultDiscountPct: legacyDiscountPct,
      defaultGstPct: legacyGstPct,
      preferFallbackWhenZero: shouldSeedLegacyItemTaxes,
    })
  );
  const designFeeBase = includeDesignFee ? Number(designFeeAmount || 0) : 0;
  const designFeePricing = buildDesignFeePricing({
    includeDesignFee,
    designFeeAmount: designFeeBase,
    designFeeDiscountPct: clampNonNegativeNumber(designFeeDiscountPct ?? 0, 0),
    designFeeGstPct: clampNonNegativeNumber(resolveLegacyCompatibleDesignFeeGstPct(designFeeGstPct, legacyGstPct), 0),
    isTamilNadu: isTN,
  });
  const productSubtotal = normalizedLineItems.reduce((sum, item) => sum + Number(item.baseAmount || 0), 0);
  const productDiscount = normalizedLineItems.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
  const taxSummary = buildQuotationTaxSummary(normalizedLineItems, {
    isTamilNadu: isTN,
    includeDesignFee,
    designFeeAmount: designFeeBase,
    designFeeDiscountPct: designFeePricing.discountPct,
    designFeeGstPct: designFeePricing.gstPct,
  });
  const cgstAmt = taxSummary.totalCgstAmount;
  const sgstAmt = taxSummary.totalSgstAmount;
  const igstAmt = taxSummary.totalIgstAmount;
  const designFeeTaxAmount = taxSummary.designFeeTaxAmount;
  const subtotal = productSubtotal + Number(designFeePricing.baseAmount || 0);
  const discountAmt = productDiscount + designFeePricing.discountAmount;
  const taxableAmount = subtotal - discountAmt;
  const taxAmount = taxSummary.totalTaxAmount;
  const grandTotal = taxableAmount + taxAmount;
  const taxAmountWordsText = `Tax Amount (in words): ${amountToWords(taxAmount, { includePaise: true })}`;
  const declarationText = (() => {
    const rawDeclaration = String(resolvedTemplate.policyText || "").trim();
    if (rawDeclaration) {
      return rawDeclaration;
    }
    return "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
  })();
  let currentY = firstSectionStartY;

  let buyerEndY;
  if (isPremiumTemplate) {
    // 1. Determine titleY based on top image
    const titleY = (resolvedTemplate.topImageBase64 ? topHeight : 20) + 5;

    // 2. Render centered "QUOTATION" title with horizontal gold flourishes
    const centerX = pageWidth / 2;
    doc.setDrawColor(...premiumGold);
    doc.setFillColor(...premiumGold);
    doc.setLineWidth(0.4);

    // Top flourish (line + center diamond/circles)
    doc.line(centerX - 30, titleY - 6, centerX - 5, titleY - 6);
    doc.line(centerX + 5, titleY - 6, centerX + 30, titleY - 6);
    doc.circle(centerX, titleY - 6, 1.2, "F");
    doc.triangle(centerX - 2, titleY - 5.5, centerX + 2, titleY - 5.5, centerX, titleY - 7.5, "F");
    doc.circle(centerX - 3.5, titleY - 6, 0.7, "F");
    doc.circle(centerX + 3.5, titleY - 6, 0.7, "F");

    // Title text
    doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...premiumText);
    doc.text("QUOTATION", centerX, titleY, { align: "center" });

    // Bottom flourish (line + center diamond/circles)
    doc.line(centerX - 30, titleY + 4, centerX - 5, titleY + 4);
    doc.line(centerX + 5, titleY + 4, centerX + 30, titleY + 4);
    doc.circle(centerX, titleY + 4, 1.2, "F");
    doc.triangle(centerX - 2, titleY + 3.5, centerX + 2, titleY + 3.5, centerX, titleY + 5.5, "F");
    doc.circle(centerX - 3.5, titleY + 4, 0.7, "F");
    doc.circle(centerX + 3.5, titleY + 4, 0.7, "F");

    // 3. Define the three cards starting at rowY
    const rowY = titleY + 10;
    const cardGap = 3;
    const cardW1 = 58; // BILL TO
    const cardW2 = 58; // SHIP TO
    const cardW3 = 60; // QUOTATION DETAILS

    const billX = left;
    const shipX = billX + cardW1 + cardGap;
    const metaCardX = shipX + cardW2 + cardGap;

    const rawGstinVal = selectedLead?.gstin || selectedLead?.gstinCode || clientGstin || "";
    const rawUdyamVal = resolvedTemplate.udyamNumber || "";

    const billDetails = [
      ["Name", resolvedCustomerName || "-"],
      ["Address", leadAddress || "-"],
      ["Mobile", selectedLead?.mobile ? formatIndianMobileNumber(selectedLead.mobile) : "-"],
      rawGstinVal ? ["GSTIN", rawGstinVal] : null,
      rawUdyamVal ? ["UDYAM", rawUdyamVal] : null,
      ["Email", selectedLead?.email || "-"],
      ["State", leadStateDisplay || leadStateValue ? (expandStateName(leadStateValue) || leadStateDisplay) : "-"],
    ].filter(Boolean);

    const shipAddress = asText(consigneeDeliveryShipping || dispatchDetails || selectedLead?.address || leadAddress || "-", "-");
    const shipDetails = [
      ["Name", asText(selectedLead?.company || resolvedCustomerName, "-")],
      ["Address", shipAddress],
      dispatchThrough ? ["Through", dispatchThrough] : null,
    ].filter(Boolean);

    const measureCardBlockHeight = (fields, maxWidth, labelWidth = 14, lineH = 3.5, fontSize = 7.2) => {
      doc.setFont("helvetica", "normal").setFontSize(fontSize);
      return fields.reduce((height, [label, value]) => {
        const wrapped = doc.splitTextToSize(String(value || "-"), maxWidth - labelWidth - 3);
        return height + (wrapped.length * lineH) + 0.8;
      }, 0);
    };

    const drawCardFieldsText = (fields, x, y, maxWidth, labelWidth = 14, lineH = 3.5, fontSize = 7.2) => {
      let cy = y;
      fields.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold").setFontSize(fontSize).setTextColor(...premiumMuted);
        doc.text(`${label}`, x, cy);
        doc.text(":", x + labelWidth, cy);
        doc.setFont("helvetica", "normal").setTextColor(...premiumText);
        const wrapped = doc.splitTextToSize(String(value || "-"), maxWidth - labelWidth - 3);
        wrapped.forEach((line, idx) => {
          doc.text(line, x + labelWidth + 2, cy + (idx * lineH));
        });
        cy += (wrapped.length * lineH) + 0.8;
      });
    };

    const validTill = (() => {
      const base = quotationDate || createdAt || resolvedDate;
      const baseDate = base ? new Date(base) : new Date();
      if (Number.isNaN(baseDate.getTime())) return "-";
      const days = Number(resolvedTemplate.validityDays || 30);
      if (!Number.isFinite(days) || days <= 0) return formatPdfDate(baseDate);
      baseDate.setDate(baseDate.getDate() + days);
      return formatPdfDate(baseDate);
    })();

    const quotationDetails = [
      ["Quotation No.", asText(quotationNumber, "DRAFT")],
      ["Date", formatPdfDate(resolvedDate)],
      ["Valid Till", validTill],
      ["Reference No.", asText(selectedLead?.leadId || leadId, "-")],
      ["Currency", "INR (Rs)"],
      ["Mode", asText(quotationType || "Enquiry", "Enquiry")],
    ];

    const billBodyHeight = measureCardBlockHeight(billDetails, cardW1 - 10, 14, 3.5, 6.8);
    const shipBodyHeight = measureCardBlockHeight(shipDetails, cardW2 - 10, 14, 3.5, 6.8);
    const metaCardBodyHeight = measureCardBlockHeight(quotationDetails, cardW3 - 10, 20, 3.5, 6.8);

    const cardH = Math.max(34, 13 + Math.max(billBodyHeight, shipBodyHeight, metaCardBodyHeight));

    // Card 1: BILL TO
    drawCard(billX, rowY, cardW1, cardH, [255, 255, 255], premiumBorder);
    doc.setFillColor(...premiumBlue);
    doc.rect(billX, rowY, cardW1, 8, "F");
    doc.setFillColor(...premiumGold);
    doc.rect(billX, rowY, 2.5, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(255, 255, 255);
    doc.text("BILL TO", billX + 6, rowY + 5.5);
    drawCardFieldsText(billDetails, billX + 5, rowY + 13, cardW1 - 10, 14, 3.5, 6.8);

    // Card 2: SHIP TO
    drawCard(shipX, rowY, cardW2, cardH, [255, 255, 255], premiumBorder);
    doc.setFillColor(...premiumBlue);
    doc.rect(shipX, rowY, cardW2, 8, "F");
    doc.setFillColor(...premiumGold);
    doc.rect(shipX, rowY, 2.5, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(255, 255, 255);
    doc.text("SHIP TO", shipX + 6, rowY + 5.5);
    drawCardFieldsText(shipDetails, shipX + 5, rowY + 13, cardW2 - 10, 14, 3.5, 6.8);

    // Card 3: QUOTATION DETAILS
    drawCard(metaCardX, rowY, cardW3, cardH, [255, 255, 255], premiumBorder);
    doc.setFillColor(...premiumBlue);
    doc.rect(metaCardX, rowY, cardW3, 8, "F");
    doc.setFillColor(...premiumGold);
    doc.rect(metaCardX, rowY, 2.5, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(255, 255, 255);
    doc.text("QUOTATION DETAILS", metaCardX + 6, rowY + 5.5);
    drawKeyValueLines(quotationDetails, metaCardX + 5, rowY + 13, 20, cardW3 - 24, 3.5);

    buyerEndY = rowY + cardH + 4;
  } else {
    if (!resolvedTemplate.topImageBase64 && (resolvedTemplate.companyName || resolvedTemplate.logoBase64)) {
      // Draw company header info since there is no top banner image
      autoTable(doc, {
        ...tableHookOptions,
        startY: currentY,
        margin: { left: 14, right: 14 },
        tableWidth: 182,
        theme: "plain",
        head: [],
        body: [[""]],
        styles: {
          overflow: "linebreak",
          cellPadding: 0,
        },
        didDrawCell: (data) => {
          const cx = data.cell.x;
          let ly = data.cell.y;
          let logoH = 0;
          const logoX = data.cell.x;
          const logoOk = safeAddImage(doc, resolvedTemplate.logoBase64, logoX, ly, 55, 16);
          if (logoOk) {
            logoH = 18;
          } else if (resolvedTemplate.companyName) {
            doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(20, 20, 20);
            doc.text(String(resolvedTemplate.companyName), cx, ly + 6);
            logoH = 10;
          }
          ly += logoH;

          const headerInfoLines = [
            resolvedTemplate.phone1    ? `Ph: ${resolvedTemplate.phone1}`         : null,
            resolvedTemplate.phone2    ? `Ph2: ${resolvedTemplate.phone2}`        : null,
            resolvedTemplate.workPhone ? `Work: ${resolvedTemplate.workPhone}`    : null,
            resolvedTemplate.email     ? `Email: ${resolvedTemplate.email}`       : null,
            resolvedTemplate.gstin     ? `GSTIN: ${resolvedTemplate.gstin}`       : null,
            resolvedTemplate.website   ? `Website: ${resolvedTemplate.website}`   : null,
            resolvedTemplate.udyamNumber ? `UDYAM: ${resolvedTemplate.udyamNumber}` : null,
            (resolvedTemplate.stateName || resolvedTemplate.stateCode)
              ? `State: ${resolvedTemplate.stateName || ""}, Code: ${resolvedTemplate.stateCode || ""}`
              : null,
          ].filter(Boolean);

          doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(50, 50, 50);
          headerInfoLines.forEach((line) => {
            doc.text(String(line), cx, ly);
            ly += 4;
          });
        },
        bodyStyles: { minCellHeight: 35 },
      });
      currentY = doc.lastAutoTable.finalY + 5;
    } else {
      currentY = firstSectionStartY;
    }

    // Draw centered "Quotation" title
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(30, 30, 30);
    doc.text("Quotation", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;

    // ══ SECTION 2 — Buyer Card ══
    const leftList = [
      ["Quotation No", asText(quotationNumber, "DRAFT")],
      ["Date", asText(resolvedDate, "-")],
      ["Details Of Buyer(Billed To)", asText(resolvedCustomerName, "-")],
      ["Customer ID", asText(selectedLead?.leadId, "-")],
      ["Name", asText(resolvedCustomerName, "-")],
      ["Address", leadAddress || "-"],
      ["GSTIN", selectedLead?.gstin || selectedLead?.gstinCode || clientGstin || "-"],
      ["State", expandStateName(leadStateValue) || leadStateDisplay || "-"],
      ["StateCode", leadStateCode || "-"],
      ["Mobile NO", formatIndianMobileNumber(selectedLead?.mobile)],
      ["Quotation Type", quotationType || "-"],
    ];

    const rightList = [
      ["Dispatch Through", dispatchThrough || "-"],
      ["Dispatch Details", dispatchDetails || "-"],
      ["Consignee/DeliveryShipping", consigneeDeliveryShipping || "-"],
      ["Address", ""],
      ["Customer ID", asText(selectedLead?.leadId, "-")],
      ["Name", asText(resolvedCustomerName, "-")],
      ["Address", leadAddress || "-"],
      ["GSTIN", selectedLead?.gstin || selectedLead?.gstinCode || clientGstin || "-"],
      ["Invoice No", asText(quotationNumber, "DRAFT")],
      ["State", expandStateName(leadStateValue) || leadStateDisplay || "-"],
      ["StateCode", leadStateCode || "-"],
      ["Mobile No", formatIndianMobileNumber(selectedLead?.mobile)],
    ];

    // Measure wrapping height with helvetica 7.5
    doc.setFont("helvetica", "bold").setFontSize(7.5);
    let leftHeight = 4;
    leftList.forEach(([label, value]) => {
      const wrapped = doc.splitTextToSize(String(value || "-"), 91 - 43 - 4);
      leftHeight += 4.2 + (Math.max(0, wrapped.length - 1) * 3.5);
    });

    let rightHeight = 4;
    rightList.forEach(([label, value]) => {
      const wrapped = doc.splitTextToSize(String(value || "-"), 91 - 43 - 4);
      rightHeight += 4.2 + (Math.max(0, wrapped.length - 1) * 3.5);
    });

    const calculatedMinCellHeight = Math.max(56, leftHeight + 4, rightHeight + 4);

    autoTable(doc, {
      ...tableHookOptions,
      startY: currentY,
      margin: tableMargin,
      tableWidth: 182,
      theme: "grid",
      head: [],
      body: [["", ""]],
      styles: {
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
        overflow: "linebreak",
        cellPadding: 0,
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 91 },
        1: { cellWidth: 91 },
      },
      didDrawCell: (data) => {
        if (data.section !== "body") return;

        const isLeft  = data.column.index === 0;
        const isRight = data.column.index === 1;
        const cx = data.cell.x + 3;
        let ly = data.cell.y + 4;

        if (isLeft) {
          leftList.forEach(([label, value]) => {
            doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(0, 0, 0);
            doc.text(label, cx, ly);
            doc.text(":", cx + 41, ly);
            
            doc.setFont("helvetica", "bold").setTextColor(0, 0, 0);
            const valX = cx + 43;
            const wrapped = doc.splitTextToSize(String(value || "-"), 91 - 43 - 4);
            wrapped.forEach((line, idx) => {
              doc.text(line, valX, ly + (idx * 3.5));
            });
            ly += 4.2 + (Math.max(0, wrapped.length - 1) * 3.5);
          });
        }

        if (isRight) {
          rightList.forEach(([label, value]) => {
            doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(0, 0, 0);
            doc.text(label, cx, ly);
            doc.text(":", cx + 41, ly);
            
            doc.setFont("helvetica", "bold").setTextColor(0, 0, 0);
            const valX = cx + 43;
            const wrapped = doc.splitTextToSize(String(value || "-"), 91 - 43 - 4);
            wrapped.forEach((line, idx) => {
              doc.text(line, valX, ly + (idx * 3.5));
            });
            ly += 4.2 + (Math.max(0, wrapped.length - 1) * 3.5);
          });
        }
      },
      bodyStyles: { minCellHeight: calculatedMinCellHeight },
    });

    buyerEndY = doc.lastAutoTable.finalY;
  }

  // ══ SECTION 9 — Line items table body ══
  const showHsnSacColumn = normalizedLineItems.some((item) => {
    const specs = (() => {
      if (item.specs && typeof item.specs === "object") return item.specs;
      const raw = item.specs || item.specsJson || item.variantFields;
      if (!raw) return {};
      if (typeof raw === "object") return raw;
      try { return JSON.parse(raw); } catch { return {}; }
    })();
    const isAddCharge = specs?.isAdditionalCharge || item.isAdditionalCharge || false;
    return !isAddCharge && Boolean(extractTaxGroupCode(item));
  });
  const tableBody = [];
  let rowNum = 1;

  // Render all items in their exact custom order
  normalizedLineItems.forEach((item) => {
    const specs = (() => {
      if (item.specs && typeof item.specs === "object") return item.specs;
      const raw = item.specs || item.specsJson || item.variantFields;
      if (!raw) return {};
      if (typeof raw === "object") return raw;
      try { return JSON.parse(raw); } catch { return {}; }
    })();
    const isAddCharge = specs?.isAdditionalCharge || item.isAdditionalCharge || false;

    if (isAddCharge) {
      const discountAmount = Number(item?.discountAmount || 0);
      const discountText = "";
      let productName = item.productName || "";
      const lowerName = productName.toLowerCase();
      if ((lowerName === "die charge" || lowerName === "screen charge") && !lowerName.includes("onetime investment")) {
        productName = `${productName} (OneTime Investment)`;
      }
      const description = [productName, discountText].filter(Boolean).join("\n");

      tableBody.push({
        rowType: "designFee", // Styled purple like designFee
        cells: [
          String(rowNum++),
          description,
          ...(showHsnSacColumn ? ["—"] : []),
          `${Number(item.discountPct || 0).toFixed(2)}%`,
          `${Number(item.gstPct || 0).toFixed(2)}%`,
          String(Number(item.quantity || 0)),
          "Job",
          Number(item.unitPrice || 0).toFixed(2),
          Number(item.lineTotal || 0).toFixed(2),
        ],
      });
    } else {
      const isDesignOnly = String(item?.designStatus || "").toLowerCase() === "design_only";
      const specsText = fullSpecsSummary(item?.specs || item?.specsJson || {}) || item?.specsSummary || "";
      let productName = asText(item?.productName, "-");
      const lowerName = productName.toLowerCase();
      if ((lowerName === "die charge" || lowerName === "screen charge") && !lowerName.includes("onetime investment")) {
        productName = `${productName} (OneTime Investment)`;
      }
      const discountAmount = Number(item?.discountAmount || 0);
      const discountText = "";
      const description = [productName, specsText, discountText].filter(Boolean).join("\n");
      const hsnSac = extractTaxGroupCode(item);

      tableBody.push({
        rowType: "product",
        cells: [
          String(rowNum++),
          description,
          ...(showHsnSacColumn ? [isDesignOnly ? "—" : (hsnSac || "—")] : []),
          isDesignOnly ? "—" : `${Number(item.discountPct || 0).toFixed(2)}%`,
          isDesignOnly ? "—" : `${Number(item.gstPct || 0).toFixed(2)}%`,
          isDesignOnly ? "—" : (Number(item.quantity || 0) > 0 ? String(Number(item.quantity || 0)) : "—"),
          isDesignOnly ? "—" : (Number(item.quantity || 0) > 0 ? "Nos" : "—"),
          isDesignOnly ? "—" : (Number(item.unitPrice || 0) > 0 ? Number(item.unitPrice || 0).toFixed(2) : "—"),
          Number(item.lineTotal || 0).toFixed(2),
        ],
      });
    }
  });

  if (includeDesignFee && Number(designFeeAmount || 0) > 0) {
    const designFeeDiscountText = Number(designFeePricing.discountAmount || 0) > 0
      ? `Discounted Amount: ${money(designFeePricing.discountAmount)}`
      : "";
    tableBody.push({
      rowType: "designFee",
      cells: [
        String(rowNum++),
        ["Design Fee", designFeeDiscountText].filter(Boolean).join("\n"),
        ...(showHsnSacColumn ? ["—"] : []),
        `${designFeePricing.discountPct.toFixed(2)}%`,
        `${designFeePricing.gstPct.toFixed(2)}%`,
        "1",
        "Job",
        Number(designFeePricing.baseAmount).toFixed(2),
        designFeePricing.lineTotal.toFixed(2),
      ],
    });
  }

  // ══ SECTION 3 — Line items table ══
  autoTable(doc, {
    ...tableHookOptions,
    startY: buyerEndY + 1,
    margin: tableMargin,
    tableWidth,
    theme: "grid",
    head: [showHsnSacColumn
      ? ["Sl.No", "Description of Goods", "HSN/SAC", "Disc %", "GST %", "Qty", "UOM", "Rate", "Amount"]
      : ["Sl.No", "Description of Goods", "Disc %", "GST %", "Qty", "UOM", "Rate", "Amount"]
    ],
    body: tableBody.map((r) => r.cells),
    didParseCell: (data) => {
      if (data.section === "body") {
        const rowData = tableBody[data.row.index];
        if (rowData && rowData.rowType === "designFee") {
          data.cell.styles.fillColor = isPremiumTemplate ? [245, 242, 255] : [250, 245, 255];
        } else if (isPremiumTemplate && data.row.index % 2 === 1) {
          data.cell.styles.fillColor = premiumSoft;
        }
        if (isPremiumTemplate) {
          const lastCol = showHsnSacColumn ? 8 : 7;
          if (data.column.index === lastCol) {
            data.cell.styles.textColor = premiumNavyBanner;
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    },
    headStyles: {
      fillColor: isPremiumTemplate ? premiumNavyBanner : [69, 89, 122],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      overflow: "hidden",
      cellPadding: isPremiumTemplate
        ? { top: 4, bottom: 4, left: 3, right: 3 }
        : { top: 3, bottom: 3, left: 2, right: 2 },
    },
    styles: {
      fontSize: 8,
      lineColor: isPremiumTemplate ? premiumBorder : tableLineColor,
      lineWidth: isPremiumTemplate ? 0.25 : tableLineWidth,
      overflow: "linebreak",
      textColor: premiumText,
      fontStyle: "bold",
      cellPadding: isPremiumTemplate
        ? { top: 3.5, bottom: 3.5, left: 3, right: 3 }
        : { top: 2, bottom: 2, left: 2, right: 2 },
    },
    columnStyles: showHsnSacColumn
      ? {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 50, halign: "left"   },
          2: { cellWidth: 18, halign: "center" },
          3: { cellWidth: 14, halign: "center" },
          4: { cellWidth: 14, halign: "center" },
          5: { cellWidth: 12, halign: "center" },
          6: { cellWidth: 12, halign: "center" },
          7: { cellWidth: 24, halign: "right"  },
          8: { cellWidth: 28, halign: "right"  },
        }
      : {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 68, halign: "left"   },
          2: { cellWidth: 14, halign: "center" },
          3: { cellWidth: 14, halign: "center" },
          4: { cellWidth: 12, halign: "center" },
          5: { cellWidth: 12, halign: "center" },
          6: { cellWidth: 24, halign: "right"  },
          7: { cellWidth: 28, halign: "right"  },
        },
  });
  const lineItemsEndY = doc.lastAutoTable.finalY;

  // ══ SECTION 4 — E&OE row (connected to line items) ══
  autoTable(doc, {
    ...tableHookOptions,
    startY: lineItemsEndY - tableLineWidth,
    margin: { left: 14, right: 14, top: topMargin, bottom: bottomMargin },
    tableWidth,
    head: [],
    body: [[
      "E&OE",
      `GST Amount: Rs. ${taxAmount.toFixed(2)}`,
      `Discount Amount: Rs. ${discountAmt.toFixed(2)}`,
      `Total (INR): Rs. ${grandTotal.toFixed(2)}`,
    ]],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      lineColor: isPremiumTemplate ? premiumBorder : tableLineColor,
      lineWidth: isPremiumTemplate ? 0.25 : tableLineWidth,
    },
    bodyStyles: {
      fillColor: isPremiumTemplate ? premiumNavyBanner : [69, 89, 122],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    didParseCell: (data) => {
      if (!isPremiumTemplate || data.section !== "body") return;
      if (data.column.index === 0) {
        data.cell.styles.fontStyle = "italic";
      }
      if (data.column.index === 3) {
        data.cell.styles.textColor = premiumGold;
      }
    },
    columnStyles: {
      0: { cellWidth: 18, halign: "center" },
      1: { cellWidth: 64, halign: "center" },
      2: { cellWidth: 50, halign: "center" },
      3: { cellWidth: 50, halign: "right"  },
    },
  });

  const eoeEndY = doc.lastAutoTable.finalY;

  const roundedGrandTotal = Math.round(grandTotal);

  // ══ SECTION 5 — Tax Amount (in words) + Round Off + Grand Total box (Moved below E&OE) ══
  const roundOffValue = roundedGrandTotal - grandTotal;
  const roundOffText = roundOffValue === 0 ? "0.00" : (roundOffValue > 0 ? `+${roundOffValue.toFixed(2)}` : roundOffValue.toFixed(2));
  
  autoTable(doc, {
    ...tableHookOptions,
    startY: eoeEndY - tableLineWidth,
    margin: { left: 14, right: 14, top: topMargin, bottom: bottomMargin },
    tableWidth,
    head: [],
    body: [
      [
        `Amount in Words (INR): ${amountToWords(roundedGrandTotal)}`,
        "Round Off",
        roundOffText
      ],
      [
        "",
        "Total Amount Value (INR)",
        roundedGrandTotal.toFixed(2)
      ]
    ],
    theme: "grid",
    styles: {
      fontSize: 8,
      lineColor: isPremiumTemplate ? premiumBorder : tableLineColor,
      lineWidth: isPremiumTemplate ? 0.25 : tableLineWidth,
      cellPadding: 4,
      textColor: [0, 0, 0],
    },
    bodyStyles: {
      fillColor: false,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 112, halign: "left", fontStyle: "bold" },
      1: { cellWidth: 42, halign: "right", fontStyle: "bold" },
      2: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        if (data.row.index === 0) {
          data.cell.rowSpan = 2;
        }
        if (isPremiumTemplate) {
          data.cell.styles.textColor = premiumBlueDark;
          data.cell.styles.fontStyle = "italic";
        }
      }
      if (data.section === "body" && data.row.index === 1) {
        if (data.column.index === 1) {
          data.cell.styles.fillColor = isPremiumTemplate ? premiumNavyBanner : [0, 176, 80];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 2) {
          data.cell.styles.fillColor = isPremiumTemplate ? premiumGold : [0, 176, 80];
          data.cell.styles.textColor = isPremiumTemplate ? premiumNavyBanner : [0, 0, 0];
          if (isPremiumTemplate) data.cell.styles.fontSize = 9;
        }
      }
    }
  });

  const wordsEndY = doc.lastAutoTable.finalY;

  // ══ SECTION 6 — Tax summary grouped by GST rate (Moved below Round Off table) ══
  autoTable(doc, {
    ...tableHookOptions,
    startY: wordsEndY + 1,
    margin: { left: 14, right: 14, top: topMargin, bottom: bottomMargin },
    tableWidth,
    theme: "grid",
    head: [isTN
      ? [
          taxSummary.hasHsnCodes ? "HSN/SAC" : "Products",
          "Taxable Value",
          "CGST %",
          "CGST Amount",
          "SGST/UTGST %",
          "SGST/UTGST Amount",
          "Tax Amount",
        ]
      : [
          taxSummary.hasHsnCodes ? "HSN/SAC" : "Products",
          "Taxable Value",
          "IGST %",
          "IGST Amount",
          "Tax Amount",
        ]
    ],
    body: [
      ...taxSummary.rows.map((row, index) => (
        isTN
          ? [
              row.displayText || row.serialText || String(index + 1),
              money(row.taxableAmount),
              `${money(row.cgstRate)}%`,
              money(row.cgstAmount),
              `${money(row.sgstRate)}%`,
              money(row.sgstAmount),
              money(row.taxTotalAmount),
            ]
          : [
              row.displayText || row.serialText || String(index + 1),
              money(row.taxableAmount),
              `${money(row.igstRate)}%`,
              money(row.igstAmount),
              money(row.taxTotalAmount),
            ]
      )),
      isTN
        ? [
            "Total",
            money(taxSummary.productTaxableAmount),
            "",
            money(taxSummary.totalCgstAmount),
            "",
            money(taxSummary.totalSgstAmount),
            money(taxSummary.productTaxAmount),
          ]
        : [
            "Total",
            money(taxSummary.productTaxableAmount),
            "",
            money(taxSummary.totalIgstAmount),
            money(taxSummary.productTaxAmount),
          ],
    ],
    headStyles: {
      fillColor: isPremiumTemplate ? premiumNavyBanner : [220, 228, 240],
      textColor: isPremiumTemplate ? [255, 255, 255] : [30, 30, 30],
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
      cellPadding: isPremiumTemplate ? { top: 3.5, bottom: 3.5, left: 2, right: 2 } : undefined,
    },
    styles: {
      fontSize: 8,
      lineColor: isPremiumTemplate ? premiumBorder : tableLineColor,
      lineWidth: isPremiumTemplate ? 0.25 : tableLineWidth,
      overflow: "linebreak",
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: isTN
      ? {
          0: { cellWidth: 24, halign: "center" },
          1: { cellWidth: 30, halign: "right" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 26, halign: "right" },
          4: { cellWidth: 22, halign: "center" },
          5: { cellWidth: 30, halign: "right" },
          6: { cellWidth: 30, halign: "right" },
        }
      : {
          0: { cellWidth: 24, halign: "center" },
          1: { cellWidth: 62, halign: "right" },
          2: { cellWidth: 24, halign: "center" },
          3: { cellWidth: 36, halign: "right" },
          4: { cellWidth: 36, halign: "right" },
        },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const isTotalRow = data.row.index === taxSummary.rows.length;
      if (isTotalRow) {
        data.cell.styles.fontStyle = "bold";
        if (isPremiumTemplate) {
          data.cell.styles.fillColor = [225, 232, 245];
          data.cell.styles.textColor = premiumBlueDark;
        }
      } else if (isPremiumTemplate && data.row.index % 2 === 1) {
        data.cell.styles.fillColor = premiumSoft;
      }
      if (data.column.index === 0) {
        data.cell.styles.halign = "left";
      }
    },
  });

  const taxSummaryEndY = doc.lastAutoTable.finalY;

  // Render "Tax Amount (in words): ..." box below Tax Summary table
  autoTable(doc, {
    ...tableHookOptions,
    startY: taxSummaryEndY - tableLineWidth,
    margin: { left: 14, right: 14, top: topMargin, bottom: bottomMargin },
    tableWidth,
    head: [],
    body: [[taxAmountWordsText]],
    theme: "grid",
    styles: {
      fontSize: 8,
      lineColor: tableLineColor,
      lineWidth: tableLineWidth,
      cellPadding: 4,
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
  });

  // ══ SECTION 7 — Declaration + Bank + Signature ══
  const totalsEndY = doc.lastAutoTable.finalY;
  const footerReserve = 35;
  let y = totalsEndY + 1;

  if (isPremiumTemplate) {
    const footerPanelW1 = 78;
    const footerPanelW2 = 46;
    const footerPanelW3 = 58;
    const footerX1 = left;
    const footerX2 = footerX1 + footerPanelW1;
    const footerX3 = footerX2 + footerPanelW2;

    const paymentBodyLines = [
      `Declaration: ${declarationText}`,
      `Bank: ${asText(resolvedTemplate.bankName, "-")}`,
      `A/c No: ${asText(resolvedTemplate.accountNumber, "-")}`,
      `IFSC: ${asText(resolvedTemplate.ifscCode, "-")} | Branch: ${asText(resolvedTemplate.branch, "-")}`,
    ];

    const measureBodyTextHeight = (lines, maxW, lineH = 3.2, fontSize = 6.8) => {
      doc.setFont("helvetica", "normal").setFontSize(fontSize);
      let height = 0;
      lines.forEach((line) => {
        const wrapped = doc.splitTextToSize(String(line), maxW);
        height += (wrapped.length * lineH) + 0.8;
      });
      return height;
    };

    const paymentContentHeight = measureBodyTextHeight(paymentBodyLines, footerPanelW1 - 8, 3.2, 6.8);
    const footerPanelH = Math.max(54, 13 + paymentContentHeight + 4);

    if (y + footerPanelH > pageHeight - footerReserve) {
      addWatermarkedPage();
      y = firstSectionStartY;
    }
    const footerStartY = y;

    // Draw cards
    drawCard(footerX1, footerStartY, footerPanelW1, footerPanelH);
    drawCard(footerX2, footerStartY, footerPanelW2, footerPanelH);
    drawCard(footerX3, footerStartY, footerPanelW3, footerPanelH);

    // Payment Terms header strip
    doc.setFillColor(...premiumNavyBanner);
    doc.rect(footerX1, footerStartY, footerPanelW1, 8, "F");
    doc.setFillColor(...premiumGold);
    doc.rect(footerX1, footerStartY, 3, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(255, 255, 255);
    doc.text("PAYMENT TERMS", footerX1 + 6, footerStartY + 5.5);

    // QR Code header strip
    doc.setFillColor(...premiumNavyBanner);
    doc.rect(footerX2, footerStartY, footerPanelW2, 8, "F");
    doc.setFillColor(...premiumGold);
    doc.rect(footerX2, footerStartY, 3, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(255, 255, 255);
    doc.text("QR CODE", footerX2 + 6, footerStartY + 5.5);

    // Authorised Signatory header strip
    doc.setFillColor(...premiumNavyBanner);
    doc.rect(footerX3, footerStartY, footerPanelW3, 8, "F");
    doc.setFillColor(...premiumGold);
    doc.rect(footerX3, footerStartY, 3, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(255, 255, 255);
    doc.text("AUTHORISED SIGNATORY", footerX3 + 6, footerStartY + 5.5);
    drawBodyText(paymentBodyLines, footerX1 + 4, footerStartY + 13, footerPanelW1 - 8, 3.2, 6.8);

    // Content: QR Code
    const qrCenterX = footerX2 + footerPanelW2 / 2;
    const qrImageY = footerStartY + 12;
    if (!safeAddImage(doc, resolvedTemplate.qrCodeBase64, footerX2 + 5, qrImageY, footerPanelW2 - 10, 30)) {
      doc.setFont("helvetica", "normal").setFontSize(7.2).setTextColor(...premiumMuted);
      doc.setDrawColor(...premiumBorder);
      doc.roundedRect(footerX2 + 5, qrImageY, footerPanelW2 - 10, 30, 2, 2, "S");
      doc.text("QR code", qrCenterX, qrImageY + 13, { align: "center" });
      doc.text("not uploaded", qrCenterX, qrImageY + 19, { align: "center" });
    }
    doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(...premiumMuted);
    doc.text("Scan to pay / verify", qrCenterX, footerStartY + footerPanelH - 4, { align: "center" });

    // Content: Authorised Signatory
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...premiumBlueDark);
    doc.text(`For ${companyNameText || "Company"}`, footerX3 + footerPanelW3 / 2, footerStartY + 14, {
      align: "center",
    });
    const signLineY = footerStartY + 26;
    doc.setDrawColor(...premiumBorder);
    doc.line(footerX3 + 8, signLineY + 12, footerX3 + footerPanelW3 - 8, signLineY + 12);
    if (resolvedTemplate.signatureBase64) {
      safeAddImage(
        doc,
        resolvedTemplate.signatureBase64,
        footerX3 + (footerPanelW3 / 2) - 20,
        signLineY - 8,
        40,
        20,
      );
    }
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...premiumMuted);
    doc.text("Authorised Signatory", footerX3 + footerPanelW3 / 2, signLineY + 17, { align: "center" });

  } else {
    if (y + 40 > pageHeight - footerReserve) {
      addWatermarkedPage();
      y = firstSectionStartY;
    }

    const bankDetailsContent = [
      "Bank Details:",
      `Bank: ${asText(resolvedTemplate.bankName, "-")}`,
      `A/c No: ${asText(resolvedTemplate.accountNumber, "-")}`,
      `IFSC Code: ${asText(resolvedTemplate.ifscCode, "-")}`,
      `Branch: ${asText(resolvedTemplate.branch, "-")}`,
    ].join("\n");

    const footerLeftContent = [
      `Declaration: ${declarationText}`,
      "",
      bankDetailsContent,
    ].join("\n");

    autoTable(doc, {
      ...tableHookOptions,
      startY: y,
      head: [[
        "Tax / Declaration / Bank Details",
        `For ${companyNameText}`,
      ]],
      body: [[footerLeftContent, ""]],
      styles: {
        fontSize: 7,
        cellPadding: 4,
        valign: "top",
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
        overflow: "linebreak",
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },

      headStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 140 },
        1: { cellWidth: 42 },
      },
      theme: "grid",
      margin: { left: 14, right: 14, top: topMargin, bottom: bottomMargin },
      pageBreak: "avoid",
      rowPageBreak: "avoid",
      didDrawCell: (data) => {
        if (data.section !== "body") return;
        if (data.column.index !== 1 || !resolvedTemplate.signatureBase64) return;

        const signatureWidth = 34;
        const signatureX = data.cell.x + Math.max(2, (data.cell.width - signatureWidth) / 2);
        const signatureY = data.cell.y + Math.max(8, data.cell.height - 34);
        safeAddImage(
          doc,
          resolvedTemplate.signatureBase64,
          signatureX,
          signatureY,
          signatureWidth,
          18,
        );
        doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(30, 30, 30);
        doc.text("Authorised Signature", data.cell.x + data.cell.width / 2, signatureY + 24, {
          align: "center",
        });
      },
    });
  }

  if (isPremiumTemplate) {
    // Gold accent stripe above the navy bottom bar
    doc.setFillColor(...premiumGold);
    doc.rect(0, pageHeight - 13, pageWidth, 2, "F");
    // Deep navy bottom bar
    doc.setFillColor(...premiumNavyBanner);
    doc.rect(0, pageHeight - 11, pageWidth, 11, "F");
    // Company name left-aligned in bold white
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(255, 255, 255);
    doc.text(companyNameText || "Quotation Template", left, pageHeight - 4.5);
    // Company tagline right-aligned in gold
    if (resolvedTemplate.companyTagline) {
      doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...premiumGold);
      doc.text(resolvedTemplate.companyTagline, right, pageHeight - 4.5, { align: "right" });
    }
  }

  // ══ SECTION 8 — Footer pinned to last page ══
  const NON_EMPLOYEE = ["MANAGER", "ADMIN", "SUPER_ADMIN", "TEAM_LEAD"];
  const creatorRole = String(createdByRole || "").toUpperCase();
  const preparedBy = createdByName || resolvedTemplate.preparedByDefault || "";
  const approvedBy = NON_EMPLOYEE.includes(creatorRole)
    ? createdByName
    : (approvedByName || resolvedTemplate.approvedByDefault || "");

  doc.setPage(doc.getNumberOfPages());
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(80, 80, 80);
  doc.text(
    `Prepared by: ${preparedBy} | Approved by: ${approvedBy} | This is a Computer Generated Form`,
    pageWidth / 2,
    pageHeight - 27,
    { align: "center" },
  );



  return doc;
}

async function convertImageToPng(dataUrl, maxPxWidth = 400, opacity = 1) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.includes(",")) { resolve(dataUrl); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const srcW = img.naturalWidth  || 400;
        const srcH = img.naturalHeight || 150;
        // Scale down to maxPxWidth — no need for huge images in PDF
        const scale = Math.min(1, maxPxWidth / srcW);
        const outW = Math.round(srcW * scale);
        const outH = Math.round(srcH * scale);
        canvas.width  = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(dataUrl); return; }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, outW, outH);
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
        ctx.filter = opacity < 1 ? "brightness(1.45)" : "none";
        ctx.drawImage(img, 0, 0, outW, outH);
        ctx.filter = "none";
        // Keep watermark output as PNG so transparent regions stay transparent.
        const output = canvas.toDataURL("image/png");
        resolve(output);
      } catch (_e) { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function prepareQuotationPdfDocument(quotation, template = {}) {
  const convertedTemplate = {
    ...template,
    logoBase64: template?.logoBase64
      ? await convertImageToPng(template.logoBase64, 400) : null,
    signatureBase64: template?.signatureBase64
      ? await convertImageToPng(template.signatureBase64, 300) : null,
    watermarkBase64: template?.watermarkBase64
      ? await convertImageToPng(template.watermarkBase64, 1800, 0.45) : null,
  };
  const quotationForPdf = normalizeQuotationLeadForPdf(quotation || {});
  const doc = await buildQuotationPdf({
    ...quotationForPdf,
    template: convertedTemplate,
  });
  const safeCustomerName = sanitizeFilenamePart(
    quotationForPdf.customerName || quotationForPdf.clientName || quotationForPdf.selectedLead?.name,
    "Customer"
  );
  const safeDate = sanitizeFilenamePart(
    quotationForPdf.quotationDate || quotationForPdf.createdAt,
    new Date().toISOString().slice(0, 10),
  );
  const fileName = `Quotation_${safeCustomerName}_${safeDate}.pdf`;
  return { doc, fileName };
}

async function openPdfBlobInNewTab(doc) {
  const pdfBlob = doc.output("blob");
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const revokeLater = () => {
    window.setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 120000);
  };

  try {
    const popup = window.open(downloadUrl, "_blank", "noopener,noreferrer");
    if (popup) {
      try {
        popup.opener = null;
      } catch {
        // Ignore cross-browser restrictions when clearing opener.
      }
      popup.focus?.();
      revokeLater();
      return true;
    }

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    revokeLater();
    return true;
  } catch (error) {
    URL.revokeObjectURL(downloadUrl);
    throw error;
  }
}

export async function downloadQuotationPdf(quotation, template = {}) {
  const { doc, fileName } = await prepareQuotationPdfDocument(quotation, template);

  try {
    const pdfBlob = doc.output("blob");
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;
    downloadLink.target = "_blank";
    downloadLink.rel = "noopener";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
  } catch {
    doc.save(fileName);
  }
}

export async function openQuotationPdfPreview(quotation, template = {}) {
  const { doc } = await prepareQuotationPdfDocument(quotation, template);
  await openPdfBlobInNewTab(doc);
}

export async function getQuotationPdfBlob(quotation, template = {}) {
  const { doc, fileName } = await prepareQuotationPdfDocument(quotation, template);
  return {
    blob: doc.output("blob"),
    fileName,
  };
}
