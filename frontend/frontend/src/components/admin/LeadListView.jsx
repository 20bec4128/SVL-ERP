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

export default function LeadListView({
  pagedRows,
  loading,
  selectedLeadIds,
  toggleSelectAll,
  toggleLeadSelection,
  pageOffset,
  getStatusClass,
  onStatusBadgeClick,
  formatCreatedOn,
  sortField,
  sortOrder,
  onSort,
  navigate,
  onUpdateStatusLead,
  onDeleteLead,
  role,
  visibleColumns = {},
  onRowClick,
}) {
  const isEmployee = role === "EMPLOYEE";
  const ownerColumnLabel = isEmployee ? "Assigned By" : "Owner";

  // Helper: is a column visible? Defaults to true if key not specified.
  const isVis = (key) => {
    if (key === "assignedBy") {
      return visibleColumns[key] === true;
    }
    return visibleColumns[key] !== false;
  };

  // Count how many columns are actually visible (checkbox + # are always shown)
  const colCount =
    2 + // checkbox + #
    (isVis("name") ? 1 : 0) +
    (isVis("mobile") ? 1 : 0) +
    (isVis("source") ? 1 : 0) +
    (isVis("status") ? 1 : 0) +
    (isVis("owner") ? 1 : 0) +
    (isVis("assignedBy") && (role === "ADMIN" || role === "SUPER_ADMIN") ? 1 : 0) +
    (isVis("createdOn") ? 1 : 0) +
    1; // actions always shown

  return (
    <div
      className="table-responsive leads-table-wrap border-0 shadow-sm mb-4"
      style={{ overflow: "visible", touchAction: "auto", borderRadius: 12, minHeight: "260px" }}
    >
      <table className="table table-hover align-middle leads-table mb-0">
        <thead>
          <tr>
            <th className="col-select" style={{ minWidth: 36 }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  pagedRows.length > 0 &&
                  pagedRows.every((row) => selectedLeadIds.has(row.id))
                }
                onChange={toggleSelectAll}
              />
            </th>
            <th className="col-index text-nowrap text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>#</th>
            {isVis("name") && (
              <th
                className="col-name text-muted"
                style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                onClick={() => onSort("name")}
              >
                Name {sortField === "name" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
              </th>
            )}
            {isVis("mobile") && (
              <th className="col-mobile text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Mobile</th>
            )}
            {isVis("source") && (
              <th className="col-source text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                Source
              </th>
            )}
            {isVis("status") && (
              <th className="col-status text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                Status
              </th>
            )}
            {isVis("owner") && (
              <th className="col-owner text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                {ownerColumnLabel}
              </th>
            )}
            {isVis("assignedBy") && (role === "ADMIN" || role === "SUPER_ADMIN") && (
              <th className="col-assigned-by text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                Assigned By
              </th>
            )}
            {isVis("createdOn") && (
              <th
                className="col-date text-muted"
                style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                onClick={() => onSort("createdAt")}
              >
                Created On {sortField === "createdAt" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
              </th>
            )}
            <th className="col-actions text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} className="text-center py-4 text-muted">
                <LoadingSpinner size="page" label="Loading leads" />
              </td>
            </tr>
          ) : pagedRows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="text-center py-4 text-muted">No leads found</td>
            </tr>
          ) : (
            pagedRows.map((row, index) => {
              const statusKey = String(row.status || "").trim().toLowerCase();
              const isDealRow = statusKey === "deal";
              return (
                <tr key={row.id} onClick={() => onRowClick?.(row)} style={{ cursor: "pointer" }}>
                  <td className="col-select" onClick={(e) => e.stopPropagation()}>
                    {isDealRow ? null : (
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedLeadIds.has(row.id)}
                        onChange={() => toggleLeadSelection(row.id)}
                      />
                    )}
                  </td>
                  <td className="col-index text-muted" style={{ fontSize: "0.9rem" }}>{pageOffset + index + 1}</td>
                  {isVis("name") && (
                    <td className="col-name fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{row.name || "-"}</td>
                  )}
                  {isVis("mobile") && (
                    <td className="col-mobile" style={{ fontSize: "0.9rem" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span>{row.mobile || "-"}</span>
                        {row.mobile && (
                          <a
                            className="btn-phone-call d-flex align-items-center justify-content-center"
                            href={`tel:${row.mobile}`}
                            style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #e2e8f0", color: "#64748b", backgroundColor: "#fff" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PhoneGlyph size={11} />
                          </a>
                        )}
                      </div>
                    </td>
                  )}
                  {isVis("source") && (
                    <td className="col-source" style={{ fontSize: "0.9rem", color: "#475569" }}>{row.secondarySource || row.primarySource || "-"}</td>
                  )}
                  {isVis("status") && (
                    <td className="col-status">
                      <button
                        type="button"
                        className={`status-pill ${getStatusClass(row.status)}`}
                        style={{
                          ...getStatusStyle(row.status),
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
                    </td>
                  )}
                  {isVis("owner") && (
                    <td className="col-owner" style={{ fontSize: "0.9rem", color: "#475569" }}>
                      {isEmployee ? row.allocator || "-" : row.owner || "-"}
                    </td>
                  )}
                  {isVis("assignedBy") && (role === "ADMIN" || role === "SUPER_ADMIN") && (
                    <td className="col-assigned-by" style={{ fontSize: "0.9rem", color: "#475569" }}>
                      {row.allocator || "-"}
                    </td>
                  )}
                  {isVis("createdOn") && (
                    <td className="col-date" style={{ fontSize: "0.9rem", color: "#475569" }}>{formatCreatedOn(row.createdAt)}</td>
                  )}
                  <td className="col-actions">
                    <div className="d-inline-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: 32,
                          height: 32,
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
                          width: 32,
                          height: 32,
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
                            width: 32,
                            height: 32,
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
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
