import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLeads } from "../../api/leadsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Error loading leads for payments:", err);
      setError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter leads that have payment verified invoice data (meaning they have paid)
  const paidLeads = leads.filter(
    (lead) => lead.paymentVerifiedInvoiceData && lead.paymentVerificationStatus === "APPROVED"
  );

  const getInvoiceNumber = (lead) => {
    return `INV-${lead.leadId || lead.id}`;
  };

  const getPaymentDate = (lead) => {
    if (!lead.updatedAt && !lead.createdAt) return "-";
    return new Date(lead.updatedAt || lead.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getInvoiceAmount = (lead) => {
    const dataStr = lead.paymentVerifiedInvoiceData;
    try {
      const parsed = JSON.parse(dataStr);
      return Number(parsed.grandTotal || parsed.grand_total || 0);
    } catch {
      return Number(lead.paymentVerificationAmount || 0);
    }
  };

  const handleViewInvoice = (lead) => {
    navigate("/invoice-details", { state: { lead } });
  };

  return (
    <>
      <div className="content">
        {/* Breadcrumb section matching standard UI */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Payments</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard">
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <span className="text-muted">Application</span>
                </li>
                <li className="breadcrumb-item active">Payments</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Payments List Table Card */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Payments List</h2>
              <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>Track and view all verified client payments received.</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark py-2 px-3 fs-13" style={{ borderRadius: "8px" }}>
                {paidLeads.length} Payments
              </span>
            </div>
          </div>
        </div>

        {/* List UI wrapper matching Lead list page */}
        {loading ? (
          <div className="p-5 text-center bg-white shadow-sm" style={{ borderRadius: 12 }}>
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : paidLeads.length === 0 ? (
          <div className="p-5 text-center text-muted bg-white shadow-sm" style={{ borderRadius: 12 }}>No payments found.</div>
        ) : (
          <div
            className="table-responsive leads-table-wrap border-0 shadow-sm mb-4 bg-white"
            style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x", borderRadius: 12, minHeight: "260px" }}
          >
            <table className="table table-hover align-middle leads-table mb-0">
              <thead>
                <tr>
                  <th className="col-select" style={{ width: 36 }}>
                    <input className="form-check-input" type="checkbox" id="select-all" />
                  </th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Invoice ID</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Client Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Company Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Payment Type</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Paid Date</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Paid Amount</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paidLeads.map((lead) => {
                  const amt = getInvoiceAmount(lead);
                  return (
                    <tr key={lead.id}>
                      <td className="col-select">
                        <input className="form-check-input" type="checkbox" />
                      </td>
                      <td style={{ fontSize: "0.9rem" }}>
                        <Link to="#" onClick={() => handleViewInvoice(lead)} className="text-info fw-medium">
                          {getInvoiceNumber(lead)}
                        </Link>
                      </td>
                      <td style={{ fontSize: "0.9rem" }}>
                        <div>
                          <h6 className="fw-semibold mb-0" style={{ color: "#1e293b" }}>
                            <Link to="#" onClick={() => handleViewInvoice(lead)} style={{ color: "inherit", textDecoration: "none" }}>
                              {lead.name}
                            </Link>
                          </h6>
                          <span className="d-block text-muted fs-12">{lead.email}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.9rem", color: "#475569" }}>{lead.companyName || "-"}</td>
                      <td style={{ fontSize: "0.9rem", color: "#475569" }}>Online Payment</td>
                      <td style={{ fontSize: "0.9rem", color: "#475569" }}>{getPaymentDate(lead)}</td>
                      <td className="fw-semibold text-success" style={{ fontSize: "0.9rem" }}>
                        ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="col-actions">
                        <div className="action-icon d-inline-flex gap-2">
                          <Link
                            to="#"
                            className="d-flex align-items-center justify-content-center"
                            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                            onClick={() => handleViewInvoice(lead)}
                          >
                            <i className="ti ti-eye" style={{ fontSize: "1.1rem" }}></i>
                          </Link>
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
    </>
  );
};

export default PaymentsPage;
