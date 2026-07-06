import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../api/categoriesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

const CategoriesPage = () => {
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [form, setForm] = useState({ name: "", subName: "" });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setCategories([]);
      showError(extractApiErrorMessage(error, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => setForm({ name: "", subName: "" });

  const openAddModal = () => {
    resetForm();
    setEditingCategoryId(null);
    setShowEditModal(false);
    setShowAddModal(true);
  };

  const openEditModal = (category) => {
    setForm({
      name: category?.name || "",
      subName: category?.subName || "",
    });
    setEditingCategoryId(category?.id || null);
    setShowAddModal(false);
    setShowEditModal(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      subName: form.subName.trim(),
    };

    if (!payload.name) {
      showError("Category name is required");
      return;
    }
    if (!payload.subName) {
      showError("Sub category name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
        showSuccess("Category updated");
      } else {
        await createCategory(payload);
        showSuccess("Category added");
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingCategoryId(null);
      resetForm();
      await loadCategories();
    } catch (error) {
      showError(extractApiErrorMessage(error, "Failed to save category"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) {
      return;
    }
    try {
      await deleteCategory(category.id);
      showSuccess("Category deleted");
      await loadCategories();
    } catch (error) {
      showError(extractApiErrorMessage(error, "Failed to delete category"));
    }
  };

  const filteredCategories = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return categories;
    return categories.filter(
      (c) =>
        String(c.name || "").toLowerCase().includes(search) ||
        String(c.subName || "").toLowerCase().includes(search)
    );
  }, [categories, searchText]);

  return (
    <div className="container-fluid content">
      {/* Header Block */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Categories</h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" className="text-decoration-none text-muted">
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item text-muted">HR</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">
                  Categories
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          {/* Controls Bar */}
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
              <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search categories..."
                style={{ height: 36, fontSize: "0.9rem" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2">
                <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={openAddModal}
              >
                <i className="ti ti-circle-plus" />
                Add Categories
              </button>
            </div>
          </div>

          <div className="table-responsive leads-table-wrap border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <table className="table table-hover align-middle leads-table mb-0">
              <thead>
                <tr>
                  <th className="text-muted" style={{ width: 80, fontWeight: "600", fontSize: "0.85rem" }}>
                    <div className="form-check form-check-md mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="select-all"
                      />
                    </div>
                  </th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Category Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Sub Category Name</th>
                  <th className="text-muted text-end" style={{ width: 150, fontWeight: "600", fontSize: "0.85rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-muted">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="form-check form-check-md mb-0">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <h6 className="fw-semibold mb-0" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{c.name}</h6>
                      </td>
                      <td style={{ color: "#475569", fontSize: "0.9rem" }}>{c.subName}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: 8 }}
                            onClick={() => openEditModal(c)}
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            style={{ borderRadius: 8 }}
                            onClick={() => handleDelete(c)}
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Category */}
      {showAddModal && (
      <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" aria-modal="true" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
            <div className="modal-header border-0 pb-0">
              <h4 className="modal-title fw-bold" style={{ color: "#0f172a" }}>Add Category</h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowAddModal(false)}
              />
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body p-4 pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted" style={{ fontSize: "0.85rem" }}>Category Name</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 10, height: 42 }}
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted" style={{ fontSize: "0.85rem" }}>Sub Category Name</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 10, height: 42 }}
                        value={form.subName}
                        onChange={(e) => setForm((prev) => ({ ...prev, subName: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 p-4">
                <button
                  type="button"
                  className="btn btn-light px-4 py-2"
                  style={{ borderRadius: 10 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4 py-2" style={{ borderRadius: 10, backgroundColor: "#3b82f6", borderColor: "#3b82f6" }} disabled={saving}>
                  {saving ? "Saving..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Edit Category */}
      {showEditModal && (
      <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" aria-modal="true" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
            <div className="modal-header border-0 pb-0">
              <h4 className="modal-title fw-bold" style={{ color: "#0f172a" }}>Edit Category</h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowEditModal(false)}
              />
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body p-4 pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted" style={{ fontSize: "0.85rem" }}>Category Name</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 10, height: 42 }}
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted" style={{ fontSize: "0.85rem" }}>Sub Category Name</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 10, height: 42 }}
                        value={form.subName}
                        onChange={(e) => setForm((prev) => ({ ...prev, subName: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 p-4">
                <button
                  type="button"
                  className="btn btn-light px-4 py-2"
                  style={{ borderRadius: 10 }}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4 py-2" style={{ borderRadius: 10, backgroundColor: "#3b82f6", borderColor: "#3b82f6" }} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default CategoriesPage;
