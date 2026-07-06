import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getAllGstMasters,
  createGstMaster,
  updateGstMaster,
  deleteGstMaster,
} from "../../api/gstMasterApi";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

export default function TaxesPage() {
  const { showSuccess, showError } = useToast();
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, pagination, selection, kebab states
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTax, setCurrentTax] = useState(null);

  // Form states
  const [taxName, setTaxName] = useState("");
  const [taxPercent, setTaxPercent] = useState("");
  const [taxType, setTaxType] = useState("GST");
  const [isActive, setIsActive] = useState(true);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const data = await getAllGstMasters();
      setTaxes(Array.isArray(data) ? data : []);
    } catch (e) {
      showError("Failed to fetch tax rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
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
    setTaxName("");
    setTaxPercent("");
    setTaxType("GST");
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleAddTax = async (e) => {
    e.preventDefault();
    if (!taxName.trim()) {
      showError("Tax name is required");
      return;
    }
    const percentNum = parseFloat(taxPercent);
    if (isNaN(percentNum) || percentNum < 0) {
      showError("Valid tax percentage is required");
      return;
    }

    try {
      await createGstMaster({
        taxName: taxName.trim(),
        taxPercent: percentNum,
        taxType: taxType,
        isActive: isActive,
      });
      showSuccess("Tax rate added successfully");
      setIsAddModalOpen(false);
      fetchTaxes();
    } catch (e) {
      showError("Failed to create tax rate");
    }
  };

  const handleOpenEditModal = (tax) => {
    setCurrentTax(tax);
    setTaxName(tax.taxName || "");
    setTaxPercent(String(tax.taxPercent ?? ""));
    setTaxType(tax.taxType || "GST");
    setIsActive(tax.isActive !== false);
    setIsEditModalOpen(true);
  };

  const handleEditTax = async (e) => {
    e.preventDefault();
    if (!currentTax) return;
    if (!taxName.trim()) {
      showError("Tax name is required");
      return;
    }
    const percentNum = parseFloat(taxPercent);
    if (isNaN(percentNum) || percentNum < 0) {
      showError("Valid tax percentage is required");
      return;
    }

    try {
      await updateGstMaster(currentTax.id, {
        taxName: taxName.trim(),
        taxPercent: percentNum,
        taxType: taxType,
        isActive: isActive,
      });
      showSuccess("Tax rate updated successfully");
      setIsEditModalOpen(false);
      fetchTaxes();
    } catch (e) {
      showError("Failed to update tax rate");
    }
  };

  const handleToggleStatus = async (tax, newStatus) => {
    try {
      await updateGstMaster(tax.id, {
        taxName: tax.taxName,
        taxPercent: tax.taxPercent,
        taxType: tax.taxType || "GST",
        isActive: newStatus,
      });
      showSuccess(`Tax rate set to ${newStatus ? "Active" : "Inactive"}`);
      fetchTaxes();
    } catch (e) {
      showError("Failed to update status");
    }
  };

  const handleOpenDeleteModal = (tax) => {
    setCurrentTax(tax);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTax = async () => {
    if (!currentTax) return;
    try {
      await deleteGstMaster(currentTax.id);
      showSuccess("Tax rate deleted/deactivated successfully");
      setIsDeleteModalOpen(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(currentTax.id);
        return next;
      });
      fetchTaxes();
    } catch (e) {
      showError("Failed to delete tax rate");
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to deactivate ${selectedIds.size} tax rates?`)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(async (id) => {
          const tax = taxes.find((t) => t.id === id);
          if (tax) {
            await updateGstMaster(id, {
              taxName: tax.taxName,
              taxPercent: tax.taxPercent,
              taxType: tax.taxType || "GST",
              isActive: false,
            });
          }
        })
      );
      showSuccess(`Deactivated ${selectedIds.size} tax rates`);
      setSelectedIds(new Set());
      fetchTaxes();
    } catch (e) {
      showError("Failed to deactivate some tax rates");
    }
  };

  // Search logic
  const filteredRows = useMemo(() => {
    let result = taxes;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((r) =>
        (r.taxName || "").toLowerCase().includes(q) ||
        (r.taxType || "").toLowerCase().includes(q) ||
        String(r.taxPercent || "").includes(q)
      );
    }
    return result;
  }, [taxes, search]);

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

  // Export handlers
  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? filteredRows.filter((r) => selectedIds.has(r.id))
      : filteredRows;

    const headers = ["Tax Name", "Type", "Percentage (%)", "Status"];
    const body = targetRows.map((row) => [
      row.taxName || "",
      row.taxType || "",
      `${row.taxPercent ?? 0}%`,
      row.isActive !== false ? "Active" : "Inactive",
    ]);

    const csv = [headers, ...body]
      .map((line) =>
        line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tax-rates-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? filteredRows.filter((r) => selectedIds.has(r.id))
      : filteredRows;

    const headers = ["Tax Name", "Type", "Percentage (%)", "Status"];
    const body = targetRows.map((row) => [
      row.taxName || "",
      row.taxType || "",
      `${row.taxPercent ?? 0}%`,
      row.isActive !== false ? "Active" : "Inactive",
    ]);

    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Tax Rates</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
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
    link.download = `tax-rates-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? filteredRows.filter((r) => selectedIds.has(r.id))
      : filteredRows;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Tax Rates Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["Tax Name", "Type", "Percentage (%)", "Status"]];
    const body = targetRows.map((row) => [
      row.taxName || "",
      row.taxType || "",
      `${row.taxPercent ?? 0}%`,
      row.isActive !== false ? "Active" : "Inactive",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 9 },
    });

    doc.save(`tax-rates-${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="content">
        {/* Custom Header Card with breadcrumb and primary blue button */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Taxes</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item" style={{ color: "#64748b" }}>HR</li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Taxes</li>
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
                <i className="ti ti-circle-plus" style={{ fontSize: "1.1rem" }}></i>
                Add Tax
              </button>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Search and Export controls inside card */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search taxes..."
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

          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive" style={{ overflowX: "auto" }}>
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
                    <th>Tax Name</th>
                    <th>Tax Type</th>
                    <th>Tax Percentage (%)</th>
                    <th>Status</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">No tax rates found</td>
                    </tr>
                  ) : (
                    pagedRows.map((tax) => (
                      <tr key={tax.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(tax.id)}
                            onChange={() => toggleRowSelection(tax.id)}
                          />
                        </td>
                        <td className="fw-semibold text-dark">{tax.taxName}</td>
                        <td>{tax.taxType || "GST"}</td>
                        <td className="fw-bold">{tax.taxPercent ?? 0}%</td>
                        <td>
                          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                              type="button"
                              data-bs-toggle="dropdown"
                              style={{ borderRadius: 6, fontSize: "0.85rem", border: "1px solid #e2e8f0" }}
                            >
                              <span className="d-flex align-items-center me-1">
                                <i className={`ti ti-point-filled ${tax.isActive !== false ? "text-success" : "text-danger"}`} />
                              </span>
                              {tax.isActive !== false ? "Active" : "Inactive"}
                            </button>
                            <ul className="dropdown-menu shadow border-0 p-2">
                              <li>
                                <button
                                  className="dropdown-item rounded py-1 px-2 text-start d-flex align-items-center gap-2"
                                  onClick={() => handleToggleStatus(tax, true)}
                                >
                                  <i className="ti ti-point-filled text-success" /> Active
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item rounded py-1 px-2 text-start d-flex align-items-center gap-2"
                                  onClick={() => handleToggleStatus(tax, false)}
                                >
                                  <i className="ti ti-point-filled text-danger" /> Inactive
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeActionsRow?.id === tax.id) {
                                  setActiveActionsRow(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActionsMenuPos({
                                  top: rect.top + window.scrollY,
                                  left: rect.right + window.scrollX,
                                });
                                setActiveActionsRow(tax);
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
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Tax
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              handleOpenDeleteModal(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Tax
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
              className="btn btn-sm btn-warning d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", border: "none" }}
              onClick={handleBulkDeactivate}
            >
              <i className="ti ti-point-filled" /> Deactivate Selected
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

      {/* Add Tax Modal */}
      {isAddModalOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Tax</h4>
                  <button type="button" className="btn-close" onClick={() => setIsAddModalOpen(false)} />
                </div>
                <form onSubmit={handleAddTax}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Tax Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={taxName}
                            onChange={(e) => setTaxName(e.target.value)}
                            placeholder="e.g. GST, VAT"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Tax Type</label>
                          <input
                            type="text"
                            className="form-control"
                            value={taxType}
                            onChange={(e) => setTaxType(e.target.value)}
                            placeholder="e.g. GST, VAT, Income Tax"
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Tax Percentage (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={taxPercent}
                            onChange={(e) => setTaxPercent(e.target.value)}
                            placeholder="e.g. 18"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="taxIsActive"
                              checked={isActive}
                              onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="taxIsActive">Active</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Tax
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Edit Tax Modal */}
      {isEditModalOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Tax</h4>
                  <button type="button" className="btn-close" onClick={() => setIsEditModalOpen(false)} />
                </div>
                <form onSubmit={handleEditTax}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Tax Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={taxName}
                            onChange={(e) => setTaxName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Tax Type</label>
                          <input
                            type="text"
                            className="form-control"
                            value={taxType}
                            onChange={(e) => setTaxType(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Tax Percentage (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={taxPercent}
                            onChange={(e) => setTaxPercent(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="taxIsActiveEdit"
                              checked={isActive}
                              onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="taxIsActiveEdit">Active</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setIsEditModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Tax
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body text-center py-4">
                  <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3 d-inline-flex align-items-center justify-content-center" style={{ width: 64, height: 64, borderRadius: "50%", fontSize: "2rem" }}>
                    <i className="ti ti-trash-x"></i>
                  </span>
                  <h4 className="mb-1">Confirm Delete</h4>
                  <p className="mb-3">
                    Are you sure you want to delete this tax rate? This action cannot be undone.
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <button type="button" className="btn btn-light" onClick={() => setIsDeleteModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleDeleteTax}>
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </>
  );
}
