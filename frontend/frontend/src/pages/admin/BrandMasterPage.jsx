import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../../api/brandsApi";
import { getStockCategories } from "../../api/stocksApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

const initialForm = {
  stockCategoryId: "",
  brandName: "",
};

export default function BrandMasterPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [emptyNoticeShown, setEmptyNoticeShown] = useState(false);

  // Selection state
  const [selectedBrandIds, setSelectedBrandIds] = useState(new Set());

  // Kebab row actions state
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter drawer state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    stockCategory: "",
  });

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

  const load = async () => {
    setLoading(true);
    try {
      const data = await getBrands();
      setRows(Array.isArray(data) ? data : []);
      if ((!data || data.length === 0) && !emptyNoticeShown) {
        showSuccess("No brands added yet", { title: "Brands" });
        setEmptyNoticeShown(true);
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 500) {
        setRows([]);
        if (!emptyNoticeShown) {
          showSuccess("No brands added yet", { title: "Brands" });
          setEmptyNoticeShown(true);
        }
      } else {
        setRows([]);
        const message = extractApiErrorMessage(e, "Failed to load brands");
        showError(message, { title: "Brands" });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getStockCategories();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      console.warn("Failed to load categories", e);
    }
  };

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  const filteredRows = useMemo(() => {
    let result = rows;

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          (r.brandName || "").toLowerCase().includes(q) ||
          (r.categoryName || "").toLowerCase().includes(q)
      );
    }

    if (filters.stockCategory) {
      result = result.filter((r) => String(r.stockCategoryId) === String(filters.stockCategory));
    }

    return result;
  }, [rows, search, filters]);

  // Pagination calculations
  const totalRows = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredRows.slice(pageOffset, pageOffset + pageSize),
    [filteredRows, pageOffset, pageSize],
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage]);

  // Selection handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedBrandIds.has(id));
    setSelectedBrandIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleBrandSelection = (id) => {
    setSelectedBrandIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Export handlers
  const exportCsv = () => {
    const targetRows = selectedBrandIds.size > 0
      ? filteredRows.filter((b) => selectedBrandIds.has(b.id))
      : filteredRows;

    const headers = ["Category", "Brand Name"];
    const body = targetRows.map((row) => [
      row.categoryName || "—",
      row.brandName || "—",
    ]);
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brands-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedBrandIds.size > 0
      ? filteredRows.filter((b) => selectedBrandIds.has(b.id))
      : filteredRows;

    const headers = ["Category", "Brand Name"];
    const body = targetRows.map((row) => [
      row.categoryName || "—",
      row.brandName || "—",
    ]);
    
    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Brands</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    template += `<body><table><thead><tr>`;
    headers.forEach((h) => {
      template += `<th>${h}</th>`;
    });
    template += `</tr></thead><tbody>`;
    body.forEach((r) => {
      template += `<tr>`;
      r.forEach((c) => {
        template += `<td>${c}</td>`;
      });
      template += `</tr>`;
    });
    template += `</tbody></table></body></html>`;

    const blob = new Blob([template], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brands-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedBrandIds.size > 0
      ? filteredRows.filter((b) => selectedBrandIds.has(b.id))
      : filteredRows;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Brands Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["Category", "Brand Name"]];
    const body = targetRows.map((row) => [
      row.categoryName || "—",
      row.brandName || "—",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 9 },
    });

    doc.save(`brands-${Date.now()}.pdf`);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.brandName.trim()) {
      showError("Brand name is required", { title: "Brands" });
      return;
    }
    if (!form.stockCategoryId) {
      showError("Category is required", { title: "Brands" });
      return;
    }
    setSaving(true);
    try {
      await createBrand({
        stockCategoryId: form.stockCategoryId,
        brandName: form.brandName.trim(),
      });
      setForm(initialForm);
      showSuccess("Brand added successfully", { title: "Brands" });
      setShowAddModal(false);
      await load();
    } catch (e2) {
      const message = extractApiErrorMessage(e2, "Failed to add brand");
      showError(message, { title: "Brands" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditForm({
      stockCategoryId: row.stockCategoryId || "",
      brandName: row.brandName || "",
    });
    setSelectedId(row.id);
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.brandName.trim()) {
      showError("Brand name is required", { title: "Brands" });
      return;
    }
    if (!editForm.stockCategoryId) {
      showError("Category is required", { title: "Brands" });
      return;
    }
    setSaving(true);
    try {
      await updateBrand(selectedId, {
        stockCategoryId: editForm.stockCategoryId,
        brandName: editForm.brandName.trim(),
      });
      showSuccess("Brand updated successfully", { title: "Brands" });
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      const message = extractApiErrorMessage(e2, "Failed to update brand");
      showError(message, { title: "Brands" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row);
    setSelectedId(row.id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deleteBrand(selectedId);
      showSuccess("Brand deleted", { title: "Brands" });
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      const message = extractApiErrorMessage(e2, "Failed to delete brand");
      showError(message, { title: "Brands" });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBrandIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete the selected ${selectedBrandIds.size} brands?`)) {
      setSaving(true);
      try {
        await Promise.all(Array.from(selectedBrandIds).map((id) => deleteBrand(id)));
        showSuccess(`${selectedBrandIds.size} brands deleted successfully`);
        setSelectedBrandIds(new Set());
        await load();
      } catch (e) {
        showError("Failed to delete some brands");
      } finally {
        setSaving(false);
      }
    }
  };

  const closeBtn = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );

  return (
    <>
      <div className="content">
        {/* Styled Card Header containing Title, Breadcrumbs and Add Button like Leads page */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Brand Management</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/stocks/brands" style={{ color: "#64748b", textDecoration: "none" }}>Brand Management</Link>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Brands</li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
                onClick={() => {
                  setForm(initialForm);
                  setShowAddModal(true);
                }}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
                Add Brand
              </button>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls bar inside the card, above the table */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom bg-white">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search brand or category..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className={`btn btn-outline-filter d-flex align-items-center gap-2 ${filterOpen ? "active" : ""}`}
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <i className="ti ti-filter" style={{ fontSize: "1rem" }} />
                Filters
              </button>

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

          {/* Filter Drawer */}
          {filterOpen && (
            <div className="p-3 border-bottom" style={{ backgroundColor: "#f8fafc" }}>
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Stock Category</label>
                  <select
                    className="form-select custom-filter-select"
                    style={{ height: 42, borderRadius: 8 }}
                    value={filters.stockCategory}
                    onChange={(e) => setFilters((p) => ({ ...p, stockCategory: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-filter-reset"
                  style={{ height: 40, padding: "0 20px", borderRadius: 8, fontWeight: "500" }}
                  onClick={() => setFilters({ stockCategory: "" })}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="thead-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={pagedRows.length > 0 && pagedRows.every((r) => selectedBrandIds.has(r.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: "50px" }}>#</th>
                    <th>Category</th>
                    <th>Brand Name</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">No brands found</td>
                    </tr>
                  ) : (
                    pagedRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedBrandIds.has(row.id)}
                            onChange={() => toggleBrandSelection(row.id)}
                          />
                        </td>
                        <td>{pageOffset + idx + 1}</td>
                        <td>{row.categoryName || "—"}</td>
                        <td className="fw-semibold text-dark">{row.brandName || "—"}</td>
                        <td>
                          <button
                            className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeActionsRow?.id === row.id) {
                                setActiveActionsRow(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActionsMenuPos({
                                  top: rect.top + window.scrollY,
                                  left: rect.right + window.scrollX,
                                });
                                setActiveActionsRow(row);
                              }
                            }}
                          >
                            <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top bg-white">
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

      {/* Add Brand Modal */}
      {showAddModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Brand</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                    {closeBtn}
                  </button>
                </div>
                <form onSubmit={handleAdd}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Category <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={form.stockCategoryId}
                            onChange={(e) => setForm((p) => ({ ...p, stockCategoryId: e.target.value }))}
                          >
                            <option value="">-- select --</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Brand Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.brandName}
                            onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Add"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Edit Brand Modal */}
      {showEditModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Brand</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowEditModal(false)}>
                    {closeBtn}
                  </button>
                </div>
                <form onSubmit={handleEdit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Category <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={editForm.stockCategoryId}
                            onChange={(e) => setEditForm((p) => ({ ...p, stockCategoryId: e.target.value }))}
                          >
                            <option value="">-- select --</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Brand Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.brandName}
                            onChange={(e) => setEditForm((p) => ({ ...p, brandName: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Confirm Delete</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowDeleteModal(false)}>
                    {closeBtn}
                  </button>
                </div>
                <div className="modal-body">
                  Are you sure you want to delete "{deleteTarget?.brandName}"?
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

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
            minWidth: 150
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              openEdit(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Brand
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              confirmDelete(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Brand
          </button>
        </div>,
        document.body
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedBrandIds.size > 0 && (
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
              {selectedBrandIds.size}
            </span>
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>brands selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "#dc2626", color: "#ffffff", border: "none" }}
              onClick={handleBulkDelete}
              disabled={saving}
            >
              <i className="ti ti-trash" /> Delete
            </button>
            <button
              className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
              style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)" }}
              onClick={() => setSelectedBrandIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}
