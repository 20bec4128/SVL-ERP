import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { downloadLeadPaymentProofFile as downloadLeadPaymentProofFileApi, getLeads, updateLeadDetails, getSalesOrders, getPaymentsForOrder, verifyPayment } from "../../api/leadsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

export default function PaymentVerificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [salesOrderPendingPayments, setSalesOrderPendingPayments] = useState([]);
  const [activeVerificationTab, setActiveVerificationTab] = useState("lead"); // lead, sales_order
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
      // 1. Fetch Lead Advance Payment Verifications
      const leads = await getLeads({ limit: 1000, offset: 0 });
      const pendingLeads = (Array.isArray(leads) ? leads : []).filter((lead) => {
        const isPending = lead.paymentVerificationStatus === "PENDING";
        if (!isPending) return false;
        if (user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER")) {
          return true;
        }
        if (!user?.id) return false;
        return String(lead.paymentVerificationAssignedToUserId) === String(user.id);
      });
      setPendingVerifications(pendingLeads);

      // 2. Fetch Sales Order Installment Payment Verifications
      const orders = await getSalesOrders();
      const pendingInstallments = [];
      
      await Promise.all(
        (Array.isArray(orders) ? orders : []).map(async (so) => {
          try {
            const pays = await getPaymentsForOrder(so.id);
            const pendingPays = (pays || []).filter(p => p.status === "PENDING");
            pendingPays.forEach((p) => {
              pendingInstallments.push({
                ...p,
                soNumber: so.soNumber || `#${so.id}`,
                customerName: so.customerName,
                companyName: so.companyName,
                totalAmount: so.totalAmount
              });
            });
          } catch (e) {
            console.error(`Failed to load payments for order ${so.id}`, e);
          }
        })
      );
      setSalesOrderPendingPayments(pendingInstallments);

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
      setRejectingId(null);
      setRejectionReason("");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to reject verification"));
    } finally {
      setApproving(null);
    }
  };

  const handleVerifySalesOrderPayment = async (payId, status) => {
    try {
      await verifyPayment(payId, status);
      showSuccess(`Sales Order payment verification marked as ${status}`);
      fetchPendingVerifications();
    } catch (e) {
      showError("Failed to update payment status");
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

  // Search logic for Leads
  const filteredLeadRows = useMemo(() => {
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

  // Search logic for Sales Orders
  const filteredSalesOrderRows = useMemo(() => {
    let result = salesOrderPendingPayments;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((r) =>
        (r.soNumber || "").toLowerCase().includes(q) ||
        (r.customerName || "").toLowerCase().includes(q) ||
        (r.companyName || "").toLowerCase().includes(q) ||
        (r.referenceNo || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [salesOrderPendingPayments, search]);

  return (
    <>
      <div className="content">
        {/* Custom Header Card */}
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

        {/* Tab Selector */}
        <div className="mb-4">
          <ul className="nav nav-pills gap-2 bg-light p-1 rounded-3 d-inline-flex">
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 px-4 py-2 ${activeVerificationTab === "lead" ? "active bg-primary fw-semibold" : "text-muted"}`}
                onClick={() => {
                  setActiveVerificationTab("lead");
                  setSearch("");
                }}
              >
                Lead Advance Payments ({pendingVerifications.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 px-4 py-2 ${activeVerificationTab === "sales_order" ? "active bg-primary fw-semibold" : "text-muted"}`}
                onClick={() => {
                  setActiveVerificationTab("sales_order");
                  setSearch("");
                }}
              >
                Sales Order Payments ({salesOrderPendingPayments.length})
              </button>
            </li>
          </ul>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
          </div>
        )}

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder={activeVerificationTab === "lead" ? "Search by ID, name or assigned..." : "Search sales orders..."}
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <LoadingSpinner />
              </div>
            ) : activeVerificationTab === "lead" ? (
              /* Leads Table */
              <div className="table-responsive">
                <table className="table table-hover table-nowrap align-middle mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th className="px-4">Lead ID</th>
                      <th>Client Details</th>
                      <th>Verified Advance Required</th>
                      <th>Proof Notes</th>
                      <th>Proof File</th>
                      <th>Assigned Auditor</th>
                      <th className="text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeadRows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">No pending advance verifications found.</td>
                      </tr>
                    ) : (
                      filteredLeadRows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 fw-bold">{row.leadId || row.id}</td>
                          <td>
                            <div className="fw-semibold text-dark">{row.name || "-"}</div>
                            <div className="text-muted small">{row.companyName || "No Company"}</div>
                          </td>
                          <td className="fw-bold text-success">
                            ₹{(parseFloat(row.paymentVerificationAmount) || 0).toLocaleString()}
                          </td>
                          <td style={{ whiteSpace: "normal", maxWIdth: "220px" }} className="text-muted small">
                            {row.paymentProofNotes || "No notes"}
                          </td>
                          <td>
                            {row.paymentProofFileName ? (
                              <button
                                className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                                onClick={() => downloadPaymentProofFile(row)}
                                style={{ borderRadius: 6 }}
                              >
                                <i className="ti ti-download" /> Download proof
                              </button>
                            ) : (
                              <span className="text-muted small">No File</span>
                            )}
                          </td>
                          <td className="text-muted small">
                            {row.paymentVerificationAssignedToUserName || "Unassigned"}
                          </td>
                          <td className="text-end px-4">
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleApprove(row)}
                                disabled={approving === row.id}
                              >
                                Verify & Approve
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setRejectingId(row.id)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Sales Order Installment Table */
              <div className="table-responsive">
                <table className="table table-hover table-nowrap align-middle mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th className="px-4">SO Number</th>
                      <th>Customer Details</th>
                      <th>Method</th>
                      <th>Reference No</th>
                      <th>Amount</th>
                      <th>Proof File</th>
                      <th className="text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesOrderRows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">No pending sales order payment entries.</td>
                      </tr>
                    ) : (
                      filteredSalesOrderRows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 fw-bold text-primary">{row.soNumber}</td>
                          <td>
                            <div className="fw-semibold text-dark">{row.customerName || "-"}</div>
                            <div className="text-muted small">{row.companyName || "No Company"}</div>
                          </td>
                          <td className="fw-semibold text-dark">{row.paymentMethod}</td>
                          <td className="text-muted">{row.referenceNo || "N/A"}</td>
                          <td className="fw-bold text-success">
                            ₹{row.amount?.toLocaleString()}
                          </td>
                          <td>
                            {row.proofFilePath ? (
                              <a
                                href={resolveMediaUrl(row.proofFilePath)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                                style={{ borderRadius: 6 }}
                              >
                                <i className="ti ti-eye" /> View Proof
                              </a>
                            ) : (
                              <span className="text-muted small">No File</span>
                            )}
                          </td>
                          <td className="text-end px-4">
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleVerifySalesOrderPayment(row.id, "VERIFIED")}
                              >
                                Verify Payment
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleVerifySalesOrderPayment(row.id, "REJECTED")}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal dialog */}
      {rejectingId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold">Reject Payment Verification</h5>
                <button type="button" className="btn-close" onClick={() => setRejectingId(null)}></button>
              </div>
              <div className="modal-body p-4">
                <label className="form-label fw-semibold">Reason for Rejection</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Specify details or missing proof guidelines..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="modal-footer border-top py-3 px-4">
                <button type="button" className="btn btn-light" onClick={() => setRejectingId(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleReject(rejectingId)}
                  disabled={approving === rejectingId}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
