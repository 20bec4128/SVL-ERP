import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Country, State, City } from "country-state-city";
import {
  createLead,
  deleteLead,
  getAssignableLeadGroups,
  getImportableEmployees,
  getLeadChatMessages,
  getLeadFilters,
  getLeads,
  updateLeadRowStatus,
  getAssignableAllocators,
  updateLeadAllocator,
  updateLeadDetails,
  getDuplicateLeads,
  convertDuplicateLead,
} from "../../api/leadsApi";
import { getLeadStatuses, DEFAULT_LEAD_STATUSES } from "../../api/leadStatusApi";
import { getPrimarySources, createPrimarySource } from "../../api/primarySourceApi";
import { getSecondarySources, createSecondarySource } from "../../api/secondarySourceApi";
import { getTertiarySources } from "../../api/tertiarySourceApi";
import { getGroupMembers, getUserGroups } from "../../api/userGroupApi";
import { getCampaignLeads, assignCampaignLead, submitTestLead } from "../../api/campaignLeadsApi";
import { getProjects } from "../../api/projectApi";
import { getLeadFlow } from "../../api/flowApi";
import { getBranches } from "../../api/branchesApi";
import { updateCustomerLeadStatus } from "../../api/customerApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { formatStatusLabel, uniqueStatusOptions, normalizeStatusLabelKey } from "../../utils/statusLabels";
import { ATTEMPTED_REASON_OPTIONS, NOT_ATTEMPTED_REASON_OPTIONS, INTERESTED_REASON_OPTIONS } from "../../constants/leadFlowStatuses";
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
import { CRM_PAGE_OPTIONS } from "../../constants/crmPages";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import { useCountryCodePicker } from "../../hooks/useCountryCodePicker";
import "./LeadsPage.css";
import LeadSearch from "../../components/admin/LeadSearch";
import LeadExportDropdown from "../../components/admin/LeadExportDropdown";
import LeadFilters from "../../components/admin/LeadFilters";
import LeadListView from "../../components/admin/LeadListView";
import LeadGridView from "../../components/admin/LeadGridView";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import ColumnVisibilityDropdown from "../../components/admin/ColumnVisibilityDropdown";
import LeadDetailsModal from "../../components/admin/LeadDetailsModal";

const EMPTY_CREATE_FORM = {
  createBranchId: "",
  createBranchName: "",
  projectName: "",
  name: "",
  email: "",
  mobile: "",
  productType: "",
  primarySource: "",
  secondarySource: "",
  tertiarySource: "",
  leadGroupId: "",
  countryCode: defaultCountryOption.value,
  assignedUserId: "",
  state: "",
  district: "",
  streetAddress: "",
  companyName: "",
  gstin: "",
};

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

function isFinalDesignUploadMessage(row) {
  const text = stripDesignThreadMarker(row?.message || "").trim().toLowerCase();
  return text === "final design uploaded" && !!row?.attachmentName;
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

function getDesignDurationDays(startValue, endValue) {
  if (!startValue || !endValue) return "";
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return "";
  }
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function pickText(row, keys = []) {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
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

function getSourceRowId(row) {
  return row?.id == null ? "" : String(row.id);
}

function toProjectNames(rows) {
  const names = (Array.isArray(rows) ? rows : [])
    .map((row) =>
      pickText(row, [
        "projectName",
        "project_name",
        "name",
        "title",
      ]),
    )
    .filter(Boolean);
  return Array.from(new Set(names));
}

function downloadTextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function mergeRowsById(primaryRows, secondaryRows) {
  const merged = [];
  const seen = new Set();
  for (const row of [...(Array.isArray(primaryRows) ? primaryRows : []), ...(Array.isArray(secondaryRows) ? secondaryRows : [])]) {
    const key = row?.id != null ? String(row.id) : "";
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged;
}

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

function formatCreatedOn(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(value);
  }
}

function getStatusClass(status) {
  const s = String(status || "").toLowerCase().trim();
  if (s.includes("new")) return "new-lead";
  if (s.includes("interested")) return "interested";
  if (s.includes("deal")) return "deal";
  if (s.includes("proposal")) return "proposal";
  return "default-status";
}

function getCountryIsoFromPhoneCode(countryCode) {
  const option = getCountryOptionByValue(countryCode);
  if (option?.country) return option.country;

  const phone = String(countryCode || "").replace("+", "").trim();
  if (!phone) return "";

  const matched = Country.getAllCountries().find((country) => country.phonecode === phone);
  return matched?.isoCode || "";
}

function findStateByValue(countryIso, stateValue) {
  const raw = String(stateValue || "").trim();
  if (!countryIso || !raw) return null;

  return State.getStatesOfCountry(countryIso).find(
    (state) =>
      String(state.isoCode || "").toUpperCase() === raw.toUpperCase() ||
      String(state.name || "").toLowerCase() === raw.toLowerCase(),
  ) || null;
}

function EditGlyph({ size = 14, className = "" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function PhoneGlyph({ size = 14, className = "" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 5.18 2 2 0 0 1 5.08 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L9.1 10.6a16 16 0 0 0 4.3 4.3l1.17-1.15a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function NoteGlyph({ size = 14, className = "" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function PlusGlyph({ size = 14, className = "" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

const LEAD_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "mobile", label: "Mobile" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "owner", label: "Owner" },
  { key: "createdOn", label: "Created On" },
];

export default function LeadsPage() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const leadColumns = useMemo(() => {
    const cols = [
      { key: "name", label: "Name" },
      { key: "mobile", label: "Mobile" },
      { key: "source", label: "Source" },
      { key: "status", label: "Status" },
      { key: "owner", label: "Owner" },
    ];
    if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "MANAGER") {
      cols.push({ key: "assignedBy", label: "Assigned By" });
    }
    cols.push({ key: "createdOn", label: "Created On" });
    return cols;
  }, [role]);
  const actorInstitutionName = String(user?.institutionName || user?.institution || "").trim();
  const { showSuccess, showError } = useToast();
  const { showConfirm, confirmDialog } = useConfirmDialog();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    primary: "",
    status: "",
    svStatus: "",
    owner: "",
    quickDate: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedLeadForView, setSelectedLeadForView] = useState(null);

  const [visibleLeadColumns, setVisibleLeadColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("leads_col_visibility");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return {};
  });
  const handleLeadColVisChange = (next) => {
    setVisibleLeadColumns(next);
    try { localStorage.setItem("leads_col_visibility", JSON.stringify(next)); } catch {}
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [primarySourceRows, setPrimarySourceRows] = useState([]);
  const [secondarySourceRows, setSecondarySourceRows] = useState([]);
  const [tertiaryOptions, setTertiaryOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [leadFilters, setLeadFilters] = useState({
    projects: [],
    primarySources: [],
    leadStatuses: [],
    leadStatusCounts: {},
    svStatuses: [],
    owners: [],
  });
  const [leadStatusScopeRows, setLeadStatusScopeRows] = useState([]);
  const [leadStatusOptions, setLeadStatusOptions] = useState([]);

  const [activeMainTab, setActiveMainTab] = useState('leads');
  const [viewMode, setViewMode] = useState("list");
  const [duplicateLeads, setDuplicateLeads] = useState([]);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupError, setDupError] = useState('');
  const [dupFilters, setDupFilters] = useState({
    search: "",
    primary: "",
    status: "",
    svStatus: "",
    owner: "",
    quickDate: "",
  });
  const [dupFilterOpen, setDupFilterOpen] = useState(false);
  const [dupPage, setDupPage] = useState(1);
  const [dupPageSize, setDupPageSize] = useState(25);
  const [convertingLeadId, setConvertingLeadId] = useState(null);
  const [convertConfirm, setConvertConfirm] = useState(null);
  const [dupWarnLead, setDupWarnLead] = useState(null);

  const [rejectedLeads, setRejectedLeads] = useState([]);
  const [rejectedLoading, setRejectedLoading] = useState(false);
  const [rejectedSaving, setRejectedSaving] = useState(false);
  const [rejectedError, setRejectedError] = useState('');
  const [rejectedSearch, setRejectedSearch] = useState('');
  const [rejectedPage, setRejectedPage] = useState(1);
  const [rejectedPageSize, setRejectedPageSize] = useState(25);

  // ── Campaign Leads tab ──────────────────────────────────────────────────────
  const [campaignLeads, setCampaignLeads] = useState([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState('');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignSourceFilter, setCampaignSourceFilter] = useState('');
  const [campaignSelectedIds, setCampaignSelectedIds] = useState(new Set());
  const [campaignFilterOpen, setCampaignFilterOpen] = useState(false);
  const [campaignFilters, setCampaignFilters] = useState({ platform: '', adName: '' });
  const [campaignAssignOpen, setCampaignAssignOpen] = useState(false);
  const [campaignAssignBranchId, setCampaignAssignBranchId] = useState('');
  const [campaignAssignGroupId, setCampaignAssignGroupId] = useState('');
  const [campaignAssignUserId, setCampaignAssignUserId] = useState('');
  const [campaignAssignLoading, setCampaignAssignLoading] = useState(false);
  const [campaignGroupMembers, setCampaignGroupMembers] = useState([]);
  const [campaignAssignGroupLoading, setCampaignAssignGroupLoading] = useState(false);

  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Test form state
  const [campaignTestOpen, setCampaignTestOpen] = useState(false);
  const [campaignTestLoading, setCampaignTestLoading] = useState(false);
  const [campaignTestForm, setCampaignTestForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    moq: "",
    industry: "",
    platform: "ig",
    adName: "Corrugated box_ Ad 1",
    campaignName: "Leads Campaign_corrugated boxes J - 18"
  });

  const filteredCampaignLeads = useMemo(() => {
    return campaignLeads.filter((l) => {
      const q = campaignSearch.toLowerCase();
      const matchSearch =
        !q ||
        String(l.fullName || "").toLowerCase().includes(q) ||
        String(l.phone || "").toLowerCase().includes(q) ||
        String(l.email || "").toLowerCase().includes(q);
      const matchPlatform =
        !campaignFilters.platform ||
        String(l.platform || "").toLowerCase() === campaignFilters.platform.toLowerCase();
      const matchAdName =
        !campaignFilters.adName ||
        String(l.adName || "").toLowerCase() === campaignFilters.adName.toLowerCase();
      const matchSource =
        !campaignSourceFilter ||
        String(l.platform || "").toLowerCase().includes(campaignSourceFilter.toLowerCase());
      return matchSearch && matchSource && matchPlatform && matchAdName;
    });
  }, [campaignLeads, campaignSearch, campaignFilters.platform, campaignFilters.adName, campaignSourceFilter]);

  const getCampaignExportRows = () => {
    if (campaignSelectedIds.size > 0) {
      return filteredCampaignLeads.filter((row) => campaignSelectedIds.has(row.id));
    }
    return filteredCampaignLeads;
  };

  // Bulk Operations State
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignUserId, setBulkAssignUserId] = useState("");
  const [bulkAssignEmployees, setBulkAssignEmployees] = useState([]);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);

  useEffect(() => {
    const handleOutsideClickOrScroll = () => {
      setActiveActionsRow(null);
    };
    window.addEventListener("click", handleOutsideClickOrScroll);
    window.addEventListener("scroll", handleOutsideClickOrScroll, true);
    return () => {
      window.removeEventListener("click", handleOutsideClickOrScroll);
      window.removeEventListener("scroll", handleOutsideClickOrScroll, true);
    };
  }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [createWizardStep, setCreateWizardStep] = useState(0);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createGroupMembers, setCreateGroupMembers] = useState([]);
  const [createBranchFlowGroupId, setCreateBranchFlowGroupId] = useState("");
  const [createMobileError, setCreateMobileError] = useState("");
  const [createStep0Errors, setCreateStep0Errors] = useState({ name: "", primarySource: "" });
  const [flowRules, setFlowRules] = useState([]);
  const [showAddPrimarySource, setShowAddPrimarySource] = useState(false);
  const [showAddSecondarySource, setShowAddSecondarySource] = useState(false);
  const [newPrimarySource, setNewPrimarySource] = useState("");
  const [newSecondarySource, setNewSecondarySource] = useState("");
  const [newSecondarySourcePrimaryId, setNewSecondarySourcePrimaryId] = useState("");
  const [addSourceLoading, setAddSourceLoading] = useState(false);
  const [sourceOptionsLoaded, setSourceOptionsLoaded] = useState(false);
  const createNameInputRef = useRef(null);
  const createStateInputRef = useRef(null);
  const isInitialSearch = useRef(true);

  const handleAddPrimarySource = async () => {
    const value = String(newPrimarySource || "").trim();
    if (!value) {
      showError("Enter a primary source name");
      return;
    }
    setAddSourceLoading(true);
    try {
      await createPrimarySource(value);
      const freshRows = await getPrimarySources();
      setPrimarySourceRows(Array.isArray(freshRows) ? freshRows : []);
      setCreateForm((prev) => ({ ...prev, primarySource: value }));
      setNewPrimarySource("");
      setShowAddPrimarySource(false);
      showSuccess("Primary source added");
    } catch (error) {
      showError(extractApiErrorMessage(error, "Failed to add primary source"));
    } finally {
      setAddSourceLoading(false);
    }
  };

  const handleAddSecondarySource = async () => {
    const value = String(newSecondarySource || "").trim();
    if (!value) {
      showError("Enter a secondary source name");
      return;
    }
    const primaryId = String(newSecondarySourcePrimaryId || "").trim();
    if (!primaryId) {
      showError("Select a primary source");
      return;
    }
    setAddSourceLoading(true);
    try {
      await createSecondarySource({
        secondarySource: value,
        primarySourceId: Number(primaryId),
      });
      const freshRows = await getSecondarySources();
      setSecondarySourceRows(Array.isArray(freshRows) ? freshRows : []);
      setCreateForm((prev) => ({ ...prev, secondarySource: value }));
      setNewSecondarySource("");
      setNewSecondarySourcePrimaryId("");
      setShowAddSecondarySource(false);
      showSuccess("Secondary source added");
    } catch (error) {
      showError(extractApiErrorMessage(error, "Failed to add secondary source"));
    } finally {
      setAddSourceLoading(false);
    }
  };

  const handleCreateCountryCodeChange = (value) => {
    setCreateForm((p) => ({
      ...p,
      countryCode: ensureCountryCodeValue(value),
      mobile: "",
    }));
    setCreateMobileError("");
    setError("");
  };

  function handleCreateCountryEnter() {
    if (!filteredCountryOptions.length) return;
    handleCreateCountryCodeChange(filteredCountryOptions[0].value);
    closeCreateCountryPicker();
  }

  const {
    isOpen: createCountryPickerOpen,
    pickerRef: createCountryPickerRef,
    closePicker: closeCreateCountryPicker,
    togglePicker: toggleCreateCountryPicker,
    searchQuery: createCountrySearch,
  } = useCountryCodePicker({ onEnter: handleCreateCountryEnter });

  const filteredCountryOptions = useMemo(() => {
    if (!createCountrySearch.trim()) return COUNTRY_CODE_OPTIONS;
    const searchLower = createCountrySearch.toLowerCase();
    return COUNTRY_CODE_OPTIONS.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.callingCode.includes(searchLower)
    );
  }, [createCountrySearch]);

  const primaryOptions = useMemo(
    () => toOptionNames(primarySourceRows, ["primarySource", "name", "label"]),
    [primarySourceRows],
  );

  const createPrimarySourceRow = useMemo(() => {
    const selected = String(createForm.primarySource || "").trim();
    if (!selected) return null;
    return (Array.isArray(primarySourceRows) ? primarySourceRows : []).find((row) =>
      String(getLeadSourceName(row, ["primarySource", "name", "label"])).trim().toLowerCase() ===
      selected.toLowerCase(),
    ) || null;
  }, [createForm.primarySource, primarySourceRows]);

  const createSecondarySourceOptions = useMemo(() => {
    const selectedPrimaryId = createPrimarySourceRow?.id == null ? "" : String(createPrimarySourceRow.id);
    if (!selectedPrimaryId) return [];
    const filteredRows = (Array.isArray(secondarySourceRows) ? secondarySourceRows : []).filter(
      (row) => row?.primarySourceId == null || String(row?.primarySourceId ?? "") === selectedPrimaryId,
    );
    return toOptionNames(filteredRows, ["secondarySource", "name", "label"]);
  }, [createPrimarySourceRow, secondarySourceRows]);

  useEffect(() => {
    if (!sourceOptionsLoaded) return;
    if (!createForm.secondarySource) return;
    if (createSecondarySourceOptions.includes(createForm.secondarySource)) return;
    setCreateForm((prev) => ({ ...prev, secondarySource: "" }));
  }, [createForm.secondarySource, createSecondarySourceOptions, sourceOptionsLoaded]);

  const createCountryIso = useMemo(
    () => getCountryIsoFromPhoneCode(createForm.countryCode),
    [createForm.countryCode],
  );

  const createStateOptions = useMemo(
    () => (createCountryIso ? State.getStatesOfCountry(createCountryIso) : []),
    [createCountryIso],
  );

  const createSelectedState = useMemo(
    () => findStateByValue(createCountryIso, createForm.state),
    [createCountryIso, createForm.state],
  );

  const createDistrictOptions = useMemo(
    () =>
      createCountryIso && createSelectedState?.isoCode
        ? City.getCitiesOfState(createCountryIso, createSelectedState.isoCode)
        : [],
    [createCountryIso, createSelectedState],
  );

  useEffect(() => {
    if (!showCreate) return;

    const targetRef = createWizardStep === 0 ? createNameInputRef : createStateInputRef;
    const timer = window.setTimeout(() => {
      targetRef.current?.focus();
    }, shouldReduceMotion ? 0 : 160);

    return () => window.clearTimeout(timer);
  }, [createWizardStep, shouldReduceMotion, showCreate]);

  const handleCreateMobileChange = (value) => {
    const option = getCountryOptionByValue(createForm.countryCode);
    const lengths = getCountryAllowedLengths(createForm.countryCode);
    setCreateForm((p) => ({
      ...p,
      mobile: sanitizePhoneDigits(value, option?.maxLength, lengths),
    }));
    setCreateMobileError("");
    setError("");
  };

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusLead, setStatusLead] = useState(null);
  const [statusValue, setStatusValue] = useState("");
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
  const [showDesignDurationModal, setShowDesignDurationModal] = useState(false);
  const [designStartAt, setDesignStartAt] = useState("");
  const [designEndAt, setDesignEndAt] = useState("");
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkLead, setRemarkLead] = useState(null);
  const [remarkValue, setRemarkValue] = useState("");

  const [saving, setSaving] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const visibleRows = useMemo(() => {
    if (!sortField) return rows;
    return [...rows].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "createdAt") {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }

      valA = String(valA || "").toLowerCase();
      valB = String(valB || "").toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortOrder]);

  const totalRows = visibleRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => visibleRows.slice(pageOffset, pageOffset + pageSize),
    [visibleRows, pageOffset, pageSize],
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPage]);

  const filteredDuplicateLeads = useMemo(() => {
    const searchTerm = String(dupFilters.search || "").trim().toLowerCase();
    const primaryTerm = String(dupFilters.primary || "").trim().toLowerCase();
    const statusTerm = String(dupFilters.status || "").trim().toLowerCase();
    const ownerTerm = String(dupFilters.owner || "").trim().toLowerCase();
    const quickDate = String(dupFilters.quickDate || "").trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - (6 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return (Array.isArray(duplicateLeads) ? duplicateLeads : []).filter((lead) => {
      const searchable = [
        lead?.name,
        lead?.mobile,
        lead?.email,
        lead?.primarySource,
        lead?.secondarySource,
        lead?.owner,
        lead?.status,
        lead?.svStatus,
        lead?.duplicateOfLeadRef,
        lead?.duplicateOfLeadName,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      if (searchTerm && !searchable.includes(searchTerm)) return false;

      if (primaryTerm) {
        const sourceValue = String(lead?.secondarySource || lead?.primarySource || "").trim().toLowerCase();
        if (!sourceValue.includes(primaryTerm)) return false;
      }

      if (statusTerm) {
        const leadStatus = String(lead?.status || "").trim().toLowerCase();
        if (!leadStatus.includes(statusTerm)) return false;
      }

      if (ownerTerm) {
        const ownerValue = String(lead?.owner || "").trim().toLowerCase();
        if (!ownerValue.includes(ownerTerm)) return false;
      }

      if (quickDate) {
        const createdAt = lead?.createdAt ? new Date(lead.createdAt).getTime() : 0;
        if (!createdAt) return false;
        if (quickDate === "today" && createdAt < startOfToday) return false;
        if (quickDate === "weekly" && createdAt < startOfWeek) return false;
        if (quickDate === "monthly" && createdAt < startOfMonth) return false;
      }

      return true;
    });
  }, [dupFilters, duplicateLeads]);

  const dupTotalRows = filteredDuplicateLeads.length;
  const dupPageCount = Math.max(1, Math.ceil(dupTotalRows / Math.max(1, dupPageSize)));
  const dupClampedPage = Math.min(Math.max(1, dupPage), dupPageCount);
  const dupPageOffset = (dupClampedPage - 1) * dupPageSize;
  const dupPagedRows = useMemo(
    () => filteredDuplicateLeads.slice(dupPageOffset, dupPageOffset + dupPageSize),
    [filteredDuplicateLeads, dupPageOffset, dupPageSize],
  );

  useEffect(() => {
    if (dupPage !== dupClampedPage) setDupPage(dupClampedPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dupClampedPage]);

  const filteredRejectedLeads = useMemo(() => {
    const term = String(rejectedSearch || "").trim().toLowerCase();
    if (!term) return rejectedLeads;
    return (Array.isArray(rejectedLeads) ? rejectedLeads : []).filter((row) => {
      const id = String(row.leadId || row.enquiryId || row.id || "").toLowerCase();
      const name = String(row.name || "").toLowerCase();
      const mobile = String(row.mobile || "").toLowerCase();
      const email = String(row.email || "").toLowerCase();
      const owner = String(row.owner || row.ownerName || "").toLowerCase();
      return id.includes(term) || name.includes(term) || mobile.includes(term) || email.includes(term) || owner.includes(term);
    });
  }, [rejectedLeads, rejectedSearch]);

  const rejectedTotalRows = filteredRejectedLeads.length;
  const rejectedPageCount = Math.max(1, Math.ceil(rejectedTotalRows / Math.max(1, rejectedPageSize)));
  const rejectedClampedPage = Math.min(Math.max(1, rejectedPage), rejectedPageCount);
  const rejectedPageOffset = (rejectedClampedPage - 1) * rejectedPageSize;
  const rejectedPagedRows = useMemo(
    () => filteredRejectedLeads.slice(rejectedPageOffset, rejectedPageOffset + rejectedPageSize),
    [filteredRejectedLeads, rejectedPageOffset, rejectedPageSize]
  );

  useEffect(() => {
    if (rejectedPage !== rejectedClampedPage) setRejectedPage(rejectedClampedPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectedClampedPage]);

  useEffect(() => {
    setRejectedPage(1);
  }, [rejectedSearch]);
  const createFlowScope = useMemo(
    () => (
      role === "SUPER_ADMIN" || !actorInstitutionName
        ? {}
        : { institutionName: actorInstitutionName }
    ),
    [actorInstitutionName, role],
  );
  const flowScopeByGroupId = useMemo(() => {
    const map = new Map();
    (groupOptions || []).forEach((group) => {
      if (group?.id == null) return;
      const institutionName = String(group?.institutionName || "").trim();
      if (!institutionName) return;
      map.set(String(group.id), institutionName);
    });
    return map;
  }, [groupOptions]);

  const loadLeads = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const normalizeRows = (input) => {
        const rowsData = Array.isArray(input) ? input : [];
        const seen = new Set();
        return rowsData.filter((row) => {
          const rowId = row?.id;
          if (rowId == null) return true;
          if (seen.has(rowId)) return false;
          seen.add(rowId);
          return true;
        });
      };
      const scopeFilters = { ...nextFilters, status: "" };
      const shouldLoadStatusScope = String(nextFilters?.status || "").trim() !== "";
      const scopePromise = shouldLoadStatusScope
        ? getLeads(scopeFilters).catch(() => null)
        : Promise.resolve(null);
      const [baseData, scopeData] = await Promise.all([
        getLeads(nextFilters),
        scopePromise,
      ]);
      setRows(normalizeRows(baseData));
      setLeadStatusScopeRows(normalizeRows(shouldLoadStatusScope ? (scopeData ?? baseData) : baseData));
      setSelectedLeadIds(new Set());
      setPage(1);
    } catch (e) {
      setRows([]);
      setLeadStatusScopeRows([]);
      setError(extractApiErrorMessage(e, "Failed to load leads"));
    } finally {
      setLoading(false);
    }
  };

  const promoteLeadToTop = (prevRows, updatedLead) => {
    if (!updatedLead?.id) return prevRows;
    const updatedId = String(updatedLead.id);
    const nextRow = { ...updatedLead };
    const nextRows = (Array.isArray(prevRows) ? prevRows : []).filter(
      (row) => String(row?.id) !== updatedId,
    );
    return [nextRow, ...nextRows];
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false;
      return;
    }
    const delayDebounce = setTimeout(() => {
      loadLeads(filters);
    }, 300);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      try {
        const canLoadGroupDirectory = role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER";
        const canLoadFlowConfig = role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER";
        const safeLoad = async (loader, fallback) => {
          try {
            return await loader();
          } catch {
            return fallback;
          }
        };
        const [
          primaries,
          secondaries,
          tertiaries,
          projects,
          groups,
          allGroups,
          branches,
          filterPayload,
          leadStatuses,
          flowPayload,
        ] = await Promise.all([
          safeLoad(() => getPrimarySources(), []),
          safeLoad(() => getSecondarySources(), []),
          safeLoad(() => getTertiarySources(), []),
          safeLoad(() => getProjects(), []),
          safeLoad(() => getAssignableLeadGroups(), []),
          canLoadGroupDirectory ? safeLoad(() => getUserGroups(), []) : Promise.resolve([]),
          role === "SUPER_ADMIN" ? safeLoad(() => getBranches(), []) : Promise.resolve([]),
          safeLoad(() => getLeadFilters(), {}),
          safeLoad(() => getLeadStatuses(), []),
          canLoadFlowConfig ? safeLoad(() => getLeadFlow(createFlowScope), {}) : Promise.resolve({}),
        ]);
        if (!isMounted) return;
        setPrimarySourceRows(Array.isArray(primaries) ? primaries : []);
        setSecondarySourceRows(Array.isArray(secondaries) ? secondaries : []);
        setTertiaryOptions(
          toOptionNames(tertiaries, ["tertiarySource", "name", "label"]),
        );
        setProjectOptions(toProjectNames(projects));
        setBranchOptions(Array.isArray(branches) ? branches : []);
        const assignable = Array.isArray(groups) ? groups : [];
        if (role === "EMPLOYEE") {
          setGroupOptions(assignable);
        } else {
          const byId = new Map(
            (Array.isArray(allGroups) ? allGroups : []).map((g) => [
              String(g.id),
              g,
            ]),
          );
          const mergedGroups = assignable.map((group) => {
            const full = byId.get(String(group.id));
            const pageKeys =
              Array.isArray(group.pageKeys) && group.pageKeys.length > 0
                ? group.pageKeys
                : Array.isArray(full?.pageKeys)
                  ? full.pageKeys
                  : [];
            return { ...group, pageKeys };
          });
          setGroupOptions(mergedGroups);
        }
        setLeadFilters({
          primarySources: Array.isArray(filterPayload?.primarySources)
            ? filterPayload.primarySources
            : [],
          leadStatuses: Array.isArray(filterPayload?.leadStatuses)
            ? filterPayload.leadStatuses
            : [],
          leadStatusCounts:
            filterPayload?.leadStatusCounts && typeof filterPayload.leadStatusCounts === "object"
              ? filterPayload.leadStatusCounts
              : {},
          svStatuses: Array.isArray(filterPayload?.svStatuses)
            ? filterPayload.svStatuses
            : [],
          owners: Array.isArray(filterPayload?.owners) ? filterPayload.owners : [],
        });
        const normalizedLeadStatuses = Array.isArray(leadStatuses)
          ? leadStatuses
              .map((item) => item?.leadStatus || item?.name || item?.status || "")
              .filter(Boolean)
              .filter((item) => !/site\s*visit/i.test(item))
          : [];

        const flowStatuses = Array.isArray(flowPayload?.rules)
          ? flowPayload.rules
              .flatMap((rule) => {
                const base = String(rule?.status || "").trim();
                const next =
                  rule?.next && typeof rule.next === "object"
                    ? Object.keys(rule.next).map((k) => String(k || "").trim())
                    : [];
                return [base, ...next];
              })
              .filter(Boolean)
          : [];

        const mergedStatuses = [
          ...normalizedLeadStatuses,
          ...flowStatuses,
        ]
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .filter((item, index, arr) => arr.indexOf(item) === index);

        setLeadStatusOptions(
          mergedStatuses.length ? mergedStatuses : DEFAULT_LEAD_STATUSES,
        );
        setFlowRules(Array.isArray(flowPayload?.rules) ? flowPayload.rules : []);
        setSourceOptionsLoaded(true);
      } catch (e) {
        if (!isMounted) return;
        setError(extractApiErrorMessage(e, "Failed to load lead options"));
      }
    };
    loadOptions();
    return () => {
      isMounted = false;
    };
  }, [createFlowScope, role]);

  useEffect(() => {
    let isMounted = true;
    const loadCreateGroupMembers = async () => {
      if (!createForm.leadGroupId) {
        setCreateGroupMembers([]);
        return;
      }
      if (role === "EMPLOYEE") {
        setCreateGroupMembers([]);
        return;
      }
      try {
        if (role === "TEAM_LEAD") {
          const employees = await getImportableEmployees();
          if (isMounted) {
            setCreateGroupMembers(
              (Array.isArray(employees) ? employees : []).map((e) => ({
                userId: e.id,
                username: e.username,
                role: e.role,
              }))
            );
          }
        } else {
          const members = await getGroupMembers(createForm.leadGroupId);
          if (isMounted) {
            setCreateGroupMembers(Array.isArray(members) ? members : []);
          }
        }
      } catch (e) {
        const status = Number(e?.response?.status ?? e?.status ?? e?.code ?? 0);
        if (status === 404) {
          if (isMounted) {
            setCreateGroupMembers([]);
          }
          return;
        }
        if (isMounted) {
          setCreateGroupMembers([]);
          setError(extractApiErrorMessage(e, "Failed to load group members"));
        }
      }
    };
    loadCreateGroupMembers();
    return () => {
      isMounted = false;
    };
  }, [createForm.leadGroupId, role]);

  const applyFilters = async () => {
    await loadLeads(filters);
  };

  const resetFilters = async () => {
    const cleared = {
      search: "",
      primary: "",
      status: "",
      svStatus: "",
      owner: "",
      quickDate: "",
    };
    setFilters(cleared);
    await loadLeads(cleared);
  };

  const leadStatusMenuItems = useMemo(() => {
    const statuses = Array.isArray(leadFilters.leadStatuses) ? leadFilters.leadStatuses : [];
    const countsByStatus = new Map();

    (Array.isArray(leadStatusScopeRows) ? leadStatusScopeRows : []).forEach((row) => {
      const rawStatus = String(row?.status || "").trim();
      if (!rawStatus) return;
      const key = rawStatus.toLowerCase();
      countsByStatus.set(key, (countsByStatus.get(key) || 0) + 1);
    });

    return statuses
      .map((status) => ({
        status,
        count: countsByStatus.get(String(status || "").trim().toLowerCase()) || 0,
      }))
      .filter((item) => item && item.count > 0);
  }, [leadFilters.leadStatuses, leadStatusScopeRows]);

  const leadStatusMenuTotal = useMemo(() => leadStatusScopeRows.length, [leadStatusScopeRows]);

  const handleLeadStatusBarClick = async (status) => {
    const nextFilters = { ...filters, status };
    setFilters(nextFilters);
    await loadLeads(nextFilters);
  };

  const leadStatusMenuLabel = filters.status
    ? formatStatusLabel(filters.status)
    : "All Statuses";

  const leadStatusMenuSelectedCount = useMemo(() => {
    if (!filters.status) return leadStatusMenuTotal;
    const match = leadStatusMenuItems.find(
      (item) => String(item.status || "").trim().toLowerCase() === String(filters.status || "").trim().toLowerCase(),
    );
    return Number(match?.count ?? 0);
  }, [filters.status, leadStatusMenuItems, leadStatusMenuTotal]);

  const applyDuplicateFilters = async () => {
    setDupFilterOpen(false);
    setDupPage(1);
  };

  const resetDuplicateFilters = async () => {
    setDupFilters({
      search: "",
      primary: "",
      status: "",
      svStatus: "",
      owner: "",
      quickDate: "",
    });
    setDupFilterOpen(false);
    setDupPage(1);
  };

  const exportDuplicateCsv = () => {
    const headers = [
      "Lead ID",
      "Name",
      "Mobile",
      "Primary Source",
      "Status",
      "Owner",
      "Matched Lead",
      "Created Date",
    ];
    const body = filteredDuplicateLeads.map((row) => [
      row.leadId || row.id || "",
      row.name || "",
      row.mobile || "",
      row.primarySource || row.secondarySource || "",
      row.status || "",
      row.owner || "",
      row.duplicateOfLeadName || row.duplicateOfLeadRef || "",
      row.createdAt || "",
    ]);
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    downloadTextFile(`duplicate-leads-${Date.now()}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const exportDuplicateExcel = () => {
    const headers = [
      "Lead ID",
      "Name",
      "Mobile",
      "Primary Source",
      "Status",
      "Owner",
      "Matched Lead",
      "Created Date",
    ];
    const escapeXml = (unsafe) =>
      String(unsafe ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const headerHtml = `      <tr>
        ${headers.map((h) => `<th>${escapeXml(h)}</th>`).join("\n        ")}
      </tr>`;

    const rowsHtml = filteredDuplicateLeads
      .map(
        (row) => `      <tr>
        <td>${escapeXml(row.leadId || row.id || "")}</td>
        <td>${escapeXml(row.name || "")}</td>
        <td>${escapeXml(row.mobile || "")}</td>
        <td>${escapeXml(row.primarySource || row.secondarySource || "")}</td>
        <td>${escapeXml(row.status || "")}</td>
        <td>${escapeXml(row.owner || "")}</td>
        <td>${escapeXml(row.duplicateOfLeadName || row.duplicateOfLeadRef || "")}</td>
        <td>${escapeXml(row.createdAt || "")}</td>
      </tr>`,
      )
      .join("\n");

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>DuplicateLeads</x:Name>
        <x:WorksheetOptions>
          <x:DisplayGridlines/>
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
</head>
<body>
  <table>
    <thead>
${headerHtml}
    </thead>
    <tbody>
${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    downloadTextFile(`duplicate-leads-${Date.now()}.xls`, template, "application/vnd.ms-excel;charset=utf-8;");
  };

  const exportDuplicatePdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Duplicate Leads Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [[
      "Lead ID",
      "Name",
      "Mobile",
      "Primary Source",
      "Status",
      "Owner",
      "Matched Lead",
      "Created Date",
    ]];

    const body = filteredDuplicateLeads.map((row) => [
      row.leadId || row.id || "",
      row.name || "",
      row.mobile || "",
      row.primarySource || row.secondarySource || "",
      row.status || "",
      row.owner || "",
      row.duplicateOfLeadName || row.duplicateOfLeadRef || "",
      row.createdAt || "",
    ]);

    autoTable(doc, {
      head: headers,
      body,
      startY: 70,
      styles: { fontSize: 8 },
    });

    doc.save(`duplicate-leads-${Date.now()}.pdf`);
  };

  const leadPageKey = CRM_PAGE_OPTIONS.find((item) => item.key === "leads")?.key || "leads";
  const leadEligibleGroups = useMemo(
    () =>
      groupOptions.filter((group) =>
        Array.isArray(group.pageKeys) ? group.pageKeys.includes(leadPageKey) : false,
      ),
    [groupOptions, leadPageKey],
  );
  const eligibleCreateGroupMembers = useMemo(
    () =>
      (Array.isArray(createGroupMembers) ? createGroupMembers : []).filter((member) => {
        const roleName = String(member?.role || "").toUpperCase();
        return roleName === "EMPLOYEE" || roleName === "TEAM_LEAD";
      }),
    [createGroupMembers],
  );
  const newLeadFlowGroupId = useMemo(() => {
    const rule = Array.isArray(flowRules)
      ? flowRules.find(
          (item) => String(item?.status || "").trim().toLowerCase() === "new lead",
        )
      : null;
    return rule?.handledByGroupId != null && String(rule.handledByGroupId).trim() !== ""
      ? String(rule.handledByGroupId)
      : "";
  }, [flowRules]);
  const createAllowedGroup = useMemo(
    () =>
      newLeadFlowGroupId
        ? leadEligibleGroups.find((group) => String(group.id) === String(newLeadFlowGroupId)) || null
        : null,
    [leadEligibleGroups, newLeadFlowGroupId],
  );
  const fallbackCreateGroup = useMemo(
    () => (leadEligibleGroups.length > 0 ? leadEligibleGroups[0] : null),
    [leadEligibleGroups],
  );
  const defaultCreateLeadGroupId = createAllowedGroup?.id
    ? String(createAllowedGroup.id)
    : fallbackCreateGroup?.id ? String(fallbackCreateGroup.id) : "";
  const shouldSelectCreateLeadGroup = role === "SUPER_ADMIN";
  const createBranchOptions = useMemo(
    () =>
      role === "SUPER_ADMIN"
        ? (Array.isArray(branchOptions) ? branchOptions : []).filter((branch) => branch?.id != null)
        : Array.from(
            new Set(
              leadEligibleGroups
                .map((group) => String(group?.institutionName || "").trim())
                .filter(Boolean),
            ),
          ),
    [branchOptions, leadEligibleGroups, role],
  );
  const createResolvedLeadGroup = useMemo(() => {
    if (!shouldSelectCreateLeadGroup) {
      return leadEligibleGroups.find((group) => String(group.id) === String(createForm.leadGroupId)) || null;
    }
    const branchName = String(createForm.createBranchName || "").trim().toLowerCase();
    if (!branchName || !createBranchFlowGroupId) return null;
    return (
      leadEligibleGroups.find(
        (group) =>
          String(group.id) === String(createBranchFlowGroupId) &&
          String(group?.institutionName || "").trim().toLowerCase() === branchName,
      ) || null
    );
  }, [
    createBranchFlowGroupId,
    createForm.createBranchName,
    createForm.leadGroupId,
    leadEligibleGroups,
    shouldSelectCreateLeadGroup,
  ]);
  const canCreateNewLead =
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "MANAGER" ||
    !newLeadFlowGroupId ||
    !!createAllowedGroup;
  const createCountryDisplayMaxLength = getCountryDisplayMaxLength(createForm.countryCode);

  const openCreateModal = () => {
    setCreateForm({
      ...EMPTY_CREATE_FORM,
      leadGroupId: shouldSelectCreateLeadGroup ? "" : defaultCreateLeadGroupId,
    });
    setCreateBranchFlowGroupId("");
    setCreateGroupMembers([]);
    setShowCreate(true);
    setCreateWizardStep(0);
    setError("");
    setCreateMobileError("");
    setCreateStep0Errors({ name: "", primarySource: "" });
  };

  useEffect(() => {
    if (!showCreate) return;
    if (shouldSelectCreateLeadGroup) return;
    if (createForm.leadGroupId || !defaultCreateLeadGroupId) return;
    setCreateForm((prev) => ({
      ...prev,
      leadGroupId: defaultCreateLeadGroupId,
    }));
  }, [showCreate, createForm.leadGroupId, defaultCreateLeadGroupId, shouldSelectCreateLeadGroup]);

  useEffect(() => {
    if (!showCreate || !shouldSelectCreateLeadGroup) return;
    const branchId = String(createForm.createBranchId || "").trim();
    const branchName = String(createForm.createBranchName || "").trim();
    if (!branchId && !branchName) {
      setCreateBranchFlowGroupId("");
      setCreateForm((prev) => ({
        ...prev,
        leadGroupId: "",
        assignedUserId: "",
      }));
      return;
    }

    let isMounted = true;
    const loadBranchFlow = async () => {
      try {
        const flowPayload = await getLeadFlow({
          branchId: branchId || null,
          institutionName: branchName,
        });
        if (!isMounted) return;
        const branchRules = Array.isArray(flowPayload?.rules) ? flowPayload.rules : [];
        const newLeadRule = branchRules.find(
          (item) => String(item?.status || "").trim().toLowerCase() === "new lead",
        );
        const nextGroupId =
          newLeadRule?.handledByGroupId != null && String(newLeadRule.handledByGroupId).trim() !== ""
            ? String(newLeadRule.handledByGroupId)
            : "";
        setCreateBranchFlowGroupId(nextGroupId);
        setCreateForm((prev) => ({
          ...prev,
          leadGroupId: nextGroupId,
          assignedUserId: "",
        }));
      } catch (e) {
        if (!isMounted) return;
        setCreateBranchFlowGroupId("");
        setCreateForm((prev) => ({
          ...prev,
          leadGroupId: "",
          assignedUserId: "",
        }));
        setError(extractApiErrorMessage(e, "Failed to load branch flow"));
      }
    };
    loadBranchFlow();
    return () => {
      isMounted = false;
    };
  }, [showCreate, shouldSelectCreateLeadGroup, createForm.createBranchId, createForm.createBranchName]);

  const loadDuplicateLeads = async () => {
    setDupLoading(true);
    setDupError('');
    try {
      const data = await getDuplicateLeads();
      setDuplicateLeads(Array.isArray(data) ? data : []);
      setDupPage(1);
    } catch (e) {
      setDupError(extractApiErrorMessage(e, 'Failed to load duplicate leads.'));
    } finally {
      setDupLoading(false);
    }
  };

  const handleConvertDuplicate = async (leadId, force = false) => {
    setConvertingLeadId(leadId);
    try {
      const result = await convertDuplicateLead(leadId, force);
      if (result?.stillDuplicate && !force) {
        setConvertConfirm({
          leadId,
          matchedRef: result.matchedLeadRef,
          matchedName: result.matchedLeadName,
        });
      } else {
        setDuplicateLeads((prev) => prev.filter((l) => l.id !== leadId));
        showSuccess('Lead converted to new lead successfully.');
        setConvertConfirm(null);
      }
    } catch (e) {
      setDupError(extractApiErrorMessage(e, 'Failed to convert lead.'));
    } finally {
      setConvertingLeadId(null);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'duplicates') {
      loadDuplicateLeads();
    }
    if (activeMainTab === 'campaign') {
      loadCampaignLeads();
    }
    if (activeMainTab === 'rejected') {
      loadRejectedLeads();
    }
  }, [activeMainTab]);

  const loadCampaignLeads = async () => {
    setCampaignLoading(true);
    setCampaignError('');
    try {
      const data = await getCampaignLeads();
      setCampaignLeads(Array.isArray(data) ? data : []);
    } catch (e) {
      setCampaignError('Failed to load campaign leads.');
    } finally {
      setCampaignLoading(false);
    }
  };

  const loadRejectedLeads = async () => {
    setRejectedLoading(true);
    setRejectedError('');
    try {
      const data = await getLeads({ status: "Rejected" });
      setRejectedLeads(Array.isArray(data) ? data : []);
    } catch (e) {
      setRejectedError('Failed to load rejected leads.');
    } finally {
      setRejectedLoading(false);
    }
  };

  const handleConvertRejected = async (row) => {
    if (!row?.id) return;
    const ok = window.confirm("Convert this rejected lead back to New Lead?");
    if (!ok) return;
    setRejectedSaving(true);
    try {
      await updateLeadRowStatus(row.id, "New Lead");
      setRejectedLeads((prev) => prev.filter((item) => String(item.id) !== String(row.id)));
      showSuccess("Converted successfully");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to convert lead"));
    } finally {
      setRejectedSaving(false);
    }
  };

  const handleDeleteRejected = async (row) => {
    if (!row?.id) return;
    const ok = window.confirm("Delete this rejected lead?");
    if (!ok) return;
    setRejectedSaving(true);
    try {
      await deleteLead(row.id);
      setRejectedLeads((prev) => prev.filter((item) => String(item.id) !== String(row.id)));
      showSuccess("Deleted successfully");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete lead"));
    } finally {
      setRejectedSaving(false);
    }
  };

  const exportRejectedCsv = () => {
    const targetRows = filteredRejectedLeads;
    const headers = [
      "S.No",
      "Name",
      "Mobile",
      "Email",
      "Status",
      "Owner",
      "Created Date",
    ];
    const body = targetRows.map((row, idx) => [
      idx + 1,
      row.name || "",
      row.mobile || "",
      row.email || "",
      row.status || "Rejected",
      row.owner || row.ownerName || "",
      row.createdAt || "",
    ]);
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    downloadTextFile(`rejected-leads-${Date.now()}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const exportRejectedExcel = () => {
    const targetRows = filteredRejectedLeads;
    const headers = [
      "S.No",
      "Name",
      "Mobile",
      "Email",
      "Status",
      "Owner",
      "Created Date",
    ];
    const escapeXml = (unsafe) => {
      return String(unsafe ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const headerHtml = `      <tr>
        ${headers.map((h) => `<th>${escapeXml(h)}</th>`).join("\n        ")}
      </tr>`;

    const rowsHtml = targetRows
      .map(
        (row, idx) => `      <tr>
        <td>${idx + 1}</td>
        <td>${escapeXml(row.name)}</td>
        <td>${escapeXml(row.mobile)}</td>
        <td>${escapeXml(row.email)}</td>
        <td>${escapeXml(row.status || "Rejected")}</td>
        <td>${escapeXml(row.owner || row.ownerName)}</td>
        <td>${escapeXml(row.createdAt)}</td>
      </tr>`,
      )
      .join("\n");

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>Rejected Leads</x:Name>
        <x:WorksheetOptions>
          <x:DisplayGridlines/>
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
</head>
<body>
  <table>
    <thead>
${headerHtml}
    </thead>
    <tbody>
${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    downloadTextFile(`rejected-leads-${Date.now()}.xls`, template, "application/vnd.ms-excel;charset=utf-8;");
  };

  const exportRejectedPdf = () => {
    const targetRows = filteredRejectedLeads;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const title = "Rejected Leads Export";
    const generatedAt = new Date().toLocaleString();
    doc.setFontSize(14);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${generatedAt}`, 40, 58);

    const headers = [[
      "S.No",
      "Name",
      "Mobile",
      "Email",
      "Status",
      "Owner",
      "Created Date",
    ]];

    const body = targetRows.map((row, idx) => [
      idx + 1,
      row.name || "",
      row.mobile || "",
      row.email || "",
      row.status || "Rejected",
      row.owner || row.ownerName || "",
      row.createdAt || "",
    ]);

    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [33, 37, 41] },
      margin: { left: 24, right: 24 },
      tableWidth: "auto",
    });

    doc.save(`rejected-leads-${Date.now()}.pdf`);
  };

  const loadCampaignEmployees = async () => {
    try {
      const list = await getImportableEmployees();
      setCampaignEmployees(Array.isArray(list) ? list : []);
    } catch (_) { /* ignore */ }
  };

  const openCampaignAssign = (preselectedId = null) => {
    if (preselectedId) setCampaignSelectedIds(new Set([preselectedId]));
    setCampaignAssignBranchId('');
    setCampaignAssignGroupId('');
    setCampaignAssignUserId('');
    setCampaignGroupMembers([]);
    // For non-SUPER_ADMIN, auto-resolve the flow group immediately
    if (role !== 'SUPER_ADMIN') {
      loadCampaignFlowGroup(null);
    }
    setCampaignAssignOpen(true);
  };

  // Resolve the "New Lead" group from the flow config for the given branch
  const loadCampaignFlowGroup = async (branchId) => {
    setCampaignAssignGroupLoading(true);
    setCampaignAssignUserId('');
    setCampaignGroupMembers([]);
    try {
      const flowPayload = await getLeadFlow(
        branchId ? { branchId, institutionName: '' } : {}
      );
      const rules = Array.isArray(flowPayload?.rules) ? flowPayload.rules : [];
      const newLeadRule = rules.find(
        (r) => String(r?.status || '').trim().toLowerCase() === 'new lead'
      );
      const groupId = newLeadRule?.handledByGroupId
        ? String(newLeadRule.handledByGroupId)
        : '';
      setCampaignAssignGroupId(groupId);
      if (groupId) {
        const members = await getGroupMembers(groupId);
        setCampaignGroupMembers(Array.isArray(members) ? members : []);
      }
    } catch (_) {
      setCampaignAssignGroupId('');
      setCampaignGroupMembers([]);
    } finally {
      setCampaignAssignGroupLoading(false);
    }
  };

  const onCampaignBranchChange = (branchId) => {
    setCampaignAssignBranchId(branchId);
    setCampaignAssignGroupId('');
    setCampaignAssignUserId('');
    setCampaignGroupMembers([]);
    if (branchId) loadCampaignFlowGroup(branchId);
  };

  const submitCampaignAssign = async () => {
    if (!campaignAssignUserId) { showError('Please select an employee.'); return; }
    if (!campaignAssignGroupId) { showError('Could not resolve lead group. Please select a branch.'); return; }
    setCampaignAssignLoading(true);
    try {
      for (const campaignLeadId of Array.from(campaignSelectedIds)) {
        await assignCampaignLead(
          campaignLeadId,
          Number(campaignAssignUserId),
          Number(campaignAssignGroupId)
        );
      }
      showSuccess(`${campaignSelectedIds.size} campaign lead(s) assigned successfully.`);
      setCampaignAssignOpen(false);
      setCampaignAssignBranchId('');
      setCampaignAssignGroupId('');
      setCampaignAssignUserId('');
      setCampaignSelectedIds(new Set());
      loadCampaignLeads();
      if (typeof handleRefresh === 'function') handleRefresh();
    } catch (e) {
      showError(e?.response?.data?.message || 'Failed to assign lead. Please try again.');
    } finally {
      setCampaignAssignLoading(false);
    }
  };

  const submitCampaignTest = async () => {
    if (!campaignTestForm.fullName.trim() || !campaignTestForm.phone.trim()) {
      showError("Name and Phone number are required to submit a test lead.");
      return;
    }
    setCampaignTestLoading(true);
    try {
      // Send snake_case keys – matches what the backend reads from the Map<String,String>
      const payload = {
        lead_id:       "TEST_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        full_name:     campaignTestForm.fullName,
        phone:         campaignTestForm.phone,
        email:         campaignTestForm.email,
        city:          campaignTestForm.city,
        moq:           campaignTestForm.moq,
        industry:      campaignTestForm.industry,
        platform:      campaignTestForm.platform,
        ad_name:       campaignTestForm.adName,
        campaign_name: campaignTestForm.campaignName,
      };
      await submitTestLead(payload);
      showSuccess("Test lead submitted! It now appears in the Campaign Leads list.");
      setCampaignTestOpen(false);
      setCampaignTestForm({
        fullName: "",
        phone: "",
        email: "",
        city: "",
        moq: "",
        industry: "",
        platform: "ig",
        adName: "Corrugated box_ Ad 1",
        campaignName: "Leads Campaign_corrugated boxes J - 18"
      });
      // Small delay to let the DB write complete, then refresh
      setTimeout(() => loadCampaignLeads(), 300);
    } catch (e) {
      showError("Failed to submit test lead. Make sure the backend is running.");
    } finally {
      setCampaignTestLoading(false);
    }
  };


  const toggleCampaignSelect = (id) => {
    setCampaignSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllCampaign = (list) => {
    if (campaignSelectedIds.size === list.length && list.length > 0) {
      setCampaignSelectedIds(new Set());
    } else {
      setCampaignSelectedIds(new Set(list.map((l) => l.id)));
    }
  };



  const goToNextCreateStep = () => {
    const errors = { name: "", primarySource: "" };
    let hasError = false;

    if (!createForm.name.trim()) {
      errors.name = "Full name is required";
      hasError = true;
    }

    if (!createForm.mobile.trim()) {
      setCreateMobileError("Mobile number is required");
      hasError = true;
    } else {
      const phoneErr = validatePhoneNumber(createForm.mobile, createForm.countryCode);
      if (phoneErr) {
        setCreateMobileError(phoneErr);
        hasError = true;
      } else {
        setCreateMobileError("");
      }
    }

    if (!createForm.primarySource.trim()) {
      errors.primarySource = "Primary source is required";
      hasError = true;
    }

    setCreateStep0Errors(errors);
    if (!hasError) {
      setCreateWizardStep((step) => Math.min(step + 1, 1));
    }
  };

  const handleCreateLead = async () => {
    const step0Errors = { name: "", primarySource: "" };
    let step0HasError = false;
    if (!createForm.name.trim()) { step0Errors.name = "Full name is required"; step0HasError = true; }
    if (!createForm.mobile.trim()) { setCreateMobileError("Mobile number is required"); step0HasError = true; }
    else {
      const phoneValidation = validatePhoneNumber(createForm.mobile, createForm.countryCode);
      if (phoneValidation) { setCreateMobileError(phoneValidation); step0HasError = true; }
      else { setCreateMobileError(""); }
    }
    if (!createForm.primarySource.trim()) { step0Errors.primarySource = "Primary source is required"; step0HasError = true; }
    setCreateStep0Errors(step0Errors);
    if (step0HasError) { setCreateWizardStep(0); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim() || null,
        countryCode: createForm.countryCode,
        mobile: createForm.mobile.trim(),
        companyName: createForm.companyName.trim() || null,
        productType: createForm.productType.trim() || null,
        primarySource: createForm.primarySource.trim(),
        secondarySource: createForm.secondarySource.trim() || null,
        tertiarySource: createForm.tertiarySource.trim() || null,
        projectName: createForm.projectName.trim() || null,
        leadGroupId: createForm.leadGroupId ? Number(createForm.leadGroupId) : null,
        assignedUserId: createForm.assignedUserId ? Number(createForm.assignedUserId) : null,
        leadCountry: createCountryIso || null,
        leadState: createForm.state || null,
        leadCity: createForm.district || null,
        streetAddress: createForm.streetAddress?.trim() || null,
        gstin: createForm.gstin?.trim() || null,
      };

      const created = await createLead(payload);
      setRows((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setCreateMobileError("");
      setCreateStep0Errors({ name: "", primarySource: "" });
      setCreateWizardStep(0);
      if (created.isDuplicate) {
        setDupWarnLead(created);
      } else {
        showSuccess("Lead created successfully");
      }
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to create lead"));
    } finally {
      setSaving(false);
    }
  };

  const openStatusModal = (lead) => {
    setStatusLead(lead);
    setStatusValue(String(lead?.status || "").trim());
    setDesignStartAt(toInputDateTime(lead?.designStartAt || ""));
    setDesignEndAt(toInputDateTime(lead?.designEndAt || ""));
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
    setError("");
    setStatusErrors({});

    const groupId = lead?.leadGroupId ?? lead?.assignedGroupId ?? null;
    const institutionName = groupId != null ? flowScopeByGroupId.get(String(groupId)) : "";
    getLeadFlow(institutionName ? { institutionName } : {})
      .then((flow) => {
        setFlowRules(Array.isArray(flow?.rules) ? flow.rules : []);
      })
      .catch(() => {
        setFlowRules([]);
      });
  };

  const handleStatusBadgeClick = (lead) => {
    openStatusModal(lead);
  };

  const resolveNextGroupIdForStatus = (status) => {
    if (!Array.isArray(flowRules)) return null;
    const targetRule = flowRules.find(
      (rule) =>
        normalizeStatusLabelKey(rule?.status) ===
        normalizeStatusLabelKey(status),
    );
    return targetRule?.handledByGroupId ?? null;
  };

  const applyManagedStatusUpdate = async (nextKey, leadOverride = statusLead) => {
    const activeLead = leadOverride || statusLead;
    if (!activeLead?.id) return;
    const nextGroupId = resolveNextGroupIdForStatus(statusValue);

    // Preserve the current owner so the backend can continue the round-robin flow.
    if ((nextKey === "design" || nextKey === "production") && activeLead?.ownerUserId) {
      await updateLeadDetails(activeLead.id, {
        paymentOwnerId: activeLead.ownerUserId,
      });
    }

    const nextLead = await updateLeadRowStatus(activeLead.id, statusValue, nextGroupId);

    setRows((prev) => promoteLeadToTop(prev, nextLead));
    setLeadStatusScopeRows((prev) => promoteLeadToTop(prev, nextLead));
    setShowStatusModal(false);
    setShowDesignDurationModal(false);
    setStatusLead(null);
    showSuccess(
      `Lead moved to ${nextKey.charAt(0).toUpperCase() + nextKey.slice(1)} status with round-robin assignment`,
    );
  };

  const saveStatusUpdate = async () => {
    if (!statusLead?.id) return;
    const errors = {};
    if (!statusValue) {
      errors.statusValue = true;
      setStatusErrors(errors);
      setError("Please select a status");
      return;
    }
    const currentKey = String(statusLead?.status || "").trim().toLowerCase();
    const nextKey = String(statusValue || "").trim().toLowerCase();
    if (role === "EMPLOYEE" && currentKey === "design" && nextKey !== "design") {
      setSaving(true);
      setError("");
      try {
        const messages = await getLeadChatMessages(statusLead.id, "CUSTOMER");
        const hasFinalDesign = Array.isArray(messages) && messages.some(isFinalDesignUploadMessage);
        if (!hasFinalDesign) {
          const message = "Please upload the final design before changing status from Design";
          setError(message);
          showError(message);
          return;
        }
      } catch (e) {
        const message = extractApiErrorMessage(e, "Failed to verify final design upload");
        setError(message);
        showError(message);
        return;
      } finally {
        setSaving(false);
      }
    }
    // Validate and handle Attempted form
    if (nextKey === "attempted") {
      if (!attemptedOpenReason) errors.attemptedOpenReason = true;
      if (!attemptedCallRemarks) errors.attemptedCallRemarks = true;
      if (Object.keys(errors).length > 0) {
        setStatusErrors(errors);
        setError("Please complete Attempted Reason and Manual Details for Attempted status");
        return;
      }
    }

    if (nextKey === "not attempted") {
      if (!notAttemptedCallStatus) errors.notAttemptedCallStatus = true;
      if (!notAttemptedCallRemarks) errors.notAttemptedCallRemarks = true;
      if (Object.keys(errors).length > 0) {
        setStatusErrors(errors);
        setError("Please complete Not Attempted Reason and Manual Details for Not Attempted status");
        return;
      }
    }

    // Validate and handle Interested form
    if (nextKey === "interested") {
      if (!interestedCallStatus) errors.interestedCallStatus = true;
      if (!interestedFollowUpDate) errors.interestedFollowUpDate = true;
      if (!interestedCallRemarks) errors.interestedCallRemarks = true;
      if (Object.keys(errors).length > 0) {
        setStatusErrors(errors);
        setError("Please complete Interested Reason, Date, and Manual Details for Interested status");
        return;
      }
    }

    // Validate and handle Rejected form
    if (nextKey === "rejected") {
      if (!rejectedReason) {
        errors.rejectedReason = true;
        setStatusErrors(errors);
        setError("Please select Rejected Reason");
        return;
      }
    }

    setStatusErrors({});

    if (nextKey === "allocate") {
      setShowStatusModal(false);
      setStatusLead(null);
      navigate(`/leads/${statusLead.id}?status=${encodeURIComponent(statusValue)}`);
      return;
    }

    if (nextKey === "requirement") {
      setShowStatusModal(false);
      setStatusLead(null);
      setError("");
      navigate(`/requirements/add?leadId=${statusLead.id}`);
      return;
    }

    if (nextKey === "design" && (!statusLead?.designStartAt || !statusLead?.designEndAt)) {
      setShowStatusModal(false);
      setShowDesignDurationModal(true);
      return;
    }
    
    // Handle payment/design/production status with roundâ€‘robin assignment and history
    if (nextKey === "payment" || nextKey === "design" || nextKey === "production") {
      setSaving(true);
      setError("");
      try {
        await applyManagedStatusUpdate(nextKey);
      } catch (e) {
        setError(extractApiErrorMessage(e, "Failed to update status"));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (nextKey === "payment" || nextKey === "design" || nextKey === "production") {
      setSaving(true);
      setError("");
      try {
        // preserve existing payment owner before changing status
        if ((nextKey === "design" || nextKey === "production") && statusLead?.ownerUserId) {
          // store the current owner so we can restore him later
          await updateLeadDetails(statusLead.id, {
            paymentOwnerId: statusLead.ownerUserId,
          });
        }

        const nextLead = await updateLeadRowStatus(statusLead.id, statusValue);

        // when moving to payment, seed total/paid/remaining if absent
        if (nextKey === "payment") {
          // no seeding now
        }

        // payment/design assignment is backend-owned; avoid overriding the
        // server-selected flow group or owner from the client.

        if (nextKey === "payment") {
          try {
            await updateCustomerLeadStatus("Payment", statusLead.id);
          } catch (custErr) {
            console.warn("Could not update customer status:", custErr);
          }
        }

        setRows((prev) => promoteLeadToTop(prev, nextLead));
        setLeadStatusScopeRows((prev) => promoteLeadToTop(prev, nextLead));
        setShowStatusModal(false);
        setStatusLead(null);
        showSuccess(
          `âœ“ Lead moved to ${nextKey.charAt(0).toUpperCase() + nextKey.slice(1)} status with round-robin assignment`,
        );
      } catch (e) {
        setError(extractApiErrorMessage(e, "Failed to update status"));
      } finally {
        setSaving(false);
      }
      return;
    }

    // Standard status update
    setSaving(true);
    setError("");
    try {
      const nextGroupId = resolveNextGroupIdForStatus(statusValue);
      const nextLead = await updateLeadRowStatus(statusLead.id, statusValue, nextGroupId);

      // Update lead details with Attempted/Interested/Rejected data
      if (nextKey === "attempted") {
        await updateLeadDetails(statusLead.id, {
          attemptedOpenReason: attemptedOpenReason || null,
          attemptedCallStatus: null,
          attemptedCallRemarks: attemptedCallRemarks || null,
          attemptedFollowUpDate: null,
          notAttemptedCallStatus: null,
          notAttemptedCallRemarks: null,
        });
      } else if (nextKey === "not attempted") {
        await updateLeadDetails(statusLead.id, {
          notAttemptedCallStatus: notAttemptedCallStatus || null,
          notAttemptedCallRemarks: notAttemptedCallRemarks || null,
        });
      } else if (nextKey === "interested") {
        await updateLeadDetails(statusLead.id, {
          interestedCallStatus: interestedCallStatus || null,
          interestedFollowUpDate: interestedFollowUpDate
            ? new Date(interestedFollowUpDate).toISOString()
            : null,
          interestedCallRemarks: interestedCallRemarks || null,
        });
      } else if (nextKey === "rejected") {
        await updateLeadDetails(statusLead.id, {
          rejectedReason: rejectedReason || null,
          rejectedReasonSubtype: rejectedReasonSubtype || null,
        });
      }

      setRows((prev) => promoteLeadToTop(prev, nextLead));
      setLeadStatusScopeRows((prev) => promoteLeadToTop(prev, nextLead));
      setShowStatusModal(false);
      setStatusLead(null);
      showSuccess("Lead status updated");
      // Reset form fields
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
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  const submitDesignDuration = async () => {
    if (!statusLead?.id) return;
    if (!designStartAt || !designEndAt) {
      setError("Please select design start and end dates");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const detailUpdate = await updateLeadDetails(statusLead.id, {
        designStartAt,
        designEndAt,
      });
      const nextLead = { ...statusLead, ...detailUpdate };
      await applyManagedStatusUpdate("design", nextLead);
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to update design duration"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (lead) => {
    if (!lead?.id) return;
    showConfirm({
      title: "Delete Lead",
      message: "Are you sure you want to delete this lead? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        setSaving(true);
        setError("");
        try {
          await deleteLead(lead.id);
          setRows((prev) => prev.filter((row) => String(row.id) !== String(lead.id)));
          setDuplicateLeads((prev) => prev.filter((row) => String(row.id) !== String(lead.id)));
          showSuccess("Lead deleted");
        } catch (e) {
          setError(extractApiErrorMessage(e, "Failed to delete lead"));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;
    showConfirm({
      title: "Delete Multiple Leads",
      message: `Are you sure you want to delete the selected ${selectedLeadIds.size} leads? This action cannot be undone.`,
      confirmLabel: "Delete All",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        setSaving(true);
        setError("");
        try {
          await Promise.all(Array.from(selectedLeadIds).map((id) => deleteLead(id)));
          setRows((prev) => prev.filter((row) => !selectedLeadIds.has(row.id)));
          setDuplicateLeads((prev) => prev.filter((row) => !selectedLeadIds.has(row.id)));
          showSuccess(`${selectedLeadIds.size} leads deleted successfully`);
          setSelectedLeadIds(new Set());
        } catch (e) {
          setError(extractApiErrorMessage(e, "Failed to delete some leads"));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const openBulkAssignModal = async () => {
    if (selectedLeadIds.size === 0) return;
    setBulkAssignLoading(true);
    try {
      const emps = await getImportableEmployees();
      setBulkAssignEmployees(Array.isArray(emps) ? emps : []);
      setBulkAssignOpen(true);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load employees for assignment"));
    } finally {
      setBulkAssignLoading(false);
    }
  };

  const submitBulkAssign = async () => {
    if (!bulkAssignUserId) {
      showError("Please select an employee");
      return;
    }
    setBulkAssignLoading(true);
    try {
      const emp = bulkAssignEmployees.find((e) => String(e.id) === String(bulkAssignUserId));
      const empName = emp ? emp.username || emp.name : "Assigned";
      
      await Promise.all(
        Array.from(selectedLeadIds).map((id) =>
          updateLeadAllocator(id, Number(bulkAssignUserId))
        )
      );

      setRows((prev) =>
        prev.map((row) => {
          if (selectedLeadIds.has(row.id)) {
            return { ...row, owner: empName, ownerUserId: Number(bulkAssignUserId) };
          }
          return row;
        })
      );
      
      showSuccess(`Allocated ${selectedLeadIds.size} leads successfully`);
      setSelectedLeadIds(new Set());
      setBulkAssignOpen(false);
      setBulkAssignUserId("");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to assign some leads"));
    } finally {
      setBulkAssignLoading(false);
    }
  };

  const orderedLeadStatuses = useMemo(() => {
    const currentRowStatus = String(statusLead?.status || "").trim();
    const flowStatuses = Array.isArray(flowRules)
      ? flowRules.flatMap((rule) => {
          const base = String(rule?.status || "").trim();
          const next =
            rule?.next && typeof rule.next === "object"
              ? Object.keys(rule.next).map((k) => String(k || "").trim())
              : [];
          return [base, ...next];
        })
      : [];

    return Array.from(
      new Set(
        [...flowStatuses, currentRowStatus]
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    );
  }, [flowRules, statusLead?.status]);

  const normalizeKey = (s) => normalizeStatusLabelKey(s);
  const allowedStatusOptions = useMemo(() => {
    const current = normalizeKey(statusLead?.status);
    if (!current) {
      return orderedLeadStatuses;
    }

    // Find the flow rule for the current status
    const rule = Array.isArray(flowRules)
      ? flowRules.find((r) => normalizeKey(r?.status) === current)
      : null;

    // Rule exists — only show explicitly configured next statuses
    if (rule) {
      if (rule.next && typeof rule.next === "object") {
        const nextKeys = Object.keys(rule.next);
        if (nextKeys.length > 0) {
          return nextKeys.map((item) => String(item || "").trim()).filter(Boolean);
        }
      }
      // Rule exists but no next statuses configured -> block transitions.
      return [];
    }

    // No flow rule at all for this status -> show the configured flow statuses
    return orderedLeadStatuses;
  }, [flowRules, orderedLeadStatuses, statusLead]);

  const displayStatusOptions = useMemo(
    () => uniqueStatusOptions(allowedStatusOptions),
    [allowedStatusOptions],
  );

  const openRemarkModal = (lead) => {
    setRemarkLead(lead);
    setRemarkValue(lead?.svStatus || "");
    setShowRemarkModal(true);
    setError("");
  };

  const saveRemarkUpdate = () => {
    if (!remarkLead?.id) return;
    setRows((prev) =>
      prev.map((row) =>
        String(row.id) === String(remarkLead.id)
          ? { ...row, svStatus: remarkValue.trim() }
          : row,
      ),
    );
    setShowRemarkModal(false);
    setRemarkLead(null);
    showSuccess("Remark updated");
  };

  const toggleLeadSelection = (leadId) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((row) => row.id);
    const allSelectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedLeadIds.has(id));
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const exportCampaignCsv = () => {
    const targetRows = getCampaignExportRows();
    const headers = [
      "Lead ID",
      "Name",
      "Mobile",
      "Email",
      "Platform",
      "Ad Name",
      "MOQ",
      "Industry",
      "Created Date",
    ];
    const body = targetRows.map((row) => [
      row.leadId || row.id || "",
      row.fullName || "",
      row.phone || "",
      row.email || "",
      row.platform || "",
      row.adName || "",
      row.moq || "",
      row.industry || "",
      row.createdAt || "",
    ]);
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    downloadTextFile(`campaign-leads-${Date.now()}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const exportCampaignExcel = () => {
    const targetRows = getCampaignExportRows();
    const headers = [
      "Lead ID",
      "Name",
      "Mobile",
      "Email",
      "Platform",
      "Ad Name",
      "MOQ",
      "Industry",
      "Created Date",
    ];

    const escapeXml = (unsafe) => {
      return String(unsafe ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const headerHtml = `      <tr>
        ${headers.map((h) => `<th>${escapeXml(h)}</th>`).join("\n        ")}
      </tr>`;

    const rowsHtml = targetRows
      .map(
        (row) => `      <tr>
        <td>${escapeXml(row.leadId || row.id || "")}</td>
        <td>${escapeXml(row.fullName)}</td>
        <td>${escapeXml(row.phone)}</td>
        <td>${escapeXml(row.email)}</td>
        <td>${escapeXml(row.platform)}</td>
        <td>${escapeXml(row.adName)}</td>
        <td>${escapeXml(row.moq)}</td>
        <td>${escapeXml(row.industry)}</td>
        <td>${escapeXml(row.createdAt)}</td>
      </tr>`,
      )
      .join("\n");

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>Campaign Leads</x:Name>
        <x:WorksheetOptions>
          <x:DisplayGridlines/>
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
</head>
<body>
  <table>
    <thead>
${headerHtml}
    </thead>
    <tbody>
${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    downloadTextFile(`campaign-leads-${Date.now()}.xls`, template, "application/vnd.ms-excel;charset=utf-8;");
  };

  const exportCampaignPdf = () => {
    const targetRows = getCampaignExportRows();
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Campaign Leads Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    autoTable(doc, {
      head: [[
        "Lead ID",
        "Name",
        "Mobile",
        "Email",
        "Platform",
        "Ad Name",
        "MOQ",
        "Industry",
        "Created Date",
      ]],
      body: targetRows.map((row) => [
        row.leadId || row.id || "",
        row.fullName || "",
        row.phone || "",
        row.email || "",
        row.platform || "",
        row.adName || "",
        row.moq || "",
        row.industry || "",
        row.createdAt || "",
      ]),
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [33, 37, 41] },
      margin: { left: 24, right: 24 },
      tableWidth: "auto",
    });

    doc.save(`campaign-leads-${Date.now()}.pdf`);
  };

  const exportCsv = () => {
    const targetRows = selectedLeadIds.size > 0
      ? visibleRows.filter((r) => selectedLeadIds.has(r.id))
      : visibleRows;

    const headers = [
      "Lead ID",
      "Name",
      "Mobile",
      "Email",
      "Primary",
      "Secondary",
      "Status",
      "Group",
      "Owner",
      "Created Date",
    ];
    const body = targetRows.map((row) => [
      row.leadId || "",
      row.name || "",
      row.mobile || "",
      row.email || "",
      row.primarySource || "",
      row.secondarySource || "",
      row.status || "",
      row.leadGroupName || "",
      row.owner || "",
      row.createdAt || "",
    ]);
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    downloadTextFile(`leads-${Date.now()}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const exportExcel = () => {
    const targetRows = selectedLeadIds.size > 0
      ? visibleRows.filter((r) => selectedLeadIds.has(r.id))
      : visibleRows;

    const headers = [
      "Lead ID",
      "Name",
      "Mobile",
      "Email",
      "Primary",
      "Secondary",
      "Status",
      "Group",
      "Owner",
      "Created Date",
    ];

    const escapeXml = (unsafe) => {
      return String(unsafe ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const headerHtml = `      <tr>
        ${headers.map((h) => `<th>${escapeXml(h)}</th>`).join("\n        ")}
      </tr>`;

    const rowsHtml = targetRows
      .map(
        (row) => `      <tr>
        <td>${escapeXml(row.leadId)}</td>
        <td>${escapeXml(row.name)}</td>
        <td>${escapeXml(row.mobile)}</td>
        <td>${escapeXml(row.email)}</td>
        <td>${escapeXml(row.primarySource)}</td>
        <td>${escapeXml(row.secondarySource)}</td>
        <td>${escapeXml(row.status)}</td>
        <td>${escapeXml(row.leadGroupName)}</td>
        <td>${escapeXml(row.owner)}</td>
        <td>${escapeXml(row.createdAt)}</td>
      </tr>`,
      )
      .join("\n");

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>Leads</x:Name>
        <x:WorksheetOptions>
          <x:DisplayGridlines/>
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
</head>
<body>
  <table>
    <thead>
${headerHtml}
    </thead>
    <tbody>
${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    downloadTextFile(`leads-${Date.now()}.xls`, template, "application/vnd.ms-excel;charset=utf-8;");
  };

  const exportPdf = () => {
    const targetRows = selectedLeadIds.size > 0
      ? visibleRows.filter((r) => selectedLeadIds.has(r.id))
      : visibleRows;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const title = "Leads Export";
    const generatedAt = new Date().toLocaleString();
    doc.setFontSize(14);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${generatedAt}`, 40, 58);

    const headers = [[
      "Lead ID",
      "Name",
      "Mobile",
      "Email",
      "Primary",
      "Secondary",
      "Status",
      "Group",
      "Owner",
      "Created Date",
    ]];

    const body = targetRows.map((row) => [
      row.leadId || "",
      row.name || "",
      row.mobile || "",
      row.email || "",
      row.primarySource || "",
      row.secondarySource || "",
      row.status || "",
      row.leadGroupName || "",
      row.owner || "",
      row.createdAt || "",
    ]);

    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [33, 37, 41] },
      margin: { left: 24, right: 24 },
      tableWidth: "auto",
    });

    doc.save(`leads-${Date.now()}.pdf`);
  };

  return (
    <div className="content"><div className="container-fluid leads-page-shell">
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Leads</h2>
            <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>Add, view and manage all your leads in one place.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {role !== "EMPLOYEE" && (
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                style={{ borderColor: "#3b82f6", color: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
                onClick={() => navigate('/leads/import')}
              >
                <i className="ti ti-upload" />
                Import Leads
              </button>
            )}
            <button
              className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              onClick={openCreateModal}
              disabled={!canCreateNewLead}
              title={!canCreateNewLead ? "Your branch flow is assigned to a group outside your access scope." : ""}
            >
              <i className="ti ti-plus" />
              Create New Lead
            </button>
          </div>
        </div>
      </div>
      <ul className="nav nav-tabs mb-1">
        <li className="nav-item">
          <button
            className={`nav-link ${activeMainTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('leads')}
          >
            Leads
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeMainTab === 'duplicates' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('duplicates')}
          >
            Duplicates
            {duplicateLeads.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">{duplicateLeads.length}</span>
            )}
          </button>
        </li>
        {role !== 'EMPLOYEE' && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeMainTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('rejected')}
            >
              <i className="ti ti-circle-x me-1" style={{ fontSize: '0.9rem' }} />
              Rejected Leads
              {rejectedLeads.length > 0 && (
                <span className="badge bg-danger ms-2" style={{ fontSize: '0.72rem' }}>{rejectedLeads.length}</span>
              )}
            </button>
          </li>
        )}
        <li className="nav-item">
          <button
            className={`nav-link ${activeMainTab === 'campaign' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('campaign')}
          >
            <i className="ti ti-speakerphone me-1" style={{ fontSize: '0.9rem' }} />
            Campaign Leads
            {campaignLeads.length > 0 && (
              <span className="badge bg-primary ms-2" style={{ fontSize: '0.72rem' }}>{campaignLeads.length}</span>
            )}
          </button>
        </li>
      </ul>

      {activeMainTab === 'leads' && (
      <div className="leads-page-body">
          {/* Redesigned Controls Row */}
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <LeadSearch
                search={filters.search}
                setSearch={(val) => setFilters((prev) => ({ ...prev, search: val }))}
                applyFilters={applyFilters}
              />

              <div className="dropdown lead-status-dropdown">
                <button
                  className="btn btn-outline-filter dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  id="leadStatusDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                >
                  <i className="ti ti-adjustments-horizontal" style={{ fontSize: "1rem" }} />
                  <span className="lead-status-dropdown-label text-truncate">{leadStatusMenuLabel}</span>
                  <span className="badge bg-primary lead-status-dropdown-count">{leadStatusMenuSelectedCount}</span>
                </button>
                <ul className="dropdown-menu shadow border-0 lead-status-dropdown-menu" aria-labelledby="leadStatusDropdown">
                  <li>
                    <button
                      type="button"
                      className={`dropdown-item py-2 d-flex align-items-center justify-content-between ${!filters.status ? "active" : ""}`}
                      onClick={() => handleLeadStatusBarClick("")}
                    >
                      <span>All Statuses</span>
                      <span className="badge bg-light text-dark">{leadStatusMenuTotal}</span>
                    </button>
                  </li>
                  {leadStatusMenuItems.map(({ status, count }) => (
                    <li key={status}>
                      <button
                        type="button"
                        className={`dropdown-item py-2 d-flex align-items-center justify-content-between ${String(filters.status || "").trim().toLowerCase() === String(status || "").trim().toLowerCase() ? "active" : ""}`}
                        onClick={() => handleLeadStatusBarClick(status)}
                      >
                        <span>{formatStatusLabel(status)}</span>
                        <span className="badge bg-light text-dark">{count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
 
            {/* Actions & Toggles on the Right */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <ColumnVisibilityDropdown
                columns={leadColumns}
                visible={visibleLeadColumns}
                onChange={handleLeadColVisChange}
              />
              <button
                className={`btn btn-outline-filter d-flex align-items-center gap-2 ${filterOpen ? 'active' : ''}`}
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={() => setFilterOpen((prev) => !prev)}
              >
                <i className="ti ti-filter" style={{ fontSize: "1rem" }} />
                Filters
              </button>
 
              <LeadExportDropdown
                exportExcel={exportExcel}
                exportCsv={exportCsv}
                exportPdf={exportPdf}
              />

              {/* Layout view toggle */}
              {/* Layout view toggle */}
              <div className="d-flex align-items-center gap-1 p-1" style={{ border: "1px solid #e2e8f0", borderRadius: 12, backgroundColor: "#f8fafc" }}>
                <button
                  type="button"
                  className="btn d-flex align-items-center justify-content-center"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    border: "none",
                    backgroundColor: viewMode === "list" ? "#3b82f6" : "transparent",
                    color: viewMode === "list" ? "#fff" : "#64748b",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <i className="ti ti-list" style={{ fontSize: "1.3rem" }} />
                </button>
                <button
                  type="button"
                  className="btn d-flex align-items-center justify-content-center"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    border: "none",
                    backgroundColor: viewMode === "grid" ? "#3b82f6" : "transparent",
                    color: viewMode === "grid" ? "#fff" : "#64748b",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  <i className="ti ti-layout-grid" style={{ fontSize: "1.3rem" }} />
                </button>
              </div>
            </div>
          </div>

          <LeadFilters
            filterOpen={filterOpen}
            filters={filters}
            setFilters={setFilters}
            leadFilters={leadFilters}
            primaryOptions={primaryOptions}
            resetFilters={resetFilters}
            applyFilters={applyFilters}
          />

          {viewMode === "list" ? (
            <LeadListView
              pagedRows={pagedRows}
              loading={loading}
              selectedLeadIds={selectedLeadIds}
              toggleSelectAll={toggleSelectAll}
              toggleLeadSelection={toggleLeadSelection}
              pageOffset={pageOffset}
              getStatusClass={getStatusClass}
              onStatusBadgeClick={handleStatusBadgeClick}
              formatCreatedOn={formatCreatedOn}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              navigate={navigate}
              onUpdateStatusLead={handleStatusBadgeClick}
              onDeleteLead={handleDeleteLead}
              role={role}
              visibleColumns={visibleLeadColumns}
              onRowClick={(row) => setSelectedLeadForView(row)}
            />
          ) : (
            <LeadGridView
              pagedRows={pagedRows}
              loading={loading}
              selectedLeadIds={selectedLeadIds}
              toggleLeadSelection={toggleLeadSelection}
              getStatusClass={getStatusClass}
              onStatusBadgeClick={handleStatusBadgeClick}
              formatCreatedOn={formatCreatedOn}
              navigate={navigate}
              onUpdateStatusLead={handleStatusBadgeClick}
              onDeleteLead={handleDeleteLead}
              role={role}
            />
          )}

          {/* Redesigned Pagination Footer */}
          <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
            <span className="entries-info text-muted small">
              {totalRows === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${pageOffset + 1} to ${Math.min(pageOffset + pageSize, totalRows)} of ${totalRows} entries`}
            </span>

            {/* Custom Pagination Numbers */}
            <div className="pagination-numbers-container d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: 6 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage <= 1}
              >
                <i className="ti ti-chevron-left" />
              </button>

              {(() => {
                const buttons = [];
                const maxVisible = 5;
                let startPage = Math.max(1, clampedPage - 2);
                let endPage = Math.min(pageCount, startPage + maxVisible - 1);
                if (maxVisible - 1 > endPage - startPage) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                if (startPage > 1) {
                  buttons.push(
                    <button
                      key={1}
                      className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === 1 ? 'btn-primary text-white' : 'btn-light'}`}
                      style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === 1 ? "#3b82f6" : undefined }}
                      onClick={() => setPage(1)}
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    buttons.push(<span key="dots-start" className="pagination-dots px-1 text-muted">...</span>);
                  }
                }

                for (let i = startPage; endPage >= i; i++) {
                  buttons.push(
                    <button
                      key={i}
                      className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === i ? 'btn-primary text-white' : 'btn-light'}`}
                      style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === i ? "#3b82f6" : undefined }}
                      onClick={() => setPage(i)}
                    >
                      {i}
                    </button>
                  );
                }

                if (pageCount > endPage) {
                  if (pageCount - 1 > endPage) {
                    buttons.push(<span key="dots-end" className="pagination-dots px-1 text-muted">...</span>);
                  }
                  buttons.push(
                    <button
                      key={pageCount}
                      className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === pageCount ? 'btn-primary text-white' : 'btn-light'}`}
                      style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === pageCount ? "#3b82f6" : undefined }}
                      onClick={() => setPage(pageCount)}
                    >
                      {pageCount}
                    </button>
                  );
                }

                return buttons;
              })()}

              <button
                type="button"
                className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: 6 }}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={clampedPage >= pageCount}
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>

            {/* Page Size Selector */}
            <PageSizeSelector
              pageSize={pageSize}
              setPageSize={setPageSize}
              setPage={setPage}
            />
          </div>
      </div>
      )}

      {activeMainTab === 'duplicates' && (
        <div className="leads-page-body">
          

          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <LeadSearch
              search={dupFilters.search}
              setSearch={(val) => {
                setDupPage(1);
                setDupFilters((prev) => ({ ...prev, search: val }));
              }}
              applyFilters={applyDuplicateFilters}
              placeholder="Search duplicate leads..."
            />

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className={`btn btn-outline-filter d-flex align-items-center gap-2 ${dupFilterOpen ? 'active' : ''}`}
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={() => setDupFilterOpen((prev) => !prev)}
              >
                <i className="ti ti-filter" style={{ fontSize: "1rem" }} />
                Filters
              </button>

              <LeadExportDropdown
                exportExcel={exportDuplicateExcel}
                exportCsv={exportDuplicateCsv}
                exportPdf={exportDuplicatePdf}
              />
               {/* <button
              className="btn btn-outline-filter d-flex align-items-center gap-2"
              style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
              onClick={loadDuplicateLeads}
            >
              <i className="ti ti-refresh" /> Refresh
            </button> */}
            </div>
          </div>

          <LeadFilters
            filterOpen={dupFilterOpen}
            filters={dupFilters}
            setFilters={(updater) => {
              setDupPage(1);
              setDupFilters((prev) => (
                typeof updater === "function" ? updater(prev) : updater
              ));
            }}
            leadFilters={leadFilters}
            primaryOptions={primaryOptions}
            resetFilters={resetDuplicateFilters}
            applyFilters={applyDuplicateFilters}
          />

          {dupError && <div className="alert alert-danger py-2">{dupError}</div>}

          {dupLoading ? (
            <div className="text-center py-5 border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
              <div className="spinner-border spinner-border-sm text-primary mb-2" />
              <div className="text-muted small">Loading duplicates...</div>
            </div>
          ) : dupPagedRows.length === 0 ? (
            <div className="text-center py-5 text-muted border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
              <i className="ti ti-circle-check text-success" style={{ fontSize: 36 }} />
              <div className="mt-2 fw-medium">
                {dupTotalRows === 0 ? "No duplicate leads found" : "No duplicate leads match your search"}
              </div>
            </div>
          ) : (
            <div
              className="table-responsive leads-table-wrap border-0 shadow-sm mb-4"
              style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x", borderRadius: 12, minHeight: "260px" }}
            >
              <table className="table table-hover align-middle leads-table mb-0">
                <thead>
                  <tr>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem", width: 50 }}>#</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Name</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Mobile</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Primary Source</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Owner</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Matches Existing Lead</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Created</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem", width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dupPagedRows.map((lead, idx) => (
                    <tr key={lead.id}>
                      <td className="text-muted" style={{ fontSize: "0.9rem" }}>{dupPageOffset + idx + 1}</td>
                      <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{lead.name || "—"}</td>
                      <td style={{ fontSize: "0.9rem", color: "#475569" }}>{lead.mobile || "—"}</td>
                      <td style={{ fontSize: "0.9rem", color: "#475569" }}>{lead.primarySource || lead.secondarySource || "—"}</td>
                      <td style={{ fontSize: "0.9rem", color: "#475569" }}>{lead.owner || "—"}</td>
                      <td style={{ fontSize: "0.9rem" }}>
                        {lead.duplicateOfLeadRef || lead.duplicateOfLeadName ? (
                          <span className="small text-danger d-inline-flex align-items-center">
                            <i className="ti ti-alert-circle me-1" />
                            {lead.duplicateOfLeadName || '—'}
                            {lead.duplicateOfLeadRef && (
                              <span className="text-muted ms-1">({lead.duplicateOfLeadRef})</span>
                            )}
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark">Duplicate</span>
                        )}
                      </td>
                      <td className="text-muted" style={{ fontSize: "0.9rem" }}>
                        {formatCreatedOn(lead.createdAt)}
                      </td>
                      <td>
                        <div className="dropdown">
                          <button
                            className="btn btn-kebab-actions d-flex align-items-center justify-content-center dropdown-toggle no-caret"
                            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: 10, minWidth: 160 }}>
                            <li>
                              <button className="dropdown-item py-2 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }} onClick={() => navigate(`/leads/${lead.id}`)}>
                                <i className="ti ti-pencil text-primary" style={{ fontSize: "0.95rem" }} /> Edit Lead
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item py-2 d-flex align-items-center gap-2"
                                style={{ fontSize: "0.85rem" }}
                                disabled={convertingLeadId === lead.id}
                                onClick={() => handleConvertDuplicate(lead.id, false)}
                              >
                                {convertingLeadId === lead.id ? (
                                  <span className="spinner-border spinner-border-sm text-success" />
                                ) : (
                                  <i className="ti ti-arrow-right text-success" style={{ fontSize: "0.95rem" }} />
                                )}
                                Convert Lead
                              </button>
                            </li>
                            {role !== 'EMPLOYEE' && (
                              <li>
                                <button className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger" style={{ fontSize: "0.85rem" }} onClick={() => handleDeleteLead(lead)}>
                                  <i className="ti ti-trash" style={{ fontSize: "0.95rem" }} /> Delete Lead
                                </button>
                              </li>
                            )}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top">
            <span className="entries-info text-muted small">
              {dupTotalRows === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${dupPageOffset + 1} to ${Math.min(dupPageOffset + dupPageSize, dupTotalRows)} of ${dupTotalRows} entries`}
            </span>

            <div className="pagination-numbers-container d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: 6 }}
                onClick={() => setDupPage((p) => Math.max(1, p - 1))}
                disabled={dupClampedPage <= 1}
              >
                <i className="ti ti-chevron-left" />
              </button>

              {(() => {
                const buttons = [];
                const maxVisible = 5;
                let startPage = Math.max(1, dupClampedPage - 2);
                let endPage = Math.min(dupPageCount, startPage + maxVisible - 1);
                if (maxVisible - 1 > endPage - startPage) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                for (let pageNum = startPage; pageNum <= endPage; pageNum += 1) {
                  buttons.push(
                    <button
                      key={pageNum}
                      type="button"
                      className={`btn-pagination-num btn btn-sm border-0 ${dupClampedPage === pageNum ? "active" : "btn-light"}`}
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => setDupPage(pageNum)}
                    >
                      {pageNum}
                    </button>,
                  );
                }

                return buttons;
              })()}

              <button
                type="button"
                className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: 6 }}
                onClick={() => setDupPage((p) => Math.min(dupPageCount, p + 1))}
                disabled={dupClampedPage >= dupPageCount}
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>

            <PageSizeSelector
              pageSize={dupPageSize}
              setPageSize={setDupPageSize}
              setPage={setDupPage}
            />
          </div>
        </div>
      )}

      {/* ── Campaign Leads Tab ──────────────────────────────────────────────── */}
      {activeMainTab === 'campaign' && (
          <div className="leads-page-body">
            <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="position-relative" style={{ width: '100%', maxWidth: 340 }}>
                <i className="ti ti-search position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: 36, borderRadius: 10, fontSize: '0.9rem', border: '1px solid #e2e8f0', height: 42 }}
                  placeholder="Search campaign leads..."
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  style={{ height: 42, padding: '0 18px', borderRadius: 10, fontWeight: '500', fontSize: '0.9rem' }}
                  onClick={() => setCampaignTestOpen(true)}
                >
                  <i className="ti ti-plus" /> Test Lead Form
                </button>
                <button
                  className={`btn d-flex align-items-center gap-2 ${
                    campaignFilters.platform || campaignFilters.adName
                      ? "btn-primary"
                      : "btn-outline-filter"
                  }`}
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                  onClick={() => setCampaignFilterOpen(true)}
                >
                  <i className="ti ti-filter" style={{ fontSize: "1rem" }} />
                  Filter
                  {(campaignFilters.platform || campaignFilters.adName) && " (Active)"}
                </button>
                <LeadExportDropdown
                  exportExcel={exportCampaignExcel}
                  exportCsv={exportCampaignCsv}
                  exportPdf={exportCampaignPdf}
                />
                {campaignSelectedIds.size > 0 && (
                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    style={{ borderRadius: 10, fontSize: '0.9rem', padding: '6px 14px', height: 42 }}
                    onClick={() => openCampaignAssign()}
                  >
                    <i className="ti ti-user-check" /> Assign ({campaignSelectedIds.size})
                  </button>
                )}
               
              </div>
            </div>

            {campaignError && <div className="alert alert-danger py-2">{campaignError}</div>}

            {campaignLoading ? (
              <div className="text-center py-5 border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
                <div className="spinner-border spinner-border-sm text-primary mb-2" />
                <div className="text-muted small">Loading campaign leads…</div>
              </div>
            ) : filteredCampaignLeads.length === 0 ? (
              <div className="text-center py-5 text-muted border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
                <i className="ti ti-speakerphone" style={{ fontSize: 40, color: '#cbd5e1' }} />
                <div className="mt-2 fw-medium">No pending campaign leads found</div>
                <div className="small mt-1">Incoming Meta leads awaiting assignment will appear here</div>
              </div>
            ) : (
              <div
                className="table-responsive leads-table-wrap border-0 shadow-sm mb-4"
                style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', borderRadius: 12, minHeight: '260px' }}
              >
                <table className="table table-hover align-middle leads-table mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={campaignSelectedIds.size === filteredCampaignLeads.length && filteredCampaignLeads.length > 0}
                          onChange={() => toggleAllCampaign(filteredCampaignLeads)}
                        />
                      </th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem', width: 50 }}>#</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Name</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Mobile</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Email</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Platform</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Ad Name</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>MOQ</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Industry</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Created On</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem', width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaignLeads.map((lead, idx) => {
                      const srcLower = String(lead.platform || '').toLowerCase();
                      const isFb = srcLower.includes('fb') || srcLower.includes('facebook');
                      const isIg = srcLower.includes('ig') || srcLower.includes('instagram');
                      const srcIcon = isFb ? 'ti-brand-facebook' : isIg ? 'ti-brand-instagram' : 'ti-speakerphone';
                      const srcColor = isFb ? '#1877F2' : isIg ? '#E1306C' : '#64748b';
                      return (
                        <tr key={lead.id} style={{ background: campaignSelectedIds.has(lead.id) ? '#f0f7ff' : undefined }}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={campaignSelectedIds.has(lead.id)}
                              onChange={() => toggleCampaignSelect(lead.id)}
                            />
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.9rem' }}>{idx + 1}</td>
                          <td className="fw-semibold" style={{ color: '#1e293b', fontSize: '0.9rem', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{lead.fullName || 'Ad Lead'}</td>
                          <td style={{ fontSize: '0.9rem', color: '#475569', whiteSpace: 'nowrap' }}>
                            <div className="d-flex align-items-center gap-2">
                              <span>{lead.phone || '—'}</span>
                              {lead.phone && (
                                <a
                                  className="btn-phone-call d-flex align-items-center justify-content-center"
                                  href={`tel:${lead.phone}`}
                                  style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #e2e8f0", color: "#64748b", backgroundColor: "#fff" }}
                                >
                                  <PhoneGlyph size={11} />
                                </a>
                              )}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.9rem', color: '#475569', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{lead.email || '—'}</td>
                          <td style={{ fontSize: '0.9rem', whiteSpace: 'normal' }}>
                            <span className="d-inline-flex align-items-center gap-1">
                              <i className={`ti ${srcIcon}`} style={{ color: srcColor, fontSize: '1rem' }} />
                              <span style={{ color: '#475569' }}>
                                {isFb ? 'Facebook' : isIg ? 'Instagram' : (lead.platform || 'Meta')}
                              </span>
                            </span>
                          </td>
                          <td style={{ fontSize: '0.9rem', color: '#475569', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{lead.adName || '—'}</td>
                          <td style={{ fontSize: '0.9rem', color: '#475569', whiteSpace: 'normal' }}>{lead.moq || '—'}</td>
                          <td style={{ fontSize: '0.9rem', color: '#475569', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{lead.industry || '—'}</td>
                          <td className="text-muted" style={{ fontSize: '0.9rem', whiteSpace: 'normal' }}>
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <div className="dropdown">
                              <button
                                className="btn btn-kebab-actions d-flex align-items-center justify-content-center dropdown-toggle no-caret"
                                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'transparent', color: '#64748b' }}
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" style={{ fontSize: '1.15rem' }} />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: 10, minWidth: 160 }}>
                                <li>
                                  <button
                                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                                    style={{ fontSize: '0.85rem' }}
                                    onClick={() => openCampaignAssign(lead.id)}
                                  >
                                    <i className="ti ti-user-check text-success" style={{ fontSize: '0.95rem' }} /> Assign Lead
                                  </button>
                                </li>
                                {role !== 'EMPLOYEE' && (
                                  <li>
                                    <button
                                      className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger"
                                      style={{ fontSize: '0.85rem' }}
                                      onClick={() => handleDeleteCampaignLead(lead)}
                                    >
                                      <i className="ti ti-trash" style={{ fontSize: '0.95rem' }} /> Delete Lead
                                    </button>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sliding Filter Drawer Panel */}
            {campaignFilterOpen && (
              <div 
                className="filter-drawer-overlay" 
                onClick={() => setCampaignFilterOpen(false)} 
              />
            )}
            <div className={`filter-drawer ${campaignFilterOpen ? "open" : ""}`}>
              <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                <h5 className="mb-0 fw-semibold text-dark" style={{ fontSize: "1.1rem" }}>
                  Filter Campaign Leads
                </h5>
                <button 
                  className="btn-close" 
                  onClick={() => setCampaignFilterOpen(false)} 
                  aria-label="Close"
                />
              </div>
              <div className="p-4 flex-grow-1 overflow-auto">
                {/* Platform filter */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>
                    Platform
                  </label>
                  <select
                    className="form-select"
                    style={{ height: 42, borderRadius: 8 }}
                    value={campaignFilters.platform}
                    onChange={(e) =>
                      setCampaignFilters((prev) => ({ ...prev, platform: e.target.value }))
                    }
                  >
                    <option value="">All Platforms</option>
                    <option value="fb">Facebook (fb)</option>
                    <option value="ig">Instagram (ig)</option>
                  </select>
                </div>

                {/* Campaign (Ad Name) filter */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>
                    Campaign (Ad Name)
                  </label>
                  <select
                    className="form-select"
                    style={{ height: 42, borderRadius: 8 }}
                    value={campaignFilters.adName}
                    onChange={(e) =>
                      setCampaignFilters((prev) => ({ ...prev, adName: e.target.value }))
                    }
                  >
                    <option value="">All Campaigns</option>
                    {[...new Set(campaignLeads.map((l) => l.adName || l.campaignName).filter(Boolean))].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 border-top d-flex gap-2 bg-light">
                <button
                  className="btn btn-light w-50"
                  style={{ height: 40, borderRadius: 8, fontWeight: "500" }}
                  onClick={() => {
                    setCampaignFilters({ platform: "", adName: "" });
                    setCampaignFilterOpen(false);
                  }}
                >
                  Reset
                </button>
                <button
                  className="btn btn-primary w-50"
                  style={{ height: 40, borderRadius: 8, fontWeight: "500" }}
                  onClick={() => setCampaignFilterOpen(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
      )}

      {/* ── Rejected Leads Tab ────────────────────────────────────────────────── */}
      {activeMainTab === 'rejected' && role !== 'EMPLOYEE' && (
        <div className="leads-page-body">
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="position-relative" style={{ width: '100%', maxWidth: 340 }}>
              <i className="ti ti-search position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 36, borderRadius: 10, fontSize: '0.9rem', border: '1px solid #e2e8f0', height: 42 }}
                placeholder="Search rejected leads..."
                value={rejectedSearch}
                onChange={(e) => setRejectedSearch(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <LeadExportDropdown
                exportExcel={exportRejectedExcel}
                exportCsv={exportRejectedCsv}
                exportPdf={exportRejectedPdf}
              />
              {/* <button
                className="btn btn-outline-filter d-flex align-items-center gap-2"
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={loadRejectedLeads}
              >
                <i className="ti ti-refresh" /> Refresh
              </button> */}
            </div>
          </div>

          {rejectedError && <div className="alert alert-danger py-2">{rejectedError}</div>}

          {rejectedLoading ? (
            <div className="text-center py-5 border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
              <div className="spinner-border spinner-border-sm text-primary mb-2" />
              <div className="text-muted small">Loading rejected leads…</div>
            </div>
          ) : rejectedPagedRows.length === 0 ? (
            <div className="text-center py-5 text-muted border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
              <i className="ti ti-circle-x" style={{ fontSize: 40, color: '#cbd5e1' }} />
              <div className="mt-2 fw-medium">No rejected leads found</div>
            </div>
          ) : (
            <>
              <div
                className="table-responsive leads-table-wrap border-0 shadow-sm mb-4"
                style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', borderRadius: 12, minHeight: '260px' }}
              >
                <table className="table table-hover align-middle leads-table mb-0">
                  <thead>
                    <tr>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>S.No</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Name</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Mobile</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Email</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Status</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Owner</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Created</th>
                      <th className="text-muted" style={{ fontWeight: '600', fontSize: '0.85rem', width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedPagedRows.map((row, index) => (
                      <tr key={row.id || row.leadId || row.enquiryId}>
                        <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>
                          {(rejectedClampedPage - 1) * rejectedPageSize + index + 1}
                        </td>
                        <td style={{ fontSize: "0.9rem" }}>
                          <a href={`/leads/${row.id}`} className="link-default fw-semibold" style={{ color: "#3b82f6" }}>
                            {row.name || "-"}
                          </a>
                        </td>
                        <td style={{ fontSize: "0.9rem" }}>{row.mobile || "-"}</td>
                        <td style={{ fontSize: "0.9rem" }}>{row.email || "-"}</td>
                        <td>
                          <span className="badge bg-danger">Rejected</span>
                        </td>
                        <td style={{ fontSize: "0.9rem" }}>{row.owner || row.ownerName || "-"}</td>
                        <td style={{ fontSize: "0.9rem" }}>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                              style={{ borderRadius: 8, width: 32, height: 32, padding: 0 }}
                              onClick={() => handleConvertRejected(row)}
                              disabled={rejectedSaving}
                              title="Convert to New Lead"
                            >
                              <i className="ti ti-refresh" />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                              style={{ borderRadius: 8, width: 32, height: 32, padding: 0 }}
                              onClick={() => handleDeleteRejected(row)}
                              disabled={rejectedSaving}
                              title="Delete"
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {rejectedTotalRows > 0 && (
                <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
                  <span className="entries-info text-muted small">
                    Showing {(rejectedClampedPage - 1) * rejectedPageSize + 1} to {Math.min(rejectedClampedPage * rejectedPageSize, rejectedTotalRows)} of {rejectedTotalRows} entries
                  </span>

                  <div className="pagination-numbers-container d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => setRejectedPage((p) => Math.max(1, p - 1))}
                      disabled={rejectedClampedPage <= 1}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>

                    {(() => {
                      const buttons = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, rejectedClampedPage - 2);
                      let endPage = Math.min(rejectedPageCount, startPage + maxVisible - 1);
                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        buttons.push(
                          <button
                            key={i}
                            type="button"
                            className={`btn-pagination-number btn btn-sm border-0 ${rejectedClampedPage === i ? 'btn-primary' : 'btn-light'}`}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              backgroundColor: rejectedClampedPage === i ? '#3b82f6' : undefined,
                              color: rejectedClampedPage === i ? '#ffffff' : undefined,
                              fontWeight: rejectedClampedPage === i ? '600' : '500'
                            }}
                            onClick={() => setRejectedPage(i)}
                          >
                            {i}
                          </button>
                        );
                      }
                      return buttons;
                    })()}

                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => setRejectedPage((p) => Math.min(rejectedPageCount, p + 1))}
                      disabled={rejectedClampedPage >= rejectedPageCount}
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Campaign Assign Modal */}
      {campaignAssignOpen && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 460 }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="ti ti-user-check me-2 text-primary" />
                    Assign Campaign Lead
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => {
                      setCampaignAssignOpen(false);
                      setCampaignAssignBranchId('');
                      setCampaignAssignGroupId('');
                      setCampaignAssignUserId('');
                    }}
                  />
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">
                    Assigning <strong>{campaignSelectedIds.size}</strong> campaign lead(s) as a <em>New Lead</em>.
                  </p>

                  {/* Branch selector — SUPER_ADMIN only */}
                  {role === 'SUPER_ADMIN' && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Branch <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={campaignAssignBranchId}
                        onChange={(e) => onCampaignBranchChange(e.target.value)}
                      >
                        <option value="">Select Branch</option>
                        {branchOptions.map((b) => (
                          <option key={b.id ?? b.branchId} value={b.id ?? b.branchId}>
                            {b.name ?? b.branchName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Employee selector */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold">
                      Employee <span className="text-danger">*</span>
                    </label>
                    {campaignAssignGroupLoading ? (
                      <div className="text-muted small py-2">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Loading employees…
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        value={campaignAssignUserId}
                        onChange={(e) => setCampaignAssignUserId(e.target.value)}
                        disabled={!campaignAssignGroupId || campaignAssignGroupLoading}
                      >
                        <option value="">
                          {role === 'SUPER_ADMIN' && !campaignAssignBranchId
                            ? 'Select a branch first'
                            : campaignGroupMembers.length === 0
                              ? 'No employees in this group'
                              : 'Select Employee'}
                        </option>
                        {campaignGroupMembers.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.username || m.name || m.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      setCampaignAssignOpen(false);
                      setCampaignAssignBranchId('');
                      setCampaignAssignGroupId('');
                      setCampaignAssignUserId('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitCampaignAssign}
                    disabled={campaignAssignLoading || !campaignAssignUserId || !campaignAssignGroupId}
                  >
                    {campaignAssignLoading
                      ? <><span className="spinner-border spinner-border-sm me-1" />Assigning…</>
                      : 'Assign Lead'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
        </>
      )}

      {/* Campaign Test Lead Modal */}
      {campaignTestOpen && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="ti ti-speakerphone me-2 text-primary" />
                    Submit Test Campaign Lead
                  </h5>
                  <button className="btn-close" onClick={() => setCampaignTestOpen(false)} />
                </div>
                <div className="modal-body">
                  <p className="text-muted small">
                    This form simulates an ad submission from Instagram or Facebook. Submitting this form calls the public API endpoint to store a new pending lead in your CRM.
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Premanand"
                        value={campaignTestForm.fullName}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +919159083513"
                        value={campaignTestForm.phone}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. amanandhere@gmail.com"
                        value={campaignTestForm.email}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">City</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Chennai"
                        value={campaignTestForm.city}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, city: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Required MOQ (Custom Question)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. below_300"
                        value={campaignTestForm.moq}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, moq: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Industry Sector (Custom Question)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. _food_business"
                        value={campaignTestForm.industry}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, industry: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Ad Platform</label>
                      <select
                        className="form-select"
                        value={campaignTestForm.platform}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, platform: e.target.value }))}
                      >
                        <option value="ig">Instagram (ig)</option>
                        <option value="fb">Facebook (fb)</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Ad Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={campaignTestForm.adName}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, adName: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Campaign Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={campaignTestForm.campaignName}
                        onChange={(e) => setCampaignTestForm(p => ({ ...p, campaignName: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-light" onClick={() => setCampaignTestOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={submitCampaignTest} disabled={campaignTestLoading}>
                    {campaignTestLoading ? 'Submitting…' : 'Submit Test Lead'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
        </>
      )}

      {showCreate && (

        <>
          <div className="modal fade show lead-create-modal" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create New Lead</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowCreate(false); setCreateStep0Errors({ name: "", primarySource: "" }); setCreateMobileError(""); setError(""); setCreateWizardStep(0); }} />
                </div>
                <div className="modal-body lead-create-shell">
                  <div className="lead-wizard">
                  {error && (
                    <div className="alert alert-danger py-2 mb-3" role="alert">
                      {error}
                    </div>
                  )}
                  {/* Progress Bar */}
                  <div className="lead-wizard-progress-bar">
                    <motion.div
                      className="lead-wizard-progress"
                      initial={shouldReduceMotion ? false : { width: "0%" }}
                      animate={shouldReduceMotion ? {} : { width: `${((createWizardStep + 1) / 2) * 100}%` }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  </div>

                  {/* Step Circles */}
                  <motion.div
                    className="lead-wizard-circles"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  >
                    <div className="lead-wizard-circle-item" onClick={() => setCreateWizardStep(0)}>
                      <motion.div
                        className={`lead-wizard-circle${createWizardStep >= 0 ? " active" : ""}`}
                        initial={shouldReduceMotion ? false : { scale: 0.94 }}
                        animate={shouldReduceMotion ? {} : { scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.08 }}
                      >
                        <i className="ti ti-user" />
                      </motion.div>
                      <div className="lead-wizard-circle-label">Lead Details</div>
                    </div>
                    <div className="lead-wizard-circle-item" onClick={() => createWizardStep >= 1 ? setCreateWizardStep(1) : goToNextCreateStep()}>
                      <motion.div
                        className={`lead-wizard-circle${createWizardStep >= 1 ? " active" : ""}`}
                        initial={shouldReduceMotion ? false : { scale: 0.94 }}
                        animate={shouldReduceMotion ? {} : { scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      >
                        <i className="ti ti-map-pin" />
                      </motion.div>
                      <div className="lead-wizard-circle-label">Address</div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="lead-create-grid"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: 0.1 }}
                  >
                  <AnimatePresence mode="wait">
                    {/* Step 0: Lead Details */}
                    {createWizardStep === 0 && (
                      <motion.div
                        key="step-0"
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 18, filter: "blur(4px)" }}
                        animate={shouldReduceMotion ? {} : { opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={shouldReduceMotion ? false : { opacity: 0, x: -18, filter: "blur(4px)" }}
                        transition={{ duration: 0.26, ease: "easeOut" }}
                        className="row g-3 lead-wizard-step-panel"
                      >
                        <div className="col-12">
                          <div className="lead-form-field">
                            <label className="form-label">Full Name</label>
                            <input
                              ref={createNameInputRef}
                              className="form-control"
                              value={createForm.name}
                              onChange={(e) => {
                                setCreateForm((prev) => ({ ...prev, name: e.target.value }));
                                if (e.target.value.trim() && createStep0Errors.name) {
                                  setCreateStep0Errors((prev) => ({ ...prev, name: "" }));
                                }
                              }}
                              placeholder="Full Name"
                              style={createStep0Errors.name ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                            />
                            {createStep0Errors.name && (
                              <small className="text-danger">{createStep0Errors.name}</small>
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="lead-form-stack">
                          <div className="lead-form-field">
                            <label className="form-label">
                              Mobile Number <span className="text-danger">*</span>
                            </label>
                            <div className="lead-phone-field" ref={createCountryPickerRef}>
                              <div
                                className="lead-phone-input-wrap"
                                style={createMobileError ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                              >
                                <button
                                  type="button"
                                  className="lead-phone-code-trigger"
                                  onClick={toggleCreateCountryPicker}
                                  aria-expanded={createCountryPickerOpen}
                                >
                                  <span>{createForm.countryCode}</span>
                                  <i className="ti ti-chevron-down" />
                                </button>
                                <input
                                  className="lead-phone-input"
                                  value={createForm.mobile}
                                  placeholder={`Enter ${createCountryDisplayMaxLength || ""} digit number`}
                                  inputMode="numeric"
                                  pattern="\d*"
                                  maxLength={createCountryDisplayMaxLength || undefined}
                                  onChange={(e) => handleCreateMobileChange(e.target.value)}
                                />
                              </div>
                              {createCountryPickerOpen && (
                                <div className="lead-phone-code-menu">
                                  {filteredCountryOptions.length > 0 ? (
                                    filteredCountryOptions.map((option) => (
                                      <button
                                        key={`${option.country}-${option.callingCode}`}
                                        type="button"
                                        className={`lead-phone-code-option${createForm.countryCode === option.value ? " is-active" : ""}`}
                                        onClick={() => {
                                          handleCreateCountryCodeChange(option.value);
                                          closeCreateCountryPicker();
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
                            <div className="lead-field-helper-row">
                              <small className="text-muted">
                                {createCountryDisplayMaxLength
                                  ? `${createCountryDisplayMaxLength} digits required`
                                  : "Numeric value"}
                              </small>
                              {createMobileError && <small className="text-danger">{createMobileError}</small>}
                            </div>
                          </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="lead-form-stack">
                          <div className="lead-form-field">
                            <label className="form-label">Email Address</label>
                            <input
                              className="form-control"
                              value={createForm.email}
                              onChange={(e) =>
                                setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                              }
                              placeholder="E-mail Id"
                            />
                          </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="lead-form-stack">
                          <div className="lead-form-field">
                            <div className="lead-source-label-row">
                              <label className="form-label mb-0">Primary Source</label>
                              <button
                                type="button"
                                className="lead-source-add-btn"
                                onClick={() => setShowAddPrimarySource(true)}
                                aria-label="Add primary source"
                              >
                                <PlusGlyph size={14} />
                              </button>
                            </div>
                            <select
                              className="form-select"
                              value={createForm.primarySource}
                              onChange={(e) => {
                                setCreateForm((prev) => ({
                                  ...prev,
                                  primarySource: e.target.value,
                                  secondarySource: "",
                                }));
                                if (e.target.value.trim() && createStep0Errors.primarySource) {
                                  setCreateStep0Errors((prev) => ({ ...prev, primarySource: "" }));
                                }
                              }}
                              style={createStep0Errors.primarySource ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                            >
                              <option value="">Select Primary Source</option>
                              {primaryOptions.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                            {createStep0Errors.primarySource && (
                              <small className="text-danger">{createStep0Errors.primarySource}</small>
                            )}
                          </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="lead-form-stack">
                          <div className="lead-form-field">
                            <div className="lead-source-label-row">
                              <label className="form-label mb-0">Secondary Source</label>
                              <button
                                type="button"
                                className="lead-source-add-btn"
                                onClick={() => {
                                  setNewSecondarySourcePrimaryId(
                                    createPrimarySourceRow?.id != null ? String(createPrimarySourceRow.id) : "",
                                  );
                                  setShowAddSecondarySource(true);
                                }}
                                aria-label="Add secondary source"
                              >
                                <PlusGlyph size={14} />
                              </button>
                            </div>
                            <select
                              className="form-select"
                              value={createForm.secondarySource}
                              onChange={(e) =>
                                setCreateForm((prev) => ({
                                  ...prev,
                                  secondarySource: e.target.value,
                                }))
                              }
                            >
                              <option value="">Select Secondary Source</option>
                              {createSecondarySourceOptions.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="lead-form-field">
                            <label className="form-label">GSTIN Number</label>
                            <input
                              className="form-control"
                              value={createForm.gstin || ""}
                              onChange={(e) =>
                                setCreateForm((prev) => ({ ...prev, gstin: e.target.value }))
                              }
                              placeholder="GSTIN Number"
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="lead-form-field">
                            <label className="form-label">Company Name</label>
                            <input
                              className="form-control"
                              value={createForm.companyName}
                              onChange={(e) =>
                                setCreateForm((prev) => ({ ...prev, companyName: e.target.value }))
                              }
                              placeholder="Company Name"
                            />
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="lead-form-field">
                            <label className="form-label">Type of Product</label>
                            <textarea
                              className="form-control"
                              value={createForm.productType}
                              onChange={(e) =>
                                setCreateForm((prev) => ({ ...prev, productType: e.target.value }))
                              }
                              placeholder="e.g. Visiting Card, Zipper pouch, Poster, etc"
                              rows="2"
                              style={{ resize: "vertical" }}
                            />
                          </div>
                        </div>

                        {role !== "EMPLOYEE" && (
                          <input type="hidden" value={createForm.leadGroupId} readOnly />
                        )}
                      </motion.div>
                    )}

                    {/* Step 1: Address */}
                    {createWizardStep === 1 && (
                      <motion.div
                        key="step-1"
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 18, filter: "blur(4px)" }}
                        animate={shouldReduceMotion ? {} : { opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={shouldReduceMotion ? false : { opacity: 0, x: -18, filter: "blur(4px)" }}
                        transition={{ duration: 0.26, ease: "easeOut" }}
                        className="row g-3 lead-wizard-step-panel"
                      >
                        <div className="col-md-6">
                          <div className="lead-form-field">
                            <label className="form-label">State</label>
                            <select
                              ref={createStateInputRef}
                              className="form-select"
                              value={createForm.state}
                              onChange={(e) =>
                                setCreateForm((prev) => ({
                                  ...prev,
                                  state: e.target.value,
                                  district: "",
                                }))
                              }
                              disabled={!createCountryIso || !createStateOptions.length}
                            >
                              <option value="">Select State</option>
                              {createStateOptions.map((state) => (
                                <option key={state.isoCode} value={state.isoCode}>
                                  {state.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="lead-form-field">
                            <label className="form-label">District</label>
                            <select
                              className="form-select"
                              value={createForm.district}
                              onChange={(e) =>
                                setCreateForm((prev) => ({ ...prev, district: e.target.value }))
                              }
                              disabled={!createSelectedState || !createDistrictOptions.length}
                            >
                              <option value="">Select District</option>
                              {createDistrictOptions.map((district) => (
                                <option key={`${district.stateCode}-${district.name}`} value={district.name}>
                                  {district.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="lead-form-field">
                            <label className="form-label">Street Address</label>
                            <textarea
                              className="form-control"
                              value={createForm.streetAddress}
                              onChange={(e) =>
                                setCreateForm((prev) => ({ ...prev, streetAddress: e.target.value }))
                              }
                              placeholder="Enter street address"
                              rows="2"
                              style={{ resize: "vertical" }}
                            />
                          </div>
                        </div>

                        {role !== "EMPLOYEE" && shouldSelectCreateLeadGroup ? (
                          <>
                            <div className="col-md-6">
                              <div className="lead-form-field">
                                <label className="form-label">Branch</label>
                                <select
                                  className="form-select"
                                  value={createForm.createBranchId}
                                  onChange={(e) =>
                                    setCreateForm((prev) => {
                                      const selected = createBranchOptions.find(
                                        (branch) => String(branch.id) === String(e.target.value),
                                      );
                                      return {
                                        ...prev,
                                        createBranchId: e.target.value,
                                        createBranchName: selected?.name || "",
                                        leadGroupId: "",
                                        assignedUserId: "",
                                      };
                                    })
                                  }
                                >
                                  <option value="">Select Branch</option>
                                  {createBranchOptions.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                      {branch.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="col-md-6">
                              <div className="lead-form-field">
                                <label className="form-label">Assign To User</label>
                                <select
                                  className="form-select"
                                  value={createForm.assignedUserId}
                                  onChange={(e) =>
                                    setCreateForm((prev) => ({ ...prev, assignedUserId: e.target.value }))
                                  }
                                  disabled={!createForm.leadGroupId}
                                >
                                  <option value="">
                                    {!createForm.leadGroupId ? "Select Branch first" : "Auto assign"}
                                  </option>
                                  {eligibleCreateGroupMembers.map((member) => (
                                    <option key={member.userId} value={member.userId}>
                                      {member.username || `User ${member.userId}`}
                                    </option>
                                  ))}
                                </select>
                                {createForm.leadGroupId && eligibleCreateGroupMembers.length === 0 && (
                                  <small className="text-muted">No eligible users in selected group.</small>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="col-12">
                            <div className="lead-assignment-note alert alert-info py-2 mb-0">
                              This lead will be assigned to you.
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </motion.div>

                  {/* Wizard Navigation */}
                  <motion.div
                    className="lead-wizard-nav"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.18 }}
                  >
                    {createWizardStep > 0 ? (
                      <button type="button" className="btn btn-light" onClick={() => { setCreateWizardStep((s) => s - 1); setCreateStep0Errors({ name: "", primarySource: "" }); setCreateMobileError(""); setError(""); }} disabled={saving}>
                        Previous
                      </button>
                    ) : (
                      <div />
                    )}
                    {createWizardStep < 1 ? (
                      <button type="button" className="btn btn-primary" onClick={goToNextCreateStep}>
                        Next
                      </button>
                    ) : (
                      <button type="button" className="btn btn-primary" onClick={handleCreateLead} disabled={saving}>
                        {saving ? "Creating..." : "Create Lead"}
                      </button>
                    )}
                  </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show lead-create-backdrop" />
        </>
      )}

      {showStatusModal && statusLead && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Update Lead Status</h5>
                  <button
                    className="btn-close"
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
                      setError("");
                      setStatusErrors({});
                    }}
                  />
                </div>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
                  {orderedLeadStatuses.length > 0 && (
                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-2">
                        {displayStatusOptions.map((item) => (
                          <span
                            key={item}
                            className={`badge ${normalizeStatusLabelKey(item) === normalizeStatusLabelKey(statusValue) ? "bg-primary" : "bg-light text-dark"}`}
                          >
                            {formatStatusLabel(item)}
                          </span>
                        ))}                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Enquiry Status:</label>
                    <select
                      className="form-select"
                      value={statusValue}
                      onChange={(e) => {
                        setStatusValue(e.target.value);
                        if (e.target.value && statusErrors.statusValue) {
                          setStatusErrors((prev) => ({ ...prev, statusValue: false }));
                        }
                      }}
                      style={statusErrors.statusValue ? { borderColor: "#dc3545", borderStyle: "solid", borderWidth: "1px" } : {}}
                    >
                      <option value="">Select Status</option>
                      {displayStatusOptions.map((item) => (
                        <option key={item} value={item}>
                          {formatStatusLabel(item)}
                        </option>
                      ))}
                    </select>
                  </div>

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
                 <div className="modal-footer">
                   <button
                     className="btn btn-light"
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
                       setError("");
                       setStatusErrors({});
                     }}
                   >
                     Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveStatusUpdate} disabled={saving}>
                    {saving ? "Saving..." : "Update Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showDesignDurationModal && statusLead && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Design Duration</h5>
                  <button
                    className="btn-close"
                    onClick={() => {
                      setShowDesignDurationModal(false);
                      setStatusLead(null);
                    }}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Design Start</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      value={designStartAt}
                      onChange={(e) => setDesignStartAt(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Design End</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      value={designEndAt}
                      onChange={(e) => setDesignEndAt(e.target.value)}
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Duration</label>
                    <input
                      className="form-control"
                      value={getDesignDurationDays(designStartAt, designEndAt) || "-"}
                      readOnly
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      setShowDesignDurationModal(false);
                      setStatusLead(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={submitDesignDuration} disabled={saving}>
                    {saving ? "Saving..." : "Save & Continue"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showRemarkModal && remarkLead && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Update Remark</h5>
                  <button
                    className="btn-close"
                    onClick={() => {
                      setShowRemarkModal(false);
                      setRemarkLead(null);
                    }}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-2 fw-semibold">{remarkLead?.name || "Lead"}</div>
                  <label className="form-label">Remark</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={remarkValue}
                    onChange={(e) => setRemarkValue(e.target.value)}
                    placeholder="Type remark..."
                  />
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      setShowRemarkModal(false);
                      setRemarkLead(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveRemarkUpdate}>
                    Save Remark
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showAddPrimarySource && (
        <>
          <div className="modal fade show lead-source-modal" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Primary Source</h5>
                  <button
                    className="btn-close"
                    onClick={() => {
                      if (addSourceLoading) return;
                      setShowAddPrimarySource(false);
                      setNewPrimarySource("");
                    }}
                  />
                </div>
                <div className="modal-body">
                  <label className="form-label">Primary Source Name</label>
                  <input
                    className="form-control"
                    value={newPrimarySource}
                    onChange={(e) => setNewPrimarySource(e.target.value)}
                    placeholder="Enter primary source"
                    autoFocus
                  />
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      if (addSourceLoading) return;
                      setShowAddPrimarySource(false);
                      setNewPrimarySource("");
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleAddPrimarySource} disabled={addSourceLoading}>
                    {addSourceLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show lead-create-backdrop" />
        </>
      )}

      {showAddSecondarySource && (
        <>
          <div className="modal fade show lead-source-modal" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Secondary Source</h5>
                  <button
                    className="btn-close"
                    onClick={() => {
                      if (addSourceLoading) return;
                      setShowAddSecondarySource(false);
                      setNewSecondarySource("");
                      setNewSecondarySourcePrimaryId("");
                    }}
                  />
                </div>
                <div className="modal-body">
                  <label className="form-label">Secondary Source Name</label>
                  <input
                    className="form-control"
                    value={newSecondarySource}
                    onChange={(e) => setNewSecondarySource(e.target.value)}
                    placeholder="Enter secondary source"
                    autoFocus
                  />
                  <label className="form-label mt-3">Primary Source</label>
                  <select
                    className="form-select"
                    value={newSecondarySourcePrimaryId}
                    onChange={(e) => setNewSecondarySourcePrimaryId(e.target.value)}
                  >
                    <option value="">Select primary source</option>
                    {(Array.isArray(primarySourceRows) ? primarySourceRows : []).map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.primarySource || row.name || row.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      if (addSourceLoading) return;
                      setShowAddSecondarySource(false);
                      setNewSecondarySource("");
                      setNewSecondarySourcePrimaryId("");
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleAddSecondarySource} disabled={addSourceLoading}>
                    {addSourceLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show lead-create-backdrop" />
        </>
      )}

      {dupWarnLead && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1070 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
              <div className="modal-content">
                <div className="modal-header bg-warning-subtle">
                  <h5 className="modal-title">
                    <i className="ti ti-alert-triangle me-2 text-warning" />
                    Duplicate Lead Detected
                  </h5>
                  <button className="btn-close" onClick={() => setDupWarnLead(null)} />
                </div>
                <div className="modal-body">
                  <p>
                    The lead <strong>{dupWarnLead.name}</strong> was saved but flagged as a
                    {' '}<span className="badge bg-warning text-dark">Duplicate</span> because a
                    matching lead already exists:
                  </p>
                  <div className="alert alert-warning py-2 mb-2">
                    <strong>{dupWarnLead.duplicateOfLeadName || '—'}</strong>
                    {dupWarnLead.duplicateOfLeadRef && (
                      <span className="text-muted ms-2">({dupWarnLead.duplicateOfLeadRef})</span>
                    )}
                  </div>
                  <p className="text-muted small mb-0">
                    It has been moved to the <strong>Duplicates</strong> tab. You can review,
                    edit, or convert it from there.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setDupWarnLead(null)}
                  >
                    Dismiss
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={() => {
                      setDupWarnLead(null);
                      setActiveMainTab('duplicates');
                      loadDuplicateLeads();
                    }}
                  >
                    <i className="ti ti-list me-1" />
                    View Duplicates Tab
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1065 }} />
        </>
      )}

      {convertConfirm && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Still a Duplicate</h5>
                  <button className="btn-close" onClick={() => setConvertConfirm(null)} />
                </div>
                <div className="modal-body">
                  <p>This lead still matches an existing lead:</p>
                  <div className="alert alert-warning py-2">
                    <strong>{convertConfirm.matchedName || '—'}</strong>
                    {convertConfirm.matchedRef && (
                      <span className="text-muted ms-2">({convertConfirm.matchedRef})</span>
                    )}
                  </div>
                  <p className="text-muted small mb-0">
                    Do you want to convert it to a new lead anyway?
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setConvertConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handleConvertDuplicate(convertConfirm.leadId, true)}
                  >
                    Convert Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
        </>
      )}

      {activeActionsRow && createPortal(
        <div
          className="floating-actions-menu shadow-lg border"
          style={{
            position: "absolute",
            top: actionsMenuPos.top,
            left: actionsMenuPos.left,
            transform: "translate(-100%, -100%) translateY(-5px)",
            zIndex: 9999,
            background: "#fff",
            borderRadius: 8,
            padding: "6px 0",
            minWidth: 150
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              navigate(`/leads/${activeActionsRow.id}`);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Lead
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              openStatusModal(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-refresh" style={{ fontSize: "1rem", color: "#64748b" }} /> Update Status
          </button>
          {role !== "EMPLOYEE" && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                handleDeleteLead(activeActionsRow);
                setActiveActionsRow(null);
              }}
            >
              <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Lead
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedLeadIds.size > 0 && (
        <div
          className="position-fixed start-50 translate-middle-x d-flex align-items-center justify-content-between gap-3 shadow-lg px-4 py-3 bg-dark text-white"
          style={{
            bottom: 24,
            borderRadius: 16,
            zIndex: 1040,
            minWidth: 400,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary text-white" style={{ fontSize: "0.9rem", padding: "6px 10px" }}>
              {selectedLeadIds.size}
            </span>
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>leads selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.3)" }}
              onClick={openBulkAssignModal}
              disabled={bulkAssignLoading}
            >
              <i className="ti ti-user-check" /> Assign
            </button>
            {role !== "EMPLOYEE" && (
              <button
                className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "#dc2626", color: "#ffffff", border: "none" }}
                onClick={handleBulkDelete}
              >
                <i className="ti ti-trash" /> Delete
              </button>
            )}
            <button
              className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
              style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)" }}
              onClick={() => setSelectedLeadIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {bulkAssignOpen && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Bulk Allocate Leads</h5>
                  <button className="btn-close" onClick={() => setBulkAssignOpen(false)} />
                </div>
                <div className="modal-body">
                  <p className="text-muted small">
                    Select an employee to allocate the <strong>{selectedLeadIds.size}</strong> selected leads to:
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Employee</label>
                    <select
                      className="form-select"
                      value={bulkAssignUserId}
                      onChange={(e) => setBulkAssignUserId(e.target.value)}
                    >
                      <option value="">Select Employee</option>
                      {bulkAssignEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.username || emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      setBulkAssignOpen(false);
                      setBulkAssignUserId("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitBulkAssign}
                    disabled={bulkAssignLoading || !bulkAssignUserId}
                  >
                    {bulkAssignLoading ? "Assigning..." : "Assign Leads"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
        </>
      )}

      {selectedLeadForView && (
        <LeadDetailsModal
          lead={selectedLeadForView}
          onClose={() => setSelectedLeadForView(null)}
          onEdit={(id) => navigate(`/leads/${id}`)}
        />
      )}

      {confirmDialog}
    </div></div>
  );
}
