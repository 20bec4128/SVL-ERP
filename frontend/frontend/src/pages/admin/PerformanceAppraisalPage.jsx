import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getEmployees } from "../../api/employeesApi";
import {
  createPerformanceAppraisal,
  deletePerformanceAppraisal,
  getPerformanceAppraisals,
  updatePerformanceAppraisal,
} from "../../api/performanceAppraisalApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";
import "../../../public/assets/css/addModalShared.css";

const technicalTemplate = [
  { indicator: "Customer Experience", expectedValue: "Intermediate" },
  { indicator: "Marketing", expectedValue: "Advanced" },
  { indicator: "Management", expectedValue: "Advanced" },
  { indicator: "Administration", expectedValue: "Advanced" },
  { indicator: "Presentation Skill", expectedValue: "Expert / Leader" },
  { indicator: "Quality Of Work", expectedValue: "Expert / Leader" },
  { indicator: "Efficiency", expectedValue: "Expert / Leader" },
];

const organizationalTemplate = [
  { indicator: "Integrity", expectedValue: "Beginner" },
  { indicator: "Professionalism", expectedValue: "Beginner" },
  { indicator: "Team Work", expectedValue: "Intermediate" },
  { indicator: "Critical Thinking", expectedValue: "Advanced" },
  { indicator: "Conflict Management", expectedValue: "Intermediate" },
  { indicator: "Attendance", expectedValue: "Intermediate" },
  { indicator: "Ability To Meet Deadline", expectedValue: "Advanced" },
];

const scoreOptions = ["None", "Beginner", "Intermediate", "Advanced", "Expert / Leader"];

const buildCompetencies = (template, values) => {
  const map = new Map((values || []).map((v) => [v.indicator, v]));
  return template.map((t) => ({
    indicator: t.indicator,
    expectedValue: t.expectedValue,
    setValue: map.get(t.indicator)?.setValue || "",
  }));
};

const createInitialForm = () => ({
  employeeId: "",
  appraisalDate: "",
  status: "Active",
  technicalCompetencies: buildCompetencies(technicalTemplate, []),
  organizationalCompetencies: buildCompetencies(organizationalTemplate, []),
});

export default function PerformanceAppraisalPage() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(createInitialForm());
  const [editForm, setEditForm] = useState(createInitialForm());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Search/Filters and Pagination state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Kebab row actions state
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Close kebab action menu on outside scroll or click
  useEffect(() => {
    const handleOutsideClickOrScroll = () => {
      setActiveActionsRow(null);
    };
    window.addEventListener("click", handleOutsideClickOrScroll);
    window.addEventListener("scroll", handleOutsideClickOrScroll, true);
    return () => {
      window.removeEventListener("click", handleOutsideClickOrScroll);
      window.removeEventListener("scroll", handleOutsideClickOrScroll, true);
    };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPerformanceAppraisals();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load appraisals"));
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const employeeList = await getEmployees();
      setEmployees(Array.isArray(employeeList) ? employeeList : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load employees"));
    }
  };

  useEffect(() => {
    load();
    loadMeta();
  }, []);

  const employeeOptions = useMemo(
    () =>
      (employees || [])
        .map((e) => ({
          id: e?.id,
          name: e?.name || e?.employeeName || e?.fullName || "",
        }))
        .filter((e) => e.id != null && e.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [employees],
  );

  // Filtered and sorted rows
  const filteredRows = useMemo(() => {
    let result = rows;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((r) =>
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.designation || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, search]);

  const orderedRows = useMemo(
    () => [...filteredRows].sort((a, b) => String(b.appraisalDate || "").localeCompare(String(a.appraisalDate || ""))),
    [filteredRows],
  );

  // Pagination calculations
  const totalRows = orderedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => orderedRows.slice(pageOffset, pageOffset + pageSize),
    [orderedRows, pageOffset, pageSize]
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage]);

  // Selection toggle handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openAdd = () => {
    setForm(createInitialForm());
    setShowAddModal(true);
  };

  const openEdit = (row) => {
    setEditForm({
      employeeId: row?.employeeId ? String(row.employeeId) : "",
      appraisalDate: row?.appraisalDate ? String(row.appraisalDate).slice(0, 10) : "",
      status: row?.status || "Active",
      technicalCompetencies: buildCompetencies(technicalTemplate, row?.technicalCompetencies || []),
      organizationalCompetencies: buildCompetencies(organizationalTemplate, row?.organizationalCompetencies || []),
    });
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row || null);
    setSelectedId(row?.id || null);
    setShowDeleteModal(true);
  };

  const updateCompetency = (setFn, groupKey, index, value) => {
    setFn((prev) => {
      const next = { ...prev };
      const list = [...next[groupKey]];
      list[index] = { ...list[index], setValue: value };
      next[groupKey] = list;
      return next;
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.employeeId) {
      showError("Employee is required");
      return;
    }
    setSaving(true);
    try {
      await createPerformanceAppraisal({
        employeeId: Number(form.employeeId),
        appraisalDate: form.appraisalDate || null,
        status: form.status,
        technicalCompetencies: form.technicalCompetencies,
        organizationalCompetencies: form.organizationalCompetencies,
      });
      setForm(createInitialForm());
      showSuccess("Appraisal added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add appraisal"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.employeeId) {
      showError("Employee is required");
      return;
    }
    setSaving(true);
    try {
      await updatePerformanceAppraisal(selectedId, {
        employeeId: Number(editForm.employeeId),
        appraisalDate: editForm.appraisalDate || null,
        status: editForm.status,
        technicalCompetencies: editForm.technicalCompetencies,
        organizationalCompetencies: editForm.organizationalCompetencies,
      });
      showSuccess("Appraisal updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update appraisal"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deletePerformanceAppraisal(selectedId);
      showSuccess("Appraisal deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete appraisal"));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete the selected ${selectedIds.size} appraisals?`)) {
      setSaving(true);
      try {
        await Promise.all(Array.from(selectedIds).map((id) => deletePerformanceAppraisal(id)));
        showSuccess(`${selectedIds.size} appraisals deleted successfully`);
        setSelectedIds(new Set());
        await load();
      } catch (e) {
        showError("Failed to delete some appraisals");
      } finally {
        setSaving(false);
      }
    }
  };

  // Export functions
  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? orderedRows.filter((r) => selectedIds.has(r.id))
      : orderedRows;

    const headers = ["Employee Name", "Designation", "Department", "Appraisal Date", "Status"];
    const body = targetRows.map((row) => [
      row.employeeName || "",
      row.designation || "",
      row.department || "",
      row.appraisalDate || "",
      row.status || "Active",
    ]);
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `performance-appraisals-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? orderedRows.filter((r) => selectedIds.has(r.id))
      : orderedRows;

    const headers = ["Employee Name", "Designation", "Department", "Appraisal Date", "Status"];
    const body = targetRows.map((row) => [
      row.employeeName || "",
      row.designation || "",
      row.department || "",
      row.appraisalDate || "",
      row.status || "Active",
    ]);
    
    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Appraisals</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    template += `<body><table><thead><tr>`;
    headers.forEach((h) => {
      template += `<th>${h}</th>`;
    });
    template += `</tr></thead><tbody>`;
    body.forEach((r) => {
      template += `<tr>`;
      r.forEach((c) => {
        template += `<td>${c}</td>`;
      });
      template += `</tr>`;
    });
    template += `</tbody></table></body></html>`;

    const blob = new Blob([template], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `performance-appraisals-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? orderedRows.filter((r) => selectedIds.has(r.id))
      : orderedRows;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Performance Appraisals Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["Employee Name", "Designation", "Department", "Appraisal Date", "Status"]];
    const body = targetRows.map((row) => [
      row.employeeName || "",
      row.designation || "",
      row.department || "",
      row.appraisalDate || "",
      row.status || "Active",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 8 },
    });

    doc.save(`performance-appraisals-${Date.now()}.pdf`);
  };

  const renderCompetencyTable = (list, onChange) => (
    <div className="table-responsive">
      <table className="table table-sm align-middle mb-0">
        <thead className="thead-light">
          <tr>
            <th>Indicator</th>
            <th>Expected Value</th>
            <th>Set Value</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item, idx) => (
            <tr key={`${item.indicator}-${idx}`}>
              <td className="fw-semibold">{item.indicator}</td>
              <td>{item.expectedValue}</td>
              <td>
                <select
                  className="form-select"
                  style={{ height: 36, borderRadius: 8, fontSize: "0.85rem" }}
                  value={item.setValue || ""}
                  onChange={(e) => onChange(idx, e.target.value)}
                >
                  <option value="">Select</option>
                  {scoreOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="content">
        {/* Custom Header Card with breadcrumb and primary blue add button */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Performance Appraisal</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <span style={{ color: "#64748b" }}>Performance</span>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Performance Appraisal</li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
                onClick={openAdd}
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
                Add Appraisal
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls Bar inside the table card */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search appraisal..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="dropdown">
                <button
                  className="btn btn-outline-export dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  id="exportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                >
                  <i className="ti ti-download" style={{ fontSize: "1rem" }} />
                  Export
                </button>
                <ul className="dropdown-menu shadow border-0" aria-labelledby="exportDropdown">
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportExcel}>
                      Excel
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportCsv}>
                      CSV
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportPdf}>
                      PDF
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive" style={{ overflowX: "auto" }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="thead-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: "50px" }}>#</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Appraisal Date</th>
                    <th>Status</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">No appraisals found</td>
                    </tr>
                  ) : (
                    pagedRows.map((row, idx) => (
                      <tr key={row.id || `${row.employeeId}-${row.appraisalDate}`}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelection(row.id)}
                          />
                        </td>
                        <td>{pageOffset + idx + 1}</td>
                        <td className="fw-semibold text-dark">{row.employeeName || "-"}</td>
                        <td>{row.designation || "-"}</td>
                        <td>{row.department || "-"}</td>
                        <td>{row.appraisalDate || "-"}</td>
                        <td>
                          {String(row.status || "Active").toLowerCase() === "inactive" ? (
                            <span className="badge bg-danger">Inactive</span>
                          ) : (
                            <span className="badge bg-success">Active</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-light btn-sm btn-icon"
                            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeActionsRow?.id === row.id) {
                                setActiveActionsRow(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActionsMenuPos({
                                  top: rect.top + window.scrollY,
                                  left: rect.right + window.scrollX,
                                });
                                setActiveActionsRow(row);
                              }
                            }}
                          >
                            <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Pagination Footer */}
          <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top">
            <span className="entries-info text-muted small">
              {totalRows === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${pageOffset + 1} to ${Math.min(pageOffset + pageSize, totalRows)} of ${totalRows} entries`}
            </span>

            <div className="pagination-numbers-container d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: 6 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage <= 1}
              >
                <i className="ti ti-chevron-left" />
              </button>

              {Array.from({ length: pageCount }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === pageNum ? "active" : "btn-light"}`}
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: 6 }}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={clampedPage >= pageCount}
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>

            <PageSizeSelector pageSize={pageSize} setPageSize={setPageSize} setPage={setPage} />
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" style={{ maxWidth: 850 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Add Appraisal</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">x</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="avm-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Employee</label>
                      <select
                        className="avm-select"
                        value={form.employeeId}
                        onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {employeeOptions.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Appraisal Date</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={form.appraisalDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, appraisalDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="col-md-12"><div className="mt-3 mb-2"><h5 className="fw-bold text-dark">Technical Competencies</h5></div></div>
                  <div className="col-md-12">
                    {renderCompetencyTable(form.technicalCompetencies, (idx, value) =>
                      updateCompetency(setForm, "technicalCompetencies", idx, value),
                    )}
                  </div>

                  <div className="col-md-12"><div className="mt-3 mb-2"><h5 className="fw-bold text-dark">Organizational Competencies</h5></div></div>
                  <div className="col-md-12">
                    {renderCompetencyTable(form.organizationalCompetencies, (idx, value) =>
                      updateCompetency(setForm, "organizationalCompetencies", idx, value),
                    )}
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Status</label>
                      <select
                        className="avm-select"
                        value={form.status}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div></div>
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowAddModal(false)} disabled={saving}>Cancel</button>
                  <button type="submit" className="avm-btn primary" disabled={saving}>{saving ? "Adding..." : "Add Appraisal"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" style={{ maxWidth: 850 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Edit Appraisal</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowEditModal(false)} aria-label="Close">x</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="avm-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Employee</label>
                      <select
                        className="avm-select"
                        value={editForm.employeeId}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {employeeOptions.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Appraisal Date</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={editForm.appraisalDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, appraisalDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="col-md-12"><div className="mt-3 mb-2"><h5 className="fw-bold text-dark">Technical Competencies</h5></div></div>
                  <div className="col-md-12">
                    {renderCompetencyTable(editForm.technicalCompetencies, (idx, value) =>
                      updateCompetency(setEditForm, "technicalCompetencies", idx, value),
                    )}
                  </div>

                  <div className="col-md-12"><div className="mt-3 mb-2"><h5 className="fw-bold text-dark">Organizational Competencies</h5></div></div>
                  <div className="col-md-12">
                    {renderCompetencyTable(editForm.organizationalCompetencies, (idx, value) =>
                      updateCompetency(setEditForm, "organizationalCompetencies", idx, value),
                    )}
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Status</label>
                      <select
                        className="avm-select"
                        value={editForm.status}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div></div>
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowEditModal(false)} disabled={saving}>Cancel</button>
                  <button type="submit" className="avm-btn primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Confirm Delete</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowDeleteModal(false)} aria-label="Close">x</button>
            </div>
            <div className="avm-body">
              <p>
                Are you sure you want to delete
                {deleteTarget?.employeeName ? ` "${deleteTarget.employeeName}"` : " this appraisal"}
                ?
              </p>
            </div>
            <div className="avm-footer">
              <div></div>
              <div className="avm-footer-right">
                <button type="button" className="avm-btn light" onClick={() => setShowDeleteModal(false)} disabled={saving}>Cancel</button>
                <button type="button" className="avm-btn danger" onClick={handleDelete} disabled={saving}>{saving ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      )}



      {activeActionsRow && createPortal(
        <div
          className="floating-actions-menu shadow-lg border"
          style={{
            position: "absolute",
            top: actionsMenuPos.top,
            left: actionsMenuPos.left,
            transform: "translate(-100%, -100%) translateY(-5px)",
            zIndex: 9999,
            background: "#fff",
            borderRadius: 8,
            padding: "6px 0",
            minWidth: 150
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              openEdit(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit
          </button>
          <button
            type="button"
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              confirmDelete(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete
          </button>
        </div>,
        document.body
      )}

      {/* Floating Bulk Operations Bar */}
      {selectedIds.size > 0 && (
        <div
          className="position-fixed start-50 translate-middle-x d-flex align-items-center justify-content-between gap-3 shadow-lg px-4 py-3 bg-dark text-white"
          style={{
            bottom: 24,
            borderRadius: 16,
            zIndex: 1040,
            minWidth: 400,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary text-white" style={{ fontSize: "0.9rem", padding: "6px 10px" }}>
              {selectedIds.size}
            </span>
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>appraisals selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "#dc2626", color: "#ffffff", border: "none" }}
              onClick={handleBulkDelete}
              disabled={saving}
            >
              <i className="ti ti-trash" /> Delete
            </button>
            <button
              className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
              style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)" }}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}
