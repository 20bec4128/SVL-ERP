import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import LeadExportDropdown from "../../components/admin/LeadExportDropdown";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getEmployees } from "../../api/employeesApi";
import { getBranches } from "../../api/branchesApi";
import { getDepartmentsMaster } from "../../api/departmentsApi";
import { getDesignations } from "../../api/designationsApi";
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
  branchId: "",
  departmentId: "",
  designationId: "",
  profileStatus: "",
};

export default function EmployeeReportPage() {
  const { showError } = useToast();

  // Core List & UI States
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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

  // Filter Dropdowns Metadata
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  // Load Dropdowns Metadata
  useEffect(() => {
    (async () => {
      try {
        const branchData = await getBranches();
        setBranches(Array.isArray(branchData) ? branchData.filter(b => !b.deleted) : []);
        
        const deptData = await getDepartmentsMaster();
        setDepartments(Array.isArray(deptData) ? deptData.filter(d => !d.deleted) : []);
        
        const desigData = await getDesignations();
        setDesignations(Array.isArray(desigData) ? desigData.filter(d => !d.deleted) : []);
      } catch (e) {
        showError("Failed to load metadata options");
      }
    })();
  }, [showError]);

  // Load Main List
  const loadData = async (targetPage, targetPageSize, currentFilters) => {
    setLoading(true);
    try {
      const queryParams = {
        page: targetPage - 1,
        size: targetPageSize,
        sort: `${sortField},${sortOrder}`,
      };

      if (search.trim()) queryParams.q = search.trim();
      if (currentFilters.branchId) queryParams.branchId = Number(currentFilters.branchId);
      if (currentFilters.departmentId) queryParams.departmentId = Number(currentFilters.departmentId);
      if (currentFilters.designationId) queryParams.designationId = Number(currentFilters.designationId);
      if (currentFilters.profileStatus) queryParams.profileStatus = currentFilters.profileStatus;

      const res = await getEmployees(queryParams);
      setRows(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load employee report"));
      setRows([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page, pageSize, appliedFilters);
  }, [page, pageSize, sortField, sortOrder, appliedFilters]);

  // Search Submit Trigger
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    loadData(1, pageSize, appliedFilters);
  };

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

  // KPI calculations
  const [totalCount, activeCount, pendingCount] = useMemo(() => {
    let tot = totalElements;
    // Client-side analytics based on currently loaded rows (or approximations)
    let act = rows.filter(r => String(r.profileStatus || "").toUpperCase() === "VERIFIED").length;
    let pend = rows.filter(r => String(r.profileStatus || "").toUpperCase() === "PENDING_VERIFICATION").length;
    
    // Scale approximations based on total if pagination is active
    if (totalElements > rows.length && rows.length > 0) {
      const ratio = totalElements / rows.length;
      act = Math.round(act * ratio);
      pend = Math.round(pend * ratio);
    }
    return [tot, act, pend];
  }, [rows, totalElements]);

  // Bulk Selection Helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(rows.map(r => r.id)));
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

  // CSV Export
  const exportCsv = () => {
    const headers = [
      "Employee Code",
      "Name",
      "Email",
      "Phone",
      "Branch",
      "Department",
      "Designation",
      "Joined Date",
      "Status"
    ];
    const data = rows.map((r) => [
      r.employeeCode || "-",
      r.name || "-",
      r.email || "-",
      r.phone || "-",
      r.institution || "-",
      r.departmentName || "-",
      r.designation || "-",
      formatDate(r.joinDate),
      r.profileStatus || "-"
    ]);
    const content = [headers, ...data]
      .map((line) => line.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadTextFile("Employee_Report.csv", content, "text/csv;charset=utf-8;");
  };

  // Excel Export
  const exportExcel = () => {
    let content = "Employee Code\tName\tEmail\tPhone\tBranch\tDepartment\tDesignation\tJoined Date\tStatus\n";
    rows.forEach((r) => {
      content += `${r.employeeCode || "-"}\t${r.name || "-"}\t${r.email || "-"}\t${r.phone || "-"}\t${r.institution || "-"}\t${r.departmentName || "-"}\t${r.designation || "-"}\t${formatDate(r.joinDate)}\t${r.profileStatus || "-"}\n`;
    });
    downloadTextFile("Employee_Report.xls", content, "application/vnd.ms-excel");
  };

  // PDF Export
  const exportPdf = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Employee Details Report", 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 20);

    const body = rows.map((r) => [
      r.employeeCode || "-",
      r.name || "-",
      r.email || "-",
      r.phone || "-",
      r.institution || "-",
      r.departmentName || "-",
      r.designation || "-",
      formatDate(r.joinDate),
      r.profileStatus || "-"
    ]);

    autoTable(doc, {
      head: [["Code", "Name", "Email", "Phone", "Branch", "Department", "Designation", "Join Date", "Status"]],
      body: body,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });
    doc.save("Employee_Report.pdf");
  };

  return (
    <>
      <div className="content">
        {/* Header Block */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
                Employee Report
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
                    Employee Report
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
                  <span className="text-muted small text-uppercase fw-semibold">Total Employees</span>
                  <h3 className="mb-0 mt-1 fw-bold text-dark">{totalCount}</h3>
                </div>
                <div className="avatar avatar-lg rounded-circle bg-primary-transparent text-primary">
                  <i className="ti ti-users fs-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small text-uppercase fw-semibold">Active Profiles</span>
                  <h3 className="mb-0 mt-1 fw-bold text-success">{activeCount}</h3>
                </div>
                <div className="avatar avatar-lg rounded-circle bg-success-transparent text-success">
                  <i className="ti ti-user-check fs-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small text-uppercase fw-semibold">Pending Verification</span>
                  <h3 className="mb-0 mt-1 fw-bold text-warning">{pendingCount}</h3>
                </div>
                <div className="avatar avatar-lg rounded-circle bg-warning-transparent text-warning">
                  <i className="ti ti-clock fs-3" />
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
              <form onSubmit={handleSearchSubmit} className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
                <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
                <input
                  type="text"
                  className="form-control border-0 bg-transparent shadow-none"
                  placeholder="Search by code or name..."
                  style={{ height: 36, fontSize: "0.9rem" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>

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
                    <label className="form-label small fw-semibold text-muted">Branch / Institution</label>
                    <select
                      className="form-select"
                      value={filters.branchId}
                      onChange={(e) => setFilters(prev => ({ ...prev, branchId: e.target.value }))}
                    >
                      <option value="">All Branches</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Department</label>
                    <select
                      className="form-select"
                      value={filters.departmentId}
                      onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Designation</label>
                    <select
                      className="form-select"
                      value={filters.designationId}
                      onChange={(e) => setFilters(prev => ({ ...prev, designationId: e.target.value }))}
                    >
                      <option value="">All Designations</option>
                      {designations.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Profile Status</label>
                    <select
                      className="form-select"
                      value={filters.profileStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, profileStatus: e.target.value }))}
                    >
                      <option value="">All Statuses</option>
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING_VERIFICATION">Pending Verification</option>
                      <option value="VERIFIED">Verified</option>
                    </select>
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
                        checked={rows.length > 0 && selectedIds.size === rows.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("employeeCode")}>
                      Code {sortField === "employeeCode" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                      Employee {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3">Contact</th>
                    <th className="py-3">Branch / Department</th>
                    <th className="py-3">Designation</th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("joinDate")}>
                      Joined Date {sortField === "joinDate" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("profileStatus")}>
                      Status {sortField === "profileStatus" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                        <div className="text-muted small mt-2">Loading report details...</div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        No employees found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((emp) => {
                      const isSelected = selectedIds.has(emp.id);
                      const status = String(emp.profileStatus || "").toUpperCase();
                      return (
                        <tr key={emp.id} className={isSelected ? "table-active" : ""}>
                          <td className="ps-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(emp.id)}
                            />
                          </td>
                          <td className="fw-semibold text-dark">{emp.employeeCode || "-"}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div
                                className="avatar avatar-md rounded-circle me-2 bg-light d-flex align-items-center justify-content-center text-primary fw-bold"
                                style={{ width: 34, height: 34, fontSize: "0.85rem" }}
                              >
                                {emp.name ? emp.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : "EE"}
                              </div>
                              <div>
                                <div className="fw-bold text-dark">{emp.name || "-"}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="small text-dark fw-medium">{emp.email || "-"}</div>
                            <div className="small text-muted">{emp.phone ? `+${emp.countryCode || "91"} ${emp.phone}` : "-"}</div>
                          </td>
                          <td>
                            <div className="text-dark small fw-medium">{emp.institution || "-"}</div>
                            <div className="text-muted small">{emp.departmentName || "-"}</div>
                          </td>
                          <td className="text-dark small fw-semibold">{emp.designation || "-"}</td>
                          <td className="small text-dark">{formatDate(emp.joinDate)}</td>
                          <td>
                            {status === "VERIFIED" ? (
                              <span className="badge bg-success-transparent text-success" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Verified
                              </span>
                            ) : status === "PENDING_VERIFICATION" ? (
                              <span className="badge bg-warning-transparent text-warning" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Pending
                              </span>
                            ) : (
                              <span className="badge bg-secondary-transparent text-secondary" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Draft
                              </span>
                            )}
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
    </>
  );
}
