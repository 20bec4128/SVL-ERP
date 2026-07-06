import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getDepartmentsMaster } from "../../api/departmentsApi";
import { createPolicy, deletePolicy, getPolicies, updatePolicy } from "../../api/policiesApi";
import api from "../../utils/api";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

const initialForm = {
  name: "",
  description: "",
  departmentId: "",
};

export default function PolicyPage() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRow, setViewRow] = useState(null);
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
      const data = await getPolicies();
      setRows(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load policies"));
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    setMetaLoading(true);
    try {
      const deps = await getDepartmentsMaster();
      setDepartments(Array.isArray(deps) ? deps : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load departments"));
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadMeta();
  }, []);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [rows],
  );

  const departmentOptions = useMemo(() => {
    return (departments || [])
      .map((d) => ({ id: d?.id, name: d?.name }))
      .filter((d) => d.id != null && d.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [departments]);

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "-";
    }
  };

  // Search & Filter
  const filteredRows = orderedRows.filter((r) => {
    const name = (r.name || "").toLowerCase();
    const dept = (r.departmentName || "").toLowerCase();
    const desc = (r.description || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || dept.includes(q) || desc.includes(q);
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
    const headers = ["Name", "Department", "Description", "Created Date"];
    const escapeXml = (unsafe) => String(unsafe ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows.map(r => `
      <tr>
        <td>${escapeXml(r.name)}</td>
        <td>${escapeXml(r.departmentName)}</td>
        <td>${escapeXml(r.description || '')}</td>
        <td>${escapeXml(formatDate(r.createdAt))}</td>
      </tr>
    `).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `policies-${Date.now()}.xls`;
    link.click();
  };

  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const headers = ["Name", "Department", "Description", "Created Date"];
    const csvContent = [
      headers.join(","),
      ...targetRows.map(r => [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.departmentName || '').replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${formatDate(r.createdAt)}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `policies-${Date.now()}.csv`;
    link.click();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Policies Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const headers = [["Name", "Department", "Description", "Created Date"]];
    const body = targetRows.map(r => [
      r.name || '',
      r.departmentName || '',
      r.description || '',
      formatDate(r.createdAt)
    ]);
    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 40, right: 40 }
    });
    doc.save(`policies-${Date.now()}.pdf`);
  };

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError("Policy name is required");
      return;
    }
    if (!form.departmentId) {
      showError("Department is required");
      return;
    }
    setSaving(true);
    try {
      await createPolicy(
        {
          name: form.name.trim(),
          description: form.description?.trim() || "",
          departmentId: Number(form.departmentId),
        },
        file,
      );
      setForm(initialForm);
      setFile(null);
      showSuccess("Policy added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add policy"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditForm({
      name: row?.name || "",
      description: row?.description || "",
      departmentId: row?.departmentId ? String(row.departmentId) : "",
    });
    setEditFile(null);
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const openView = (row) => {
    setViewRow(row || null);
    setShowViewModal(true);
  };

  const handleViewFile = async () => {
    if (!viewRow?.id) return;
    try {
      const response = await api.get(`/api/policies/${viewRow.id}/file`, {
        responseType: "blob",
      });
      const blob = response?.data;
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to open file"));
    }
  };

  const handleEditPolicy = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.name.trim()) {
      showError("Policy name is required");
      return;
    }
    if (!editForm.departmentId) {
      showError("Department is required");
      return;
    }
    setSaving(true);
    try {
      await updatePolicy(
        selectedId,
        {
          name: editForm.name.trim(),
          description: editForm.description?.trim() || "",
          departmentId: Number(editForm.departmentId),
        },
        editFile,
      );
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

  const confirmDelete = (row) => {
    setDeleteTarget(row || null);
    setSelectedId(row?.id || null);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deletePolicy(selectedId);
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

  return (
    <>
      <div className="content">
        {/* White top header card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Policies</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">HR</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Policies</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ borderRadius: 8 }}
                onClick={() => {
                  setForm(initialForm);
                  setFile(null);
                  setShowAddModal(true);
                }}
              >
                <i className="ti ti-circle-plus"></i>Add Policy
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
                  <th>Name</th>
                  <th>Department</th>
                  <th>Description</th>
                  <th>Created Date</th>
                  <th style={{ width: 80 }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
                ) : pagedRows.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">No policies found</td></tr>
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
                      <td>{row.departmentName || "-"}</td>
                      <td>{row.description || "-"}</td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td className="text-end">
                        <div className="dropdown">
                          <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="ti ti-dots-vertical" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                            <li>
                              <button className="dropdown-item" onClick={() => openView(row)}>
                                View Details
                              </button>
                            </li>
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
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h4 className="modal-title fw-bold">Add Policy</h4>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <form onSubmit={handleAddPolicy}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Policy Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={form.description}
                          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Department</label>
                        <select
                          className="form-select"
                          value={form.departmentId}
                          onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                          disabled={metaLoading}
                        >
                          <option value="">Select</option>
                          {departmentOptions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Upload Policy</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Adding..." : "Add Policy"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showEditModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h4 className="modal-title fw-bold">Edit Policy</h4>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <form onSubmit={handleEditPolicy}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Policy Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editForm.name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Department</label>
                        <select
                          className="form-select"
                          value={editForm.departmentId}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                          disabled={metaLoading}
                        >
                          <option value="">Select</option>
                          {departmentOptions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Upload Policy</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                        />
                        <small className="text-muted">Leave blank to keep existing file.</small>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showDeleteModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h4 className="modal-title fw-bold text-danger">Confirm Delete</h4>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete
                    {deleteTarget?.name ? ` "${deleteTarget.name}"` : " this policy"}
                    ?
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showViewModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h4 className="modal-title fw-bold">Policy Details</h4>
                  <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Policy Name</label>
                      <div className="form-control bg-light">{viewRow?.name || "-"}</div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Department</label>
                      <div className="form-control bg-light">{viewRow?.departmentName || "-"}</div>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <div className="form-control bg-light" style={{ minHeight: 90 }}>
                        {viewRow?.description || "-"}
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Created Date</label>
                      <div className="form-control bg-light">{formatDate(viewRow?.createdAt)}</div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">File</label>
                      <div className="form-control bg-light d-flex align-items-center justify-content-between">
                        <span>{viewRow?.fileName || "No file"}</span>
                        {viewRow?.id ? (
                          <button type="button" className="btn btn-sm btn-light" onClick={handleViewFile}>
                            View File
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">File Type</label>
                      <div className="form-control bg-light">{viewRow?.fileType || "-"}</div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">File Size</label>
                      <div className="form-control bg-light">
                        {viewRow?.fileSize ? `${viewRow.fileSize} bytes` : "-"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowViewModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  );
}
