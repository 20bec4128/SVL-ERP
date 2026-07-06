import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createHeadOffice,
  deleteHeadOffice,
  getHeadOffices,
  updateHeadOffice,
} from "../../api/headOfficesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "../../../public/assets/css/addModalShared.css";

const initialForm = {
  name: "",
  location: "",
  status: "ACTIVE",
};

function AddHeadOfficeModal({ form, saving, onClose, onSubmit, onFormChange }) {
  return (
    <div className="avm-backdrop" role="presentation">
      <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="avm-modal-header">
          <h2 className="avm-modal-title">Add Head Office</h2>
          <button type="button" className="avm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="avm-body">
            <div className="row g-3">
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">
                    Head Office Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="avm-input"
                    value={form.name}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Location</label>
                  <input
                    type="text"
                    className="avm-input"
                    value={form.location}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Status</label>
                  <select
                    className="avm-select"
                    value={form.status}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="avm-footer">
            <div />
            <div className="avm-footer-right">
              <button type="button" className="avm-btn light" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="avm-btn primary" disabled={saving}>
                {saving ? "Adding..." : "Add Head Office"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditHeadOfficeModal({ form, saving, onClose, onSubmit, onFormChange }) {
  return (
    <div className="avm-backdrop" role="presentation">
      <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="avm-modal-header">
          <h2 className="avm-modal-title">Edit Head Office</h2>
          <button type="button" className="avm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="avm-body">
            <div className="row g-3">
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">
                    Head Office Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="avm-input"
                    value={form.name}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Location</label>
                  <input
                    type="text"
                    className="avm-input"
                    value={form.location}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Status</label>
                  <select
                    className="avm-select"
                    value={form.status}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="avm-footer">
            <div />
            <div className="avm-footer-right">
              <button type="button" className="avm-btn light" onClick={onClose} disabled={saving}>
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
  );
}

function DeleteHeadOfficeModal({ deleteTarget, saving, onClose, onDelete }) {
  return (
    <div className="avm-backdrop" role="presentation">
      <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="avm-modal-header">
          <h2 className="avm-modal-title">Confirm Delete</h2>
          <button type="button" className="avm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="avm-body">
          <p>
            Are you sure you want to delete{" "}
            {deleteTarget?.name ? `"${deleteTarget.name}"` : "this head office"}?
          </p>
        </div>
        <div className="avm-footer">
          <div />
          <div className="avm-footer-right">
            <button type="button" className="avm-btn light" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="avm-btn primary" onClick={onDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeadOfficesPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Search & Pagination States
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getHeadOffices();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load head offices"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filter & Pagination Logic
  const filteredRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
    const search = searchText.trim().toLowerCase();
    if (!search) return sorted;
    return sorted.filter(
      (row) =>
        String(row.name || "").toLowerCase().includes(search) ||
        String(row.location || "").toLowerCase().includes(search)
    );
  }, [rows, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [searchText]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError("Head Office name is required");
      return;
    }
    setSaving(true);
    try {
      await createHeadOffice({
        name: form.name.trim(),
        location: form.location?.trim() || "",
        status: form.status,
      });
      showSuccess("Head Office added");
      setForm(initialForm);
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add head office"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditForm({
      name: row?.name || "",
      location: row?.location || "",
      status: String(row?.status || "ACTIVE").toUpperCase(),
    });
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.name.trim()) {
      showError("Head Office name is required");
      return;
    }
    setSaving(true);
    try {
      await updateHeadOffice(selectedId, {
        name: editForm.name.trim(),
        location: editForm.location?.trim() || "",
        status: editForm.status,
      });
      showSuccess("Head Office updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update head office"));
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
      await deleteHeadOffice(selectedId);
      showSuccess("Head Office deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete head office"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="container-fluid content">
        {/* Header Block */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Head Offices</h2>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-decoration-none text-muted">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Employee</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">
                    Head Offices
                  </li>
                </ol>
              </nav>
            </div>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-plus" />
              Add Head Office
            </button>
          </div>
        </div>

        {/* Content Card */}
        <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body">
            {/* Search Controls Bar */}
            <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
                <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
                <input
                  type="text"
                  className="form-control border-0 bg-transparent shadow-none"
                  placeholder="Search head office..."
                  style={{ height: 36, fontSize: "0.9rem" }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5 text-muted">Loading head offices...</div>
            ) : (
              <>
                <div className="table-responsive leads-table-wrap border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
                  <table className="table table-hover align-middle leads-table mb-0">
                    <thead>
                      <tr>
                        <th className="text-muted" style={{ width: 100, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Name</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Location</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                        <th className="text-muted text-end" style={{ width: 180, fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-muted">
                            No head offices found
                          </td>
                        </tr>
                      ) : (
                        pagedRows.map((row, idx) => (
                          <tr key={row.id}>
                            <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{(page - 1) * pageSize + idx + 1}</td>
                            <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{row.name}</td>
                            <td style={{ color: "#475569", fontSize: "0.9rem" }}>{row.location || "-"}</td>
                            <td>
                              <span
                                className={`badge d-inline-flex align-items-center badge-xs ${
                                  String(row.status || "ACTIVE").toUpperCase() === "ACTIVE"
                                    ? "badge-success"
                                    : "badge-danger"
                                }`}
                              >
                                <i className="ti ti-point-filled me-1"></i>
                                {String(row.status || "ACTIVE").toUpperCase()}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  style={{ borderRadius: 8, fontWeight: "600" }}
                                  onClick={() => openEdit(row)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  style={{ borderRadius: 8, fontWeight: "600" }}
                                  onClick={() => confirmDelete(row)}
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
              </>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddHeadOfficeModal
          form={form}
          saving={saving}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          onFormChange={setForm}
        />
      )}
      {showEditModal && (
        <EditHeadOfficeModal
          form={editForm}
          saving={saving}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEdit}
          onFormChange={setEditForm}
        />
      )}
      {showDeleteModal && (
        <DeleteHeadOfficeModal
          deleteTarget={deleteTarget}
          saving={saving}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
