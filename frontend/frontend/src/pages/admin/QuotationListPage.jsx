import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";
import { createPortal } from "react-dom";
import api from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import LeadExportDropdown from "../../components/admin/LeadExportDropdown";
import ColumnVisibilityDropdown from "../../components/admin/ColumnVisibilityDropdown";
import {
  approveQuotation,
  deleteQuotation,
  getQuotations,
  markQuotationAccepted,
  markQuotationNegotiating,
  markQuotationRejected,
  markQuotationSent,
  sendQuotationForVerification,
  rejectQuotationByAdmin,
} from "../../api/quotationApi";
import {
  QUOTATION_STATUS_ACCEPTED,
  QUOTATION_STATUS_APPROVED,
  QUOTATION_STATUS_DRAFT,
  QUOTATION_STATUS_NEGOTIATING,
  QUOTATION_STATUS_REJECTED,
  QUOTATION_STATUS_SENT,
  QUOTATION_STATUS_VERIFICATION_PENDING,
  downloadQuotationPdf,
  openQuotationPdfPreview,
  setQuotationDraft,
  getQuotationPdfBlob,
} from "../../utils/quotationUtils";
import { getQuotationTemplate } from "../../api/quotationTemplateApi";
import { getUserGroups } from "../../api/userGroupApi";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./QuotationListPage.css";

function downloadTextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  try {
    return new Date(value).toLocaleDateString("en-IN");
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  try {
    return new Date(value).toLocaleString("en-IN");
  } catch {
    return value;
  }
}

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function isHigherAuthorityRole(role) {
  return ["TEAM_LEAD", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role);
}

function getStatusUi(status) {
  switch (status) {
    case QUOTATION_STATUS_APPROVED:
      return { label: "Approved", className: "badge bg-success" };
    case QUOTATION_STATUS_VERIFICATION_PENDING:
      return { label: "Verification Pending", className: "badge bg-warning text-dark" };
    case QUOTATION_STATUS_SENT:
      return { label: "Sent to Customer", className: "badge bg-info text-dark" };
    case QUOTATION_STATUS_NEGOTIATING:
      return { label: "Negotiating", className: "badge bg-warning text-dark" };
    case QUOTATION_STATUS_REJECTED:
      return { label: "Rejected", className: "badge bg-danger" };
    case QUOTATION_STATUS_ACCEPTED:
      return { label: "Accepted", className: "badge bg-success" };
    default:
      return { label: "Draft", className: "badge bg-secondary" };
  }
}

function getDisplayQuotationStatus(quotation) {
  const status = quotation?.status || QUOTATION_STATUS_DRAFT;
  if (status === QUOTATION_STATUS_VERIFICATION_PENDING && quotation?.negotiatingAt) {
    return "Re-verification Pending";
  }
  if (status === QUOTATION_STATUS_APPROVED && quotation?.negotiatingAt) {
    return "Re-verification Approved";
  }
  return getStatusUi(status).label;
}

function matchesQuickDate(value, quickDate) {
  if (!quickDate) {
    return true;
  }

  const rawDate = value ? new Date(value) : null;
  if (!rawDate || Number.isNaN(rawDate.getTime())) {
    return false;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const rowDate = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
  const diffDays = Math.floor((startOfToday - rowDate) / (1000 * 60 * 60 * 24));

  if (quickDate === "today") {
    return diffDays === 0;
  }
  if (quickDate === "weekly") {
    return diffDays >= 0 && diffDays < 7;
  }
  if (quickDate === "monthly") {
    return diffDays >= 0 && diffDays < 30;
  }
  return true;
}

function canTeamLeadApproveQuotation(quotation, user) {
  const ownerRole = normalizeRole(quotation.createdByRole);
  const quotationTeam = String(quotation.createdByTeam || "").trim().toLowerCase();
  const userTeam = String(user?.team || user?.teamName || "").trim().toLowerCase();
  if (!quotationTeam || !userTeam) {
    return false;
  }
  return ownerRole === "EMPLOYEE" && quotationTeam === userTeam;
}

function canApproveQuotation(quotation, userRole, user) {
  if (["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
    return (
      quotation.status === QUOTATION_STATUS_DRAFT ||
      quotation.status === QUOTATION_STATUS_VERIFICATION_PENDING
    );
  }
  if (userRole === "TEAM_LEAD") {
    return (
      quotation.status === QUOTATION_STATUS_VERIFICATION_PENDING &&
      canTeamLeadApproveQuotation(quotation, user)
    );
  }
  return false;
}

const QUOTATION_COLUMNS = [
  { key: "sno", label: "S.No" },
  { key: "qtNo", label: "Qt No." },
  { key: "customer", label: "Customer Name" },
  { key: "createdBy", label: "Created By" },
  { key: "createdDate", label: "Created Date" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
  { key: "notes", label: "Notes" },
];

export default function QuotationListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userRole = normalizeRole(user?.role);
  const isEmployee = userRole === "EMPLOYEE";
  const isHigherAuthority = isHigherAuthorityRole(userRole);

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [notesDialog, setNotesDialog] = useState({
    open: false,
    mode: null,
    quotationId: null,
    notes: "",
  });
  const [customerResponseDialog, setCustomerResponseDialog] = useState({
    open: false,
    quotationId: null,
  });
  const [logDialog, setLogDialog] = useState({
    open: false,
    quotation: null,
  });
  const [allocationDialog, setAllocationDialog] = useState({
    open: false,
    quotation: null,
    allocations: {},
  });
  const [markSentDialog, setMarkSentDialog] = useState({
    open: false,
    quotation: null,
    sendEmail: false,
  });
  const [quotationTemplate, setQuotationTemplate] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || "");
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

  // New state variables for search, sorting, and pagination
  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    quickDate: "",
  });
  const [filterDraft, setFilterDraft] = useState({
    status: "",
    quickDate: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [visibleQtColumns, setVisibleQtColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("quotation_col_visibility");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return {};
  });
  const handleQtColVisChange = (next) => {
    setVisibleQtColumns(next);
    try { localStorage.setItem("quotation_col_visibility", JSON.stringify(next)); } catch {}
  };
  const isQtVis = (key) => visibleQtColumns[key] !== false;

  // Kebab actions state
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

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

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getQuotations()
      .then((rows) => {
        if (!ignore) {
          setQuotations(Array.isArray(rows) ? rows : []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setActionError("Failed to load quotations.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    getQuotationTemplate()
      .then((data) => { if (!ignore) setQuotationTemplate(data || {}); })
      .catch(() => { if (!ignore) setQuotationTemplate({}); });
    getUserGroups()
      .then((data) => { if (!ignore) setUserGroups(Array.isArray(data) ? data : []); })
      .catch(() => { if (!ignore) setUserGroups([]); });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    setFilterDraft(filters);
  }, [filters]);

  const updateSingleQuotation = (updatedQuotation) => {
    setQuotations((previous) =>
      previous.map((quotation) => (quotation.id === updatedQuotation.id ? updatedQuotation : quotation)),
    );
  };

  const handleEdit = (quotation) => {
    setQuotationDraft(quotation);
    navigate("/quotation");
  };

  const handleView = (quotation) => {
    setActionError("");
    openQuotationPdfPreview(quotation, quotationTemplate || {})
      .catch((error) => {
        console.error("Failed to open quotation PDF preview", error);
        setActionError("Failed to open quotation PDF preview.");
      });
  };

  const handleDownload = async (quotation) => {
    try {
      await downloadQuotationPdf(quotation, quotationTemplate || {});
    } catch (error) {
      console.error("Failed to download quotation PDF", error);
      setActionError("Failed to download quotation PDF.");
    }
  };

  const handleDelete = (quotation) => {
    setNotesDialog({ open: true, mode: "delete", quotationId: quotation.id, notes: "" });
  };

  const openVerifyDialog = (quotation) => {
    setNotesDialog({
      open: true,
      mode: "verify",
      quotationId: quotation.id,
      notes: quotation.verificationRequestNotes || "",
    });
  };

  const openApproveDialog = (quotation) => {
    setNotesDialog({
      open: true,
      mode: "approve",
      quotationId: quotation.id,
      notes: quotation.approvalNotes || "",
    });
  };

  const openAdminRejectDialog = (quotation) => {
    setNotesDialog({
      open: true,
      mode: "admin-reject",
      quotationId: quotation.id,
      notes: "",
    });
  };

  const handleConvertToCustomer = async (quotation) => {
    if (!window.confirm("Are you sure you want to convert this lead to a customer?")) return;
    try {
      setLoading(true);
      await api.post(`/api/v1/customers/convert-lead/${quotation.leadId}`);
      setSuccessMessage("Lead successfully converted to Customer, first invoice generated, and Portal account created!");
      const rows = await getQuotations();
      setQuotations(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data || "Failed to convert lead to customer.";
      setActionError(typeof errMsg === "string" ? errMsg : "Failed to convert lead to customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSent = (quotation) => {
    setMarkSentDialog({
      open: true,
      quotation,
      sendEmail: !!(quotation.clientEmail && quotation.clientEmail.trim()),
    });
  };

  const confirmMarkSent = async () => {
    setActionError("");
    const { quotation, sendEmail } = markSentDialog;
    if (!quotation) return;
    try {
      let file = null;
      if (sendEmail) {
        try {
          const { blob, fileName } = await getQuotationPdfBlob(quotation, quotationTemplate || {});
          file = new File([blob], fileName, { type: "application/pdf" });
        } catch (pdfErr) {
          console.error("Failed to generate PDF for email attachment", pdfErr);
        }
      }
      const updated = await markQuotationSent(quotation.id, sendEmail, file);
      if (updated) updateSingleQuotation(updated);
      setSuccessMessage(
        sendEmail
          ? "Quotation marked as sent and email with PDF attachment dispatched!"
          : "Quotation marked as sent successfully!"
      );
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to mark quotation as sent.";
      setActionError(message);
    } finally {
      setMarkSentDialog({ open: false, quotation: null, sendEmail: false });
    }
  };

  const openMarkNegotiatingDialog = (quotation) => {
    setNotesDialog({ open: true, mode: "mark-negotiating", quotationId: quotation.id, notes: "" });
  };

  const openMarkRejectedDialog = (quotation) => {
    setNotesDialog({ open: true, mode: "mark-rejected", quotationId: quotation.id, notes: "" });
  };

  const openMarkAcceptedDialog = (quotation) => {
    setNotesDialog({ open: true, mode: "mark-accepted", quotationId: quotation.id, notes: "" });
  };

  const closeNotesDialog = () => {
    setNotesDialog({ open: false, mode: null, quotationId: null, notes: "" });
  };

  const openCustomerResponseDialog = (quotation) => {
    setCustomerResponseDialog({ open: true, quotationId: quotation.id });
  };

  const closeCustomerResponseDialog = () => {
    setCustomerResponseDialog({ open: false, quotationId: null });
  };

  const openLogDialog = (quotation) => {
    setLogDialog({ open: true, quotation });
  };

  const closeLogDialog = () => {
    setLogDialog({ open: false, quotation: null });
  };

  const isAdditionalChargeItem = (item) => {
    if (!item) return false;
    const specs = (() => {
      if (item.specs && typeof item.specs === "object") return item.specs;
      if (!item.specsJson) return {};
      try { return JSON.parse(item.specsJson); } catch { return {}; }
    })();
    const isAddCharge = item.isAdditionalCharge || specs?.isAdditionalCharge || false;
    const nameLower = (item.productName || "").toLowerCase();
    const isNameMatch = nameLower.includes("charge") ||
                        nameLower.includes("fee") ||
                        nameLower.includes("delivery") ||
                        nameLower.includes("freight") ||
                        nameLower.includes("greasing") ||
                        nameLower.includes("scoring") ||
                        nameLower.includes("printing") ||
                        nameLower.includes("cutting") ||
                        nameLower.includes("packing") ||
                        nameLower.includes("bundle");
    return isAddCharge || isNameMatch;
  };

  const openAllocationDialog = (quotation) => {
    const defaultGroup = userGroups[0]?.name || "Production";
    const initialAllocations = {};
    if (quotation?.items) {
      quotation.items
        .filter((item) => !isAdditionalChargeItem(item))
        .forEach((item) => {
          initialAllocations[item.id] = defaultGroup;
        });
    }
    setAllocationDialog({
      open: true,
      quotation,
      allocations: initialAllocations,
    });
  };

  const submitAllocationDialog = async () => {
    setActionError("");
    try {
      const q = allocationDialog.quotation;
      if (!q || !q.leadId) {
        setAllocationDialog({ open: false, quotation: null, allocations: {} });
        return;
      }

      const values = Object.values(allocationDialog.allocations);
      const hasDesign = values.some(val => String(val).toLowerCase().includes("design"));
      const hasProduction = values.some(val => String(val).toLowerCase().includes("production"));

      let targetStatus = "Production";
      if (hasDesign && hasProduction) {
        targetStatus = "Design + Production";
      } else if (hasDesign) {
        targetStatus = "Design";
      }

      const { updateLeadRowStatus } = await import("../../api/leadsApi");
      await updateLeadRowStatus(q.leadId, "deal");

      const { getDealByLeadId, updateDeal, updateDealStatus } = await import("../../api/dealsApi");
      let deal = null;
      for (let i = 0; i < 5; i++) {
        try {
          deal = await getDealByLeadId(q.leadId);
          if (deal) break;
        } catch (e) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      if (deal) {
        // Compile allocation details to show in Design/Production tables
        const allocatedItemsList = q.items?.filter((item) => !isAdditionalChargeItem(item)) || [];
        const compiledReqType = allocatedItemsList.map(item => item.productName).join(", ");
        const compiledReqNotes = allocatedItemsList.map(item => {
          const dept = allocationDialog.allocations[item.id] || "Production";
          return `[${dept}] ${item.productName} (Qty: ${item.quantity})${item.specsSummary ? ` - Specs: ${item.specsSummary}` : ""}`;
        }).join("\n");

        await updateDeal(deal.id, {
          requirementType: compiledReqType || "Allocation",
          requirementNotes: compiledReqNotes || "No items allocated"
        });
        await updateDealStatus(deal.id, targetStatus);
        setSuccessMessage(`Successfully allocated items and routed Deal to ${targetStatus}!`);
        // Refresh quotation list to update UI state
        getQuotations().then((rows) => setQuotations(Array.isArray(rows) ? rows : []));
        setAllocationDialog({ open: false, quotation: null, allocations: {} });
      } else {
        setActionError("Lead successfully converted, but the generated Deal could not be loaded. Please refresh.");
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data || err.message || "Failed to allocate and route quotation items.";
      setActionError(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    }
  };

  const buildQuotationLogs = (quotation) => {
    if (!quotation) return [];
    const items = [
      {
        key: "created",
        title: "Quotation Created",
        actor: quotation.createdByName || quotation.createdByEmail || "",
        actorRole: quotation.createdByRole || "",
        createdAt: quotation.createdAt,
        details: quotation.customerName
          ? `Created for customer ${quotation.customerName}`
          : "Quotation draft created",
      },
      {
        key: "verify",
        title: "Sent For Verification",
        actor: quotation.verificationRequestedByName || "",
        actorRole: quotation.verificationRequestedByRole || "",
        createdAt: quotation.verificationRequestedAt,
        details: quotation.verificationRequestNotes || "",
      },
      {
        key: "approved",
        title: "Quotation Approved",
        actor: quotation.approvedByName || "",
        actorRole: quotation.approvedByRole || "",
        createdAt: quotation.approvedAt,
        details: quotation.approvalNotes || "",
      },
      {
        key: "sent",
        title: "Sent To Customer",
        actor: quotation.sentByName || "",
        actorRole: "",
        createdAt: quotation.sentAt,
        details: "",
      },
      {
        key: "negotiating",
        title: "Marked As Negotiating",
        actor: quotation.negotiatingByName || "",
        actorRole: "",
        createdAt: quotation.negotiatingAt,
        details: quotation.negotiatingNotes || "",
      },
      {
        key: "rejected",
        title: "Marked As Rejected",
        actor: quotation.rejectedByName || "",
        actorRole: "",
        createdAt: quotation.rejectedAt,
        details: quotation.rejectionNotes || "",
      },
      {
        key: "accepted",
        title: "Marked As Accepted",
        actor: quotation.acceptedByName || "",
        actorRole: "",
        createdAt: quotation.acceptedAt,
        details: quotation.acceptanceNotes || "",
      },
    ];

    return items
      .filter((item) => item.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const handleCustomerResponse = async (responseType) => {
    setActionError("");
    try {
      let updated = null;
      if (responseType === "accepted") {
        openMarkAcceptedDialog(quotations.find((q) => q.id === customerResponseDialog.quotationId));
      } else if (responseType === "negotiating") {
        openMarkNegotiatingDialog(quotations.find((q) => q.id === customerResponseDialog.quotationId));
      } else if (responseType === "rejected") {
        openMarkRejectedDialog(quotations.find((q) => q.id === customerResponseDialog.quotationId));
      }
      if (updated) {
        updateSingleQuotation(updated);
      }
      closeCustomerResponseDialog();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to process customer response.";
      setActionError(message);
    }
  };

  const submitNotesDialog = async () => {
    const quotation = quotations.find((row) => row.id === notesDialog.quotationId);
    if (!quotation) {
      closeNotesDialog();
      return;
    }

    setActionError("");
    try {
      let updated = null;
      if (notesDialog.mode === "verify") {
        updated = await sendQuotationForVerification(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "approve") {
        updated = await approveQuotation(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "admin-reject") {
        updated = await rejectQuotationByAdmin(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "mark-negotiating") {
        updated = await markQuotationNegotiating(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "mark-rejected") {
        updated = await markQuotationRejected(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "mark-accepted") {
        updated = await markQuotationAccepted(quotation.id, notesDialog.notes);
      } else if (notesDialog.mode === "delete") {
        await deleteQuotation(quotation.id);
        setQuotations((previous) => previous.filter((q) => q.id !== quotation.id));
      }
      if (updated) {
        updateSingleQuotation(updated);
      }
      closeNotesDialog();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to process quotation action.";
      setActionError(message);
    }
  };

  // Sorting & searching handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchText, filters.status, filters.quickDate]);

  const quotationStatusOptions = useMemo(() => (
    Array.from(
      new Set(
        quotations
          .map((quotation) => quotation?.status || QUOTATION_STATUS_DRAFT)
          .map((status) => String(status || "").trim())
          .filter(Boolean),
      ),
    )
  ), [quotations]);

  const filteredQuotations = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    let result = quotations;
    if (term) {
      result = quotations.filter((q) => {
        const qNo = (q.quotationNumber || "").toLowerCase();
        const customer = (q.clientName || q.customerName || "").toLowerCase();
        const status = (q.status || "").toLowerCase();
        return qNo.includes(term) || customer.includes(term) || status.includes(term);
      });
    }

    if (filters.status) {
      const selectedStatus = String(filters.status || "").trim().toLowerCase();
      result = result.filter((quotation) => String(quotation?.status || "").trim().toLowerCase() === selectedStatus);
    }

    if (filters.quickDate) {
      result = result.filter((quotation) =>
        matchesQuickDate(quotation?.quotationDate || quotation?.createdAt, filters.quickDate),
      );
    }

    return [...result].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      if (sortField === "quotationNumber") {
        aVal = a.quotationNumber || "";
        bVal = b.quotationNumber || "";
      } else if (sortField === "customer") {
        aVal = a.clientName || a.customerName || "";
        bVal = b.clientName || b.customerName || "";
      } else if (sortField === "status") {
        aVal = a.status || "";
        bVal = b.status || "";
      } else if (sortField === "date") {
        aVal = a.quotationDate || a.createdAt || "";
        bVal = b.quotationDate || b.createdAt || "";
      } else if (sortField === "total") {
        const totalA = Number(a.grandTotal ?? a.totals?.grandTotal ?? 0);
        const totalB = Number(b.grandTotal ?? b.totals?.grandTotal ?? 0);
        return sortOrder === "asc" ? totalA - totalB : totalB - totalA;
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [quotations, searchText, filters.status, filters.quickDate, sortField, sortOrder]);

  const exportCsv = () => {
    const headers = [
      "Quotation No.",
      "Customer",
      "Status",
      "Date",
      "Total",
      "Employee Notes",
      "Branch Head Notes",
    ];

    const body = filteredQuotations.map((quotation) => [
      quotation.quotationNumber || "",
      quotation.clientName || quotation.customerName || "",
      getDisplayQuotationStatus(quotation),
      formatDate(quotation.quotationDate || quotation.createdAt),
      Number(quotation.grandTotal ?? quotation.totals?.grandTotal ?? 0).toFixed(2),
      quotation.verificationRequestNotes || "",
      quotation.approvalNotes || "",
    ]);

    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    downloadTextFile(`quotation-list-${Date.now()}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const exportExcel = () => {
    const headers = [
      "Quotation No.",
      "Customer",
      "Status",
      "Date",
      "Total",
      "Employee Notes",
      "Branch Head Notes",
    ];

    const escapeXml = (unsafe) =>
      String(unsafe ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const headerHtml = `      <tr>${headers.map((header) => `<th>${escapeXml(header)}</th>`).join("")}</tr>`;
    const rowsHtml = filteredQuotations
      .map((quotation) => `      <tr>
        <td>${escapeXml(quotation.quotationNumber)}</td>
        <td>${escapeXml(quotation.clientName || quotation.customerName)}</td>
        <td>${escapeXml(getDisplayQuotationStatus(quotation))}</td>
        <td>${escapeXml(formatDate(quotation.quotationDate || quotation.createdAt))}</td>
        <td>${escapeXml(Number(quotation.grandTotal ?? quotation.totals?.grandTotal ?? 0).toFixed(2))}</td>
        <td>${escapeXml(quotation.verificationRequestNotes)}</td>
        <td>${escapeXml(quotation.approvalNotes)}</td>
      </tr>`)
      .join("\n");

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
</head>
<body>
  <table>
${headerHtml}
${rowsHtml}
  </table>
</body>
</html>`;

    downloadTextFile(`quotation-list-${Date.now()}.xls`, template, "application/vnd.ms-excel;charset=utf-8;");
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const title = "Quotation List Export";
    const head = [["Quotation No.", "Customer", "Status", "Date", "Total", "Employee Notes", "Branch Head Notes"]];
    const body = filteredQuotations.map((quotation) => [
      quotation.quotationNumber || "",
      quotation.clientName || quotation.customerName || "",
      getDisplayQuotationStatus(quotation),
      formatDate(quotation.quotationDate || quotation.createdAt),
      `Rs. ${Number(quotation.grandTotal ?? quotation.totals?.grandTotal ?? 0).toFixed(2)}`,
      quotation.verificationRequestNotes || "-",
      quotation.approvalNotes || "-",
    ]);

    doc.setFontSize(16);
    doc.text(title, 40, 40);

    autoTable(doc, {
      startY: 60,
      head,
      body,
      styles: {
        fontSize: 9,
        cellPadding: 6,
        valign: "middle",
      },
      headStyles: {
        fillColor: [226, 232, 240],
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 24, right: 24, bottom: 24 },
      theme: "grid",
    });

    doc.save(`quotation-list-${Date.now()}.pdf`);
  };

  const applyFilters = () => {
    setFilters(filterDraft);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    const cleared = { status: "", quickDate: "" };
    setFilterDraft(cleared);
    setFilters(cleared);
    setFilterOpen(false);
  };

  const totalPages = Math.ceil(filteredQuotations.length / pageSize);
  const pagedQuotations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, page, pageSize]);

  return (
    <>
      <div className="content">
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Quotation List</h2>
            <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              {isEmployee
                ? "Track verification status for your quotations."
                : "Review and approve verification requests."}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/quotation"
              className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            >
              <i className="ti ti-plus" />
              Create Quotation
            </Link>
          </div>
        </div>
      </div>

        {successMessage && (
          <div className="alert alert-success alert-dismissible">
            <i className="ti ti-circle-check me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage("")} />
          </div>
        )}
        {actionError && (
          <div className="alert alert-danger">
            <i className="ti ti-alert-circle me-2"></i>
            {actionError}
          </div>
        )}

        <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="flex-grow-1" style={{ minWidth: 260, maxWidth: 420 }}>
                <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%" }}>
                  <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
                  <input
                    type="text"
                    className="form-control border-0 bg-transparent shadow-none"
                    placeholder="Search by quotation no., customer, status..."
                    style={{ height: 36, fontSize: "0.9rem" }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <ColumnVisibilityDropdown
                  columns={QUOTATION_COLUMNS}
                  visible={visibleQtColumns}
                  onChange={handleQtColVisChange}
                />
                <button
                  type="button"
                  className={`btn btn-outline-filter d-flex align-items-center gap-2 ${filterOpen ? "active" : ""}`}
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
              </div>
            </div>

            {filterOpen && (
              <div className="card border-0 shadow-sm filter-drawer-card mb-4" style={{ borderRadius: 14, backgroundColor: "#f8fafc" }}>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Status</label>
                      <select
                        className="form-select custom-filter-select"
                        style={{ height: 42, borderRadius: 8 }}
                        value={filterDraft.status}
                        onChange={(e) => setFilterDraft((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="">All Statuses</option>
                        {quotationStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {getStatusUi(status).label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Date Range</label>
                      <select
                        className="form-select custom-filter-select"
                        style={{ height: 42, borderRadius: 8 }}
                        value={filterDraft.quickDate}
                        onChange={(e) => setFilterDraft((prev) => ({ ...prev, quickDate: e.target.value }))}
                      >
                        <option value="">All Dates</option>
                        <option value="today">Today</option>
                        <option value="weekly">Last 7 Days</option>
                        <option value="monthly">Last 30 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button className="btn btn-filter-reset" style={{ height: 40, padding: "0 20px", borderRadius: 8, fontWeight: "500" }} onClick={resetFilters}>
                      Reset
                    </button>
                    <button className="btn btn-filter-apply text-white" style={{ height: 40, padding: "0 20px", borderRadius: 8, fontWeight: "500", backgroundColor: "#3b82f6" }} onClick={applyFilters}>
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-5 text-center text-muted">
                <LoadingSpinner size="page" label="Loading quotations" />
              </div>
            ) : pagedQuotations.length === 0 ? (
              <div className="text-center py-5">
                <h5 className="mb-2">No quotations found</h5>
                <p className="text-muted mb-3">
                  {isEmployee
                    ? "Create your first quotation and send it for verification."
                    : "No verification requests are available for your scope."}
                </p>
                <Link to="/quotation" className="btn btn-primary">
                  Create Quotation
                </Link>
              </div>
            ) : (
              <>
                <div
                  className="table-responsive leads-table-wrap border-0 shadow-sm mb-4"
                  style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x", borderRadius: 12, minHeight: "260px" }}
                >
                  <table className="table table-hover align-middle leads-table mb-0">
                    <thead>
                      <tr>
                        <th className="col-select text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                          <input className="form-check-input" type="checkbox" id="select-all" />
                        </th>
                        {isQtVis("sno") && <th className="col-sno text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>S.No</th>}
                        {isQtVis("qtNo") && (
                          <th
                            className="col-qno text-muted"
                            style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                            onClick={() => handleSort("quotationNumber")}
                          >
                            Qt No. {sortField === "quotationNumber" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                          </th>
                        )}
                        {isQtVis("customer") && (
                          <th
                            className="col-customer text-muted"
                            style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                            onClick={() => handleSort("customer")}
                          >
                            Customer Name {sortField === "customer" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                          </th>
                        )}
                        {isQtVis("createdBy") && <th className="col-createdby text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Created By</th>}
                        {isQtVis("createdDate") && (
                          <th
                            className="col-date text-muted"
                            style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                            onClick={() => handleSort("date")}
                          >
                            Created Date {sortField === "date" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                          </th>
                        )}
                        {isQtVis("status") && (
                          <th
                            className="col-status text-muted"
                            style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                            onClick={() => handleSort("status")}
                          >
                            Status {sortField === "status" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                          </th>
                        )}
                        {isQtVis("total") && (
                          <th
                            className="col-total text-muted"
                            style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                            onClick={() => handleSort("total")}
                          >
                            Total {sortField === "total" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                          </th>
                        )}
                        {isQtVis("notes") && <th className="col-notes text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Notes</th>}
                        <th className="col-actions text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedQuotations.map((quotation, index) => {
                        const status = quotation.status || QUOTATION_STATUS_DRAFT;
                        const statusUi = getStatusUi(status);
                        const canApprove = canApproveQuotation(quotation, userRole, user);
                        const isApprovedOrAccepted = status === QUOTATION_STATUS_APPROVED || status === QUOTATION_STATUS_ACCEPTED;

                        return (
                          <tr key={quotation.id}>
                            <td className="col-select">
                              <input className="form-check-input" type="checkbox" />
                            </td>
                            {isQtVis("sno") && (
                              <td className="col-sno fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>
                                {(page - 1) * pageSize + index + 1}
                              </td>
                            )}
                            {isQtVis("qtNo") && (
                              <td className="col-qno fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{quotation.quotationNumber || "-"}</td>
                            )}
                            {isQtVis("customer") && (
                              <td className="col-customer" style={{ fontSize: "0.9rem" }}>
                                <div>
                                  <div className="fw-semibold" style={{ color: "#0f172a" }}>{quotation.clientName || quotation.customerName || "-"}</div>
                                  {quotation.clientEmail && <span className="d-block text-muted small">{quotation.clientEmail}</span>}
                                </div>
                              </td>
                            )}
                            {isQtVis("createdBy") && (
                              <td className="col-createdby" style={{ fontSize: "0.9rem" }}>
                                <div>
                                  <div className="fw-semibold" style={{ color: "#0f172a" }}>{quotation.createdByName || "-"}</div>
                                  {quotation.createdByEmail && <span className="d-block text-muted small">{quotation.createdByEmail}</span>}
                                </div>
                              </td>
                            )}
                            {isQtVis("createdDate") && (
                              <td className="col-date" style={{ fontSize: "0.9rem", color: "#475569" }}>{formatDate(quotation.quotationDate || quotation.createdAt)}</td>
                            )}
                            {isQtVis("status") && (
                              <td className="col-status">
                                <span className={statusUi.className}>
                                  {status === QUOTATION_STATUS_VERIFICATION_PENDING && quotation.negotiatingAt
                                    ? "Re-verification Pending"
                                    : status === QUOTATION_STATUS_APPROVED && quotation.negotiatingAt
                                    ? "Re-verification Approved"
                                    : statusUi.label}
                                </span>
                                {isEmployee && status === QUOTATION_STATUS_APPROVED && (
                                  <div className="mt-2">
                                    <button
                                      type="button"
                                      className="btn btn-info btn-sm w-100"
                                      onClick={() => handleMarkSent(quotation)}
                                    >
                                      <i className="ti ti-mail-forward me-1"></i>
                                      Mark as Sent
                                    </button>
                                  </div>
                                )}
                                {isEmployee && status === QUOTATION_STATUS_SENT && (
                                  <div className="mt-2">
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm w-100"
                                      onClick={() => openCustomerResponseDialog(quotation)}
                                    >
                                      <i className="ti ti-help me-1"></i>
                                      Customer Response
                                    </button>
                                  </div>
                                )}
                                {status === QUOTATION_STATUS_ACCEPTED &&
                                   !["converted to customer", "deal", "allocate", "design", "production", "design + production"].includes(String(quotation.leadStatus || "").trim().toLowerCase()) &&
                                   ["EMPLOYEE", "TEAM_LEAD", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(userRole) && (
                                     <div className="mt-2">
                                       <button
                                         type="button"
                                         className="btn btn-success btn-sm w-100"
                                         onClick={() => handleConvertToCustomer(quotation)}
                                       >
                                         <i className="ti ti-user-check me-1"></i>
                                         Convert to Customer
                                       </button>
                                     </div>
                                   )}
                                 {[QUOTATION_STATUS_ACCEPTED, QUOTATION_STATUS_APPROVED].includes(status) &&
                                   ["payment", "allocate", "converted to customer"].includes(String(quotation.leadStatus || "").trim().toLowerCase()) &&
                                   quotation.salesOrderStatus &&
                                   quotation.salesOrderStatus !== "AWAITING_ADVANCE" &&
                                   ["EMPLOYEE", "TEAM_LEAD", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(userRole) && (
                                     <div className="mt-2">
                                       <button
                                         type="button"
                                         className="btn btn-primary btn-sm w-100"
                                         onClick={() => openAllocationDialog(quotation)}
                                       >
                                         <i className="ti ti-arrows-split me-1"></i>
                                         Allocate Items
                                       </button>
                                     </div>
                                    )}
                              </td>
                            )}
                            {isQtVis("total") && (
                              <td className="col-total fw-semibold text-success" style={{ fontSize: "0.9rem" }}>Rs. {Number(quotation.grandTotal ?? quotation.totals?.grandTotal ?? 0).toFixed(2)}</td>
                            )}
                            {isQtVis("notes") && (
                              <td className="col-notes" style={{ fontSize: "0.85rem" }}>
                                <div className="small">
                                  <div>
                                    <strong>Employee:</strong> {quotation.verificationRequestNotes || "-"}
                                  </div>
                                  <div>
                                    <strong>Branch Head:</strong> {quotation.approvalNotes || "-"}
                                  </div>
                                </div>
                              </td>
                            )}
                            <td className="col-actions">
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                                  style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (activeActionsRow?.id === quotation.id) {
                                      setActiveActionsRow(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setActionsMenuPos({
                                        top: rect.top + window.scrollY,
                                        left: rect.right + window.scrollX,
                                      });
                                      setActiveActionsRow(quotation);
                                    }
                                  }}
                                >
                                  <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                                </button>
                                {canApprove && (
                                  <div className="d-flex gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm d-flex align-items-center gap-1"
                                      style={{ padding: "6px 12px", borderRadius: 8, fontSize: "0.85rem", fontWeight: "600" }}
                                      onClick={() => openApproveDialog(quotation)}
                                    >
                                      <i className="ti ti-circle-check"></i>
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                                      style={{ padding: "6px 12px", borderRadius: 8, fontSize: "0.85rem", fontWeight: "600" }}
                                      onClick={() => openAdminRejectDialog(quotation)}
                                    >
                                      <i className="ti ti-circle-x"></i>
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
                  <span className="entries-info text-muted small">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredQuotations.length)} of {filteredQuotations.length} entries
                  </span>

                  <div className="pagination-numbers-container d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>

                    {(() => {
                      const buttons = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, page - 2);
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      if (maxVisible - 1 > endPage - startPage) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      if (startPage > 1) {
                        buttons.push(
                          <button
                            key={1}
                            className={`btn-pagination-num btn btn-sm border-0 ${page === 1 ? 'btn-primary text-white' : 'btn-light'}`}
                            style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === 1 ? "#3b82f6" : undefined }}
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
                            className={`btn-pagination-num btn btn-sm border-0 ${page === i ? 'btn-primary text-white' : 'btn-light'}`}
                            style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === i ? "#3b82f6" : undefined }}
                            onClick={() => setPage(i)}
                          >
                            {i}
                          </button>
                        );
                      }

                      if (totalPages > endPage) {
                        if (totalPages - 1 > endPage) {
                          buttons.push(<span key="dots-end" className="pagination-dots px-1 text-muted">...</span>);
                        }
                        buttons.push(
                          <button
                            key={totalPages}
                            className={`btn-pagination-num btn btn-sm border-0 ${page === totalPages ? 'btn-primary text-white' : 'btn-light'}`}
                            style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === totalPages ? "#3b82f6" : undefined }}
                            onClick={() => setPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return buttons;
                    })()}

                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                  </div>

                  <PageSizeSelector
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    setPage={setPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {notesDialog.open && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {notesDialog.mode === "verify" && "Send for Verification"}
                    {notesDialog.mode === "approve" && "Approve Quotation"}
                    {notesDialog.mode === "admin-reject" && "Reject Quotation"}
                    {notesDialog.mode === "mark-negotiating" && "Mark as Negotiating"}
                    {notesDialog.mode === "mark-rejected" && "Mark as Rejected"}
                    {notesDialog.mode === "mark-accepted" && "Mark as Accepted"}
                    {notesDialog.mode === "delete" && "Delete Quotation"}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeNotesDialog}></button>
                </div>
                <div className="modal-body">
                  {notesDialog.mode === "delete" ? (
                    <div>
                      <p className="text-warning">
                        <i className="ti ti-alert-triangle me-2"></i>
                        <strong>Are you sure you want to delete this quotation?</strong>
                      </p>
                      <p className="text-muted small">This action cannot be undone. The quotation and all its data will be permanently removed.</p>
                    </div>
                  ) : (
                    <>
                      <label className="form-label">
                        {notesDialog.mode === "verify" && "Verification Notes (optional)"}
                        {notesDialog.mode === "approve" && "Approval Notes (optional)"}
                        {notesDialog.mode === "admin-reject" && "Rejection Notes (required)"}
                        {notesDialog.mode === "mark-negotiating" && "Negotiation Notes (required)"}
                        {notesDialog.mode === "mark-rejected" && "Rejection Notes (required)"}
                        {notesDialog.mode === "mark-accepted" && "Acceptance Notes (optional)"}
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={notesDialog.notes}
                        onChange={(event) =>
                          setNotesDialog((previous) => ({ ...previous, notes: event.target.value }))
                        }
                        placeholder="Add notes..."
                      />
                      {(notesDialog.mode === "mark-negotiating" || notesDialog.mode === "mark-rejected" || notesDialog.mode === "admin-reject") && !notesDialog.notes.trim() && (
                        <div className="form-text text-danger">Notes are required.</div>
                      )}
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeNotesDialog}>
                    {notesDialog.mode === "delete" ? "Cancel" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    className={notesDialog.mode === "delete" ? "btn btn-danger" : "btn btn-primary"}
                    onClick={submitNotesDialog}
                    disabled={
                      (notesDialog.mode === "mark-negotiating" || notesDialog.mode === "mark-rejected" || notesDialog.mode === "admin-reject")
                      && !notesDialog.notes.trim()
                    }
                  >
                    {notesDialog.mode === "verify" && "Send Verification"}
                    {notesDialog.mode === "approve" && "Approve"}
                    {notesDialog.mode === "admin-reject" && "Reject"}
                    {notesDialog.mode === "mark-negotiating" && "Save"}
                    {notesDialog.mode === "mark-rejected" && "Save"}
                    {notesDialog.mode === "mark-accepted" && "Save"}
                    {notesDialog.mode === "delete" && "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show quotation-list-backdrop"></div>
        </>
      )}

      {customerResponseDialog.open && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Customer Response</h5>
                  <button type="button" className="btn-close" onClick={closeCustomerResponseDialog}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted mb-4">Select customer's response to the quotation:</p>
                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-success btn-lg"
                      onClick={() => handleCustomerResponse("accepted")}
                    >
                      <i className="ti ti-circle-check me-2"></i>
                      Accepted
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning btn-lg"
                      onClick={() => handleCustomerResponse("negotiating")}
                    >
                      <i className="ti ti-refresh me-2"></i>
                      Negotiating
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-lg"
                      onClick={() => handleCustomerResponse("rejected")}
                    >
                      <i className="ti ti-x me-2"></i>
                      Rejected
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show quotation-list-backdrop"></div>
        </>
      )}

      {logDialog.open && (
        <>
          <div className="quotation-log-overlay">
            <div className="quotation-log-card">
              <div className="quotation-log-header">
                <div>
                  <h5 className="mb-1">
                    <i className="ti ti-history me-2"></i>
                    Quotation Log
                  </h5>
                  <div className="quotation-log-subtitle">
                    {logDialog.quotation?.quotationNumber || "Quotation"}
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={closeLogDialog}></button>
              </div>
              <div className="quotation-log-body">
                {buildQuotationLogs(logDialog.quotation).length === 0 ? (
                  <div className="text-muted text-center py-4">No quotation activity yet.</div>
                ) : (
                  <div className="quotation-log-list">
                    {buildQuotationLogs(logDialog.quotation).map((log) => (
                      <div key={log.key} className="quotation-log-item">
                        <div className="quotation-log-item-head">
                          <h6 className="mb-1">{log.title}</h6>
                          <span className="quotation-log-time">{formatDateTime(log.createdAt)}</span>
                        </div>
                        {(log.actor || log.actorRole) && (
                          <div className="quotation-log-meta">
                            {log.actor ? `By: ${log.actor}` : "By: -"}
                            {log.actorRole ? ` (${log.actorRole})` : ""}
                          </div>
                        )}
                        {log.details ? <div className="quotation-log-details">{log.details}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="quotation-log-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeLogDialog}>
                  Close
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show quotation-list-backdrop"></div>
        </>
      )}

      {allocationDialog.open && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>
                    <i className="ti ti-arrows-split me-2 text-primary"></i>
                    Separate & Allocate Quotation Items
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setAllocationDialog({ open: false, quotation: null, allocations: {} })}></button>
                </div>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-4">
                    For each product in this quotation, choose which team it should be sent to. 
                    If items are split between both teams, the Deal status will automatically be updated to <strong>Design + Production</strong>.
                  </p>
                  
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Details</th>
                          <th>Quantity</th>
                          <th style={{ width: 240 }}>Allocate To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocationDialog.quotation?.items
                          ?.filter((item) => !isAdditionalChargeItem(item))
                          ?.map((item) => (
                          <tr key={item.id}>
                            <td className="fw-semibold" style={{ color: "#0f172a" }}>{item.productName}</td>
                            <td className="small text-muted">{item.specsSummary || "-"}</td>
                            <td className="fw-semibold">{item.quantity}</td>
                            <td>
                              <select
                                className="form-select"
                                style={{ borderRadius: 8 }}
                                value={allocationDialog.allocations[item.id] || (userGroups[0]?.name || "Production")}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAllocationDialog(prev => ({
                                    ...prev,
                                    allocations: {
                                      ...prev.allocations,
                                      [item.id]: val
                                    }
                                  }));
                                }}
                              >
                                {userGroups.map((group) => (
                                  <option key={group.id} value={group.name}>
                                    {group.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-light px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => setAllocationDialog({ open: false, quotation: null, allocations: {} })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-3"
                    style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                    onClick={submitAllocationDialog}
                  >
                    Allocate & Send
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show quotation-list-backdrop"></div>
        </>
      )}

      {markSentDialog.open && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>
                    <i className="ti ti-mail-forward me-2 text-primary"></i>
                    Mark Quotation as Sent
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setMarkSentDialog({ open: false, quotation: null, sendEmail: false })}></button>
                </div>
                <div className="modal-body p-4">
                  {markSentDialog.quotation?.clientEmail && markSentDialog.quotation.clientEmail.trim() ? (
                    <div>
                      <p className="mb-3">Would you like to send an automated email copy of the quotation to the customer?</p>
                      <div className="form-check form-switch p-0 d-flex align-items-center gap-3 bg-light p-3" style={{ borderRadius: 8 }}>
                        <input
                          className="form-check-input ms-0"
                          type="checkbox"
                          role="switch"
                          id="sendEmailCheckbox"
                          style={{ width: 44, height: 22, cursor: "pointer" }}
                          checked={markSentDialog.sendEmail}
                          onChange={(e) => setMarkSentDialog(prev => ({ ...prev, sendEmail: e.target.checked }))}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="sendEmailCheckbox" style={{ cursor: "pointer", color: "#334155" }}>
                          Send Email to: <span className="text-primary">{markSentDialog.quotation.clientEmail}</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-alert-triangle" style={{ fontSize: "1.2rem" }}></i>
                        <strong>No Customer Email Configured</strong>
                      </div>
                      <p className="text-muted small mb-0">
                        This lead/customer doesn't have an email address configured. The quotation status will be updated to <strong>Sent</strong>, and you can download the PDF to send privately.
                      </p>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-light px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => setMarkSentDialog({ open: false, quotation: null, sendEmail: false })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-3"
                    style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                    onClick={confirmMarkSent}
                  >
                    Confirm & Mark Sent
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show quotation-list-backdrop"></div>
        </>
      )}

      {selectedQuotationDetails && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "18px" }}>
                <div className="modal-header bg-light" style={{ borderTopLeftRadius: "18px", borderTopRightRadius: "18px" }}>
                  <h5 className="modal-title fw-bold" style={{ color: "#45597a" }}>
                    Details ({selectedQuotationDetails.quotationNumber || "Draft"})
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedQuotationDetails(null)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="d-flex flex-column gap-3">
                    <div className="row">
                      <div className="col-4 text-muted fw-semibold">Customer:</div>
                      <div className="col-8 fw-bold">{selectedQuotationDetails.clientName || selectedQuotationDetails.customerName || "-"}</div>
                    </div>
                    <div className="row">
                      <div className="col-4 text-muted fw-semibold">Status:</div>
                      <div className="col-8">
                        <span className={getStatusUi(selectedQuotationDetails.status || QUOTATION_STATUS_DRAFT).className}>
                          {selectedQuotationDetails.status || QUOTATION_STATUS_DRAFT}
                        </span>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4 text-muted fw-semibold">Date:</div>
                      <div className="col-8">{formatDate(selectedQuotationDetails.quotationDate || selectedQuotationDetails.createdAt)}</div>
                    </div>
                    <div className="row">
                      <div className="col-4 text-muted fw-semibold">Total:</div>
                      <div className="col-8 fw-bold text-success">
                        Rs. {Number(selectedQuotationDetails.grandTotal ?? selectedQuotationDetails.totals?.grandTotal ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4 text-muted fw-semibold">Employee Notes:</div>
                      <div className="col-8">{selectedQuotationDetails.verificationRequestNotes || "-"}</div>
                    </div>
                    <div className="row">
                      <div className="col-4 text-muted fw-semibold">Branch Head Notes:</div>
                      <div className="col-8">{selectedQuotationDetails.approvalNotes || "-"}</div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Actions inside the details modal */}
                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        handleEdit(selectedQuotationDetails);
                        setSelectedQuotationDetails(null);
                      }}
                      disabled={isEmployee && !(selectedQuotationDetails.status === QUOTATION_STATUS_DRAFT || selectedQuotationDetails.status === QUOTATION_STATUS_NEGOTIATING)}
                    >
                      <i className="ti ti-edit me-2"></i>
                      Edit Quotation
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => {
                        handleView(selectedQuotationDetails);
                        setSelectedQuotationDetails(null);
                      }}
                    >
                      <i className="ti ti-eye me-2"></i>
                      View PDF Preview
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        handleDownload(selectedQuotationDetails);
                        setSelectedQuotationDetails(null);
                      }}
                      disabled={isEmployee && !(selectedQuotationDetails.status === QUOTATION_STATUS_APPROVED || selectedQuotationDetails.status === QUOTATION_STATUS_ACCEPTED)}
                    >
                      <i className="ti ti-file-download me-2"></i>
                      Download PDF
                    </button>
                    {isEmployee && selectedQuotationDetails.status === QUOTATION_STATUS_APPROVED && (
                      <button
                        type="button"
                        className="btn btn-info"
                        onClick={() => {
                          handleMarkSent(selectedQuotationDetails);
                          setSelectedQuotationDetails(null);
                        }}
                      >
                        <i className="ti ti-mail-forward me-2"></i>
                        Mark as Sent
                      </button>
                    )}
                    {isEmployee && selectedQuotationDetails.status === QUOTATION_STATUS_SENT && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          openCustomerResponseDialog(selectedQuotationDetails);
                          setSelectedQuotationDetails(null);
                        }}
                      >
                        <i className="ti ti-help me-2"></i>
                        Customer Response
                      </button>
                    )}
                    {isEmployee && selectedQuotationDetails.status === QUOTATION_STATUS_DRAFT && (
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => {
                          openVerifyDialog(selectedQuotationDetails);
                          setSelectedQuotationDetails(null);
                        }}
                      >
                        <i className="ti ti-send me-2"></i>
                        Send for Verification
                      </button>
                    )}
                    {isEmployee && selectedQuotationDetails.status === QUOTATION_STATUS_NEGOTIATING && (
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => {
                          openVerifyDialog(selectedQuotationDetails);
                          setSelectedQuotationDetails(null);
                        }}
                      >
                        <i className="ti ti-send me-2"></i>
                        Re-send for Approval
                      </button>
                    )}
                    {isHigherAuthority && (
                      <>
                        <button
                          type="button"
                          className="btn btn-info"
                          onClick={() => {
                            openApproveDialog(selectedQuotationDetails);
                            setSelectedQuotationDetails(null);
                          }}
                          disabled={!canApproveQuotation(selectedQuotationDetails, userRole, user)}
                        >
                          <i className="ti ti-circle-check me-2"></i>
                          {selectedQuotationDetails.status === QUOTATION_STATUS_APPROVED ? "Approved" : "Approve"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => {
                            openAdminRejectDialog(selectedQuotationDetails);
                            setSelectedQuotationDetails(null);
                          }}
                          disabled={!canApproveQuotation(selectedQuotationDetails, userRole, user)}
                        >
                          <i className="ti ti-circle-x me-2"></i>
                          Reject Quotation
                        </button>
                      </>
                    )}
                    {userRole === "SUPER_ADMIN" && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                          handleDelete(selectedQuotationDetails);
                          setSelectedQuotationDetails(null);
                        }}
                      >
                        <i className="ti ti-trash me-2"></i>
                        Delete Quotation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show quotation-list-backdrop"></div>
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
            minWidth: 180
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Edit */}
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleEdit(activeActionsRow);
              setActiveActionsRow(null);
            }}
            disabled={isEmployee && !(activeActionsRow.status === QUOTATION_STATUS_DRAFT || activeActionsRow.status === QUOTATION_STATUS_NEGOTIATING)}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Quotation
          </button>

          {/* View PDF Preview */}
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleView(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-eye" style={{ fontSize: "1rem", color: "#64748b" }} /> View Preview
          </button>

          {/* Download PDF */}
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleDownload(activeActionsRow);
              setActiveActionsRow(null);
            }}
            disabled={isEmployee && !(activeActionsRow.status === QUOTATION_STATUS_APPROVED || activeActionsRow.status === QUOTATION_STATUS_ACCEPTED)}
          >
            <i className="ti ti-file-download" style={{ fontSize: "1rem", color: "#64748b" }} /> Download PDF
          </button>

          {/* Log */}
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              openLogDialog(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-history" style={{ fontSize: "1rem", color: "#64748b" }} /> View Log
          </button>

          {/* Send for Verification */}
          {isEmployee && activeActionsRow.status === QUOTATION_STATUS_DRAFT && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                openVerifyDialog(activeActionsRow);
                setActiveActionsRow(null);
              }}
            >
              <i className="ti ti-send" style={{ fontSize: "1rem", color: "#64748b" }} /> Send for Verification
            </button>
          )}

          {/* Re-send for Approval */}
          {isEmployee && activeActionsRow.status === QUOTATION_STATUS_NEGOTIATING && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                openVerifyDialog(activeActionsRow);
                setActiveActionsRow(null);
              }}
            >
              <i className="ti ti-send" style={{ fontSize: "1rem", color: "#64748b" }} /> Re-send for Approval
            </button>
          )}

          {/* Approve */}
          {isHigherAuthority && (
            <>
              <button
                className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
                style={{ fontSize: "0.85rem" }}
                onClick={() => {
                  openApproveDialog(activeActionsRow);
                  setActiveActionsRow(null);
                }}
                disabled={!canApproveQuotation(activeActionsRow, userRole, user)}
              >
                <i className="ti ti-circle-check" style={{ fontSize: "1rem", color: "#64748b" }} /> Approve
              </button>
              <button
                className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
                style={{ fontSize: "0.85rem" }}
                onClick={() => {
                  openAdminRejectDialog(activeActionsRow);
                  setActiveActionsRow(null);
                }}
                disabled={!canApproveQuotation(activeActionsRow, userRole, user)}
              >
                <i className="ti ti-circle-x" style={{ fontSize: "1rem", color: "#ef4444" }} /> Reject
              </button>
            </>
          )}

          {/* Delete */}
          {userRole === "SUPER_ADMIN" && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                handleDelete(activeActionsRow);
                setActiveActionsRow(null);
              }}
            >
              <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
