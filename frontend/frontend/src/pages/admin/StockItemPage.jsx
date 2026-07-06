import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getStockCategories,
  getStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
} from "../../api/stocksApi";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import "./LeadsPage.css";

function renderField(cat, values, onChange) {
  const { fields } = cat;
  if (!fields || !Array.isArray(fields)) return null;
  return fields.map((f) => {
    const key = f.name;
    const val = values[key] || "";
    if (f.type === "text") {
      return (
        <div className="col-md-6 mb-3" key={key}>
          <label className="form-label">{key}</label>
          <input
            type="text"
            className="form-control"
            value={val}
            onChange={(e) => onChange(key, e.target.value)}
          />
        </div>
      );
    }
    if (f.type === "number") {
      return (
        <div className="col-md-6 mb-3" key={key}>
          <label className="form-label">{key}</label>
          <input
            type="number"
            className="form-control"
            value={val}
            onChange={(e) => onChange(key, e.target.value)}
          />
        </div>
      );
    }
    if (f.type === "number-unit") {
      return (
        <div className="col-md-6 mb-3" key={key}>
          <label className="form-label">{key} ({f.unit || ""})</label>
          <input
            type="number"
            className="form-control"
            value={val}
            onChange={(e) => onChange(key, e.target.value)}
          />
        </div>
      );
    }
    if (f.type === "dropdown") {
      return (
        <div className="col-md-6 mb-3" key={key}>
          <label className="form-label">{key}</label>
          <select
            className="form-select"
            value={val}
            onChange={(e) => onChange(key, e.target.value)}
          >
            <option value="">Select</option>
            {(f.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return null;
  });
}

export default function StockItemPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter, Search, Pagination, Selection, Kebab state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    quantity: 0,
    minThreshold: 0,
    values: {},
  });
  const [selectedCat, setSelectedCat] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getStockCategories();
      const its = await getStockItems();
      setCategories(cats);
      setItems(its);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load stock data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close kebab action menu on outside scroll or click
  useEffect(() => {
    const handleOutsideClickOrScroll = () => {
      setActiveActionsRow(null);
    };
    window.addEventListener("click", handleOutsideClickOrScroll);
    window.addEventListener("scroll", handleOutsideClickOrScroll, true);
    return () => {
      window.removeEventListener("click", handleOutsideClickOrScroll);
      window.removeEventListener("scroll", handleOutsideClickOrScroll, true);
    };
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      categoryId: "",
      quantity: 0,
      minThreshold: 0,
      values: {},
    });
    setSelectedCat(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    const cat = categories.find((c) => c.id === item.categoryId) || null;
    setSelectedCat(cat);
    setFormData({
      name: item.name || "",
      categoryId: item.categoryId || "",
      quantity: item.quantity || 0,
      minThreshold: item.minThreshold || 0,
      values: item.values || {},
    });
    setShowEditModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      showError("Name is required");
      return;
    }
    if (!formData.categoryId) {
      showError("Select a category");
      return;
    }
    if (Number(formData.quantity) < 0) {
      showError("Quantity cannot be negative");
      return;
    }
    if (Number(formData.minThreshold) < 0) {
      showError("Minimum Threshold cannot be negative");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: Number(formData.categoryId),
        name: formData.name.trim(),
        quantity: Number(formData.quantity) || 0,
        minThreshold: Number(formData.minThreshold) || 0,
        values: formData.values || {},
      };
      if (showEditModal && editingItem) {
        await updateStockItem(editingItem.id, payload);
        showSuccess("Stock item updated successfully");
        setShowEditModal(false);
      } else {
        await createStockItem(payload);
        showSuccess("Stock item created successfully");
        setShowAddModal(false);
      }
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save item"));
    } finally {
      setSaving(false);
    }
  };

  const onFieldChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      values: { ...(prev.values || {}), [key]: value },
    }));
  };

  const handleDelete = (item) => {
    showConfirm({
      title: "Delete Stock Item",
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await deleteStockItem(item.id);
          showSuccess("Stock item deleted successfully");
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          loadData();
        } catch (e) {
          showError(extractApiErrorMessage(e, "Failed to delete item"));
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    showConfirm({
      title: "Delete Selected Stock Items",
      message: `Are you sure you want to delete ${selectedIds.size} stock items? This action cannot be undone.`,
      confirmLabel: "Delete All",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await Promise.all(Array.from(selectedIds).map((id) => deleteStockItem(id)));
          showSuccess(`Successfully deleted ${selectedIds.size} stock items`);
          setSelectedIds(new Set());
          loadData();
        } catch (e) {
          showError("Failed to delete some stock items");
        }
      },
    });
  };

  // Export handlers
  const exportExcel = () => {
    const csvContent = [
      ["ID", "Name", "Category", "Quantity", "Min Threshold", "Status"],
      ...filteredRows.map((r) => [
        r.id,
        r.name,
        categories.find((c) => c.id === r.categoryId)?.name || "N/A",
        r.quantity,
        r.minThreshold,
        r.quantity <= r.minThreshold ? "Low Stock" : "Normal",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock-items-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCsv = exportExcel;

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text("Stock Items List", 14, 15);
    const headers = [["ID", "Name", "Category", "Quantity", "Min Threshold", "Status"]];
    const data = filteredRows.map((r) => [
      r.id,
      r.name,
      categories.find((c) => c.id === r.categoryId)?.name || "N/A",
      r.quantity,
      r.minThreshold,
      r.quantity <= r.minThreshold ? "Low Stock" : "Normal",
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20,
      styles: { fontSize: 9 },
    });
    doc.save(`stock-items-${Date.now()}.pdf`);
  };

  // Search & filter logic
  const filteredRows = useMemo(() => {
    let result = items;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(q) ||
          String(r.id).includes(q)
      );
    }
    if (categoryFilter) {
      result = result.filter((r) => String(r.categoryId) === String(categoryFilter));
    }
    return result;
  }, [items, search, categoryFilter]);

  // Pagination logic
  const totalRows = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredRows.slice(pageOffset, pageOffset + pageSize),
    [filteredRows, pageOffset, pageSize]
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage]);

  // Selection handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleRowSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      <div className="content">
        {/* Custom White Header Card */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Stock Items</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      Home
                    </Link>
                  </li>
                  <li className="breadcrumb-item" style={{ color: "#64748b" }}>Stocks</li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Items</li>
                </ol>
              </nav>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                onClick={() => navigate("/stocks/item/import")}
                style={{ fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-upload" style={{ fontSize: "1.1rem" }}></i>
                Import Items
              </button>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleOpenAddModal}
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0">
              <div className="position-relative" style={{ minWidth: "200px" }}>
                <input
                  className="form-control"
                  style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                  value={search}
                  placeholder="Search items..."
                  onChange={(e) => setSearch(e.target.value)}
                />
                <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
              </div>

              <select
                className="form-select"
                style={{ height: 42, borderRadius: 10, fontSize: "0.95rem", minWidth: "180px" }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="dropdown">
                <button
                  className="btn btn-outline-export dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  id="exportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                >
                  <i className="ti ti-download" style={{ fontSize: "1rem" }} />
                  Export
                </button>
                <ul className="dropdown-menu shadow border-0" aria-labelledby="exportDropdown">
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportExcel}>
                      Excel
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportCsv}>
                      CSV
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item py-2 text-start" onClick={exportPdf}>
                      PDF
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="card-body p-0">
            <div className="table-responsive" style={{ overflowX: "auto" }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="thead-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Min Threshold</th>
                    <th>Status</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">No stock items found</td>
                    </tr>
                  ) : (
                    pagedRows.map((item) => {
                      const isLowStock = Number(item.quantity) <= Number(item.minThreshold);
                      return (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleRowSelection(item.id)}
                            />
                          </td>
                          <td className="fw-semibold text-dark">{item.name}</td>
                          <td>{categories.find((c) => c.id === item.categoryId)?.name || "N/A"}</td>
                          <td className="fw-bold">{item.quantity}</td>
                          <td>{item.minThreshold}</td>
                          <td>
                            <span
                              className={`badge ${isLowStock ? "bg-danger" : "bg-success"}`}
                              style={{ padding: "6px 10px", borderRadius: "6px" }}
                            >
                              {isLowStock ? "Low Stock" : "Normal"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeActionsRow?.id === item.id) {
                                  setActiveActionsRow(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setActionsMenuPos({
                                    top: rect.top + window.scrollY,
                                    left: rect.right + window.scrollX,
                                  });
                                  setActiveActionsRow(item);
                                }
                              }}
                            >
                              <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="d-flex flex-wrap align-items-center justify-content-between p-3 gap-3 border-top">
              <span className="entries-info text-muted small">
                {totalRows === 0
                  ? "Showing 0 to 0 of 0 entries"
                  : `Showing ${pageOffset + 1} to ${Math.min(pageOffset + pageSize, totalRows)} of ${totalRows} entries`}
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

                {Array.from({ length: pageCount }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === pageNum ? "active" : "btn-light"}`}
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={clampedPage >= pageCount}
                >
                  <i className="ti ti-chevron-right" />
                </button>
              </div>

              <PageSizeSelector pageSize={pageSize} setPageSize={setPageSize} setPage={setPage} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Kebab Actions Portal */}
      {activeActionsRow && createPortal(
        <div
          className="floating-actions-menu shadow-lg border"
          style={{
            position: "absolute",
            top: actionsMenuPos.top,
            left: actionsMenuPos.left,
            transform: "translate(-100%, -100%) translateY(-5px)",
            zIndex: 9999,
            background: "#fff",
            borderRadius: 8,
            padding: "6px 0",
            minWidth: 140
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleOpenEditModal(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Item
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleDelete(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Item
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-primary"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              setActiveActionsRow(null);
              navigate("/stocks/requests", { state: { requestItem: activeActionsRow } });
            }}
          >
            <i className="ti ti-git-pull-request" style={{ fontSize: "1rem", color: "#3b82f6" }} /> Request Stock
          </button>
        </div>,
        document.body
      )}

      {/* Floating Bulk Operations Bar */}
      {selectedIds.size > 0 && (
        <div
          className="position-fixed start-50 translate-middle-x d-flex align-items-center justify-content-between gap-3 shadow-lg px-4 py-3 bg-dark text-white"
          style={{
            bottom: 24,
            borderRadius: 16,
            zIndex: 1040,
            minWidth: 400,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary text-white" style={{ fontSize: "0.9rem", padding: "6px 10px" }}>
              {selectedIds.size}
            </span>
            <span className="fw-medium text-white">selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", border: "none" }}
              onClick={handleBulkDelete}
            >
              <i className="ti ti-trash" /> Delete Selected
            </button>
            <button
              className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
              style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)" }}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Stock Item</h4>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.categoryId}
                        onChange={(e) => {
                          const cat = categories.find((c) => String(c.id) === String(e.target.value)) || null;
                          setSelectedCat(cat);
                          setFormData((p) => ({ ...p, categoryId: e.target.value, values: {} }));
                        }}
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Enter item name"
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Minimum Threshold</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={formData.minThreshold}
                        onChange={(e) => setFormData((p) => ({ ...p, minThreshold: e.target.value }))}
                        required
                      />
                    </div>

                    {selectedCat && renderField(selectedCat, formData.values, onFieldChange)}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Stock Item</h4>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.categoryId}
                        onChange={(e) => {
                          const cat = categories.find((c) => String(c.id) === String(e.target.value)) || null;
                          setSelectedCat(cat);
                          setFormData((p) => ({ ...p, categoryId: e.target.value, values: {} }));
                        }}
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Enter item name"
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Minimum Threshold</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={formData.minThreshold}
                        onChange={(e) => setFormData((p) => ({ ...p, minThreshold: e.target.value }))}
                        required
                      />
                    </div>

                    {selectedCat && renderField(selectedCat, formData.values, onFieldChange)}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Backdrops */}
      {(showAddModal || showEditModal) && <div className="modal-backdrop fade show" />}

      {confirmDialog}
    </>
  );
}
