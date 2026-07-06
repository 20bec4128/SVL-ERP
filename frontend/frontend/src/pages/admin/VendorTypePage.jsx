import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getVendorTypes,
  createVendorType,
  updateVendorType,
  deleteVendorType,
} from "../../api/vendorTypesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

const initialForm = { typeName: "" };

export default function VendorTypePage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
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
  const [selectedTypeIds, setSelectedTypeIds] = useState(new Set());

  // Kebab row actions state
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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
      const data = await getVendorTypes();
      setRows(Array.isArray(data) ? data : []);
      if ((!data || data.length === 0) && !emptyNoticeShown) {
        showSuccess("No vendor types added yet", { title: "Vendor Types" });
        setEmptyNoticeShown(true);
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 500) {
        setRows([]);
        if (!emptyNoticeShown) {
          showSuccess("No vendor types added yet", { title: "Vendor Types" });
          setEmptyNoticeShown(true);
        }
      } else {
        setRows([]);
        const message = extractApiErrorMessage(e, "Failed to load vendor types");
        showError(message, { title: "Vendor Types" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => (r.typeName || "").toLowerCase().includes(q));
  }, [rows, search]);

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
    const allSelectedOnPage = pageIds.every((id) => selectedTypeIds.has(id));
    setSelectedTypeIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleTypeSelection = (id) => {
    setSelectedTypeIds((prev) => {
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
    const targetRows = selectedTypeIds.size > 0
      ? filteredRows.filter((t) => selectedTypeIds.has(t.id))
      : filteredRows;

    const headers = ["Type Name"];
    const body = targetRows.map((row) => [
      row.typeName || "—",
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
    link.download = `vendor-types-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedTypeIds.size > 0
      ? filteredRows.filter((t) => selectedTypeIds.has(t.id))
      : filteredRows;

    const headers = ["Type Name"];
    const body = targetRows.map((row) => [
      row.typeName || "—",
    ]);
    
    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Vendor Types</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
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
    link.download = `vendor-types-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedTypeIds.size > 0
      ? filteredRows.filter((t) => selectedTypeIds.has(t.id))
      : filteredRows;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Vendor Types Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["Type Name"]];
    const body = targetRows.map((row) => [
      row.typeName || "—",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 9 },
    });

    doc.save(`vendor-types-${Date.now()}.pdf`);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.typeName.trim()) {
      showError("Type name is required", { title: "Vendor Types" });
      return;
    }
    setSaving(true);
    try {
      await createVendorType({ typeName: form.typeName.trim() });
      setForm(initialForm);
      showSuccess("Vendor type added successfully", { title: "Vendor Types" });
      setShowAddModal(false);
      await load();
    } catch (e2) {
      const message = extractApiErrorMessage(e2, "Failed to add vendor type");
      showError(message, { title: "Vendor Types" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditForm({ typeName: row.typeName || "" });
    setSelectedId(row.id);
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.typeName.trim()) {
      showError("Type name is required", { title: "Vendor Types" });
      return;
    }
    setSaving(true);
    try {
      await updateVendorType(selectedId, { typeName: editForm.typeName.trim() });
      showSuccess("Vendor type updated successfully", { title: "Vendor Types" });
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      const message = extractApiErrorMessage(e2, "Failed to update vendor type");
      showError(message, { title: "Vendor Types" });
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
      await deleteVendorType(selectedId);
      showSuccess("Vendor type deleted", { title: "Vendor Types" });
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      const message = extractApiErrorMessage(e2, "Failed to delete vendor type");
      showError(message, { title: "Vendor Types" });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTypeIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete the selected ${selectedTypeIds.size} vendor types?`)) {
      setSaving(true);
      try {
        await Promise.all(Array.from(selectedTypeIds).map((id) => deleteVendorType(id)));
        showSuccess(`${selectedTypeIds.size} vendor types deleted successfully`);
        setSelectedTypeIds(new Set());
        await load();
      } catch (e) {
        showError("Failed to delete some vendor types");
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
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Vendor Types</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/stocks/vendor-types" style={{ color: "#64748b", textDecoration: "none" }}>Vendor Types</Link>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Vendor Types</li>
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
                Add Type
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
                placeholder="Search type..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>

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

          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="thead-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={pagedRows.length > 0 && pagedRows.every((r) => selectedTypeIds.has(r.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: "50px" }}>#</th>
                    <th>Type Name</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">No vendor types found</td>
                    </tr>
                  ) : (
                    pagedRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedTypeIds.has(row.id)}
                            onChange={() => toggleTypeSelection(row.id)}
                          />
                        </td>
                        <td>{pageOffset + idx + 1}</td>
                        <td className="fw-semibold text-dark">{row.typeName || "—"}</td>
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

      {/* Add Vendor Type Modal */}
      {showAddModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Vendor Type</h4>
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
                            Type Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.typeName}
                            onChange={(e) => setForm((p) => ({ ...p, typeName: e.target.value }))}
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

      {showEditModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Vendor Type</h4>
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
                            Type Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.typeName}
                            onChange={(e) => setEditForm((p) => ({ ...p, typeName: e.target.value }))}
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
                  Are you sure you want to delete "{deleteTarget?.typeName}"?
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
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Type
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              confirmDelete(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Type
          </button>
        </div>,
        document.body
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedTypeIds.size > 0 && (
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
              {selectedTypeIds.size}
            </span>
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>vendor types selected</span>
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
              onClick={() => setSelectedTypeIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}
