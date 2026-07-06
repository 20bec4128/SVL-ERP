import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
} from "../../api/branchesApi";
import { getHeadOffices } from "../../api/headOfficesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "../../../public/assets/css/addModalShared.css";

const initialForm = {
  headOfficeId: "",
  name: "",
  location: "",
  status: "ACTIVE",
};

function isActiveMaster(item) {
  return String(item?.status || "ACTIVE").toUpperCase() !== "INACTIVE";
}

function withInactiveSelected(items, selectedId) {
  const list = Array.isArray(items) ? items : [];
  const active = list.filter(isActiveMaster);
  if (!selectedId) return active;

  const selected = list.find((it) => String(it?.id) === String(selectedId));
  if (!selected || isActiveMaster(selected)) return active;

  return [
    ...active,
    { ...selected, name: `${selected?.name || "Selected"} (Inactive)` },
  ];
}

function hasHeadOfficeOption(headOffices, headOfficeId) {
  return Array.isArray(headOffices)
    && headOffices.some((item) => String(item?.id) === String(headOfficeId));
}

// Modal components defined outside
const AddModal = ({ show, onClose, onSave, headOffices, metaLoading, saving, initialHeadOfficeId }) => {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    headOfficeId: initialHeadOfficeId || "",
  }));

  // Reset form when modal opens or initialHeadOfficeId changes
  useEffect(() => {
    if (show) {
      setForm({
        ...initialForm,
        headOfficeId: hasHeadOfficeOption(headOffices, initialHeadOfficeId) ? String(initialHeadOfficeId) : "",
      });
    }
  }, [show, initialHeadOfficeId, headOffices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.headOfficeId) {
      return;
    }
    if (!form.name.trim()) {
      return;
    }
    await onSave(form);
  };

  if (!show) return null;

  return (
    <div className="avm-backdrop" role="presentation">
      <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="avm-modal-header">
          <h2 className="avm-modal-title">Add Branch</h2>
          <button type="button" className="avm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="avm-body">
            <div className="row g-3">
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Head Office <span className="req">*</span></label>
                  <select
                    className="avm-select"
                    value={form.headOfficeId}
                    onChange={(e) => setForm((prev) => ({ ...prev, headOfficeId: e.target.value }))}
                    disabled={metaLoading}
                    required
                  >
                    <option value="">Select</option>
                    {withInactiveSelected(headOffices, form.headOfficeId).map((ho) => (
                      <option key={ho.id} value={ho.id}>
                        {ho.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Branch Name <span className="req">*</span></label>
                  <input
                    type="text"
                    className="avm-input"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Status</label>
                  <select
                    className="avm-select"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
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
                {saving ? "Adding..." : "Add Branch"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditModal = ({ show, onClose, onSave, headOffices, metaLoading, saving, editData }) => {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (show && editData) {
      setForm({
        headOfficeId: hasHeadOfficeOption(headOffices, editData?.headOfficeId) ? String(editData?.headOfficeId || "") : "",
        name: editData?.name || "",
        location: editData?.location || "",
        status: String(editData?.status || "ACTIVE").toUpperCase(),
      });
    }
  }, [show, editData, headOffices]);

  const editHeadOfficeOptions = useMemo(() => {
    const list = withInactiveSelected(headOffices, form.headOfficeId);
    return [...list].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [headOffices, form.headOfficeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.headOfficeId) return;
    if (!form.name.trim()) return;
    await onSave(form);
  };

  if (!show) return null;

  return (
    <div className="avm-backdrop" role="presentation">
      <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="avm-modal-header">
          <h2 className="avm-modal-title">Edit Branch</h2>
          <button type="button" className="avm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="avm-body">
            <div className="row g-3">
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Head Office <span className="req">*</span></label>
                  <select
                    className="avm-select"
                    value={form.headOfficeId}
                    onChange={(e) => setForm((prev) => ({ ...prev, headOfficeId: e.target.value }))}
                    disabled={metaLoading}
                    required
                  >
                    <option value="">Select</option>
                    {editHeadOfficeOptions.map((ho) => (
                      <option key={ho.id} value={ho.id}>
                        {ho.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Branch Name <span className="req">*</span></label>
                  <input
                    type="text"
                    className="avm-input"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="avm-field">
                  <label className="avm-label">Status</label>
                  <select
                    className="avm-select"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
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
};

const DeleteModal = ({ show, onClose, onDelete, saving, deleteTarget }) => {
  if (!show) return null;

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
            {deleteTarget?.name ? `"${deleteTarget.name}"` : "this branch"}?
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
};

export default function BranchesPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters State
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    headOfficeId: "",
    status: "",
  });
  const [draftFilters, setDraftFilters] = useState(filters);

  // Search & Pagination States
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editData, setEditData] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadMeta = async () => {
    setMetaLoading(true);
    try {
      const data = await getHeadOffices();
      setHeadOffices(Array.isArray(data) ? data : []);
    } catch (e) {
      setHeadOffices([]);
      showError(extractApiErrorMessage(e, "Failed to load head offices"));
    } finally {
      setMetaLoading(false);
    }
  };

  const load = async (headOfficeId) => {
    setLoading(true);
    try {
      const data = await getBranches(headOfficeId || undefined);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load branches"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    load(filters.headOfficeId);
  }, [filters.headOfficeId]);

  const headOfficeOptions = useMemo(
    () =>
      [...headOffices]
        .filter(isActiveMaster)
        .sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        ),
    [headOffices],
  );

  // Filter, Search & Pagination Logic
  const filteredRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
    const search = searchText.trim().toLowerCase();
    return sorted.filter((row) => {
      const status = String(row?.status || "ACTIVE").toUpperCase();
      const statusOk = !filters.status || status === String(filters.status).toUpperCase();
      const searchOk =
        !search ||
        String(row?.name || "").toLowerCase().includes(search) ||
        String(row?.location || "").toLowerCase().includes(search) ||
        String(
          headOffices.find((h) => String(h.id) === String(row.headOfficeId))?.name || ""
        )
          .toLowerCase()
          .includes(search);
      return statusOk && searchOk;
    });
  }, [rows, searchText, filters.status, headOffices]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [searchText, filters]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleAdd = async (formData) => {
    if (!formData.headOfficeId) {
      showError("Head Office is required");
      return;
    }
    if (!formData.name.trim()) {
      showError("Branch name is required");
      return;
    }
    setSaving(true);
    try {
      await createBranch({
        headOfficeId: Number(formData.headOfficeId),
        name: formData.name.trim(),
        location: formData.location?.trim() || "",
        status: formData.status,
      });
      showSuccess("Branch added");
      setShowAddModal(false);
      await load(filters.headOfficeId);
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add branch"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditData(row);
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const handleEdit = async (formData) => {
    if (!selectedId) return;
    if (!formData.headOfficeId) {
      showError("Head Office is required");
      return;
    }
    if (!formData.name.trim()) {
      showError("Branch name is required");
      return;
    }
    setSaving(true);
    try {
      await updateBranch(selectedId, {
        headOfficeId: Number(formData.headOfficeId),
        name: formData.name.trim(),
        location: formData.location?.trim() || "",
        status: formData.status,
      });
      showSuccess("Branch updated");
      setShowEditModal(false);
      setSelectedId(null);
      setEditData(null);
      await load(filters.headOfficeId);
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update branch"));
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
      await deleteBranch(selectedId);
      showSuccess("Branch deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load(filters.headOfficeId);
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete branch"));
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
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Branches</h2>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-decoration-none text-muted">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Employee</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">
                    Branches
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-plus" />
                Add Branch
              </button>
            </div>
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
                  placeholder="Search branches..."
                  style={{ height: 36, fontSize: "0.9rem" }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={`btn btn-outline-filter d-flex align-items-center gap-2 ${filterOpen ? 'active' : ''}`}
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={() => {
                  setDraftFilters(filters);
                  setFilterOpen(true);
                }}
              >
                <i className="ti ti-filter" style={{ fontSize: "1rem" }} />
                Filters
              </button>
            </div>

            {/* Filter Drawer */}
            {filterOpen && (
              <>
                <div
                  className="position-fixed top-0 start-0 w-100 h-100"
                  style={{ background: "rgba(0,0,0,0.35)", zIndex: 1048 }}
                  onClick={() => setFilterOpen(false)}
                />
                <div
                  className="position-fixed top-0 end-0 h-100 bg-white border-start shadow"
                  style={{ width: 380, zIndex: 1049 }}
                >
                  <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                    <h6 className="mb-0 fw-bold">Filters</h6>
                    <button type="button" className="btn-close" onClick={() => setFilterOpen(false)} />
                  </div>

                  <div className="p-3">
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">Head Office</label>
                      <select
                        className="form-select"
                        value={draftFilters.headOfficeId}
                        onChange={(e) =>
                          setDraftFilters((prev) => ({ ...prev, headOfficeId: e.target.value }))
                        }
                        disabled={metaLoading}
                      >
                        <option value="">All</option>
                        {headOfficeOptions.map((ho) => (
                          <option key={ho.id} value={ho.id}>
                            {ho.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">Status</label>
                      <select
                        className="form-select"
                        value={draftFilters.status}
                        onChange={(e) =>
                          setDraftFilters((prev) => ({ ...prev, status: e.target.value }))
                        }
                      >
                        <option value="">All</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 border-top d-flex gap-2 position-absolute bottom-0 w-100 bg-white">
                    <button
                      type="button"
                      className="btn btn-light w-50"
                      style={{ borderRadius: 8, fontWeight: "600" }}
                      onClick={() => setDraftFilters({ headOfficeId: "", status: "" })}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary w-50"
                      style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                      onClick={() => {
                        setFilters(draftFilters);
                        setFilterOpen(false);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}

            {loading ? (
              <div className="text-center py-5 text-muted">Loading branches...</div>
            ) : (
              <>
                <div className="table-responsive leads-table-wrap border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
                  <table className="table table-hover align-middle leads-table mb-0">
                    <thead>
                      <tr>
                        <th className="text-muted" style={{ width: 100, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Head Office</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Branch Name</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Location</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                        <th className="text-muted text-end" style={{ width: 180, fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            No branches found
                          </td>
                        </tr>
                      ) : (
                        pagedRows.map((row, idx) => (
                          <tr key={row.id}>
                            <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{(page - 1) * pageSize + idx + 1}</td>
                            <td className="fw-semibold" style={{ color: "#475569", fontSize: "0.9rem" }}>
                              {headOffices.find((h) => String(h.id) === String(row.headOfficeId))?.name ||
                                row.headOfficeId}
                            </td>
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

      <AddModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
        headOffices={headOffices}
        metaLoading={metaLoading}
        saving={saving}
        initialHeadOfficeId={filters.headOfficeId}
      />

      <EditModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditData(null);
          setSelectedId(null);
        }}
        onSave={handleEdit}
        headOffices={headOffices}
        metaLoading={metaLoading}
        saving={saving}
        editData={editData}
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
          setSelectedId(null);
        }}
        onDelete={handleDelete}
        saving={saving}
        deleteTarget={deleteTarget}
      />
    </>
  );
}
