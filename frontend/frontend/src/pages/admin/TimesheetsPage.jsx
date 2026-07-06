import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getEmployees } from "../../api/employeesApi";
import {
  createTimesheet,
  deleteTimesheet,
  getTimesheets,
  updateTimesheet,
} from "../../api/timesheetsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";
import "../../../public/assets/css/addModalShared.css";

const initialForm = {
  employeeId: "",
  projectName: "",
  deadline: "",
  totalHours: "",
  remainingHours: "",
  workDate: "",
  workedHours: "",
};

export default function TimesheetsPage() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Selection, search and pagination states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTimesheets();
      setRows(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load timesheets"));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (e) {
      setEmployees([]);
      showError(extractApiErrorMessage(e, "Failed to load employees"));
    }
  };

  useEffect(() => {
    load();
    loadEmployees();
  }, []);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => String(b.workDate || "").localeCompare(String(a.workDate || ""))),
    [rows],
  );

  const employeeOptions = useMemo(
    () =>
      (employees || [])
        .map((e) => ({
          id: e?.id,
          name: e?.name || e?.employeeName || e?.fullName || "",
          dept: e?.dept || e?.department || "",
        }))
        .filter((e) => e.id != null && e.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [employees],
  );

  const resolveEmployee = (row) => {
    if (row?.employeeName) return { name: row.employeeName, dept: row.employeeDept || row.employeeDesignation || "" };
    const match = employeeOptions.find((e) => e.id === row?.employeeId);
    return match || { name: "-", dept: "" };
  };

  // Search & Filter
  const filteredRows = orderedRows.filter((r) => {
    const emp = resolveEmployee(r);
    const empName = (emp.name || "").toLowerCase();
    const dept = (emp.dept || "").toLowerCase();
    const project = (r.projectName || "").toLowerCase();
    const date = (r.workDate || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return empName.includes(q) || dept.includes(q) || project.includes(q) || date.includes(q);
  });

  const totalRows = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = filteredRows.slice(pageOffset, pageOffset + pageSize);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(pagedRows.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const headers = ["Employee", "Department", "Date", "Project", "Assigned Hours", "Worked Hours"];
    const escapeXml = (unsafe) => String(unsafe ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows.map(r => {
      const emp = resolveEmployee(r);
      return `
        <tr>
          <td>${escapeXml(emp.name)}</td>
          <td>${escapeXml(emp.dept)}</td>
          <td>${escapeXml(r.workDate)}</td>
          <td>${escapeXml(r.projectName)}</td>
          <td>${escapeXml(r.totalHours ?? '')}</td>
          <td>${escapeXml(r.workedHours ?? '')}</td>
        </tr>
      `;
    }).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheets-${Date.now()}.xls`;
    link.click();
  };

  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const headers = ["Employee", "Department", "Date", "Project", "Assigned Hours", "Worked Hours"];
    const csvContent = [
      headers.join(","),
      ...targetRows.map(r => {
        const emp = resolveEmployee(r);
        return [
          `"${(emp.name || '').replace(/"/g, '""')}"`,
          `"${(emp.dept || '').replace(/"/g, '""')}"`,
          `"${(r.workDate || '')}"`,
          `"${(r.projectName || '').replace(/"/g, '""')}"`,
          `"${r.totalHours ?? ''}"`,
          `"${r.workedHours ?? ''}"`
        ].join(",");
      })
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheets-${Date.now()}.csv`;
    link.click();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Timesheet Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const headers = [["Employee", "Department", "Date", "Project", "Assigned Hrs", "Worked Hrs"]];
    const body = targetRows.map(r => {
      const emp = resolveEmployee(r);
      return [
        emp.name,
        emp.dept,
        r.workDate || '',
        r.projectName || '',
        String(r.totalHours ?? ''),
        String(r.workedHours ?? '')
      ];
    });
    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 40, right: 40 }
    });
    doc.save(`timesheets-${Date.now()}.pdf`);
  };

  const openAdd = () => {
    setForm(initialForm);
    setShowAddModal(true);
  };

  const openEdit = (row) => {
    setEditForm({
      employeeId: row?.employeeId ? String(row.employeeId) : "",
      projectName: row?.projectName || "",
      deadline: row?.deadline ? String(row.deadline).slice(0, 10) : "",
      totalHours: row?.totalHours != null ? String(row.totalHours) : "",
      remainingHours: row?.remainingHours != null ? String(row.remainingHours) : "",
      workDate: row?.workDate ? String(row.workDate).slice(0, 10) : "",
      workedHours: row?.workedHours != null ? String(row.workedHours) : "",
    });
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row || null);
    setSelectedId(row?.id || null);
    setShowDeleteModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.projectName || !form.workDate) {
      showError("Employee, project and date are required");
      return;
    }
    setSaving(true);
    try {
      await createTimesheet({
        employeeId: Number(form.employeeId),
        projectName: form.projectName.trim(),
        deadline: form.deadline || null,
        totalHours: form.totalHours ? Number(form.totalHours) : null,
        remainingHours: form.remainingHours ? Number(form.remainingHours) : null,
        workDate: form.workDate || null,
        workedHours: form.workedHours ? Number(form.workedHours) : null,
      });
      setForm(initialForm);
      showSuccess("Timesheet added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add timesheet"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.employeeId || !editForm.projectName || !editForm.workDate) {
      showError("Employee, project and date are required");
      return;
    }
    setSaving(true);
    try {
      await updateTimesheet(selectedId, {
        employeeId: Number(editForm.employeeId),
        projectName: editForm.projectName.trim(),
        deadline: editForm.deadline || null,
        totalHours: editForm.totalHours ? Number(editForm.totalHours) : null,
        remainingHours: editForm.remainingHours ? Number(editForm.remainingHours) : null,
        workDate: editForm.workDate || null,
        workedHours: editForm.workedHours ? Number(editForm.workedHours) : null,
      });
      showSuccess("Timesheet updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update timesheet"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deleteTimesheet(selectedId);
      showSuccess("Timesheet deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete timesheet"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="content">
        {/* White top header card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Timesheets</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Employee</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Timesheets</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-primary create-lead-btn d-flex align-items-center gap-2" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }} onClick={openAdd}>
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>Add Today&#39;s Work
              </button>
            </div>
          </div>
        </div>

        {/* Timesheet card */}
        <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12, overflow: "hidden" }}>
          {/* Table Controls Bar */}
          <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 350 }}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "8px 0 0 8px" }}><i className="ti ti-search text-muted" /></span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  style={{ borderRadius: "0 8px 8px 0", height: 38 }}
                  placeholder="Search timesheets..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <button
                  className="btn btn-white border d-flex align-items-center gap-2 dropdown-toggle"
                  type="button"
                  id="timesheetsExportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
                >
                  <i className="ti ti-download" /> Export
                </button>
                <ul className="dropdown-menu shadow border-0" aria-labelledby="timesheetsExportDropdown">
                  <li><button className="dropdown-item" onClick={exportExcel}>Excel</button></li>
                  <li><button className="dropdown-item" onClick={exportCsv}>CSV</button></li>
                  <li><button className="dropdown-item" onClick={exportPdf}>PDF</button></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={pagedRows.length > 0 && pagedRows.every(r => selectedIds.has(r.id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Assigned Hours</th>
                  <th>Worked Hours</th>
                  <th style={{ width: 80 }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
                ) : pagedRows.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-4 text-muted">No timesheets found</td></tr>
                ) : (
                  pagedRows.map((row) => {
                    const emp = resolveEmployee(row);
                    return (
                      <tr key={row.id || `${row.employeeId || "emp"}-${row.workDate || "date"}`}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(row.id)}
                            onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                          />
                        </td>
                        <td>
                          <div>
                            <h6 className="fw-semibold text-slate-800 mb-0">{emp.name || "-"}</h6>
                            <small className="text-muted">{emp.dept || ""}</small>
                          </div>
                        </td>
                        <td>{row.workDate || "-"}</td>
                        <td className="fw-semibold text-slate-800">{row.projectName || "-"}</td>
                        <td>{row.totalHours ?? "-"}</td>
                        <td>{row.workedHours ?? "-"}</td>
                        <td className="text-end">
                          <div className="dropdown">
                            <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="ti ti-dots-vertical" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                              <li>
                                <button className="dropdown-item" onClick={() => openEdit(row)}>
                                  Edit
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-danger" onClick={() => confirmDelete(row)}>
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Custom Pagination Footer */}
          {!loading && rows.length > 0 && (
            <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
              <div className="text-muted small">
                Showing {totalRows > 0 ? pageOffset + 1 : 0} to {Math.min(pageOffset + pageSize, totalRows)} of {totalRows} entries
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={clampedPage === 1}
                >
                  <i className="ti ti-chevron-left" />
                </button>
                {(() => {
                  const buttons = [];
                  for (let i = 1; i <= pageCount; i++) {
                    if (i === 1 || i === pageCount || (i >= clampedPage - 2 && i <= clampedPage + 2)) {
                      buttons.push(
                        <button
                          key={i}
                          className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === i ? 'btn-primary text-white' : 'btn-light'}`}
                          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === i ? "#3b82f6" : undefined }}
                          onClick={() => setPage(i)}
                        >
                          {i}
                        </button>
                      );
                    } else if (i === clampedPage - 3 || i === clampedPage + 3) {
                      buttons.push(<span key={`dots-${i}`} className="px-1 text-muted">...</span>);
                    }
                  }
                  return buttons;
                })()}
                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  disabled={clampedPage === pageCount}
                >
                  <i className="ti ti-chevron-right" />
                </button>
                <PageSizeSelector
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  setPage={setPage}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Dark Bottom Actions Bar */}
      {selectedIds.size > 0 && createPortal(
        <div className="floating-bulk-bar" style={{
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
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
        }}>
          <span className="small">{selectedIds.size} row(s) selected</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedIds(new Set())}>Clear</button>
          <button className="btn btn-sm btn-primary" onClick={exportPdf}>Export Selected PDF</button>
        </div>,
        document.body
      )}

      {showAddModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Add Todays Work</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Employee <span className="text-danger">*</span></label>
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
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Project <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="avm-input"
                        value={form.projectName}
                        onChange={(e) => setForm((prev) => ({ ...prev, projectName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Deadline</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={form.deadline}
                        onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Total Hours</label>
                      <input
                        type="number"
                        className="avm-input"
                        value={form.totalHours}
                        onChange={(e) => setForm((prev) => ({ ...prev, totalHours: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Remaining Hours</label>
                      <input
                        type="number"
                        className="avm-input"
                        value={form.remainingHours}
                        onChange={(e) => setForm((prev) => ({ ...prev, remainingHours: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="avm-input"
                        value={form.workDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, workDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Hours</label>
                      <input
                        type="number"
                        className="avm-input"
                        value={form.workedHours}
                        onChange={(e) => setForm((prev) => ({ ...prev, workedHours: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div></div>
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowAddModal(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn primary" disabled={saving}>
                    {saving ? "Adding..." : "Add Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Edit Todays Work</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowEditModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Employee <span className="text-danger">*</span></label>
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
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Project <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="avm-input"
                        value={editForm.projectName}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, projectName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Deadline</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={editForm.deadline}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, deadline: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Total Hours</label>
                      <input
                        type="number"
                        className="avm-input"
                        value={editForm.totalHours}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, totalHours: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Remaining Hours</label>
                      <input
                        type="number"
                        className="avm-input"
                        value={editForm.remainingHours}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, remainingHours: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="avm-input"
                        value={editForm.workDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, workDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Hours</label>
                      <input
                        type="number"
                        className="avm-input"
                        value={editForm.workedHours}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, workedHours: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div></div>
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowEditModal(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
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
              <button type="button" className="avm-modal-close" onClick={() => setShowDeleteModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <div className="avm-body text-center">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36"></i>
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3">You want to delete this timesheet, this cant be undone once you delete.</p>
            </div>
            <div className="avm-footer">
              <div></div>
              <div className="avm-footer-right">
                <button type="button" className="avm-btn light" onClick={() => setShowDeleteModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="avm-btn danger" onClick={handleDelete} disabled={saving}>
                  {saving ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
