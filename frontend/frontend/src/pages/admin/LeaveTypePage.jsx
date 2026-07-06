import { useEffect, useMemo, useState } from "react";
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "../../api/leaveSettingsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";

const INITIAL_FORM = { name: "", daysPerYear: "", enabled: true };

export default function LeaveTypePage() {
  const { showSuccess, showError } = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search & Pagination
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState(INITIAL_FORM);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState(null);

  /* ─── Data fetch ──────────────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    try {
      const data = await getLeaveTypes();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load leave types"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Reset page on search change
  useEffect(() => {
    setPage(1);
  }, [searchText]);

  /* ─── Derived data ────────────────────────────────────────────────────── */
  const ordered = useMemo(
    () => [...rows].sort((a, b) => (b.id || 0) - (a.id || 0)),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return ordered;
    return ordered.filter((r) =>
      (r.name || "").toLowerCase().includes(term)
    );
  }, [ordered, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = filtered.slice(pageOffset, pageOffset + pageSize);

  /* ─── Add ─────────────────────────────────────────────────────────────── */
  const openAdd = () => {
    setAddForm(INITIAL_FORM);
    setShowAddModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      showError("Leave type name is required");
      return;
    }
    const days = parseInt(addForm.daysPerYear, 10);
    if (isNaN(days) || days < 0) {
      showError("Please enter a valid number of days");
      return;
    }
    setSaving(true);
    try {
      await createLeaveType({
        name: addForm.name.trim(),
        daysPerYear: days,
        enabled: true,
      });
      showSuccess("Leave type created");
      setShowAddModal(false);
      await load();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to create leave type"));
    } finally {
      setSaving(false);
    }
  };

  /* ─── Edit ────────────────────────────────────────────────────────────── */
  const openEdit = (row) => {
    setEditId(row.id);
    setEditForm({
      name: row.name || "",
      daysPerYear: String(row.daysPerYear ?? ""),
      enabled: row.enabled !== false,
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editId) return;
    if (!editForm.name.trim()) {
      showError("Leave type name is required");
      return;
    }
    const days = parseInt(editForm.daysPerYear, 10);
    if (isNaN(days) || days < 0) {
      showError("Please enter a valid number of days");
      return;
    }
    setSaving(true);
    try {
      await updateLeaveType(editId, {
        name: editForm.name.trim(),
        daysPerYear: days,
        enabled: editForm.enabled,
      });
      showSuccess("Leave type updated");
      setShowEditModal(false);
      setEditId(null);
      await load();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to update leave type"));
    } finally {
      setSaving(false);
    }
  };

  /* ─── Delete ──────────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteLeaveType(deleteTarget.id);
      showSuccess("Leave type deleted");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to delete leave type"));
    } finally {
      setSaving(false);
    }
  };

  /* ─── Pagination helper ───────────────────────────────────────────────── */
  const renderPageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, clampedPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (maxVisible - 1 > endPage - startPage)
      startPage = Math.max(1, endPage - maxVisible + 1);

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === 1 ? "btn-primary text-white" : "btn-light"}`}
          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === 1 ? "#3b82f6" : undefined }}
          onClick={() => setPage(1)}
        >1</button>
      );
      if (startPage > 2)
        buttons.push(<span key="dots-start" className="pagination-dots px-1 text-muted">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === i ? "btn-primary text-white" : "btn-light"}`}
          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === i ? "#3b82f6" : undefined }}
          onClick={() => setPage(i)}
        >{i}</button>
      );
    }

    if (totalPages > endPage) {
      if (totalPages - 1 > endPage)
        buttons.push(<span key="dots-end" className="pagination-dots px-1 text-muted">...</span>);
      buttons.push(
        <button
          key={totalPages}
          className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === totalPages ? "btn-primary text-white" : "btn-light"}`}
          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === totalPages ? "#3b82f6" : undefined }}
          onClick={() => setPage(totalPages)}
        >{totalPages}</button>
      );
    }
    return buttons;
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="container-fluid content">

      {/* ── Header Card ─────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2
              className="leads-header-title mb-1"
              style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}
            >
              Leave Type
            </h2>
            <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Configure and manage Leave Type categories.
            </p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{
              backgroundColor: "#3b82f6",
              borderColor: "#3b82f6",
              fontWeight: "600",
              padding: "10px 20px",
              borderRadius: "10px",
            }}
            onClick={openAdd}
          >
            <i className="ti ti-plus" />
            Add Leave Type
          </button>
        </div>
      </div>

      {/* ── Table Card ──────────────────────────────────────────────────── */}
      <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">

          {/* Controls bar */}
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div
              className="d-flex align-items-center gap-2 p-1 border"
              style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}
            >
              <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search leave type..."
                style={{ height: 36, fontSize: "0.9rem" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div
            className="table-responsive leads-table-wrap border-0 shadow-sm mb-4"
            style={{ borderRadius: 12 }}
          >
            <table className="table table-hover align-middle leads-table mb-0">
              <thead>
                <tr>
                  <th className="text-muted" style={{ width: 60, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Leave Type</th>
                  <th className="text-muted" style={{ width: 160, fontWeight: "600", fontSize: "0.85rem" }}>Days / Year</th>
                  <th className="text-muted" style={{ width: 130, fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                  <th className="text-muted" style={{ width: 160, fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm me-2" role="status" />
                      Loading...
                    </td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      {searchText ? "No leave types match your search." : "No leave types found. Click \"Add Leave Type\" to get started."}
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((r, i) => (
                    <tr key={r.id}>
                      <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>
                        {pageOffset + i + 1}
                      </td>
                      <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>
                        {r.name || "-"}
                      </td>
                      <td style={{ color: "#334155", fontSize: "0.9rem" }}>
                        {r.daysPerYear ?? "-"}
                      </td>
                      <td>
                        {r.enabled !== false ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#16a34a",
                              fontWeight: "600",
                              fontSize: "0.78rem",
                              padding: "5px 10px",
                              borderRadius: 6,
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: "#fee2e2",
                              color: "#dc2626",
                              fontWeight: "600",
                              fontSize: "0.78rem",
                              padding: "5px 10px",
                              borderRadius: 6,
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => openEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => setDeleteTarget(r)}
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
          {filtered.length > 0 && (
            <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
              <span className="entries-info text-muted small">
                Showing {pageOffset + 1} to {Math.min(pageOffset + pageSize, filtered.length)} of {filtered.length} entries
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

                {renderPageButtons()}

                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={clampedPage >= totalPages}
                >
                  <i className="ti ti-chevron-right" />
                </button>
              </div>

              <PageSizeSelector pageSize={pageSize} setPageSize={setPageSize} setPage={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* ── Add Modal ───────────────────────────────────────────────────── */}
      {showAddModal && (
        <>
          <div className="modal fade show" style={{ display: "block", zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>
                    Add Leave Type
                  </h5>
                  <button className="btn-close" onClick={() => setShowAddModal(false)} disabled={saving} />
                </div>
                <form onSubmit={handleAdd}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">
                        Leave Type Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control"
                        placeholder="e.g. Annual Leave, Sick Leave"
                        style={{ borderRadius: 8, padding: "10px 14px" }}
                        value={addForm.name}
                        onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-muted">
                        Days Per Year <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="e.g. 12"
                        style={{ borderRadius: 8, padding: "10px 14px" }}
                        value={addForm.daysPerYear}
                        onChange={(e) => setAddForm((f) => ({ ...f, daysPerYear: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-0 p-3 bg-light">
                    <button
                      type="button"
                      className="btn btn-light"
                      style={{ borderRadius: 8, fontWeight: "600" }}
                      onClick={() => setShowAddModal(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                      disabled={saving}
                    >
                      {saving ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        </>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {showEditModal && (
        <>
          <div className="modal fade show" style={{ display: "block", zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>
                    Edit Leave Type
                  </h5>
                  <button className="btn-close" onClick={() => setShowEditModal(false)} disabled={saving} />
                </div>
                <form onSubmit={handleEdit}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">
                        Leave Type Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control"
                        placeholder="e.g. Annual Leave, Sick Leave"
                        style={{ borderRadius: 8, padding: "10px 14px" }}
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">
                        Days Per Year <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="e.g. 12"
                        style={{ borderRadius: 8, padding: "10px 14px" }}
                        value={editForm.daysPerYear}
                        onChange={(e) => setEditForm((f) => ({ ...f, daysPerYear: e.target.value }))}
                      />
                    </div>
                    <div className="mb-1">
                      <label className="form-label small fw-semibold text-muted d-block">Status</label>
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            id="edit-status-active"
                            checked={editForm.enabled === true}
                            onChange={() => setEditForm((f) => ({ ...f, enabled: true }))}
                          />
                          <label className="form-check-label small" htmlFor="edit-status-active">Active</label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            id="edit-status-inactive"
                            checked={editForm.enabled === false}
                            onChange={() => setEditForm((f) => ({ ...f, enabled: false }))}
                          />
                          <label className="form-check-label small" htmlFor="edit-status-inactive">Inactive</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-0 p-3 bg-light">
                    <button
                      type="button"
                      className="btn btn-light"
                      style={{ borderRadius: 8, fontWeight: "600" }}
                      onClick={() => setShowEditModal(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Update"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        </>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {deleteTarget && (
        <>
          <div className="modal fade show" style={{ display: "block", zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title fw-bold" style={{ color: "#334155" }}>Delete Leave Type</h5>
                  <button className="btn-close" onClick={() => setDeleteTarget(null)} disabled={saving} />
                </div>
                <div className="modal-body p-4 text-center">
                  <i className="ti ti-alert-triangle text-danger mb-3" style={{ fontSize: "2rem" }} />
                  <p className="mb-0">
                    Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                  </p>
                </div>
                <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-center">
                  <button
                    className="btn btn-light px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={() => setDeleteTarget(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger px-3"
                    style={{ borderRadius: 8, fontWeight: "600" }}
                    onClick={handleDelete}
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