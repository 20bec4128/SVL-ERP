import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getStockCategories,
  createStockCategory,
  updateStockCategory,
} from "../../api/stocksApi";
import { getVendorTypes } from "../../api/vendorTypesApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";

export default function StockCategoryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const isEditMode = !!id;
  const [categories, setCategories] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({ name: "", fields: [], allowedVendorTypeIds: [] });

  // Add Fields sub-modal states
  const [showAddFieldsModal, setShowAddFieldsModal] = useState(false);
  const [addFieldsTab, setAddFieldsTab] = useState("library"); // "library", "create", "copy"
  const [selectedLibraryNames, setSelectedLibraryNames] = useState(new Set());
  const [libSearchQuery, setLibSearchQuery] = useState("");
  const [libTypeFilter, setLibTypeFilter] = useState("all");
  const [copySourceCategoryId, setCopySourceCategoryId] = useState("");
  const [newFieldForm, setNewFieldForm] = useState({
    name: "",
    type: "text",
    unit: "",
    options: "",
  });

  const previouslyUsedFields = useMemo(() => {
    const fieldMap = new Map();
    const standardFields = [
      { name: "Width", type: "number", options: [], unit: "mm" },
      { name: "Height", type: "number", options: [], unit: "mm" },
      { name: "Length", type: "number", options: [], unit: "mm" },
      { name: "Thickness", type: "number", options: [], unit: "micron" },
      { name: "GSM", type: "number", options: [], unit: "gsm" },
      { name: "Color", type: "text", options: [], unit: "" },
      { name: "Weight", type: "number", options: [], unit: "kg" },
      { name: "Size", type: "dropdown", options: ["Small", "Medium", "Large"], unit: "" },
      { name: "Material", type: "dropdown", options: ["Paper", "Plastic", "Metal", "Wood"], unit: "" },
    ];
    standardFields.forEach((field) => {
      fieldMap.set(field.name.toLowerCase().trim(), field);
    });

    categories.forEach((cat) => {
      if (Array.isArray(cat.fields)) {
        cat.fields.forEach((field) => {
          if (field.name) {
            fieldMap.set(field.name.toLowerCase().trim(), field);
          }
        });
      }
    });
    return Array.from(fieldMap.values());
  }, [categories]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const cats = await getStockCategories();
        const types = await getVendorTypes();
        setCategories(cats);
        setVendorTypes(Array.isArray(types) ? types : []);

        if (isEditMode) {
          const cat = cats.find((c) => String(c.id) === String(id));
          if (cat) {
            setForm({
              name: cat.name || "",
              fields: Array.isArray(cat.fields) ? cat.fields : [],
              allowedVendorTypeIds: Array.isArray(cat.allowedVendorTypeIds) ? cat.allowedVendorTypeIds : [],
            });
          } else {
            showError("Stock Category not found");
            navigate("/stocks/categories");
          }
        }
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load page data"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode, navigate, showError]);

  const updateField = (index, key, value) => {
    setForm((p) => {
      const fields = [...(p.fields || [])];
      fields[index] = { ...fields[index], [key]: value };
      return { ...p, fields };
    });
  };

  const removeField = (index) => {
    setForm((p) => {
      const fields = [...(p.fields || [])];
      fields.splice(index, 1);
      return { ...p, fields };
    });
  };

  const addField = () => {
    setSelectedLibraryNames(new Set());
    setLibSearchQuery("");
    setLibTypeFilter("all");
    setCopySourceCategoryId("");
    setNewFieldForm({ name: "", type: "text", unit: "", options: "" });
    setAddFieldsTab("library");
    setShowAddFieldsModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      showError("Category Name is required");
      return;
    }
    setSaving(true);
    try {
      if (isEditMode) {
        await updateStockCategory(id, form);
        showSuccess("Category updated successfully");
      } else {
        await createStockCategory(form);
        showSuccess("Category created successfully");
      }
      navigate("/stocks/categories");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save category"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="content">
        {/* Breadcrumb Header */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
                {isEditMode ? "Edit" : "Add"} Stock Category
              </h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      Home
                    </Link>
                  </li>
                  <li className="breadcrumb-item" style={{ color: "#64748b" }}>Stocks</li>
                  <li className="breadcrumb-item">
                    <Link to="/stocks/categories" style={{ color: "#64748b", textDecoration: "none" }}>
                      Categories
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>
                    {isEditMode ? "Edit" : "Add"} Category
                  </li>
                </ol>
              </nav>
            </div>
            <div>
              <Link to="/stocks/categories" className="btn btn-secondary d-flex align-items-center gap-2">
                <i className="ti ti-arrow-left" /> Back to Categories
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card p-5 text-center border-0 shadow-sm">
            <div className="spinner-border text-primary mx-auto" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="row">
              {/* Left Side: General Info */}
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
                  <div className="card-header bg-transparent border-bottom py-3">
                    <h5 className="mb-0 fw-bold text-dark">Category Info</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">Category Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Enter category name"
                        required
                        style={{ height: 42, borderRadius: 8 }}
                      />
                    </div>

                    <div className="mb-0">
                      <label className="form-label fw-semibold text-dark">Allowed Vendor Type</label>
                      <select
                        className="form-select"
                        value={form.allowedVendorTypeIds[0] || ""}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          setForm((p) => ({ ...p, allowedVendorTypeIds: val ? [val] : [] }));
                        }}
                        style={{ borderRadius: 8 }}
                      >
                        <option value="">Select Vendor Type</option>
                        {vendorTypes.map((vt) => (
                          <option key={vt.id} value={vt.id}>
                            {vt.typeName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Fields Management */}
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
                  <div className="card-header bg-transparent border-bottom py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold text-dark">Category Fields</h5>
                    <button type="button" className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={addField}>
                      <i className="ti ti-plus" /> Add Field
                    </button>
                  </div>
                  <div className="card-body bg-light" style={{ minHeight: 200, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                    {(form.fields || []).length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <i className="ti ti-list-details fs-1 mb-2 d-block" />
                        No fields configured for this category yet. Click <strong>Add Field</strong> to get started.
                      </div>
                    ) : (
                      (form.fields || []).map((f, idx) => (
                        <div key={idx} className="card p-3 mb-3 border-0 shadow-sm bg-white" style={{ borderRadius: 10 }}>
                          <div className="row align-items-center g-3">
                            <div className="col-md-3">
                              <label className="form-label text-muted small fw-semibold mb-1">Field Name</label>
                              <input
                                type="text"
                                className="form-control fw-bold"
                                value={f.name}
                                onChange={(e) => updateField(idx, "name", e.target.value)}
                                placeholder="Field Name"
                                required
                                style={{ height: 38, borderRadius: 6 }}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label text-muted small fw-semibold mb-1">Field Type</label>
                              <select
                                className="form-select"
                                value={f.type}
                                onChange={(e) => updateField(idx, "type", e.target.value)}
                                style={{ borderRadius: 6 }}
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="number-unit">Number with unit</option>
                                <option value="dropdown">Dropdown</option>
                              </select>
                            </div>

                            {f.type === "number-unit" && (
                              <div className="col-md-4">
                                <label className="form-label text-muted small fw-semibold mb-1">Unit</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={f.unit || ""}
                                  onChange={(e) => updateField(idx, "unit", e.target.value)}
                                  placeholder="e.g. mm, kg, micron"
                                  required
                                  style={{ height: 38, borderRadius: 6 }}
                                />
                              </div>
                            )}

                            {f.type === "dropdown" && (
                              <div className="col-md-4">
                                <label className="form-label text-muted small fw-semibold mb-1">Options (comma-separated)</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={Array.isArray(f.options) ? f.options.join(", ") : ""}
                                  onChange={(e) =>
                                    updateField(
                                      idx,
                                      "options",
                                      e.target.value.split(",").map((o) => o.trim())
                                    )
                                  }
                                  placeholder="e.g. High, Medium, Low"
                                  required
                                  style={{ height: 38, borderRadius: 6 }}
                                />
                              </div>
                            )}

                            {f.type !== "number-unit" && f.type !== "dropdown" && (
                              <div className="col-md-4"></div>
                            )}

                            <div className="col-md-2 text-md-end text-start">
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm border-0 d-flex align-items-center gap-1 ms-md-auto mt-md-3"
                                onClick={() => removeField(idx)}
                              >
                                <i className="ti ti-trash" /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: 12 }}>
                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <Link to="/stocks/categories" className="btn btn-light" style={{ borderRadius: 8 }}>
                      Cancel
                    </Link>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 8, minWidth: 120 }}>
                      {saving ? "Saving..." : "Save Category"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Add Fields Sub-Modal */}
      {showAddFieldsModal && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1060 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: 12 }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-dark">
                  Add Fields to Category
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddFieldsModal(false)} />
              </div>
              <div className="modal-body p-0">
                {/* Tab Bar */}
                <div className="border-bottom bg-light px-3 pt-2">
                  <ul className="nav nav-tabs border-0">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link border-0 fw-semibold ${addFieldsTab === "library" ? "active text-primary border-bottom border-primary" : "text-muted bg-transparent"}`}
                        style={{ borderBottomWidth: 3 }}
                        onClick={() => setAddFieldsTab("library")}
                      >
                        <i className="ti ti-library me-1" /> Pick from Library
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link border-0 fw-semibold ${addFieldsTab === "create" ? "active text-primary border-bottom border-primary" : "text-muted bg-transparent"}`}
                        style={{ borderBottomWidth: 3 }}
                        onClick={() => setAddFieldsTab("create")}
                      >
                        <i className="ti ti-plus me-1" /> Create Custom Field
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link border-0 fw-semibold ${addFieldsTab === "copy" ? "active text-primary border-bottom border-primary" : "text-muted bg-transparent"}`}
                        style={{ borderBottomWidth: 3 }}
                        onClick={() => setAddFieldsTab("copy")}
                      >
                        <i className="ti ti-copy me-1" /> Copy from Category
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Tab Content */}
                <div className="p-4" style={{ minHeight: "320px", maxHeight: "450px", overflowY: "auto" }}>
                  {addFieldsTab === "library" && (
                    <div>
                      {/* Search and Filter */}
                      <div className="row g-2 mb-3">
                        <div className="col-md-8 position-relative">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search library..."
                            value={libSearchQuery}
                            onChange={(e) => setLibSearchQuery(e.target.value)}
                            style={{ height: 40, borderRadius: 8 }}
                          />
                        </div>
                        <div className="col-md-4">
                          <select
                            className="form-select"
                            value={libTypeFilter}
                            onChange={(e) => setLibTypeFilter(e.target.value)}
                            style={{ height: 40, borderRadius: 8 }}
                          >
                            <option value="all">All Types</option>
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="number-unit">Number with Unit</option>
                            <option value="dropdown">Dropdown</option>
                          </select>
                        </div>
                      </div>

                      {/* Select All */}
                      <div className="form-check mb-3 pb-2 border-bottom">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="selectAllLib"
                          checked={
                            previouslyUsedFields.length > 0 &&
                            previouslyUsedFields
                              .filter((f) => {
                                const matchSearch = !libSearchQuery.trim() || f.name.toLowerCase().includes(libSearchQuery.toLowerCase());
                                const matchType = libTypeFilter === "all" || f.type === libTypeFilter;
                                return matchSearch && matchType;
                              })
                              .every((f) => selectedLibraryNames.has(f.name))
                          }
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedLibraryNames((prev) => {
                              const next = new Set(prev);
                              previouslyUsedFields
                                .filter((f) => {
                                  const matchSearch = !libSearchQuery.trim() || f.name.toLowerCase().includes(libSearchQuery.toLowerCase());
                                  const matchType = libTypeFilter === "all" || f.type === libTypeFilter;
                                  return matchSearch && matchType;
                                })
                                .forEach((f) => {
                                  if (checked) next.add(f.name);
                                  else next.delete(f.name);
                                });
                              return next;
                            });
                          }}
                        />
                        <label className="form-check-label fw-semibold text-dark" htmlFor="selectAllLib">
                          Select All Fields ({previouslyUsedFields.filter((f) => {
                            const matchSearch = !libSearchQuery.trim() || f.name.toLowerCase().includes(libSearchQuery.toLowerCase());
                            const matchType = libTypeFilter === "all" || f.type === libTypeFilter;
                            return matchSearch && matchType;
                          }).length} found)
                        </label>
                      </div>

                      {/* Fields Checklist */}
                      <div className="d-flex flex-column gap-2">
                        {previouslyUsedFields
                          .filter((f) => {
                            const matchSearch = !libSearchQuery.trim() || f.name.toLowerCase().includes(libSearchQuery.toLowerCase());
                            const matchType = libTypeFilter === "all" || f.type === libTypeFilter;
                            return matchSearch && matchType;
                          })
                          .map((field) => {
                            const alreadyAdded = (form.fields || []).some(
                              (added) => added.name.toLowerCase() === field.name.toLowerCase()
                            );
                            return (
                              <div
                                key={field.name}
                                className={`p-3 rounded border d-flex align-items-center justify-content-between ${alreadyAdded ? "bg-light border-dashed" : "bg-white"}`}
                                style={{ borderRadius: 8 }}
                              >
                                <div className="form-check mb-0">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`lib-${field.name}`}
                                    disabled={alreadyAdded}
                                    checked={selectedLibraryNames.has(field.name) || alreadyAdded}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSelectedLibraryNames((prev) => {
                                        const next = new Set(prev);
                                        if (checked) next.add(field.name);
                                        else next.delete(field.name);
                                        return next;
                                      });
                                    }}
                                  />
                                  <label
                                    className={`form-check-label fw-bold mb-0 ${alreadyAdded ? "text-muted text-decoration-line-through" : "text-dark"}`}
                                    htmlFor={`lib-${field.name}`}
                                    style={{ cursor: alreadyAdded ? "default" : "pointer" }}
                                  >
                                    {field.name}
                                    <span className="badge text-bg-light border ms-2 small text-capitalize">
                                      {field.type === "number-unit" ? `Number (${field.unit})` : field.type}
                                    </span>
                                  </label>
                                </div>
                                {alreadyAdded && (
                                  <span className="text-muted small fw-medium">Already Added</span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {addFieldsTab === "create" && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-dark">Field Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Length, Color, GSM"
                          value={newFieldForm.name}
                          onChange={(e) => setNewFieldForm((p) => ({ ...p, name: e.target.value }))}
                          required
                          style={{ height: 40, borderRadius: 8 }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-dark">Field Type</label>
                        <select
                          className="form-select"
                          value={newFieldForm.type}
                          onChange={(e) => setNewFieldForm((p) => ({ ...p, type: e.target.value }))}
                          style={{ height: 40, borderRadius: 8 }}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="number-unit">Number with unit</option>
                          <option value="dropdown">Dropdown</option>
                        </select>
                      </div>

                      {newFieldForm.type === "number-unit" && (
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-dark">Unit</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. mm, kg, micron"
                            value={newFieldForm.unit}
                            onChange={(e) => setNewFieldForm((p) => ({ ...p, unit: e.target.value }))}
                            required
                            style={{ height: 40, borderRadius: 8 }}
                          />
                        </div>
                      )}

                      {newFieldForm.type === "dropdown" && (
                        <div className="col-md-12">
                          <label className="form-label fw-semibold text-dark">Options (comma separated)</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Matte, Glossy, Standard"
                            value={newFieldForm.options}
                            onChange={(e) => setNewFieldForm((p) => ({ ...p, options: e.target.value }))}
                            required
                            style={{ height: 40, borderRadius: 8 }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {addFieldsTab === "copy" && (
                    <div>
                      <p className="text-muted small mb-3">
                        Copying fields will merge all fields configured in this category with the fields from the selected category below.
                      </p>
                      <label className="form-label fw-semibold text-dark">Select Category to Copy From</label>
                      <select
                        className="form-select"
                        value={copySourceCategoryId}
                        onChange={(e) => setCopySourceCategoryId(e.target.value)}
                        style={{ height: 42, borderRadius: 8 }}
                      >
                        <option value="">Select category</option>
                        {categories
                          .filter((c) => String(c.id) !== String(id))
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.fields?.length || 0} fields)
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowAddFieldsModal(false)}
                  style={{ borderRadius: 8 }}
                >
                  Cancel
                </button>
                {addFieldsTab === "library" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={selectedLibraryNames.size === 0}
                    onClick={() => {
                      const fieldsToAdd = previouslyUsedFields.filter((f) => selectedLibraryNames.has(f.name));
                      setForm((prev) => {
                        const existingFields = prev.fields || [];
                        const merged = [...existingFields];
                        fieldsToAdd.forEach((field) => {
                          if (!existingFields.some((f) => f.name.toLowerCase() === field.name.toLowerCase())) {
                            merged.push({
                              name: field.name,
                              type: field.type,
                              unit: field.unit || "",
                              options: Array.isArray(field.options) ? [...field.options] : [],
                            });
                          }
                        });
                        return { ...prev, fields: merged };
                      });
                      setShowAddFieldsModal(false);
                      showSuccess(`Added ${fieldsToAdd.length} fields from library.`);
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    Add Selected Fields
                  </button>
                )}
                {addFieldsTab === "create" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!newFieldForm.name.trim()}
                    onClick={() => {
                      const cleanName = newFieldForm.name.trim();
                      if ((form.fields || []).some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
                        showError("A field with this name already exists in this category.");
                        return;
                      }
                      const field = {
                        name: cleanName,
                        type: newFieldForm.type,
                        unit: newFieldForm.type === "number-unit" ? newFieldForm.unit.trim() : "",
                        options: newFieldForm.type === "dropdown" ? newFieldForm.options.split(",").map((o) => o.trim()).filter(Boolean) : [],
                      };
                      setForm((prev) => ({
                        ...prev,
                        fields: [...(prev.fields || []), field],
                      }));
                      setShowAddFieldsModal(false);
                      showSuccess(`Custom field "${cleanName}" added successfully.`);
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    Create and Add Field
                  </button>
                )}
                {addFieldsTab === "copy" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!copySourceCategoryId}
                    onClick={() => {
                      const sourceCat = categories.find((c) => String(c.id) === String(copySourceCategoryId));
                      if (sourceCat && Array.isArray(sourceCat.fields)) {
                        setForm((prev) => {
                          const existingFields = prev.fields || [];
                          const merged = [...existingFields];
                          sourceCat.fields.forEach((field) => {
                            if (!existingFields.some((f) => f.name.toLowerCase() === field.name.toLowerCase())) {
                              merged.push({
                                name: field.name,
                                type: field.type,
                                unit: field.unit || "",
                                options: Array.isArray(field.options) ? [...field.options] : [],
                              });
                            }
                          });
                          return { ...prev, fields: merged };
                        });
                        setShowAddFieldsModal(false);
                        showSuccess(`Copied ${sourceCat.fields.length} fields from category "${sourceCat.name}".`);
                      }
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    Copy and Merge Fields
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrops */}
      {showAddFieldsModal && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />}
    </>
  );
}
