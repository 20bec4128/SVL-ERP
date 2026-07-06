import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";
import { downloadLeadPaymentProofFile as downloadLeadPaymentProofFileApi, getLeads, updateLeadDetails } from "../../api/leadsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

export default function PaymentVerificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

  const fetchPendingVerifications = async () => {
    setLoading(true);
    setError("");
    try {
      const leads = await getLeads({ limit: 1000, offset: 0 });
      const pending = (Array.isArray(leads) ? leads : []).filter((lead) => {
        const isPending = lead.paymentVerificationStatus === "PENDING";
        if (!isPending) return false;
        
        if (user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER")) {
          return true;
        }
        
        if (!user?.id) return false;
        return String(lead.paymentVerificationAssignedToUserId) === String(user.id);
      });
      setPendingVerifications(pending);
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to load verifications"));
      showError(extractApiErrorMessage(e, "Failed to load verifications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user !== undefined) {
      fetchPendingVerifications();
    }
  }, [user]);

  const handleApprove = (lead) => {
    navigate(`/payment-verifications/${lead.id}/approve`);
  };

  const handleReject = async (leadId) => {
    if (!rejectionReason.trim()) {
      showError("Please provide a rejection reason");
      return;
    }
    setApproving(leadId);
    try {
      await updateLeadDetails(leadId, {
        paymentVerificationStatus: "REJECTED",
        paymentVerificationRejectionReason: rejectionReason,
      });
      showSuccess("Payment verification rejected");
      setPendingVerifications((prev) =>
        prev.filter((item) => item.id !== leadId)
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
      setRejectingId(null);
      setRejectionReason("");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to reject verification"));
    } finally {
      setApproving(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    const reason = window.prompt("Enter rejection reason for selected payment verifications:");
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
            paymentVerificationStatus: "REJECTED",
            paymentVerificationRejectionReason: reason,
          })
        )
      );
      showSuccess(`${selectedIds.size} verifications rejected successfully`);
      setPendingVerifications((prev) =>
        prev.filter((item) => !selectedIds.has(item.id))
      );
      setSelectedIds(new Set());
    } catch (e) {
      showError("Failed to reject some verifications");
    } finally {
      setLoading(false);
    }
  };

  const downloadPaymentProofFile = async (lead) => {
    try {
      const { blob, contentDisposition } = await downloadLeadPaymentProofFileApi(lead.id);
      if (!blob) return;
      const match = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(contentDisposition || "");
      const fallback = lead.paymentProofFileName || `payment-proof-${lead.id}`;
      const fileName = decodeURIComponent((match?.[1] || fallback).replace(/\"/g, "").trim());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download payment proof file"));
    }
  };

  const handleViewDetails = (lead) => {
    navigate(`/payment-verifications/${lead.id}`);
  };

  // Search logic
  const filteredRows = useMemo(() => {
    let result = pendingVerifications;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((r) =>
        (r.name || "").toLowerCase().includes(q) ||
        String(r.leadId || r.id).toLowerCase().includes(q) ||
        (r.paymentVerificationAssignedToUserName || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [pendingVerifications, search]);

  // Pagination logic
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

    const headers = ["Lead ID", "Lead Name", "Paid Amount", "Assigned To", "Notes"];
    const body = targetRows.map((row) => [
      row.leadId || row.id,
      row.name || "",
      (parseFloat(row.paymentVerificationAmount) || 0).toFixed(2),
      row.paymentVerificationAssignedToUserName || "Unassigned",
      row.paymentProofNotes || "",
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
    link.download = `payment-verifications-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? filteredRows.filter((r) => selectedIds.has(r.id))
      : filteredRows;

    const headers = ["Lead ID", "Lead Name", "Paid Amount", "Assigned To", "Notes"];
    const body = targetRows.map((row) => [
      row.leadId || row.id,
      row.name || "",
      (parseFloat(row.paymentVerificationAmount) || 0).toFixed(2),
      row.paymentVerificationAssignedToUserName || "Unassigned",
      row.paymentProofNotes || "",
    ]);

    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Payment Verifications</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
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
    link.download = `payment-verifications-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? filteredRows.filter((r) => selectedIds.has(r.id))
      : filteredRows;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Payment Verifications Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["Lead ID", "Lead Name", "Paid Amount", "Assigned To", "Notes"]];
    const body = targetRows.map((row) => [
      row.leadId || row.id,
      row.name || "",
      (parseFloat(row.paymentVerificationAmount) || 0).toFixed(2),
      row.paymentVerificationAssignedToUserName || "Unassigned",
      row.paymentProofNotes || "",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 9 },
    });

    doc.save(`payment-verifications-${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="content">
        {/* Custom header card with breadcrumb and primary blue button */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Payment Verifications</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Payment Verifications</li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={fetchPendingVerifications}
                disabled={loading}
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-refresh" style={{ fontSize: "1.1rem" }}></i>
                Refresh List
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
          </div>
        )}

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls bar inside the card */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search by ID, name or assigned..."
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
                    <th>Paid Amount</th>
                    <th>Assigned To</th>
                    <th>Notes</th>
                    <th>Proof Document</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <LoadingSpinner size="page" label="Loading payment verifications" />
                      </td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">No pending verifications found</td>
                    </tr>
                  ) : (
                    pagedRows.map((lead) => {
                      const verificationAmount = parseFloat(lead.paymentVerificationAmount) || 0;
                      return (
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
                            <Link to={`/lead/${lead.id}`} className="text-primary fw-semibold" style={{ textDecoration: "none" }}>
                              #{lead.leadId || lead.id}
                            </Link>
                          </td>
                          <td className="fw-semibold text-dark">{lead.name || "—"}</td>
                          <td>
                            <strong className="text-dark">
                              ₹{verificationAmount.toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            {lead.paymentVerificationAssignedToUserId ? (
                              <span className="badge bg-info">
                                {lead.paymentVerificationAssignedToUserName ||
                                  (lead.paymentVerificationAssignedToUserId === user?.id ? "You" : "Assigned")}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">Unassigned</span>
                            )}
                          </td>
                          <td>
                            <small className="text-muted">{lead.paymentProofNotes || "—"}</small>
                          </td>
                          <td>
                            {lead.paymentProofFileName ? (
                              <button
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                onClick={() => downloadPaymentProofFile(lead)}
                                style={{ borderRadius: 6 }}
                              >
                                <i className="ti ti-download"></i> Download
                              </button>
                            ) : (
                              <span className="text-muted small">No file</span>
                            )}
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
                                    disabled={approving === lead.id}
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
                      );
                    })
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
            minWidth: 160
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleViewDetails(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-eye" style={{ fontSize: "1rem", color: "#64748b" }} /> View Details
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-success"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleApprove(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-check" style={{ fontSize: "1rem", color: "#10b981" }} /> Approve Payment
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-warning"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              setRejectingId(activeActionsRow.id);
              setRejectionReason("");
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-x" style={{ fontSize: "1rem", color: "#f59e0b" }} /> Reject Payment
          </button>
          {activeActionsRow.paymentProofFileName && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                downloadPaymentProofFile(activeActionsRow);
                setActiveActionsRow(null);
              }}
            >
              <i className="ti ti-download" style={{ fontSize: "1rem", color: "#64748b" }} /> Download Proof
            </button>
          )}
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
    </>
  );
}
