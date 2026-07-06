import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";
import { downloadLeadRequirementFile, getLeads, updateLeadDetails } from "../../api/leadsApi";
import { getDesignRequirement } from "../../api/designRequirementApi";
import { getUsers, getUserById } from "../../api/userAdminApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import api from "../../utils/api";
import "./LeadsPage.css";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function DetailField({ label, value, className = "col-md-4" }) {
  return (
    <div className={className}>
      <div className="border rounded-3 h-100 p-3 bg-light">
        <div className="text-muted small text-uppercase fw-semibold mb-1">{label}</div>
        <div className="fw-semibold text-dark text-break">{value || "-"}</div>
      </div>
    </div>
  );
}

function FileField({ label, fileName, filePath, onDownload, className = "col-md-6" }) {
  if (!fileName) return null;
  return (
    <div className={className}>
      <div className="border rounded-3 h-100 p-3 bg-light">
        <div className="text-muted small text-uppercase fw-semibold mb-2">{label}</div>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <div className="fw-semibold text-break">{fileName}</div>
          {filePath ? (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onDownload(filePath, fileName)}
            >
              <i className="ti ti-download me-1"></i>Download
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function BudgetVerificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [pendingBudgets, setPendingBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [userNameMap, setUserNameMap] = useState({});
  const [detailLead, setDetailLead] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailDesignRequirement, setDetailDesignRequirement] = useState(null);

  // Search, pagination, selection, kebab states
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Close kebab action menu on outside scroll or click
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

  const getAssignedDisplayName = (lead) => {
    const assignedUserId = lead?.budgetVerificationAssignedToUserId;
    if (!assignedUserId) return "Unassigned";

    const directName =
      lead?.budgetVerificationAssignedToUserName ||
      lead?.budgetVerificationAssignedToUsername ||
      lead?.budgetVerificationAssignedToUserFullName ||
      lead?.budgetVerificationAssignedToUser?.name ||
      lead?.budgetVerificationAssignedToUser?.fullName ||
      lead?.budgetVerificationAssignedToUser?.username ||
      lead?.assignedToUserName ||
      lead?.assignedToUsername ||
      lead?.assignedToUserFullName ||
      lead?.assignedToFullName;

    if (directName) return directName;

    const cachedName = userNameMap[assignedUserId];
    if (cachedName) return cachedName;

    if (String(assignedUserId) === String(user?.id)) return "You";
    return "Unknown employee";
  };

  const fetchPendingBudgets = async () => {
    setLoading(true);
    try {
      const leads = await getLeads({ limit: 1000, offset: 0 });
      const pending = (Array.isArray(leads) ? leads : []).filter((lead) => {
        const isPending = lead.budgetVerificationStatus === "PENDING";
        if (!isPending) return false;
        if (user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER")) {
          return true;
        }
        if (!user?.id) return false;
        return String(lead.budgetVerificationAssignedToUserId) === String(user.id);
      });
      setPendingBudgets(pending);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load budget verifications"));
    } finally {
      setLoading(false);
    }
  };

  const loadUserNames = async () => {
    try {
      const usersData = await getUsers(0, 500);
      const map = {};
      if (Array.isArray(usersData?.items)) {
        usersData.items.forEach((u) => {
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
          map[u.id] = fullName || u.username || "";
        });
      }

      const missingIds = (Array.isArray(pendingBudgets) ? pendingBudgets : [])
        .map((lead) => lead?.budgetVerificationAssignedToUserId)
        .filter((id) => id != null && !map[id]);

      const uniqueMissingIds = [...new Set(missingIds.map((id) => String(id)))];
      await Promise.all(
        uniqueMissingIds.map(async (id) => {
          const userData = await getUserById(id).catch(() => null);
          if (!userData) return;
          const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ").trim();
          map[userData.id] = fullName || userData.username || "";
        })
      );

      setUserNameMap(map);
    } catch (e) {
      console.error("Failed to load user names:", e);
    }
  };

  useEffect(() => {
    if (user !== undefined) {
      fetchPendingBudgets();
    }
  }, [user]);

  useEffect(() => {
    if (user !== undefined) {
      loadUserNames();
    }
  }, [user, pendingBudgets]);

  const handleCalculate = (lead) => {
    navigate(`/budget-verifications/${lead.id}/calculate`);
  };

  const openRequirementDetails = async (lead) => {
    setDetailLead(lead);
    setDetailLoading(true);
    setDetailDesignRequirement(null);
    try {
      const designReq = await getDesignRequirement(lead.id);
      setDetailDesignRequirement(designReq || null);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load requirement details"));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeRequirementDetails = () => {
    setDetailLead(null);
    setDetailDesignRequirement(null);
    setDetailLoading(false);
  };

  const handleReject = async (leadId) => {
    if (!rejectionReason.trim()) {
      showError("Please provide a rejection reason");
      return;
    }
    setRejecting(leadId);
    try {
      await updateLeadDetails(leadId, {
        budgetVerificationStatus: "REJECTED",
        budgetVerificationRejectionReason: rejectionReason,
      });
      showSuccess("Budget verification rejected");
      setPendingBudgets((prev) => prev.filter((item) => item.id !== leadId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
      setRejectingId(null);
      setRejectionReason("");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to reject budget verification"));
    } finally {
      setRejecting(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    const reason = window.prompt("Enter rejection reason for selected budget verifications:");
    if (reason === null) return;
    if (!reason.trim()) {
      showError("Rejection reason is required");
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateLeadDetails(id, {
            budgetVerificationStatus: "REJECTED",
            budgetVerificationRejectionReason: reason,
          })
        )
      );
      showSuccess(`${selectedIds.size} verifications rejected successfully`);
      setPendingBudgets((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
    } catch (e) {
      showError("Failed to reject some verifications");
    } finally {
      setLoading(false);
    }
  };

  const downloadProtectedFile = async (filePath, fileName) => {
    try {
      const response = await api.get(filePath, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download file"));
    }
  };

  // Search logic
  const filteredRows = useMemo(() => {
    let result = pendingBudgets;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((r) =>
        (r.name || "").toLowerCase().includes(q) ||
        String(r.leadId || r.id).toLowerCase().includes(q) ||
        (r.requirementType || "").toLowerCase().includes(q) ||
        getAssignedDisplayName(r).toLowerCase().includes(q)
      );
    }
    return result;
  }, [pendingBudgets, search, userNameMap]);

  // Pagination logic
  const totalRows = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredRows.slice(pageOffset, pageOffset + pageSize),
    [filteredRows, pageOffset, pageSize]
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage]);

  // Selection handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleRowSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Export handlers
  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? filteredRows.filter((r) => selectedIds.has(r.id))
      : filteredRows;

    const headers = ["Lead ID", "Lead Name", "Requirement Type", "Assigned To", "Notes"];
    const body = targetRows.map((row) => [
      row.leadId || row.id,
      row.name || "",
      row.requirementType || "",
      getAssignedDisplayName(row),
      row.requirementNotes || "",
    ]);

    const csv = [headers, ...body]
      .map((line) =>
        line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-verifications-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? filteredRows.filter((r) => selectedIds.has(r.id))
      : filteredRows;

    const headers = ["Lead ID", "Lead Name", "Requirement Type", "Assigned To", "Notes"];
    const body = targetRows.map((row) => [
      row.leadId || row.id,
      row.name || "",
      row.requirementType || "",
      getAssignedDisplayName(row),
      row.requirementNotes || "",
    ]);

    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Budget Verifications</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    template += `<body><table><thead><tr>`;
    headers.forEach((h) => {
      template += `<th>${h}</th>`;
    });
    template += `</tr></thead><tbody>`;
    body.forEach((r) => {
      template += `<tr>`;
      r.forEach((c) => {
        template += `<td>${c}</td>`;
      });
      template += `</tr>`;
    });
    template += `</tbody></table></body></html>`;

    const blob = new Blob([template], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-verifications-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? filteredRows.filter((r) => selectedIds.has(r.id))
      : filteredRows;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Budget Verifications Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["Lead ID", "Lead Name", "Requirement Type", "Assigned To", "Notes"]];
    const body = targetRows.map((row) => [
      row.leadId || row.id,
      row.name || "",
      row.requirementType || "",
      getAssignedDisplayName(row),
      row.requirementNotes || "",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 9 },
    });

    doc.save(`budget-verifications-${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="content">
        {/* Custom Header Card with breadcrumb and primary blue button */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Budget Verifications</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Budget Verifications</li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={fetchPendingBudgets}
                disabled={loading}
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-refresh" style={{ fontSize: "1.1rem" }}></i>
                Refresh List
              </button>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Search and Export controls inside card */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search by ID, name, type..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="dropdown">
                <button
                  className="btn btn-outline-export dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  id="exportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                >
                  <i className="ti ti-download" style={{ fontSize: "1rem" }} />
                  Export
                </button>
                <ul className="dropdown-menu shadow border-0" aria-labelledby="exportDropdown">
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportExcel}>
                      Excel
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportCsv}>
                      CSV
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportPdf}>
                      PDF
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive" style={{ overflowX: "auto" }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="thead-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Lead ID</th>
                    <th>Lead Name</th>
                    <th>Requirement Type</th>
                    <th>Assigned To</th>
                    <th>Notes</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">No pending budget verifications found</td>
                    </tr>
                  ) : (
                    pagedRows.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(lead.id)}
                            onChange={() => toggleRowSelection(lead.id)}
                          />
                        </td>
                        <td>
                          <Link to={`/leads/${lead.id}`} className="text-primary fw-semibold" style={{ textDecoration: "none" }}>
                            #{lead.leadId || lead.id}
                          </Link>
                        </td>
                        <td className="fw-semibold text-dark">{lead.name || "—"}</td>
                        <td>
                          {lead.requirementType ? (
                            <span className="badge bg-secondary">{lead.requirementType}</span>
                          ) : "—"}
                        </td>
                        <td>
                          <span className={`badge ${lead.budgetVerificationAssignedToUserId ? "bg-info" : "bg-secondary"}`}>
                            {getAssignedDisplayName(lead)}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">{lead.requirementNotes || "—"}</small>
                        </td>
                        <td>
                          {rejectingId === lead.id ? (
                            <div className="d-flex gap-1 flex-column" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                placeholder="Rejection reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                style={{ minWidth: 150 }}
                              />
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleReject(lead.id)}
                                  disabled={rejecting === lead.id}
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Confirm
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectionReason("");
                                  }}
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeActionsRow?.id === lead.id) {
                                  setActiveActionsRow(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setActionsMenuPos({
                                    top: rect.top + window.scrollY,
                                    left: rect.right + window.scrollX,
                                  });
                                  setActiveActionsRow(lead);
                                }
                              }}
                            >
                              <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top">
            <span className="entries-info text-muted small">
              {totalRows === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${pageOffset + 1} to ${Math.min(pageOffset + pageSize, totalRows)} of ${totalRows} entries`}
            </span>

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

              {Array.from({ length: pageCount }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === pageNum ? "active" : "btn-light"}`}
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

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

            <PageSizeSelector pageSize={pageSize} setPageSize={setPageSize} setPage={setPage} />
          </div>
        </div>
      </div>

      {/* Floating Kebab Actions Portal */}
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
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              openRequirementDetails(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-eye" style={{ fontSize: "1rem", color: "#64748b" }} /> View Requirement
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-success"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleCalculate(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-calculator" style={{ fontSize: "1rem", color: "#10b981" }} /> Calculate Budget
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              setRejectingId(activeActionsRow.id);
              setRejectionReason("");
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-x" style={{ fontSize: "1rem", color: "#ef4444" }} /> Reject Verification
          </button>
        </div>,
        document.body
      )}

      {/* Floating Bulk Operations Bar */}
      {selectedIds.size > 0 && (
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
              {selectedIds.size}
            </span>
            <span className="fw-medium text-white">selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-warning d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", border: "none" }}
              onClick={handleBulkReject}
              disabled={loading}
            >
              <i className="ti ti-x" /> Reject Selected
            </button>
            <button
              className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
              style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)" }}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Modal for Details */}
      {detailLead && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" aria-modal="true" role="dialog">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Requirement Details for #{detailLead.leadId || detailLead.id}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeRequirementDetails} />
                </div>
                <div className="modal-body">
                  <div className="row g-3 mb-4">
                    <DetailField label="Lead Name" value={detailLead.name} />
                    <div className="col-md-4">
                      <div className="border rounded-3 h-100 p-3 bg-light">
                        <div className="text-muted small text-uppercase fw-semibold mb-2">Selected Category</div>
                        <span className="badge bg-secondary fs-6">{detailLead.requirementType || "-"}</span>
                      </div>
                    </div>
                    <DetailField label="Notes" value={detailLead.requirementNotes} />
                  </div>

                  {detailLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {detailDesignRequirement && (
                        <div className="card mb-4">
                          <div className="card-header">
                            <h6 className="mb-0"><i className="ti ti-palette me-2"></i>Design Requirement Details</h6>
                          </div>
                          <div className="card-body">
                            <div className="row g-3">
                              <DetailField label="Requirement Type" value={detailDesignRequirement.requirementType} />
                              <DetailField label="Product Type" value={detailDesignRequirement.designProductType} />
                              <DetailField label="Size" value={detailDesignRequirement.designSize} />
                              <DetailField label="Orientation" value={detailDesignRequirement.designOrientation} />
                              <DetailField label="Pages" value={detailDesignRequirement.designNumPages} />
                              <DetailField label="Purpose" value={detailDesignRequirement.designPurpose} />
                              <DetailField label="Priority" value={detailDesignRequirement.designPriority} />
                              <DetailField label="Brand Colors" value={detailDesignRequirement.designBrandColors} className="col-md-6" />
                              <DetailField label="Fonts" value={detailDesignRequirement.designFonts} className="col-md-6" />
                              <DetailField label="Target Audience" value={detailDesignRequirement.designTargetAudience} className="col-md-6" />
                              <DetailField label="Style Preference" value={detailDesignRequirement.designStylePref} className="col-md-6" />
                              <DetailField label="Deadline" value={detailDesignRequirement.designDeadline ? formatDateTime(detailDesignRequirement.designDeadline) : "-"} className="col-md-6" />
                              <DetailField label="Reference Links" value={detailDesignRequirement.designReferenceLinks} className="col-md-6" />
                              <DetailField label="Description" value={detailDesignRequirement.designDescription} className="col-md-12" />
                              <DetailField label="Additional Notes" value={detailDesignRequirement.designAdditionalNotes || detailDesignRequirement.requirementNotes} className="col-md-12" />
                              <FileField
                                label="Brand Guidelines"
                                fileName={detailDesignRequirement.designBrandGuidelinesFileName}
                                filePath={detailDesignRequirement.designBrandGuidelinesFilePath}
                                onDownload={downloadProtectedFile}
                              />
                              <FileField
                                label="Logo File"
                                fileName={detailDesignRequirement.designLogoFileName}
                                filePath={detailDesignRequirement.designLogoFilePath}
                                onDownload={downloadProtectedFile}
                              />
                              <FileField
                                label="Client Images"
                                fileName={detailDesignRequirement.designImagesFileName}
                                filePath={detailDesignRequirement.designImagesFilePath}
                                onDownload={downloadProtectedFile}
                              />
                              <FileField
                                label="Reference Images"
                                fileName={detailDesignRequirement.designReferenceImagesFileName}
                                filePath={detailDesignRequirement.designReferenceImagesFilePath}
                                onDownload={downloadProtectedFile}
                              />
                              <FileField
                                label="Previous Designs"
                                fileName={detailDesignRequirement.designPreviousDesignsFileName}
                                filePath={detailDesignRequirement.designPreviousDesignsFilePath}
                                onDownload={downloadProtectedFile}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {!detailDesignRequirement && (
                        <div className="text-muted">No submitted requirement details found for this lead.</div>
                      )}
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeRequirementDetails}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </>
  );
}
