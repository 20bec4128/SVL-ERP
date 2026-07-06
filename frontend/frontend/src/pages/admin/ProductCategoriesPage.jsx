import { useEffect, useState } from "react";
import {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from "../../api/productCategoriesApi";
import PageHeader from "../../components/admin/PageHeader";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import "./ProductCategoriesPage.css";

const EMPTY_FORM = { name: "" };

export default function ProductCategoriesPage() {
  const { showSuccess, showError } = useToast();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const [categories, setCategories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getProductCategories();
      console.log("Loaded categories:", data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      const message = extractApiErrorMessage(e, "Failed to load categories");
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

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
        await updateProductCategory(editingId, form);
        showSuccess("Category updated");
      } else {
        await createProductCategory(form);
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
          await deleteProductCategory(category.id);
          showSuccess("Category deleted");
          await loadCategories();
        } catch (e) {
          const message = extractApiErrorMessage(e, "Failed to delete");
          showError(message);
        }
      },
    });
  };

  return (
    <div className="product-categories-shell">
      <PageHeader
        title="Product Categories"
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Services", path: "" },
          { label: "Product Categories", path: "" },
        ]}
      />

      <div className="leads-page-body">
        <div className="leads-toolbar">
          <div />
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button
              className="btn btn-success leads-toolbar-btn leads-primary-action"
              onClick={handleOpenCreate}
              style={{ marginLeft: "auto" }}
            >
              <i className="ti ti-plus me-1" />
              Add Category
            </button>
          </div>
        </div>

        <div className="leads-search-row">
          <div className="leads-search-box">
            <label className="mb-0 leads-search-label">Search</label>
            <input
              className="form-control leads-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
            />
          </div>
        </div>

        <div className="leads-table-wrap">
          <table className="table leads-table mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center text-muted py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>
                      <span className={`badge ${category.isActive ? "bg-success" : "bg-danger"}`}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: "#6f65d6",
                          color: "#fff",
                          width: 32,
                          height: 32,
                          padding: 0,
                          borderRadius: 4,
                          border: "none",
                          marginRight: "0.5rem",
                        }}
                        onClick={() => handleEdit(category)}
                        title="Edit"
                      >
                        <i className="ti ti-edit" style={{ fontSize: "14px" }} />
                      </button>
                      <button
                        className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: "#e74c3c",
                          color: "#fff",
                          width: 32,
                          height: 32,
                          padding: 0,
                          borderRadius: 4,
                          border: "none",
                        }}
                        onClick={() => handleDelete(category)}
                        title="Delete"
                      >
                        <i className="ti ti-trash" style={{ fontSize: "14px" }} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center text-muted py-4">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <>
          <div className="modal fade show lead-create-modal" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingId ? "Edit Category" : "Add New Category"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreate(false)}
                  />
                </div>
                <div className="modal-body lead-create-shell">
                  <div className="lead-wizard">
                    <div className="row g-3 lead-wizard-step-panel">
                      <div className="col-12">
                        <div className="lead-form-stack">
                          <div className="lead-form-field">
                            <label className="form-label">Category Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              placeholder="Enter category name"
                              autoFocus
                            />
                          </div>

                          <div className="lead-form-field">
                            <label className="form-label d-flex align-items-center gap-2">
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
                                <label className="form-check-label" htmlFor="statusToggle">
                                  {form.isActive ? "Active" : "Inactive"}
                                </label>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lead-wizard-nav">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowCreate(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : editingId ? "Update" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show lead-create-backdrop" />
        </>
      )}

      {confirmDialog}
    </div>
  );
}
