import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import LeadExportDropdown from "../../components/admin/LeadExportDropdown";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getUsers } from "../../api/userAdminApi";
import { getBranches } from "../../api/branchesApi";
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
  branchName: "",
  departmentName: "",
  role: "",
  status: "",
};

export default function UserReportPage() {
  const { showError } = useToast();

  // Core List & UI States
  const [allUsers, setAllUsers] = useState([]);
  const [branches, setBranches] = useState([]);
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

  // Load Dropdowns Metadata
  useEffect(() => {
    (async () => {
      try {
        const branchData = await getBranches();
        setBranches(Array.isArray(branchData) ? branchData.filter(b => !b.deleted) : []);
        
        const deptData = await getDepartmentsMaster();
        setDepartments(Array.isArray(deptData) ? deptData.filter(d => !d.deleted) : []);
      } catch (e) {
        showError("Failed to load metadata options");
      }
    })();
  }, [showError]);

  // Load Users Records (fetch with a large size to allow full client-side filtering/exports)
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getUsers(0, 10000);
      setAllUsers(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load user records"));
      setAllUsers([]);
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
  const processedUsers = useMemo(() => {
    let result = [...allUsers];

    // 1. Search Query (matches Username, Email, First/Last Name)
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          String(r.username || "").toLowerCase().includes(q) ||
          String(r.email || "").toLowerCase().includes(q) ||
          String(r.firstName || "").toLowerCase().includes(q) ||
          String(r.lastName || "").toLowerCase().includes(q)
      );
    }

    // 2. Branch/Institution Filter
    if (appliedFilters.branchName) {
      result = result.filter(
        (r) => String(r.branch || r.institution || "").toLowerCase() === appliedFilters.branchName.toLowerCase()
      );
    }

    // 3. Department Filter
    if (appliedFilters.departmentName) {
      result = result.filter(
        (r) => String(r.departmentName || "").toLowerCase() === appliedFilters.departmentName.toLowerCase()
      );
    }

    // 4. Role Filter
    if (appliedFilters.role) {
      result = result.filter(
        (r) => String(r.role || "").toUpperCase() === appliedFilters.role.toUpperCase()
      );
    }

    // 5. Status Filter
    if (appliedFilters.status) {
      result = result.filter((r) => {
        const activation = String(r.activationStatus || "").toUpperCase();
        if (appliedFilters.status === "ACTIVE") return r.active && activation !== "PENDING";
        if (appliedFilters.status === "BANNED") return !r.active;
        if (appliedFilters.status === "PENDING") return activation === "PENDING";
        return true;
      });
    }

    // 6. Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls
      if (valA == null) return sortOrder === "asc" ? -1 : 1;
      if (valB == null) return sortOrder === "asc" ? 1 : -1;

      // Special field resolving if needed (e.g. registeredAt date)
      if (sortField === "registeredAt" || sortField === "lastLoginAt") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allUsers, search, appliedFilters, sortField, sortOrder]);

  // Pagination Calculations
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return processedUsers.slice(startIndex, startIndex + pageSize);
  }, [processedUsers, page, pageSize]);

  const totalElements = processedUsers.length;
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
  const [totalCount, activeCount, adminCount] = useMemo(() => {
    const tot = allUsers.length;
    const act = allUsers.filter(r => r.active && String(r.activationStatus || "").toUpperCase() !== "PENDING").length;
    const adm = allUsers.filter(r => ["SUPER_ADMIN", "ADMIN"].includes(String(r.role || "").toUpperCase())).length;
    return [tot, act, adm];
  }, [allUsers]);

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
      ? allUsers.filter(r => selectedIds.has(r.id))
      : processedUsers;
    
    const headers = [
      "Username",
      "Full Name",
      "Email",
      "Role",
      "Branch",
      "Department",
      "Registered Date",
      "Status"
    ];
    const csvData = targetRows.map((r) => [
      r.username || "-",
      `${r.firstName || ""} ${r.lastName || ""}`.trim() || "-",
      r.email || "-",
      r.role || "-",
      r.branch || r.institution || "-",
      r.departmentName || "-",
      formatDate(r.registeredAt),
      r.status || "-"
    ]);
    const content = [headers, ...csvData]
      .map((line) => line.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadTextFile("User_Report.csv", content, "text/csv;charset=utf-8;");
  };

  // Excel Export
  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? allUsers.filter(r => selectedIds.has(r.id))
      : processedUsers;

    let content = "Username\tFull Name\tEmail\tRole\tBranch\tDepartment\tRegistered Date\tStatus\n";
    targetRows.forEach((r) => {
      content += `${r.username || "-"}\t${`${r.firstName || ""} ${r.lastName || ""}`.trim() || "-"}\t${r.email || "-"}\t${r.role || "-"}\t${r.branch || r.institution || "-"}\t${r.departmentName || "-"}\t${formatDate(r.registeredAt)}\t${r.status || "-"}\n`;
    });
    downloadTextFile("User_Report.xls", content, "application/vnd.ms-excel");
  };

  // PDF Export
  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? allUsers.filter(r => selectedIds.has(r.id))
      : processedUsers;

    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("User Details Report", 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 20);

    const body = targetRows.map((r) => [
      r.username || "-",
      `${r.firstName || ""} ${r.lastName || ""}`.trim() || "-",
      r.email || "-",
      r.role || "-",
      r.branch || r.institution || "-",
      r.departmentName || "-",
      formatDate(r.registeredAt),
      r.status || "-"
    ]);

    autoTable(doc, {
      head: [["Username", "Full Name", "Email", "Role", "Branch", "Department", "Registered Date", "Status"]],
      body: body,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });
    doc.save("User_Report.pdf");
  };

  return (
    <>
      <div className="content">
        {/* Header Block */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
                User Report
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
                    User Report
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
                  <span className="text-muted small text-uppercase fw-semibold">Total Accounts</span>
                  <h3 className="mb-0 mt-1 fw-bold text-dark">{totalCount}</h3>
                </div>
                <div className="avatar avatar-lg rounded-circle bg-primary-transparent text-primary">
                  <i className="ti ti-user fs-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small text-uppercase fw-semibold">Active Accounts</span>
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
                  <span className="text-muted small text-uppercase fw-semibold">Admins & Super Admins</span>
                  <h3 className="mb-0 mt-1 fw-bold text-warning">{adminCount}</h3>
                </div>
                <div className="avatar avatar-lg rounded-circle bg-warning-transparent text-warning">
                  <i className="ti ti-shield fs-3" />
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
                  placeholder="Search by username, email or name..."
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
                    <label className="form-label small fw-semibold text-muted">Branch / Institution</label>
                    <select
                      className="form-select"
                      value={filters.branchName}
                      onChange={(e) => setFilters(prev => ({ ...prev, branchName: e.target.value }))}
                    >
                      <option value="">All Branches</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Department</label>
                    <select
                      className="form-select"
                      value={filters.departmentName}
                      onChange={(e) => setFilters(prev => ({ ...prev, departmentName: e.target.value }))}
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Role</label>
                    <select
                      className="form-select"
                      value={filters.role}
                      onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="">All Roles</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="EMPLOYEE">Employee</option>
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
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Awaiting Activation</option>
                      <option value="BANNED">Banned</option>
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
                        checked={paginatedRows.length > 0 && selectedIds.size === paginatedRows.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("username")}>
                      Username {sortField === "username" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("firstName")}>
                      Full Name {sortField === "firstName" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
                      Email {sortField === "email" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("role")}>
                      Role {sortField === "role" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3">Branch / Department</th>
                    <th className="py-3" style={{ cursor: "pointer" }} onClick={() => handleSort("registeredAt")}>
                      Registered Date {sortField === "registeredAt" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                        <div className="text-muted small mt-2">Loading user details...</div>
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        No user records found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((user) => {
                      const isSelected = selectedIds.has(user.id);
                      const active = user.active;
                      const activation = String(user.activationStatus || "").toUpperCase();
                      
                      return (
                        <tr key={user.id} className={isSelected ? "table-active" : ""}>
                          <td className="ps-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(user.id)}
                            />
                          </td>
                          <td className="fw-semibold text-dark">{user.username || "-"}</td>
                          <td className="text-dark fw-bold">
                            {`${user.firstName || ""} ${user.lastName || ""}`.trim() || "-"}
                          </td>
                          <td className="small text-dark fw-medium">{user.email || "-"}</td>
                          <td className="small text-dark font-monospace">{user.role || "-"}</td>
                          <td>
                            <div className="text-dark small fw-medium">{user.branch || user.institution || "-"}</div>
                            <div className="text-muted small">{user.departmentName || "-"}</div>
                          </td>
                          <td className="small text-dark">{formatDate(user.registeredAt)}</td>
                          <td>
                            {activation === "PENDING" ? (
                              <span className="badge bg-warning-transparent text-warning" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Awaiting Activation
                              </span>
                            ) : active ? (
                              <span className="badge bg-success-transparent text-success" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Active
                              </span>
                            ) : (
                              <span className="badge bg-danger-transparent text-danger" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                                Banned
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
