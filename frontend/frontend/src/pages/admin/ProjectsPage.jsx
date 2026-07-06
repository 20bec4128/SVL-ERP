import { useEffect, useMemo, useState } from "react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../api/projectApi";
import { getProjectStatuses } from "../../api/projectStatusApi";
import { getProjectTypes } from "../../api/projectTypeApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "",
  type: "",
};

const PROJECT_STATUS_OPTIONS = [
  "Planning",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

const PROJECT_TYPE_OPTIONS = [
  "Internal",
  "Client",
  "Research",
  "Maintenance",
  "Other",
];

export default function ProjectsPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [projectStatusOptions, setProjectStatusOptions] = useState(PROJECT_STATUS_OPTIONS);
  const [projectTypeOptions, setProjectTypeOptions] = useState(PROJECT_TYPE_OPTIONS);

  // Search & Pagination states
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to load projects"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchText]);

  useEffect(() => {
    let active = true;
    const loadMetaOptions = async () => {
      try {
        const [statuses, types] = await Promise.all([
          getProjectStatuses(),
          getProjectTypes(),
        ]);
        if (!active) return;
        const statusValues = Array.from(
          new Set(
            (Array.isArray(statuses) ? statuses : [])
              .map((row) => row?.projectStatus || row?.status || row?.name || "")
              .map((val) => String(val).trim())
              .filter(Boolean),
          ),
        );
        const typeValues = Array.from(
          new Set(
            (Array.isArray(types) ? types : [])
              .map((row) => row?.projectType || row?.type || row?.name || "")
              .map((val) => String(val).trim())
              .filter(Boolean),
          ),
        );
        setProjectStatusOptions(statusValues.length ? statusValues : PROJECT_STATUS_OPTIONS);
        setProjectTypeOptions(typeValues.length ? typeValues : PROJECT_TYPE_OPTIONS);
      } catch {
        if (active) {
          setProjectStatusOptions(PROJECT_STATUS_OPTIONS);
          setProjectTypeOptions(PROJECT_TYPE_OPTIONS);
        }
      }
    };
    loadMetaOptions();
    return () => {
      active = false;
    };
  }, []);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (b?.id || 0) - (a?.id || 0)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return sortedRows;
    return sortedRows.filter((r) => {
      const name = String(r.name || r.projectName || "").toLowerCase();
      const type = String(r.type || r.projectType || "").toLowerCase();
      const status = String(r.status || r.projectStatus || "").toLowerCase();
      const desc = String(r.description || "").toLowerCase();
      return name.includes(term) || type.includes(term) || status.includes(term) || desc.includes(term);
    });
  }, [sortedRows, searchText]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingRow(null);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditingRow(row);
    setForm({
      name: row?.name || row?.projectName || "",
      description: row?.description || "",
      status: row?.status || row?.projectStatus || "",
      type: row?.type || row?.projectType || "",
    });
    setShowModal(true);
  };

  const saveProject = async () => {
    if (!form.name.trim()) {
      showError("Project name is required");
      return;
    }
    if (!form.type || !form.type.toString().trim()) {
      showError("Project type is required");
      return;
    }
    if (!form.status || !form.status.toString().trim()) {
      showError("Project status is required");
      return;
    }
    const payload = {
      projectName: form.name.trim(),
      projectType: form.type,
      projectStatus: form.status,
      description: form.description.trim() || null,
    };

    setSaving(true);
    try {
      if (editingRow?.id) {
        await updateProject(editingRow.id, payload);
      } else {
        await createProject(payload);
      }
      showSuccess(editingRow ? "Project updated" : "Project created");
      setShowModal(false);
      setEditingRow(null);
      setForm(EMPTY_FORM);
      await loadProjects();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow?.id) return;
    setSaving(true);
    try {
      await deleteProject(deleteRow.id);
      showSuccess("Project deleted");
      setDeleteRow(null);
      await loadProjects();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to delete"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid content">
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Projects</h2>
            <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Configure, assign, and manage execution tracking for system projects.
            </p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            onClick={openCreate}
          >
            <i className="ti ti-plus" />
            Add Project
          </button>
        </div>
      </div>

      <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          {/* Controls Bar */}
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
              <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search projects..."
                style={{ height: 36, fontSize: "0.9rem" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive leads-table-wrap border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
            <table className="table table-hover align-middle leads-table mb-0">
              <thead>
                <tr>
                  <th className="text-muted" style={{ width: 80, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Project Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Type</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Description</th>
                  <th className="text-muted" style={{ width: 200, fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">Loading...</td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">No records found</td>
                  </tr>
                ) : (
                  pagedRows.map((row, i) => (
                    <tr key={row.id || i}>
                      <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{(page - 1) * pageSize + i + 1}</td>
                      <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{row.name || row.projectName || "-"}</td>
                      <td style={{ color: "#475569", fontSize: "0.9rem" }}>
                        <span className="badge bg-light text-dark px-2.5 py-1.5 fs-12 fw-semibold" style={{ border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                          {row.type || row.projectType || "-"}
                        </span>
                      </td>
                      <td>
                        {row.status || row.projectStatus ? (
                          <span className="badge bg-primary px-2.5 py-1.5 fs-12 fw-semibold" style={{ borderRadius: "6px" }}>
                            {row.status || row.projectStatus}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ color: "#64748b", fontSize: "0.9rem" }}>{row.description || "-"}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => openEdit(row)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => setDeleteRow(row)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredRows.length > 0 && (
            <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
              <span className="entries-info text-muted small">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} entries
              </span>

              <div className="pagination-numbers-container d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <i className="ti ti-chevron-left" />
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <i className="ti ti-chevron-right" />
                </button>
              </div>

              <PageSizeSelector
                pageSize={pageSize}
                setPageSize={setPageSize}
                setPage={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal fade show" style={{ display: "block", zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>
                    {editingRow ? "Edit Project" : "Add Project"}
                  </h5>
                  <button className="btn-close" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Project Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Project Name"
                      style={{ borderRadius: 8, padding: "10px 14px" }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Type *</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      style={{ borderRadius: 8, padding: "10px 14px" }}
                    >
                      <option value="">Select project type</option>
                      {projectTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Status *</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                      style={{ borderRadius: 8, padding: "10px 14px" }}
                    >
                      <option value="">Select project status</option>
                      {projectStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-muted">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Description"
                      style={{ borderRadius: 8, padding: "10px 14px" }}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button
                    className="btn btn-light"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                    onClick={saveProject}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingRow ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        </>
      )}

      {deleteRow && (
        <>
          <div className="modal fade show" style={{ display: "block", zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>Delete Project</h5>
                  <button className="btn-close" onClick={() => setDeleteRow(null)} />
                </div>
                <div className="modal-body p-4 text-center">
                  <i className="ti ti-alert-triangle text-danger mb-3" style={{ fontSize: "2rem" }}></i>
                  <p className="mb-0">
                    Are you sure you want to delete project <strong>{deleteRow.name || deleteRow.projectName}</strong>?
                  </p>
                </div>
                <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-center">
                  <button
                    className="btn btn-light px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => setDeleteRow(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={confirmDelete}
                    disabled={saving}
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        </>
      )}
    </div>
  );
}
