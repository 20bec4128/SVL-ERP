import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import LeadExportDropdown from "../../components/admin/LeadExportDropdown";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getLeaves } from "../../api/leavesApi";
import { getDepartmentsMaster } from "../../api/departmentsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import "./EmployeesPage.css";

function downloadTextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_FILTERS = {
  department: "",
  status: "",
  fromDate: "",
  toDate: "",
};

export default function LeaveReportPage() {
  const { showError } = useToast();

  // Core List & UI States
  const [allLeaves, setAllLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  // Load Departments Metadata
  useEffect(() => {
    (async () => {
      try {
        const deptData = await getDepartmentsMaster();
        setDepartments(Array.isArray(deptData) ? deptData.filter(d => !d.deleted) : []);
      } catch (e) {
        showError("Failed to load department options");
      }
    })();
  }, [showError]);

  // Load Leave Records
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getLeaves();
      setAllLeaves(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load leave records"));
      setAllLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format Helper
  const formatDate = (val) => {
    if (!val) return "-";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString("en-GB");
    } catch {
      return val;
    }
  };

  // Filtered & Sorted Records (Client-side implementation)
  const processedLeaves = useMemo(() => {
    let result = [...allLeaves];

    // 1. Search Query (matches Employee Name, Leave Type, or Reason)
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          String(r.employeeName || "").toLowerCase().includes(q) ||
          String(r.policyName || "").toLowerCase().includes(q) ||
          String(r.reason || "").toLowerCase().includes(q)
      );
    }

    // 2. Department Filter
    if (appliedFilters.department) {
      result = result.filter(
        (r) => String(r.department || "").toLowerCase() === appliedFilters.department.toLowerCase()
      );
    }

    // 3. Status Filter
    if (appliedFilters.status) {
      result = result.filter(
        (r) => String(r.status || "").toUpperCase() === appliedFilters.status.toUpperCase()
      );
    }

    // 4. Date Range Filters
    if (appliedFilters.fromDate) {
      const startLimit = new Date(appliedFilters.fromDate);
      result = result.filter((r) => r.fromDate && new Date(r.fromDate) >= startLimit);
    }
    if (appliedFilters.toDate) {
      const endLimit = new Date(appliedFilters.toDate);
      result = result.filter((r) => r.toDate && new Date(r.toDate) <= endLimit);
    }

    // 5. Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls
      if (valA == null) return sortOrder === "asc" ? -1 : 1;
      if (valB == null) return sortOrder === "asc" ? 1 : -1;

      // Handle dates specifically
      if (sortField === "fromDate" || sortField === "toDate") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allLeaves, search, appliedFilters, sortField, sortOrder]);

  // Pagination Calculations
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return processedLeaves.slice(startIndex, startIndex + pageSize);
  }, [processedLeaves, page, pageSize]);

  const totalElements = processedLeaves.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  // Filter Actions
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSearch("");
    setPage(1);
    setFilterOpen(false);
  };

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // KPI Calculations
  const [totalCount, approvedCount, pendingCount] = useMemo(() => {
    const tot = allLeaves.length;
    const app = allLeaves.filter(r => String(r.status || "").toUpperCase() === "APPROVED").length;
    const pend = allLeaves.filter(r => ["NEW", "PENDING"].includes(String(r.status || "").toUpperCase())).length;
    return [tot, app, pend];
  }, [allLeaves]);

  // Bulk Selection Helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedRows.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // CSV Export
  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? allLeaves.filter(r => selectedIds.has(r.id))
      : processedLeaves;
    
    const headers = [
      "Employee",
      "Department",
      "Leave Policy / Type",
      "From Date",
      "To Date",
      "Days",
      "Status",
      "Reason"
    ];
    const csvData = targetRows.map((r) => [
      r.employeeName || "-",
      r.department || "-",
      r.policyName || "-",
      formatDate(r.fromDate),
      formatDate(r.toDate),
      r.noOfDays || "0",
      r.status || "-",
      r.reason || "-"
    ]);
    const content = [headers, ...csvData]
      .map((line) => line.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadTextFile("Leave_Report.csv", content, "text/csv;charset=utf-8;");
  };

  // Excel Export
  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? allLeaves.filter(r => selectedIds.has(r.id))
      : processedLeaves;

    let content = "Employee\tDepartment\tLeave Policy / Type\tFrom Date\tTo Date\tDays\tStatus\tReason\n";
    targetRows.forEach((r) => {
      content += `${r.employeeName || "-"}\t${r.department || "-"}\t${r.policyName || "-"}\t${formatDate(r.fromDate)}\t${formatDate(r.toDate)}\t${r.noOfDays || "0"}\t${r.status || "-"}\t${r.reason || "-"}\n`;
    });
    downloadTextFile("Leave_Report.xls", content, "application/vnd.ms-excel");
  };

  // PDF Export
  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? allLeaves.filter(r => selectedIds.has(r.id))
      : processedLeaves;

    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Leave Details Report", 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 20);

    const body = targetRows.map((r) => [
      r.employeeName || "-",
      r.department || "-",
      r.policyName || "-",
      formatDate(r.fromDate),
      formatDate(r.toDate),
      String(r.noOfDays || "0"),
      r.status || "-",
      r.reason || "-"
    ]);

    autoTable(doc, {
      head: [["Employee", "Department", "Leave Policy", "From Date", "To Date", "Days", "Status", "Reason"]],
      body: body,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });
    doc.save("Leave_Report.pdf");
  };

  return (
    <>
      <div className="content">
        {/* Header Block */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
                Leave Report
              </h2>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-decoration-none text-muted">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Reports</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">
                    Leave Report
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small text-uppercase fw-semibold">Total Leave Requests</span>
                  <h3 className="mb-0 mt-1 fw-bold text-dark">{totalCount}</h3>
                </div>
                <div className="avatar avatar-lg rounded-circle bg-primary-transparent text-primary">
                  <i className="ti ti-calendar fs-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small text-uppercase fw-semibold">Approved Leaves</span>
                  <h3 className="mb-0 mt-1 fw-bold text-success">{approvedCount}</h3>
                </div>
                <div className="avatar avatar-lg rounded-circle bg-success-transparent text-success">
                  <i className="ti ti-circle-check fs-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small text-uppercase fw-semibold">Pending Approval</span>
                  <h3 className="mb-0 mt-1 fw-bold text-warning">{pendingCount}</h3>
                </div>
                <div className="avatar avatar-lg rounded-circle bg-warning-transparent text-warning">
                  <i className="ti ti-clock-hour-4 fs-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table & Filtering */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body">
            {/* Search Controls Bar */}
            <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
                <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
                <input
                  type="text"
                  className="form-control border-0 bg-transparent shadow-none"
                  placeholder="Search by name, reason or type..."
                  style={{ height: 36, fontSize: "0.9rem" }}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className={`btn btn-outline-filter d-flex align-items-center gap-2 ${filterOpen ? 'active' : ''}`}
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                  onClick={() => setFilterOpen((prev) => !prev)}
                >
                  <i className="ti ti-filter" style={{ fontSize: "1rem" }} />
                  Filters
                </button>

                <LeadExportDropdown
                  exportExcel={exportExcel}
                  exportCsv={exportCsv}
                  exportPdf={exportPdf}
                />
              </div>
            </div>

            {/* Filter Toggle Panel */}
            {filterOpen && (
              <div className="card border p-3 mb-4" style={{ borderRadius: 10, backgroundColor: "#f8fafc" }}>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Department</label>
                    <select
                      className="form-select"
                      value={filters.department}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Status</label>
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">All Statuses</option>
                      <option value="NEW">New</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="DECLINED">Declined</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filters.fromDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">To Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filters.toDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-sm btn-outline-secondary px-3" onClick={handleResetFilters}>
                    Reset
                  </button>
                  <button className="btn btn-sm btn-primary px-3" onClick={handleApplyFilters}>
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {/* List Table */}
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "40px" }} className="py-3 ps-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={paginatedRows.length > 0 && selectedIds.size === paginatedRows.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("employeeName")}>
                      Employee {sortField === "employeeName" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("department")}>
                      Department {sortField === "department" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("policyName")}>
                      Leave Type {sortField === "policyName" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("fromDate")}>
                      From {sortField === "fromDate" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("toDate")}>
                      To {sortField === "toDate" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("noOfDays")}>
                      Days {sortField === "noOfDays" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("status")}>
                      Status {sortField === "status" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                        <div className="text-muted small mt-2">Loading leave details...</div>
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        No leave records found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((leave) => {
                      const isSelected = selectedIds.has(leave.id);
                      const status = String(leave.status || "").toUpperCase();
                      return (
                        <tr key={leave.id} className={isSelected ? "table-active" : ""}>
                          <td className="ps-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(leave.id)}
                            />
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div
                                className="avatar avatar-md rounded-circle me-2 bg-light d-flex align-items-center justify-content-center text-primary fw-bold"
                                style={{ width: 34, height: 34, fontSize: "0.85rem" }}
                              >
                                {leave.employeeName ? leave.employeeName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : "EE"}
                              </div>
                              <div>
                                <div className="fw-bold text-dark">{leave.employeeName || "-"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-dark small fw-medium">{leave.department || "-"}</td>
                          <td className="text-dark small fw-medium">{leave.policyName || "-"}</td>
                          <td className="small text-dark">{formatDate(leave.fromDate)}</td>
                          <td className="small text-dark">{formatDate(leave.toDate)}</td>
                          <td className="small text-dark fw-semibold">{leave.noOfDays || "0"}</td>
                          <td>
                            {status === "APPROVED" ? (
                              <span className="badge bg-success-transparent text-success" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Approved
                              </span>
                            ) : ["NEW", "PENDING"].includes(status) ? (
                              <span className="badge bg-warning-transparent text-warning" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Pending
                              </span>
                            ) : (
                              <span className="badge bg-danger-transparent text-danger" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Declined
                              </span>
                            )}
                          </td>
                          <td className="small text-muted" style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={leave.reason || ""}>
                            {leave.reason || "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!loading && totalElements > 0 && (
              <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
                <span className="entries-info text-muted small">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalElements)} of {totalElements} entries
                </span>
                
                <div className="pagination-numbers-container d-flex align-items-center gap-1 mx-auto">
                  <button
                    type="button"
                    className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    ❮
                  </button>
                  {(() => {
                    const buttons = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, page - 2);
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    if (maxVisible - 1 > endPage - startPage) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }

                    if (startPage > 1) {
                      buttons.push(
                        <button
                          key={1}
                          type="button"
                          className={`btn-pagination-num btn btn-sm border-0 ${page === 1 ? 'btn-primary text-white' : 'btn-light'}`}
                          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === 1 ? "#3b82f6" : undefined }}
                          onClick={() => setPage(1)}
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        buttons.push(<span key="dots-start" className="pagination-dots px-1 text-muted">...</span>);
                      }
                    }

                    for (let i = startPage; endPage >= i; i++) {
                      buttons.push(
                        <button
                          key={i}
                          type="button"
                          className={`btn-pagination-num btn btn-sm border-0 ${page === i ? 'btn-primary text-white' : 'btn-light'}`}
                          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === i ? "#3b82f6" : undefined }}
                          onClick={() => setPage(i)}
                        >
                          {i}
                        </button>
                      );
                    }

                    if (totalPages > endPage) {
                      if (totalPages - 1 > endPage) {
                        buttons.push(<span key="dots-end" className="pagination-dots px-1 text-muted">...</span>);
                      }
                      buttons.push(
                        <button
                          key={totalPages}
                          type="button"
                          className={`btn-pagination-num btn btn-sm border-0 ${page === totalPages ? 'btn-primary text-white' : 'btn-light'}`}
                          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === totalPages ? "#3b82f6" : undefined }}
                          onClick={() => setPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    return buttons;
                  })()}
                  <button
                    type="button"
                    className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    ❯
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <PageSizeSelector
                    pageSize={pageSize}
                    setPageSize={(size) => {
                      setPageSize(size);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 &&
        createPortal(
          <div
            className="floating-bulk-bar"
            style={{
              position: "fixed",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#0f172a",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 16,
              zIndex: 9999,
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            }}
          >
            <span className="small">{selectedIds.size} row(s) selected</span>
            <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
            <div className="dropdown">
              <button
                className="btn btn-sm btn-primary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Bulk Export
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={exportPdf}>
                    <i className="ti ti-file-type-pdf text-danger" /> Export PDF
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={exportExcel}>
                    <i className="ti ti-file-type-xls text-success" /> Export Excel
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={exportCsv}>
                    <i className="ti ti-file-type-csv text-info" /> Export CSV
                  </button>
                </li>
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
