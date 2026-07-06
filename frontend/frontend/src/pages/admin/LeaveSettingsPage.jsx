import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getEmployees } from "../../api/employeesApi";
import { createLeavePolicy, deleteLeavePolicy, getLeavePolicies, updateLeavePolicy } from "../../api/leaveSettingsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "../../../public/assets/css/addModalShared.css";
import "./LeadsPage.css";

const initialForm = {
  name: "",
  daysPerYear: "",
  employeeIds: [],
};

export default function LeaveSettingsPage() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Table pagination and selection states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLeavePolicies();
      setRows(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load leave policies"));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    load();
    loadEmployees();
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

  const filteredEmployeeOptions = useMemo(() => {
    const term = String(employeeSearch || "").trim().toLowerCase();
    if (!term) return employeeOptions;
    return employeeOptions.filter((emp) => String(emp.name || "").toLowerCase().includes(term));
  }, [employeeOptions, employeeSearch]);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [rows],
  );

  // Search & Filter
  const filteredRows = orderedRows.filter((r) => {
    const name = (r.name || "").toLowerCase();
    const days = String(r.daysPerYear ?? "").toLowerCase();
    const members = String(Array.isArray(r.employeeIds) ? r.employeeIds.length : 0);
    const q = searchQuery.toLowerCase();
    return name.includes(q) || days.includes(q) || members.includes(q);
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
    const headers = ["Policy Name", "No of Days", "No of Members"];
    const escapeXml = (unsafe) => String(unsafe ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows.map(r => `
      <tr>
        <td>${escapeXml(r.name)}</td>
        <td>${escapeXml(r.daysPerYear)}</td>
        <td>${escapeXml(Array.isArray(r.employeeIds) ? r.employeeIds.length : 0)}</td>
      </tr>
    `).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leave-policies-${Date.now()}.xls`;
    link.click();
  };

  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const headers = ["Policy Name", "No of Days", "No of Members"];
    const csvContent = [
      headers.join(","),
      ...targetRows.map(r => [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${r.daysPerYear ?? 0}"`,
        `"${Array.isArray(r.employeeIds) ? r.employeeIds.length : 0}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leave-policies-${Date.now()}.csv`;
    link.click();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Leave Policies Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const headers = [["Policy Name", "No of Days", "No of Members"]];
    const body = targetRows.map(r => [
      r.name || '',
      String(r.daysPerYear ?? 0),
      String(Array.isArray(r.employeeIds) ? r.employeeIds.length : 0)
    ]);
    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 40, right: 40 }
    });
    doc.save(`leave-policies-${Date.now()}.pdf`);
  };

  const openAdd = () => {
    setForm(initialForm);
    setEmployeeSearch("");
    setShowAddModal(true);
  };

  const openEdit = (row) => {
    setEditForm({
      name: row?.name || "",
      daysPerYear: row?.daysPerYear ?? "",
      employeeIds: Array.isArray(row?.employeeIds) ? row.employeeIds : [],
    });
    setEmployeeSearch("");
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row || null);
    setSelectedId(row?.id || null);
    setShowDeleteModal(true);
  };

  const toggleEmployee = (setFn, currentIds, id) => {
    if (currentIds.includes(id)) {
      setFn(currentIds.filter((v) => v !== id));
    } else {
      setFn([...currentIds, id]);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError("Policy name is required");
      return;
    }
    const days = Number(form.daysPerYear);
    if (!Number.isFinite(days) || days < 0) {
      showError("Days must be a valid number");
      return;
    }
    setSaving(true);
    try {
      await createLeavePolicy({
        name: form.name.trim(),
        daysPerYear: days,
        employeeIds: form.employeeIds,
      });
      setForm(initialForm);
      showSuccess("Policy added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add policy"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.name.trim()) {
      showError("Policy name is required");
      return;
    }
    const days = Number(editForm.daysPerYear);
    if (!Number.isFinite(days) || days < 0) {
      showError("Days must be a valid number");
      return;
    }
    setSaving(true);
    try {
      await updateLeavePolicy(selectedId, {
        name: editForm.name.trim(),
        daysPerYear: days,
        employeeIds: editForm.employeeIds,
      });
      showSuccess("Policy updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update policy"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deleteLeavePolicy(selectedId);
      showSuccess("Policy deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete policy"));
    } finally {
      setSaving(false);
    }
  };

  const renderEmployeeList = (currentIds, setIds) => (
    <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: "auto" }}>
      <input
        type="text"
        className="form-control form-control-sm mb-2"
        placeholder="Search employee..."
        value={employeeSearch}
        onChange={(e) => setEmployeeSearch(e.target.value)}
      />
      {filteredEmployeeOptions.length === 0 ? (
        <div className="text-muted">No employees</div>
      ) : (
        filteredEmployeeOptions.map((emp) => {
          const id = Number(emp.id);
          const checked = currentIds.includes(id);
          return (
            <div className="form-check" key={id}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`emp-${id}-${setIds === setEditForm ? "edit" : "add"}`}
                checked={checked}
                onChange={() =>
                  toggleEmployee(
                    (next) =>
                      setIds((prev) => ({
                        ...prev,
                        employeeIds: next,
                      })),
                    currentIds,
                    id,
                  )
                }
              />
              <label className="form-check-label" htmlFor={`emp-${id}-${setIds === setEditForm ? "edit" : "add"}`}>
                {emp.name}
              </label>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <div className="content">
        {/* White top header card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Leave Policy</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Employee</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Leave Policy</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
                onClick={openAdd}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>Add Policy
              </button>
            </div>
          </div>
        </div>

        {/* Policies table card */}
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
                  placeholder="Search policies..."
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
                  id="policiesExportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
                >
                  <i className="ti ti-download" /> Export
                </button>
                <ul className="dropdown-menu shadow border-0" aria-labelledby="policiesExportDropdown">
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
                  <th>Policy Name</th>
                  <th>No of Days</th>
                  <th>No of Members</th>
                  <th style={{ width: 80 }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
                ) : pagedRows.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No policies found</td></tr>
                ) : (
                  pagedRows.map((row) => (
                    <tr key={row.id || row.name}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedIds.has(row.id)}
                          onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <h6 className="fw-semibold text-slate-800 mb-0">{row.name || "-"}</h6>
                      </td>
                      <td>{row.daysPerYear ?? "-"}</td>
                      <td>{Array.isArray(row.employeeIds) ? row.employeeIds.length : 0}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Custom Pagination Footer */}
          {!loading && filteredRows.length > 0 && (
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
              <h2 className="avm-modal-title">Add Policy</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Policy Name</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">No of Days</label>
                      <input
                        type="number"
                        min="0"
                        className="avm-input"
                        value={form.daysPerYear}
                        onChange={(e) => setForm((prev) => ({ ...prev, daysPerYear: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Members</label>
                      {renderEmployeeList(form.employeeIds, setForm)}
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
                    {saving ? "Adding..." : "Add Policy"}
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
              <h2 className="avm-modal-title">Edit Policy</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowEditModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Policy Name</label>
                      <input
                        type="text"
                        className="avm-input"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">No of Days</label>
                      <input
                        type="number"
                        min="0"
                        className="avm-input"
                        value={editForm.daysPerYear}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, daysPerYear: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Members</label>
                      {renderEmployeeList(editForm.employeeIds, setEditForm)}
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
            <div className="avm-body">
              <p>
                Are you sure you want to delete
                {deleteTarget?.name ? ` "${deleteTarget.name}"` : " this policy"}
                ?
              </p>
            </div>
            <div className="avm-footer">
              <div></div>
              <div className="avm-footer-right">
                <button type="button" className="avm-btn light" onClick={() => setShowDeleteModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="avm-btn danger" onClick={handleDelete} disabled={saving}>
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
