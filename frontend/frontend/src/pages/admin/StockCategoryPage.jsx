import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getStockCategories,
  deleteStockCategory,
} from "../../api/stocksApi";
import { getVendorTypes } from "../../api/vendorTypesApi";
import { useToast } from "../../components/system/ToastProvider";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import "./LeadsPage.css";

export default function StockCategoryPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const [categories, setCategories] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Selection, Pagination
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getStockCategories();
      const types = await getVendorTypes();
      setCategories(cats);
      setVendorTypes(Array.isArray(types) ? types : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    navigate("/stocks/categories/add");
  };

  const handleOpenEditModal = (cat) => {
    navigate(`/stocks/categories/edit/${cat.id}`);
  };

  const handleDelete = (cat) => {
    showConfirm({
      title: "Delete Stock Category",
      message: `Are you sure you want to delete "${cat.name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await deleteStockCategory(cat.id);
          showSuccess("Category deleted successfully");
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(cat.id);
            return next;
          });
          loadData();
        } catch (e) {
          showError(extractApiErrorMessage(e, "Failed to delete category"));
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    showConfirm({
      title: "Delete Selected Categories",
      message: `Are you sure you want to delete ${selectedIds.size} stock categories? This action cannot be undone.`,
      confirmLabel: "Delete All",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await Promise.all(Array.from(selectedIds).map((id) => deleteStockCategory(id)));
          showSuccess(`Successfully deleted ${selectedIds.size} categories`);
          setSelectedIds(new Set());
          loadData();
        } catch (e) {
          showError("Failed to delete some categories");
        }
      },
    });
  };

  // Export handlers
  const exportExcel = () => {
    const csvContent = [
      ["ID", "Name", "Allowed Vendor Type", "Fields Count"],
      ...filteredRows.map((r) => {
        const vtId = r.allowedVendorTypeIds?.[0];
        const vt = vendorTypes.find((v) => v.id === vtId);
        return [
          r.id,
          r.name,
          vt ? vt.typeName : "None",
          r.fields?.length || 0,
        ];
      }),
    ]
      .map((e) => e.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock-categories-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCsv = exportExcel;

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text("Stock Categories List", 14, 15);
    const headers = [["ID", "Name", "Allowed Vendor Type", "Fields Count"]];
    const data = filteredRows.map((r) => {
      const vtId = r.allowedVendorTypeIds?.[0];
      const vt = vendorTypes.find((v) => v.id === vtId);
      return [
        r.id,
        r.name,
        vt ? vt.typeName : "None",
        r.fields?.length || 0,
      ];
    });

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20,
      styles: { fontSize: 9 },
    });
    doc.save(`stock-categories-${Date.now()}.pdf`);
  };

  // Search & filter
  const filteredRows = useMemo(() => {
    let result = categories;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(q) ||
          String(r.id).includes(q)
      );
    }
    return result;
  }, [categories, search]);

  // Pagination
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

  // Selection
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
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Stock Categories</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      Home
                    </Link>
                  </li>
                  <li className="breadcrumb-item" style={{ color: "#64748b" }}>Stocks</li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Categories</li>
                </ol>
              </nav>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleOpenAddModal}
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Main Categories Table Card */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="position-relative" style={{ minWidth: "260px" }}>
              <input
                className="form-control"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search categories..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
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
                    <th>Allowed Vendor Type</th>
                    <th>Fields Count</th>
                    <th style={{ width: "100px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">No stock categories found</td>
                    </tr>
                  ) : (
                    pagedRows.map((cat) => {
                      const vtId = cat.allowedVendorTypeIds?.[0];
                      const vt = vendorTypes.find((v) => v.id === vtId);
                      return (
                        <tr key={cat.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.has(cat.id)}
                              onChange={() => toggleRowSelection(cat.id)}
                            />
                          </td>
                          <td className="fw-semibold text-dark">{cat.name}</td>
                          <td>{vt ? vt.typeName : "None"}</td>
                          <td>{cat.fields?.length || 0} fields</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                                style={{ borderRadius: 8, width: 32, height: 32, padding: 0 }}
                                onClick={() => navigate(`/stocks/categories/edit/${cat.id}`)}
                                title="Edit"
                              >
                                <i className="ti ti-edit" />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                                style={{ borderRadius: 8, width: 32, height: 32, padding: 0 }}
                                onClick={() => handleDelete(cat)}
                                title="Delete"
                              >
                                <i className="ti ti-trash" />
                              </button>
                            </div>
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

      {confirmDialog}
    </>
  );
}
