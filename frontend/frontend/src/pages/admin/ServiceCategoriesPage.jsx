import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getServiceCategoriesPaged,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from "../../api/serviceCategoriesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import "./ServiceCategoriesPage.css";

const EMPTY_FORM = { name: "" };

export default function ServiceCategoriesPage() {
  const { showSuccess, showError } = useToast();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const [categories, setCategories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getServiceCategoriesPaged({
        page: Math.max(0, Number(page) - 1),
        size: Number(pageSize) || 10,
      });
      setCategories(Array.isArray(data?.content) ? data.content : []);
      setPage(Number(data?.page ?? page) || page);
      setPageSize(Number(data?.size ?? pageSize) || pageSize);
      setTotalRows(Number(data?.totalElements ?? 0) || 0);
      setTotalPages(Math.max(1, Number(data?.totalPages ?? 1) || 1));
    } catch (e) {
      const message = extractApiErrorMessage(e, "Failed to load categories");
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const pageOffset = (clampedPage - 1) * pageSize;

  const handleOpenCreate = () => {
    setForm({ name: "", isActive: true });
    setEditingId(null);
    setShowCreate(true);
  };

  const handleEdit = (category) => {
    setForm({
      name: category.name,
      isActive: category.isActive !== undefined ? category.isActive : true
    });
    setEditingId(category.id);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showError("Name required");
      return;
    }
    setSaving(true);
    try {
      console.log("Sending form data:", form);
      if (editingId) {
        await updateServiceCategory(editingId, form);
        showSuccess("Category updated");
      } else {
        await createServiceCategory(form);
        showSuccess("Category added");
      }
      setShowCreate(false);
      setForm({ name: "", isActive: true });
      setEditingId(null);
      await loadCategories();
    } catch (e) {
      const message = extractApiErrorMessage(e, "Failed to save");
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category) => {
    showConfirm({
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.name}"?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await deleteServiceCategory(category.id);
          showSuccess("Category deleted");
          await loadCategories();
        } catch (e) {
          const message = extractApiErrorMessage(e, "Failed to delete");
          showError(message);
        }
      },
    });
  };

  const filteredCategories = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return categories;
    return categories.filter((c) =>
      String(c.name || "").toLowerCase().includes(search)
    );
  }, [categories, searchText]);

  return (
    <div className="container-fluid content">
      {/* Header Block */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Service Categories</h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" className="text-decoration-none text-muted">
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item text-muted">Services</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">
                  Service Categories
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{
                backgroundColor: "#3b82f6",
                borderColor: "#3b82f6",
                fontWeight: "600",
                padding: "10px 20px",
                borderRadius: "10px",
                fontSize: "0.9rem"
              }}
              onClick={handleOpenCreate}
            >
              <i className="ti ti-plus" style={{ fontSize: "1.1rem" }} />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          {/* Controls Bar */}
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
              <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search service categories..."
                style={{ height: 36, fontSize: "0.9rem" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center p-4 text-muted">No categories found.</div>
          ) : (
            <>
              <div className="table-responsive leads-table-wrap border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
                <table className="table table-hover align-middle leads-table mb-0">
                  <thead>
                    <tr>
                      <th className="text-muted" style={{ width: 90, fontWeight: "600", fontSize: "0.85rem" }}>Index</th>
                      <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Name</th>
                      <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                      <th className="text-muted text-end" style={{ width: 150, fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category, index) => (
                      <tr key={category.id}>
                        <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{pageOffset + index + 1}</td>
                        <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{category.name}</td>
                        <td>
                          <span className={`badge ${category.isActive ? "bg-success" : "bg-danger"}`} style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: 8 }}>
                            {category.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              style={{ borderRadius: 8 }}
                              onClick={() => handleEdit(category)}
                              title="Edit"
                            >
                              <i className="ti ti-edit" />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              style={{ borderRadius: 8 }}
                              onClick={() => handleDelete(category)}
                              title="Delete"
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer aligned like leads */}
              {totalRows > 0 && (
                <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 border-top">
                  <span className="entries-info text-muted small">
                    Showing {pageOffset + 1} to {Math.min(pageOffset + pageSize, totalRows)} of {totalRows} entries
                  </span>

                  <div className="pagination-numbers-container d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={loading || clampedPage <= 1}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>

                    <span className="text-muted small px-2">
                      Page {clampedPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={loading || clampedPage >= totalPages}
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Rows per page</span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 80, borderRadius: 8, height: 36 }}
                      value={pageSize}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setPageSize(Number.isFinite(next) && next > 0 ? next : 10);
                        setPage(1);
                      }}
                      disabled={loading}
                    >
                      {[10, 25, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <>
          <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px" }}>
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold" style={{ color: "#0f172a" }}>
                    {editingId ? "Edit Category" : "Add New Category"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreate(false)}
                  />
                </div>
                <div className="modal-body p-4 pb-0">
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted" style={{ fontSize: "0.85rem" }}>Category Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter category name"
                      style={{ borderRadius: 10, height: 42 }}
                      autoFocus
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label d-flex align-items-center gap-3 fw-semibold text-muted" style={{ fontSize: "0.85rem" }}>
                      <span>Status</span>
                      <div className="form-check form-switch" style={{ margin: 0 }}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="statusToggle"
                          checked={form.isActive}
                          onChange={(e) =>
                            setForm({ ...form, isActive: e.target.checked })
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <label className="form-check-label fw-medium text-dark ms-1" htmlFor="statusToggle" style={{ fontSize: "0.85rem" }}>
                          {form.isActive ? "Active" : "Inactive"}
                        </label>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 p-4">
                  <button
                    type="button"
                    className="btn btn-light px-4 py-2"
                    style={{ borderRadius: 10 }}
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2"
                    style={{ borderRadius: 10, backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {confirmDialog}
    </div>
  );
}
