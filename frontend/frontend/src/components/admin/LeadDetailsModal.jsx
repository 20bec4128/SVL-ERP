import React from "react";
import { formatStatusLabel, getStatusStyle } from "../../utils/statusLabels";

export default function LeadDetailsModal({ lead, onClose, onEdit }) {
  if (!lead) return null;

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(value);
    }
  };

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 1070, backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div 
          className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
            {/* Header */}
            <div className="modal-header px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div className="d-flex align-items-center gap-3">
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: "1.25rem" }}>
                  Lead Details
                </h5>
                <span
                  className="badge px-3 py-2 rounded-pill font-weight-semibold"
                  style={{
                    ...getStatusStyle(lead.status),
                    fontSize: "0.8rem",
                  }}
                >
                  {formatStatusLabel(lead.status) || "New"}
                </span>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            {/* Body */}
            <div className="modal-body p-4" style={{ backgroundColor: "#f8fafc" }}>
              <div className="row g-4">
                {/* Section: Basic Information */}
                <div className="col-12">
                  <div className="bg-white p-3 rounded-4 shadow-sm border border-light">
                    <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                      <i className="ti ti-user" style={{ fontSize: "1.1rem" }} />
                      Basic Information
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Lead/Enquiry Name</label>
                        <span className="text-dark fw-semibold" style={{ fontSize: "0.9rem" }}>{lead.name || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Mobile Number</label>
                        <span className="text-dark" style={{ fontSize: "0.9rem" }}>{lead.mobile || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Email Address</label>
                        <span className="text-dark text-break" style={{ fontSize: "0.9rem" }}>{lead.email || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Company Name</label>
                        <span className="text-dark" style={{ fontSize: "0.9rem" }}>{lead.companyName || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">GSTIN</label>
                        <span className="text-dark text-uppercase" style={{ fontSize: "0.9rem" }}>{lead.gstin || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Project & Assignment */}
                <div className="col-12">
                  <div className="bg-white p-3 rounded-4 shadow-sm border border-light">
                    <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                      <i className="ti ti-briefcase" style={{ fontSize: "1.1rem" }} />
                      Source & Assignment
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Project Name</label>
                        <span className="text-dark fw-semibold" style={{ fontSize: "0.9rem" }}>{lead.projectName || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Product Type</label>
                        <span className="text-dark" style={{ fontSize: "0.9rem" }}>{lead.productType || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Owner / Assignee</label>
                        <span className="text-dark fw-semibold" style={{ fontSize: "0.9rem" }}>{lead.owner || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Assigned By / Allocator</label>
                        <span className="text-dark" style={{ fontSize: "0.9rem" }}>{lead.allocator || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Primary Source</label>
                        <span className="text-dark" style={{ fontSize: "0.9rem" }}>{lead.primarySource || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">Secondary Source</label>
                        <span className="text-dark" style={{ fontSize: "0.9rem" }}>{lead.secondarySource || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Address Details */}
                <div className="col-12">
                  <div className="bg-white p-3 rounded-4 shadow-sm border border-light">
                    <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                      <i className="ti ti-map-pin" style={{ fontSize: "1.1rem" }} />
                      Location Details
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">State</label>
                        <span className="text-dark" style={{ fontSize: "0.9rem" }}>{lead.state || "-"}</span>
                      </div>
                      <div className="col-md-6 col-lg-4">
                        <label className="text-muted small fw-semibold d-block mb-1">District / City</label>
                        <span className="text-dark" style={{ fontSize: "0.9rem" }}>{lead.district || "-"}</span>
                      </div>
                      <div className="col-12">
                        <label className="text-muted small fw-semibold d-block mb-1">Street Address</label>
                        <span className="text-dark d-block text-wrap" style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>{lead.streetAddress || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Metadata */}
                <div className="col-12">
                  <div className="d-flex justify-content-between text-muted px-2" style={{ fontSize: "0.8rem" }}>
                    <span>Lead ID: {lead.id}</span>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span>Created On: {formatDate(lead.createdAt)}</span>
                      {lead.updatedAt && (
                        <span>Last Updated: {formatDate(lead.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer px-4 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                style={{ borderRadius: 10, fontWeight: "500" }}
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 d-flex align-items-center gap-2"
                style={{ borderRadius: 10, fontWeight: "500" }}
                onClick={() => {
                  onEdit?.(lead.id);
                  onClose();
                }}
              >
                <i className="ti ti-pencil" style={{ fontSize: "1rem" }} />
                Edit Lead
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1060 }} />
    </>
  );
}
