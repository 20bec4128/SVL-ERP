import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PageLoader from "../../components/common/PageLoader";
import {
  getStockRequests,
  createStockRequest,
  getStockItems,
  updateStockRequest,
  deleteStockRequest,
} from "../../api/stocksApi";
import { useToast } from "../../components/system/ToastProvider";
import StockRequestFormModal from "../../components/system/StockRequestFormModal";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { getLeads } from "../../api/leadsApi";
import { getLeadFlow } from "../../api/flowApi";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

export default function StockRequestsPage() {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const isAccountUser = role === "ACCOUNT";
  const isAdminUser = role === "ADMIN" || role === "SUPER_ADMIN";
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [leadOptions, setLeadOptions] = useState([]);
  const [flowRules, setFlowRules] = useState([]);
  const [editStatus, setEditStatus] = useState("");

  // Search, Selection, Pagination & Actions
  const [search, setSearch] = useState("");
  const [selectedRequestIds, setSelectedRequestIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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

  const parseRequestItems = useCallback((items) => {
    if (!items) return [];
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const matchesAssignedUser = useCallback(
    (request) => {
      if (!user?.id) return false;
      const currentUserId = String(user.id);
      const currentUserNames = [
        user?.email,
        String(user?.email || "").trim().split("@")[0],
        user?.username,
        user?.name,
        user?.fullName,
        user?.displayName,
      ]
        .filter((value) => value && String(value).trim())
        .map((value) => String(value).trim().toLowerCase());
      const assignedValues = [
        request?.assignedTo,
        request?.assignedToId,
        request?.assignedToUserId,
        request?.assigned_to,
        request?.assigned_to_id,
        request?.assigned_to_user_id,
      ]
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
        .map((value) => String(value));
      const assignedNames = [
        request?.assignedToName,
        request?.assigned_to_name,
        request?.assignedToUsername,
        request?.assigned_to_username,
      ]
        .filter((value) => value && String(value).trim())
        .map((value) => String(value).trim().toLowerCase());
      return (
        assignedValues.includes(currentUserId) ||
        assignedNames.some((name) => currentUserNames.includes(name))
      );
    },
    [user?.id],
  );

  const flowStatusNames = useMemo(() => {
    return new Set(
      (flowRules || [])
        .map((rule) => String(rule?.status || "").trim().toLowerCase())
        .filter(Boolean),
    );
  }, [flowRules]);

  const stockRequestFlowStatuses = useMemo(() => {
    const baseStatuses = [
      "Stock Request",
      "Accounts Review",
      "Approval",
      "Rejected",
    ];
    if (flowStatusNames.size === 0) {
      return baseStatuses;
    }
    const filtered = baseStatuses.filter((status) =>
      flowStatusNames.has(String(status || "").trim().toLowerCase()),
    );
    return filtered.length ? filtered : baseStatuses;
  }, [flowStatusNames]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const isAssigneeFacingRole = role === "PRODUCTION" || role === "EMPLOYEE";
      const rows = await getStockRequests();
      const normalizedRows = Array.isArray(rows) ? rows : [];
      const visibleRows = isAssigneeFacingRole
        ? normalizedRows.filter((request) => matchesAssignedUser(request))
        : normalizedRows;
      setRequests(visibleRows);
    } catch (e) {
      const message = extractApiErrorMessage(e, "Failed to load stock requests");
      console.error(e);
      showError(message, { title: "Stock Requests" });
    } finally {
      setLoading(false);
    }
  }, [matchesAssignedUser, role, showError]);

  useEffect(() => {
    let active = true;
    const loadFlow = async () => {
      try {
        const flow = await getLeadFlow();
        if (!active) return;
        setFlowRules(Array.isArray(flow?.rules) ? flow.rules : []);
      } catch (e) {
        console.error("failed to load flow", e);
        if (active) setFlowRules([]);
      }
    };
    loadFlow();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setEditStatus(editingRequest?.status || stockRequestFlowStatuses[0] || "");
  }, [editingRequest, stockRequestFlowStatuses]);

  const statusOptions = useMemo(() => {
    if (!isAccountUser) return [];
    const seen = new Set();
    const values = [];
    if (editingRequest?.status) {
      values.push(editingRequest.status);
      seen.add(editingRequest.status);
    }
    stockRequestFlowStatuses.forEach((status) => {
      if (status && !seen.has(status)) {
        values.push(status);
        seen.add(status);
      }
    });
    return values;
  }, [editingRequest?.status, isAccountUser, stockRequestFlowStatuses]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;
    const loadLeadOptions = async () => {
      try {
        const params = { size: 1000 };
        if (role === "PRODUCTION") {
          params.owner = user?.id;
        }
        const rows = await getLeads(params);
        if (!active) return;
        setLeadOptions(
          Array.isArray(rows)
            ? rows
                .filter((row) => row?.id != null && (row?.name || row?.leadName || row?.leadId))
                .map((row) => {
                  const displayId = row.leadId || row.id;
                  const name = row.leadName || row.name || `Lead ${displayId}`;
                  return {
                    id: row.id,
                    name,
                    displayId,
                    label: `${displayId} · ${name}`,
                  };
                })
            : [],
        );
      } catch (e) {
        console.error("failed to load lead options", e);
      }
    };
    loadLeadOptions();
    return () => {
      active = false;
    };
  }, [role, user?.id]);

  useEffect(() => {
    let active = true;
    const loadItems = async () => {
      try {
        const rows = await getStockItems();
        if (!active) return;
        setStockItems(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("Failed to load stock items", e);
      }
    };
    loadItems();
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    let result = requests;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          String(r.id).toLowerCase().includes(q) ||
          (r.requestedByName || r.requestedBy || "").toLowerCase().includes(q) ||
          (r.assignedToName || r.assignedTo || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [requests, search]);

  // Pagination calculations
  const totalRows = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredRows.slice(pageOffset, pageOffset + pageSize),
    [filteredRows, pageOffset, pageSize],
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage]);

  // Selection toggle handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedRequestIds.has(id));
    setSelectedRequestIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRequestSelection = (id) => {
    setSelectedRequestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Export actions
  const exportCsv = () => {
    const targetRows = selectedRequestIds.size > 0
      ? filteredRows.filter((r) => selectedRequestIds.has(r.id))
      : filteredRows;

    const headers = ["ID", "Requested By", "Assigned To", "Status"];
    const body = targetRows.map((row) => [
      row.id,
      row.requestedByName || row.requestedBy || "",
      row.assignedToName || row.assignedTo || "",
      row.status || "",
    ]);
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-requests-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedRequestIds.size > 0
      ? filteredRows.filter((r) => selectedRequestIds.has(r.id))
      : filteredRows;

    const headers = ["ID", "Requested By", "Assigned To", "Status"];
    const body = targetRows.map((row) => [
      row.id,
      row.requestedByName || row.requestedBy || "",
      row.assignedToName || row.assignedTo || "",
      row.status || "",
    ]);
    
    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Stock Requests</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
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
    link.download = `stock-requests-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedRequestIds.size > 0
      ? filteredRows.filter((r) => selectedRequestIds.has(r.id))
      : filteredRows;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Stock Requests Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["ID", "Requested By", "Assigned To", "Status"]];
    const body = targetRows.map((row) => [
      row.id,
      row.requestedByName || row.requestedBy || "",
      row.assignedToName || row.assignedTo || "",
      row.status || "",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 9 },
    });

    doc.save(`stock-requests-${Date.now()}.pdf`);
  };



  const openDetail = (req) => {
    navigate(`/stock-requests/${req.id}`);
  };

  const openEditModal = (req) => {
    if (!isAccountUser) return;
    setEditingRequest(req);
  };

  const closeEditModal = () => {
    setEditingRequest(null);
  };

  const editingRows = useMemo(
    () => (editingRequest ? parseRequestItems(editingRequest.items || "[]") : []),
    [editingRequest, parseRequestItems],
  );

  const handleEditSubmit = async ({ items, status }) => {
    if (!editingRequest?.id) return;
    setUpdating(true);
    try {
      const payload = { items };
      if (status) {
        payload.status = status;
      }
      await updateStockRequest(editingRequest.id, payload);
      showSuccess("Stock request updated", { title: "Stock Requests" });
      closeEditModal();
      await load();
    } catch (e) {
      const message = extractApiErrorMessage(e, "Failed to update stock request");
      showError(message, { title: "Stock Requests" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = useCallback(
    async (req) => {
      if (!isAdminUser) return;
      setDeletingRequestId(req.id);
      try {
        await deleteStockRequest(req.id);
        showSuccess("Stock request deleted", { title: "Stock Requests" });
        await load();
      } catch (e) {
        const message = extractApiErrorMessage(e, "Failed to delete stock request");
        showError(message, { title: "Stock Requests" });
      } finally {
        setDeletingRequestId(null);
      }
    },
    [isAdminUser, load, showError, showSuccess],
  );

  const handleBulkDelete = async () => {
    if (selectedRequestIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete the selected ${selectedRequestIds.size} stock requests?`)) {
      setUpdating(true);
      try {
        await Promise.all(Array.from(selectedRequestIds).map((id) => deleteStockRequest(id)));
        showSuccess(`${selectedRequestIds.size} stock requests deleted successfully`);
        setSelectedRequestIds(new Set());
        await load();
      } catch (e) {
        showError("Failed to delete some stock requests");
      } finally {
        setUpdating(false);
      }
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="content">
        {/* Styled Card Header containing Title, Breadcrumbs and Add Button like Leads page */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Stock Requests</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Stock Requests</li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
                onClick={() => navigate("/stock-requests/create")}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
                Create Request
              </button>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls bar inside the card, above the table */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom bg-white">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search requests..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>

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

          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="thead-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={pagedRows.length > 0 && pagedRows.every((r) => selectedRequestIds.has(r.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: "80px" }}>ID</th>
                    <th>Requested By</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">No requests found</td>
                    </tr>
                  ) : (
                    pagedRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRequestIds.has(row.id)}
                            onChange={() => toggleRequestSelection(row.id)}
                          />
                        </td>
                        <td>{row.id}</td>
                        <td>{row.requestedByName || row.requestedBy || "—"}</td>
                        <td>{row.assignedToName || row.assignedTo || "—"}</td>
                        <td>
                          <span className="badge bg-light text-dark px-2 py-1" style={{ fontSize: "0.85rem", fontWeight: "500", borderRadius: 6 }}>
                            {row.status}
                          </span>
                          {row.billFilePath && (
                            <span className="badge bg-info text-dark ms-1" style={{ borderRadius: 6 }} title="Bill uploaded">Bill</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeActionsRow?.id === row.id) {
                                setActiveActionsRow(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActionsMenuPos({
                                  top: rect.top + window.scrollY,
                                  left: rect.right + window.scrollX,
                                });
                                setActiveActionsRow(row);
                              }
                            }}
                          >
                            <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top bg-white">
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


      <StockRequestFormModal
        open={Boolean(editingRequest)}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        submitting={updating}
        title="Edit Stock Request"
        itemOptions={stockItems}
        initialRows={editingRows}
        initialLeadName={editingRequest?.leadName || editingRequest?.leadDisplayId}
      />

      {confirmDialog}

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
            minWidth: 150
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              openDetail(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-eye" style={{ fontSize: "1rem", color: "#64748b" }} /> View Details
          </button>
          {isAccountUser && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                openEditModal(activeActionsRow);
                setActiveActionsRow(null);
              }}
            >
              <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Request
            </button>
          )}
          {isAdminUser && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                handleDelete(activeActionsRow);
                setActiveActionsRow(null);
              }}
              disabled={deletingRequestId === activeActionsRow.id}
            >
              <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Request
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedRequestIds.size > 0 && (
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
              {selectedRequestIds.size}
            </span>
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>requests selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {isAdminUser && (
              <button
                className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "#dc2626", color: "#ffffff", border: "none" }}
                onClick={handleBulkDelete}
                disabled={updating}
              >
                <i className="ti ti-trash" /> Delete
              </button>
            )}
            <button
              className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
              style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)" }}
              onClick={() => setSelectedRequestIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}
