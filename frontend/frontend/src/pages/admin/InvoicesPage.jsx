import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLeads } from "../../api/leadsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Error loading leads for invoices:", err);
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter leads that have any invoice data
  const invoiceLeads = leads.filter(
    (lead) => lead.invoiceData || lead.paymentVerifiedInvoiceData
  );

  // Compute stats
  let totalInvoiceAmount = 0;
  let outstandingAmount = 0;
  let draftAmount = 0;
  let paidAmount = 0;

  invoiceLeads.forEach((lead) => {
    const dataStr = lead.paymentVerifiedInvoiceData || lead.invoiceData;
    let grandTotal = 0;
    try {
      const parsed = JSON.parse(dataStr);
      grandTotal = Number(parsed.grandTotal || parsed.grand_total || 0);
    } catch {
      grandTotal = 0;
    }

    totalInvoiceAmount += grandTotal;

    const isPaid = !!lead.paymentVerifiedInvoiceData;
    const isDraft = !!lead.invoiceData && !lead.budgetInvoiceSent;

    if (isPaid) {
      paidAmount += grandTotal;
    } else if (isDraft) {
      draftAmount += grandTotal;
      outstandingAmount += grandTotal;
    } else {
      outstandingAmount += grandTotal;
    }
  });

  const getInvoiceNumber = (lead) => {
    return `INV-${lead.leadId || lead.id}`;
  };

  const getInvoiceDate = (lead) => {
    if (!lead.createdAt) return "-";
    return new Date(lead.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getInvoiceAmount = (lead) => {
    const dataStr = lead.paymentVerifiedInvoiceData || lead.invoiceData;
    try {
      const parsed = JSON.parse(dataStr);
      return Number(parsed.grandTotal || parsed.grand_total || 0);
    } catch {
      return 0;
    }
  };

  const getInvoiceStatus = (lead) => {
    if (lead.paymentVerifiedInvoiceData) {
      return { label: "Paid", className: "badge badge-success" };
    }
    if (lead.invoiceData && !lead.budgetInvoiceSent) {
      return { label: "Draft", className: "badge badge-warning" };
    }
    return { label: "Sent", className: "badge badge-purple" };
  };

  const handleViewInvoice = (lead) => {
    navigate("/invoice-details", { state: { lead } });
  };

  return (
    <>
      <div className="content">
        {/* Breadcrumb section matching the user request */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Invoices</h2>
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
                <li className="breadcrumb-item active">Invoices</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Invoice Stats Summary Row */}
        <div className="row mb-2">
          <div className="col-xl-3 col-sm-6">
            <div className="card flex-fill border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <div className="d-flex align-items-center overflow-hidden mb-2">
                  <div>
                    <p className="fs-12 fw-normal mb-1 text-truncate text-muted">Total Invoice</p>
                    <h5 className="fw-bold text-dark">₹{totalInvoiceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h5>
                  </div>
                </div>
                <div className="attendance-report-bar mb-2">
                  <div className="progress" role="progressbar" style={{ height: "5px" }}>
                    <div className="progress-bar bg-pink" style={{ width: "100%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card flex-fill border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <div className="d-flex align-items-center overflow-hidden mb-2">
                  <div>
                    <p className="fs-12 fw-normal mb-1 text-truncate text-muted">Outstanding</p>
                    <h5 className="fw-bold text-dark">₹{outstandingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h5>
                  </div>
                </div>
                <div className="attendance-report-bar mb-2">
                  <div className="progress" role="progressbar" style={{ height: "5px" }}>
                    <div className="progress-bar bg-purple" style={{ width: "70%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card flex-fill border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <div className="d-flex align-items-center overflow-hidden mb-2">
                  <div>
                    <p className="fs-12 fw-normal mb-1 text-truncate text-muted">Draft</p>
                    <h5 className="fw-bold text-dark">₹{draftAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h5>
                  </div>
                </div>
                <div className="attendance-report-bar mb-2">
                  <div className="progress" role="progressbar" style={{ height: "5px" }}>
                    <div className="progress-bar bg-warning" style={{ width: "30%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card flex-fill border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <div className="d-flex align-items-center overflow-hidden mb-2">
                  <div>
                    <p className="fs-12 fw-normal mb-1 text-truncate text-muted">Paid Amount</p>
                    <h5 className="fw-bold text-dark">₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h5>
                  </div>
                </div>
                <div className="attendance-report-bar mb-2">
                  <div className="progress" role="progressbar" style={{ height: "5px" }}>
                    <div className="progress-bar bg-success" style={{ width: "40%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List Table Card */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Invoices List</h2>
              <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>Manage and track all generated billing invoices.</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark py-2 px-3 fs-13" style={{ borderRadius: "8px" }}>
                {invoiceLeads.length} Invoices
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
        ) : invoiceLeads.length === 0 ? (
          <div className="p-5 text-center text-muted bg-white shadow-sm" style={{ borderRadius: 12 }}>No invoices found.</div>
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
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Created On</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Total Amount</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoiceLeads.map((lead) => {
                  const status = getInvoiceStatus(lead);
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
                      <td style={{ fontSize: "0.9rem", color: "#475569" }}>{getInvoiceDate(lead)}</td>
                      <td className="fw-semibold" style={{ fontSize: "0.9rem", color: "#1e293b" }}>
                        ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={status.className}>
                          {status.label}
                        </span>
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

export default InvoicesPage;
