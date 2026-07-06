import React from "react";
import { formatStatusLabel } from "../../utils/statusLabels";

export default function LeadFilters({
  filterOpen,
  filters,
  setFilters,
  leadFilters,
  primaryOptions = [],
  resetFilters,
  applyFilters,
}) {
  if (!filterOpen) return null;

  return (
    <div className="card border-0 shadow-sm filter-drawer-card mb-4" style={{ borderRadius: 14, backgroundColor: "#f8fafc" }}>
      <div className="card-body p-4">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Status</label>
            <select
              className="form-select custom-filter-select"
              style={{ height: 42, borderRadius: 8 }}
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="">All Statuses</option>
              {(leadFilters.leadStatuses || []).map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Source</label>
            <select
              className="form-select custom-filter-select"
              style={{ height: 42, borderRadius: 8 }}
              value={filters.primary}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, primary: e.target.value }))
              }
            >
              <option value="">All Sources</option>
              {[...new Set([...primaryOptions, ...(leadFilters.primarySources || [])])]
                .filter(Boolean)
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Owner</label>
            <select
              className="form-select custom-filter-select"
              style={{ height: 42, borderRadius: 8 }}
              value={filters.owner}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, owner: e.target.value }))
              }
            >
              <option value="">All Owners</option>
              {(leadFilters.owners || []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Date Range</label>
            <select
              className="form-select custom-filter-select"
              style={{ height: 42, borderRadius: 8 }}
              value={filters.quickDate}
              onChange={(e) =>
                setFilters((prev) => ({ 
                  ...prev, 
                  quickDate: e.target.value,
                  // Clear custom dates if we switch away from custom
                  ...(e.target.value !== "custom" ? { fromDate: "", toDate: "" } : {})
                }))
              }
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {filters.quickDate === "custom" && (
            <>
              <div className="col-md-3">
                <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>From Date</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ height: 42, borderRadius: 8 }}
                  value={filters.fromDate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>To Date</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ height: 42, borderRadius: 8 }}
                  value={filters.toDate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                  }
                />
              </div>
            </>
          )}
        </div>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button className="btn btn-filter-reset" style={{ height: 40, padding: "0 20px", borderRadius: 8, fontWeight: "500" }} onClick={resetFilters}>
            Reset
          </button>
          <button className="btn btn-filter-apply text-white" style={{ height: 40, padding: "0 20px", borderRadius: 8, fontWeight: "500", backgroundColor: "#3b82f6" }} onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
