import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getQuotations, deleteQuotation } from "../../api/quotationApi";
import { setQuotationDraft } from "../../utils/quotationUtils";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const EstimatesPage = () => {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const data = await getQuotations();
      setEstimates(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Error loading estimates:", err);
      setError("Failed to load estimates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  const handleEdit = (estimate) => {
    setQuotationDraft(estimate);
    navigate("/quotation");
  };

  const handleDeleteClick = (estimate) => {
    setSelectedEstimate(estimate);
  };

  const confirmDelete = async () => {
    if (!selectedEstimate) return;
    setDeleting(true);
    try {
      await deleteQuotation(selectedEstimate.id);
      setEstimates((prev) => prev.filter((est) => est.id !== selectedEstimate.id));
      setSelectedEstimate(null);
      const closeBtn = document.querySelector("#delete_modal [data-bs-dismiss='modal']");
      if (closeBtn) closeBtn.click();
    } catch (err) {
      console.error("Error deleting estimate:", err);
      alert("Failed to delete estimate.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return "-";
    try {
      return new Date(val).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(val);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (String(status).toLowerCase()) {
      case "accepted":
      case "approved":
        return "badge badge-success";
      case "sent":
        return "badge badge-soft-purple";
      case "expired":
        return "badge badge-soft-warning";
      case "declined":
      case "rejected":
        return "badge badge-danger";
      default:
        return "badge badge-secondary";
    }
  };

  return (
    <>
      <div className="content">
        {/* Breadcrumb section matching the user request */}
        {/* <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Estimates</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard">
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <span className="text-muted">HR</span>
                </li>
                <li className="breadcrumb-item active">Estimates</li>
              </ol>
            </nav>
          </div>
        </div> */}

        {/* Premium Header Card with the Add button inside, matching lead list page */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Estimates List</h2>
              <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>Add, view and manage all your estimates in one place.</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link
                to="/quotation"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-plus" />
                Add Estimates
              </Link>
            </div>
          </div>
        </div>

        {/* Estimates Table List Wrapper matches Leads List style */}
        {loading ? (
          <div className="p-5 text-center bg-white shadow-sm" style={{ borderRadius: 12 }}>
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : estimates.length === 0 ? (
          <div className="p-5 text-center text-muted bg-white shadow-sm" style={{ borderRadius: 12 }}>No estimates found.</div>
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
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Estimate ID</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Client Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Company Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Estimate Date</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Expiry Date</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Amount</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((est) => (
                  <tr key={est.id}>
                    <td className="col-select">
                      <input className="form-check-input" type="checkbox" />
                    </td>
                    <td style={{ fontSize: "0.9rem" }}>
                      <span className="text-info fw-medium">{est.quotationNumber || `EST-${est.id}`}</span>
                    </td>
                    <td style={{ fontSize: "0.9rem" }}>
                      <div>
                        <h6 className="fw-semibold mb-0" style={{ color: "#1e293b" }}>{est.clientName || "-"}</h6>
                        <span className="d-block text-muted fs-12">{est.clientEmail}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.9rem", color: "#475569" }}>{est.clientCompany || "-"}</td>
                    <td style={{ fontSize: "0.9rem", color: "#475569" }}>{formatDate(est.createdAt)}</td>
                    <td style={{ fontSize: "0.9rem", color: "#475569" }}>{formatDate(est.validityDate)}</td>
                    <td className="fw-semibold" style={{ fontSize: "0.9rem", color: "#1e293b" }}>
                      ₹{Number(est.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(est.status)}>
                        {est.status}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="action-icon d-inline-flex gap-2">
                        <Link
                          to="#"
                          className="d-flex align-items-center justify-content-center"
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                          onClick={() => handleEdit(est)}
                        >
                          <i className="ti ti-edit" style={{ fontSize: "1.1rem" }}></i>
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                          className="d-flex align-items-center justify-content-center text-danger"
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent" }}
                          onClick={() => handleDeleteClick(est)}
                        >
                          <i className="ti ti-trash" style={{ fontSize: "1.1rem" }}></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36"></i>
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3">
                Are you sure you want to delete Estimate <strong>{selectedEstimate?.quotationNumber || `EST-${selectedEstimate?.id}`}</strong>? This action cannot be undone.
              </p>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-light me-3" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Modal */}
    </>
  );
};

export default EstimatesPage;
