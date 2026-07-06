import { useEffect, useMemo, useState } from "react";
import {
  createProjectStatus,
  deleteProjectStatus,
  getProjectStatuses,
  updateProjectStatus,
} from "../../api/projectStatusApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";

function formatCreatedAt(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function ProjectStatusPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState(null);
  const [formValue, setFormValue] = useState("");
  const [saving, setSaving] = useState(false);
  const canManageProjectStatus = true;

  // Search & Pagination states
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadProjectStatuses = async () => {
    setLoading(true);
    try {
      const data = await getProjectStatuses();
      setRows(data);
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to load project status list"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectStatuses();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchText]);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => new Date(b?.createdDate || 0).getTime() - new Date(a?.createdDate || 0).getTime()),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return orderedRows;
    return orderedRows.filter((r) => {
      const status = String(r.projectStatus || "").toLowerCase();
      const statusId = String(r.statusId || "").toLowerCase();
      return status.includes(term) || statusId.includes(term);
    });
  }, [orderedRows, searchText]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleCreateOpen = () => {
    setFormValue("");
    setEditingRow(null);
    setShowCreateModal(true);
  };

  const handleEditOpen = (row) => {
    setEditingRow(row);
    setFormValue(row?.projectStatus || "");
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    const value = String(formValue || "").trim();
    if (!value) {
      showError("Project Status is required");
      return;
    }
    setSaving(true);
    try {
      if (editingRow?.id) {
        await updateProjectStatus(editingRow.id, value);
        showSuccess("Project Status updated successfully");
      } else {
        await createProjectStatus(value);
        showSuccess("Project Status created successfully");
      }
      setShowCreateModal(false);
      setEditingRow(null);
      setFormValue("");
      await loadProjectStatuses();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to save project status"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteRow?.id) return;
    setSaving(true);
    try {
      await deleteProjectStatus(pendingDeleteRow.id);
      showSuccess("Project Status deleted successfully");
      setPendingDeleteRow(null);
      await loadProjectStatuses();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to delete project status"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid content">
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Project Status</h2>
            <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Configure and manage status settings for all system projects.
            </p>
          </div>
          {canManageProjectStatus && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              onClick={handleCreateOpen}
            >
              <i className="ti ti-plus" />
              Create Project Status
            </button>
          )}
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
                placeholder="Search project status..."
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
                  <th className="text-muted" style={{ width: 100, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Project Status</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Created Date</th>
                  {canManageProjectStatus && (
                    <th className="text-muted" style={{ width: 200, fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={canManageProjectStatus ? 4 : 3} className="text-center py-4 text-muted">Loading...</td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={canManageProjectStatus ? 4 : 3} className="text-center py-4 text-muted">No records found</td>
                  </tr>
                ) : (
                  pagedRows.map((row, i) => (
                    <tr key={row.id}>
                      <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{(page - 1) * pageSize + i + 1}</td>
                      <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{row.projectStatus || "-"}</td>
                      <td style={{ color: "#475569", fontSize: "0.9rem" }}>{formatCreatedAt(row.createdDate)}</td>
                      {canManageProjectStatus && (
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              style={{ borderRadius: 8, fontWeight: "600" }}
                              onClick={() => handleEditOpen(row)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              style={{ borderRadius: 8, fontWeight: "600" }}
                              onClick={() => setPendingDeleteRow(row)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
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

      {showCreateModal && canManageProjectStatus && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1060 }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>
                    {editingRow ? "Edit Project Status" : "Create Project Status"}
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                  />
                </div>
                <div className="modal-body p-4">
                  <label className="form-label small fw-semibold text-muted">Project Status</label>
                  <input
                    className="form-control"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="Project Status"
                    style={{ borderRadius: 8, padding: "10px 14px" }}
                  />
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button
                    className="btn btn-light"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => setShowCreateModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingRow ? "Update Project Status" : "Create Project Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        </>
      )}

      {pendingDeleteRow && canManageProjectStatus && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1060 }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>Delete Project Status</h5>
                  <button
                    className="btn-close"
                    onClick={() => setPendingDeleteRow(null)}
                  />
                </div>
                <div className="modal-body p-4 text-center">
                  <i className="ti ti-alert-triangle text-danger mb-3" style={{ fontSize: "2rem" }}></i>
                  <p className="mb-0">
                    Are you sure you want to delete <strong>{pendingDeleteRow?.projectStatus || ""}</strong>?
                  </p>
                </div>
                <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-center">
                  <button
                    className="btn btn-light px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => setPendingDeleteRow(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={handleConfirmDelete}
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

export default ProjectStatusPage;
