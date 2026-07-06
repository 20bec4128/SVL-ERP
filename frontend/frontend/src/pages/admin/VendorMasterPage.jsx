import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getVendors,
  updateVendor,
  deleteVendor,
} from "../../api/vendorsApi";
import { getVendorTypes } from "../../api/vendorTypesApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import useConfirmDialog from "../../components/system/useConfirmDialog";
import AddVendorModal from "./AddVendorModal";
import EditVendorModal from "./EditVendorModal";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

export default function VendorMasterPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [productsTarget, setProductsTarget] = useState(null);
  const [popupMode, setPopupMode] = useState("types");

  // Selection state
  const [selectedVendorIds, setSelectedVendorIds] = useState(new Set());

  // Kebab row actions state
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter drawer state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    vendorType: "",
    productCategory: "",
    status: "",
  });
  
  // Lookup data
  const [vendorTypes, setVendorTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

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

  // Load master data
  const loadMasterData = async () => {
    try {
      const [types, cats, allTypes] = await Promise.all([
        getVendorTypes(),
        getServiceCategories(),
        getServiceTypes(),
      ]);
      setVendorTypes(Array.isArray(types) ? types : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setServiceTypes(Array.isArray(allTypes) ? allTypes : []);
    } catch (e) {
      console.warn("Failed to load master data", e);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getVendors();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load vendors"), { title: "Vendors" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadMasterData();
  }, []);

  const filteredRows = useMemo(() => {
    let result = rows;
    
    // search
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((r) =>
        (r.vendorName || "").toLowerCase().includes(q) ||
        (r.contactPerson || "").toLowerCase().includes(q) ||
        (r.officialEmail || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q)
      );
    }

    // Vendor Type filter
    if (filters.vendorType) {
      result = result.filter((r) => {
        const ids = Array.isArray(r?.vendorTypeIds) ? r.vendorTypeIds : [];
        return ids.some((id) => String(id) === String(filters.vendorType));
      });
    }

    // Product Category filter
    if (filters.productCategory) {
      result = result.filter((r) => {
        const ids = Array.isArray(r?.productIds) ? r.productIds : [];
        return ids.some((id) => String(id) === String(filters.productCategory));
      });
    }

    // Status filter
    if (filters.status) {
      result = result.filter((r) => {
        const s = (r.status || "active").toLowerCase();
        return s === filters.status.toLowerCase();
      });
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

  // Selection toggle handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedVendorIds.has(id));
    setSelectedVendorIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleVendorSelection = (id) => {
    setSelectedVendorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Export actions
  const exportCsv = () => {
    const targetRows = selectedVendorIds.size > 0
      ? filteredRows.filter((r) => selectedVendorIds.has(r.id))
      : filteredRows;

    const headers = [
      "Vendor Name",
      "Contact Person",
      "Mobile",
      "Official Email",
      "Deals With",
      "Status",
    ];
    const body = targetRows.map((row) => [
      row.vendorName || "",
      row.contactPerson || "",
      row.phone || "",
      row.officialEmail || "",
      row.dealsWith || "",
      row.status || "active",
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
    link.download = `vendors-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedVendorIds.size > 0
      ? filteredRows.filter((r) => selectedVendorIds.has(r.id))
      : filteredRows;

    const headers = [
      "Vendor Name",
      "Contact Person",
      "Mobile",
      "Official Email",
      "Deals With",
      "Status",
    ];
    const body = targetRows.map((row) => [
      row.vendorName || "",
      row.contactPerson || "",
      row.phone || "",
      row.officialEmail || "",
      row.dealsWith || "",
      row.status || "active",
    ]);
    
    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Vendors</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
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
    link.download = `vendors-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedVendorIds.size > 0
      ? filteredRows.filter((r) => selectedVendorIds.has(r.id))
      : filteredRows;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Vendors Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [[
      "Vendor Name",
      "Contact Person",
      "Mobile",
      "Official Email",
      "Deals With",
      "Status",
    ]];

    const body = targetRows.map((row) => [
      row.vendorName || "",
      row.contactPerson || "",
      row.phone || "",
      row.officialEmail || "",
      row.dealsWith || "",
      row.status || "active",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 8 },
    });

    doc.save(`vendors-${Date.now()}.pdf`);
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
      await deleteVendor(selectedId);
      showSuccess("Vendor deleted successfully", { title: "Vendors" });
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      const msg = extractApiErrorMessage(e2, "Failed to delete vendor");
      showError(msg, { title: "Vendors" });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVendorIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete the selected ${selectedVendorIds.size} vendors?`)) {
      setSaving(true);
      try {
        await Promise.all(Array.from(selectedVendorIds).map((id) => deleteVendor(id)));
        showSuccess(`${selectedVendorIds.size} vendors deleted successfully`);
        setSelectedVendorIds(new Set());
        await load();
      } catch (e) {
        showError("Failed to delete some vendors");
      } finally {
        setSaving(false);
      }
    }
  };

  const buildVendorUpdatePayload = (row, nextStatus) => ({
    vendorName : row.vendorName || "",
    contactPerson: row.contactPerson || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    materialsSupplied: row.materialsSupplied || [],
    countryCode: row.countryCode || "",
    officialEmail: row.officialEmail || "",
    secondaryEmail: row.secondaryEmail || "",
    vendorTypeIds: row.vendorTypeIds || [],
    productIds: row.productIds || [],
    brandIds: row.brandIds || [],
    dealsWith: row.dealsWith || "",
    internalRepresentative: row.internalRepresentative || "",
    relationshipSince: row.relationshipSince ? row.relationshipSince : null,
    companyWebsite: row.companyWebsite || "",
    countryOfRegistration: row.countryOfRegistration || "",
    companyRegistrationNo: row.companyRegistrationNo || "",
    gstNumber: row.gstNumber || "",
    panNumber: row.panNumber || "",
    companyAddress: row.companyAddress || "",
    bankDetails: Array.isArray(row.bankDetails) ? row.bankDetails : [],
    status: nextStatus,
  });

  const toggleVendorStatus = async (row) => {
    const current = (row.status || "active").toLowerCase();
    const nextStatus = current === "active" ? "inactive" : "active";

    setStatusSavingId(row.id);
    try {
      await updateVendor(row.id, buildVendorUpdatePayload(row, nextStatus));
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r))
      );
      showSuccess(`Vendor marked ${nextStatus}`, { title: "Vendors" });
    } catch (e) {
      const msg = extractApiErrorMessage(e, "Failed to update status");
      showError(msg, { title: "Vendors" });
    } finally {
      setStatusSavingId(null);
    }
  };

  const getSelectedVendorTypes = (row) => {
    const ids = Array.isArray(row?.vendorTypeIds) ? row.vendorTypeIds : [];
    if (ids.length === 0) return [];
    return ids
      .map((id) => vendorTypes.find((type) => Number(type.id) === Number(id)))
      .filter(Boolean)
      .map((type) => ({
        id: type.id,
        name: type.typeName || "-",
      }));
  };

  const getProductNames = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return "-";
    return ids
      .map((id) => categories.find((cat) => Number(cat.id) === Number(id))?.name || "")
      .filter(Boolean)
      .join(", ");
  };

  const getSelectedServiceItems = (row) => {
    const brandIds = Array.isArray(row?.brandIds) ? row.brandIds : [];
    if (brandIds.length === 0) return [];

    return brandIds
      .map((id) => {
        const selected = serviceTypes.find((type) => Number(type.id) === Number(id));
        if (!selected) return null;

        if (selected.parentId) {
          const parent = serviceTypes.find((type) => Number(type.id) === Number(selected.parentId));
          const category = categories.find(
            (cat) => Number(cat.id) === Number(parent?.categoryId ?? selected.categoryId),
          );
          return {
            id: selected.id,
            categoryName: category?.name || "-",
            typeName: parent?.name || "-",
            subTypeName: selected.name || "-",
          };
        }

        const category = categories.find((cat) => Number(cat.id) === Number(selected.categoryId));
        return {
          id: selected.id,
          categoryName: category?.name || "-",
          typeName: selected.name || "-",
          subTypeName: "-",
        };
      })
      .filter(Boolean);
  };

  const openProductsModal = (row, mode) => {
    setPopupMode(mode);
    setProductsTarget(row);
    setShowProductsModal(true);
  };

  return (
    <>
      <div className="content">
        {/* Styled Card Header containing Title, Breadcrumbs and Add Button like Leads page */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Vendor Management</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/stocks/vendors" style={{ color: "#64748b", textDecoration: "none" }}>Vendor Management</Link>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Vendors</li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
                onClick={() => setShowAddModal(true)}
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
                Add Vendor
              </button>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls bar inside the card, above the table */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search vendor..."
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

          {/* Filter Drawer inside the card */}
          {filterOpen && (
            <div className="p-3 border-bottom" style={{ backgroundColor: "#f8fafc" }}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Vendor Type</label>
                  <select
                    className="form-select custom-filter-select"
                    style={{ height: 42, borderRadius: 8 }}
                    value={filters.vendorType}
                    onChange={(e) => setFilters((p) => ({ ...p, vendorType: e.target.value }))}
                  >
                    <option value="">All Vendor Types</option>
                    {vendorTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.typeName}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Product Category</label>
                  <select
                    className="form-select custom-filter-select"
                    style={{ height: 42, borderRadius: 8 }}
                    value={filters.productCategory}
                    onChange={(e) => setFilters((p) => ({ ...p, productCategory: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Status</label>
                  <select
                    className="form-select custom-filter-select"
                    style={{ height: 42, borderRadius: 8 }}
                    value={filters.status}
                    onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-filter-reset"
                  style={{ height: 40, padding: "0 20px", borderRadius: 8, fontWeight: "500" }}
                  onClick={() => setFilters({ vendorType: "", productCategory: "", status: "" })}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          <div className="card-body p-0">
            <div
              className="custom-datatable-filter table-responsive"
              style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
            >
              <table className="table table-hover align-middle mb-0">
                <thead className="thead-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={pagedRows.length > 0 && pagedRows.every((r) => selectedVendorIds.has(r.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: "50px" }}>#</th>
                    <th>Vendor / Company Name</th>
                    <th>Mobile</th>
                    <th>Vendor / Company Types</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">No vendors found</td>
                    </tr>
                  ) : (
                    pagedRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedVendorIds.has(row.id)}
                            onChange={() => toggleVendorSelection(row.id)}
                          />
                        </td>
                        <td>{pageOffset + idx + 1}</td>
                        <td className="fw-semibold text-dark">{row.vendorName || "—"}</td>
                        <td>{row.phone || "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openProductsModal(row, "types")}
                          >
                            View
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openProductsModal(row, "products")}
                          >
                            View
                          </button>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={(row.status || "active").toLowerCase() === "active"}
                                disabled={statusSavingId === row.id}
                                onChange={() => toggleVendorStatus(row)}
                                aria-label="Toggle vendor status"
                              />
                            </div>
                            <span
                              className={`badge ${
                                (row.status || "").toLowerCase() === "active"
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {(row.status || "active").toLowerCase() === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                        </td>
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
          <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top">
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

      <AddVendorModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
      />
      <EditVendorModal
        open={!!editVendor}
        vendor={editVendor}
        onClose={() => setEditVendor(null)}
        onUpdated={load}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Confirm Delete</h4>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete vendor:{" "}
                    <strong>{deleteTarget?.vendorName}</strong>?
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Product Details Modal */}
      {showProductsModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">
                    {popupMode === "types" ? "Vendor Type Details" : "Product Details"}: {productsTarget?.vendorName || "Vendor"}
                  </h4>
                </div>
                <div className="modal-body">
                  {popupMode === "types" ? (
                    <div className="mb-3">
                      <h6 className="mb-2">Vendor / Company Types</h6>
                      {getSelectedVendorTypes(productsTarget).length === 0 ? (
                        <div>-</div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {getSelectedVendorTypes(productsTarget).map((item) => (
                            <span key={item.id} className="badge bg-light text-dark">
                              {item.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <h6 className="mb-2">Service Categories</h6>
                        <div>{getProductNames(productsTarget?.productIds)}</div>
                      </div>
                      <div>
                        <h6 className="mb-2">Selected Types / Sub-Types</h6>
                        {getSelectedServiceItems(productsTarget).length === 0 ? (
                          <div>-</div>
                        ) : (
                          <div
                            className="table-responsive"
                            style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
                          >
                            <table className="table table-sm table-bordered mb-0">
                              <thead>
                                <tr>
                                  <th style={{ width: "50px" }}>#</th>
                                  <th>Category</th>
                                  <th>Type</th>
                                  <th>Sub-Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getSelectedServiceItems(productsTarget).map((item, index) => (
                                  <tr key={`${item.id}-${index}`}>
                                    <td>{index + 1}</td>
                                    <td>{item.categoryName}</td>
                                    <td>{item.typeName}</td>
                                    <td>{item.subTypeName}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowProductsModal(false);
                      setProductsTarget(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
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
          <Link
            to={`/stocks/vendors/${activeActionsRow.id}`}
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem", textDecoration: "none" }}
            onClick={() => setActiveActionsRow(null)}
          >
            <i className="ti ti-eye" style={{ fontSize: "1rem", color: "#64748b" }} /> View Details
          </Link>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              setEditVendor(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Vendor
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              confirmDelete(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Vendor
          </button>
        </div>,
        document.body
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedVendorIds.size > 0 && (
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
              {selectedVendorIds.size}
            </span>
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>vendors selected</span>
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
              onClick={() => setSelectedVendorIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}
