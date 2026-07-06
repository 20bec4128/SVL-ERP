import React from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import { getStatusStyle, formatStatusLabel } from "../../utils/statusLabels";

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

export default function LeadGridView({
  pagedRows,
  loading,
  selectedLeadIds,
  toggleLeadSelection,
  getStatusClass,
  onStatusBadgeClick,
  formatCreatedOn,
  navigate,
  onUpdateStatusLead,
  onDeleteLead,
  role,
}) {
  const isEmployee = role === "EMPLOYEE";
  const ownerLabel = isEmployee ? "Assigned By" : "Owner";

  return (
    <div className="leads-grid-view row g-3 mb-4">
      {loading ? (
        <div className="col-12 text-center py-5 text-muted">
          <LoadingSpinner size="page" label="Loading leads" />
        </div>
      ) : pagedRows.length === 0 ? (
        <div className="col-12 text-center py-5 text-muted border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
          No leads found
        </div>
      ) : (
        pagedRows.map((row, index) => {
          const statusKey = String(row.status || "").trim().toLowerCase();
          const isDealRow = statusKey === "deal";
          return (
            <div key={row.id} className="col-sm-6 col-lg-4 col-xl-3">
              <div className="card border-0 shadow-sm h-100 position-relative" style={{ borderRadius: 12, backgroundColor: "#fff" }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    {/* Card Header: checkbox and actions */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        {isDealRow ? null : (
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedLeadIds.has(row.id)}
                            onChange={() => toggleLeadSelection(row.id)}
                            style={{ width: 16, height: 16 }}
                          />
                        )}
                      </div>
                      <div className="d-inline-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn d-inline-flex align-items-center justify-content-center"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: "1px solid #dbe3f0",
                            backgroundColor: "#f8fbff",
                            color: "#2563eb",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate?.(`/leads/${row.id}`);
                          }}
                          title="Edit Lead"
                          aria-label="Edit Lead"
                        >
                          <i className="ti ti-pencil" style={{ fontSize: "1rem" }} />
                        </button>
                        <button
                          type="button"
                          className="btn d-inline-flex align-items-center justify-content-center"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: "1px solid #d7f0e3",
                            backgroundColor: "#f0fdf4",
                            color: "#16a34a",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatusLead?.(row);
                          }}
                          title="Update Status"
                          aria-label="Update Status"
                        >
                          <i className="ti ti-refresh" style={{ fontSize: "1rem" }} />
                        </button>
                        {role !== "EMPLOYEE" && (
                          <button
                            type="button"
                            className="btn d-inline-flex align-items-center justify-content-center"
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              border: "1px solid #ffd5ce",
                              backgroundColor: "#fff5f3",
                              color: "#ef4444",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLead?.(row);
                            }}
                            title="Delete Lead"
                            aria-label="Delete Lead"
                          >
                            <i className="ti ti-trash" style={{ fontSize: "1rem" }} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lead Name and Status */}
                    <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                      <h6 className="fw-semibold mb-0" style={{ color: "#1e293b", fontSize: "0.95rem", lineHeight: "1.3" }}>
                        {row.name || "-"}
                      </h6>
                      <button
                        type="button"
                        className={`status-pill ${getStatusClass(row.status)}`}
                        style={{
                          ...getStatusStyle(row.status),
                          fontSize: "0.75rem",
                          padding: "4px 8px",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          border: "none",
                          appearance: "none",
                          WebkitAppearance: "none",
                          outline: "none",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusBadgeClick?.(row);
                        }}
                      >
                        {formatStatusLabel(row.status) || "-"}
                      </button>
                    </div>

                    {/* Details */}
                    <div className="text-muted small">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="ti ti-phone text-muted" style={{ fontSize: "0.95rem" }} />
                        <span style={{ fontSize: "0.85rem" }}>{row.mobile || "-"}</span>
                        {row.mobile && (
                          <a
                            className="btn-phone-call d-flex align-items-center justify-content-center ms-auto"
                            href={`tel:${row.mobile}`}
                            style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid #e2e8f0", color: "#64748b", backgroundColor: "#fff" }}
                          >
                            <PhoneGlyph size={9} />
                          </a>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="ti ti-world text-muted" style={{ fontSize: "0.95rem" }} />
                        <span style={{ fontSize: "0.85rem" }}>{row.secondarySource || row.primarySource || "-"}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="ti ti-user text-muted" style={{ fontSize: "0.95rem" }} />
                        <span style={{ fontSize: "0.85rem" }}>
                          <span className="me-1">{ownerLabel}:</span>
                          {isEmployee ? row.allocator || "-" : row.owner || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between">
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                      <i className="ti ti-calendar me-1" />
                      {formatCreatedOn(row.createdAt)}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      style={{ borderRadius: 6, fontSize: "0.75rem", padding: "4px 10px" }}
                      onClick={() => navigate(`/leads/${row.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
