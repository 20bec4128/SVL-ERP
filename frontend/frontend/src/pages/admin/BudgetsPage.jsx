import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "../../pages/admin/LeadsPage.css";
import { getBudgets, createBudget, updateBudget, deleteBudget } from "../../api/budgetsApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";

const initialForm = { title: "", type: "Category", startDate: "", endDate: "", totalRevenue: "", totalExpense: "", taxAmount: "", budgetAmount: "" };

export default function BudgetsPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await getBudgets();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load budgets"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.title || "").toLowerCase().includes(q) ||
      (r.type || "").toLowerCase().includes(q) ||
      (r.startDate || "").toLowerCase().includes(q) ||
      (r.endDate || "").toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const totalRows = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = filteredRows.slice(pageOffset, pageOffset + pageSize);

  const handleSelectAll = (checked) => {
    if (checked) setSelectedIds(new Set(pagedRows.map(r => r.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectRow = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id); else next.delete(id);
    setSelectedIds(next);
  };

  const targetRows = () => selectedIds.size > 0 ? rows.filter(r => selectedIds.has(r.id)) : rows;

  const exportExcel = () => {
    const headers = ["Budget Title", "Budget Type", "Start Date", "End Date", "Total Revenue", "Total Expense", "Tax Amount", "Budget Amount"];
    const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows().map(r => `<tr><td>${esc(r.title)}</td><td>${esc(r.type)}</td><td>${esc(r.startDate)}</td><td>${esc(r.endDate)}</td><td>${esc(r.totalRevenue)}</td><td>${esc(r.totalExpense)}</td><td>${esc(r.taxAmount)}</td><td>${esc(r.budgetAmount)}</td></tr>`).join("");
    const html = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `budgets-${Date.now()}.xls`; a.click();
  };

  const exportCsv = () => {
    const headers = ["Budget Title", "Budget Type", "Start Date", "End Date", "Total Revenue", "Total Expense", "Tax Amount", "Budget Amount"];
    const csv = [headers.join(","), ...targetRows().map(r => [
      `"${(r.title||"").replace(/"/g,'""')}"`, `"${(r.type||"").replace(/"/g,'""')}"`,
      `"${r.startDate}"`, `"${r.endDate}"`, r.totalRevenue, r.totalExpense, r.taxAmount, r.budgetAmount
    ].join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `budgets-${Date.now()}.csv`; a.click();
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14); doc.text("Budgets Report", 40, 40);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    autoTable(doc, {
      head: [["Budget Title", "Budget Type", "Start Date", "End Date", "Total Revenue", "Total Expense", "Tax Amount", "Budget Amount"]],
      body: targetRows().map(r => [r.title, r.type, r.startDate, r.endDate, r.totalRevenue, r.totalExpense, r.taxAmount, r.budgetAmount]),
      startY: 72, styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] }, margin: { left: 40, right: 40 }
    });
    doc.save(`budgets-${Date.now()}.pdf`);
  };

  const openEdit = (row) => { setEditTarget(row); setEditForm({ ...row }); setShowEditModal(true); };
  const openDelete = (row) => { setDeleteTarget(row); setShowDeleteModal(true); };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type.trim(),
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
        totalRevenue: Number(form.totalRevenue) || 0,
        totalExpense: Number(form.totalExpense) || 0,
        taxAmount: Number(form.taxAmount) || 0,
        budgetAmount: Number(form.budgetAmount) || 0
      };
      await createBudget(payload);
      showSuccess("Budget added successfully");
      setForm(initialForm);
      setShowAddModal(false);
      await loadBudgets();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to add budget"));
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: editForm.title.trim(),
        type: editForm.type.trim(),
        startDate: editForm.startDate.trim(),
        endDate: editForm.endDate.trim(),
        totalRevenue: Number(editForm.totalRevenue) || 0,
        totalExpense: Number(editForm.totalExpense) || 0,
        taxAmount: Number(editForm.taxAmount) || 0,
        budgetAmount: Number(editForm.budgetAmount) || 0
      };
      await updateBudget(editTarget.id, payload);
      showSuccess("Budget updated successfully");
      setShowEditModal(false);
      await loadBudgets();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to update budget"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBudget(deleteTarget.id);
      showSuccess("Budget deleted successfully");
      setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
      setDeleteTarget(null);
      setShowDeleteModal(false);
      await loadBudgets();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to delete budget"));
    }
  };

  return (
    <>
      <div className="content">
        {/* White header card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Budgets</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-muted text-decoration-none"><i className="ti ti-smart-home" /></Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Finance</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Budgets</li>
                </ol>
              </nav>
            </div>
            <button
              type="button"
              className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              onClick={() => { setForm(initialForm); setShowAddModal(true); }}
            >
              <i className="ti ti-plus" /> Add Budget
            </button>
          </div>
        </div>

        {/* Table card */}
        <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12, overflow: "hidden" }}>
          {/* Controls bar */}
          <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 350 }}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "8px 0 0 8px" }}><i className="ti ti-search text-muted" /></span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  style={{ borderRadius: "0 8px 8px 0", height: 38 }}
                  placeholder="Search budgets..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="dropdown">
              <button
                className="btn btn-white border d-flex align-items-center gap-2 dropdown-toggle"
                type="button"
                id="budgetsExportDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
              >
                <i className="ti ti-download" /> Export
              </button>
              <ul className="dropdown-menu shadow border-0" aria-labelledby="budgetsExportDropdown">
                <li><button className="dropdown-item" onClick={exportExcel}>Excel</button></li>
                <li><button className="dropdown-item" onClick={exportCsv}>CSV</button></li>
                <li><button className="dropdown-item" onClick={exportPdf}>PDF</button></li>
              </ul>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" className="form-check-input"
                      checked={pagedRows.length > 0 && pagedRows.every(r => selectedIds.has(r.id))}
                      onChange={(e) => handleSelectAll(e.target.checked)} />
                  </th>
                  <th style={{ width: 40 }}>#</th>
                  <th>Budget Title</th>
                  <th>Budget Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Total Revenue</th>
                  <th>Total Expense</th>
                  <th>Tax Amount</th>
                  <th>Budget Amount</th>
                  <th style={{ width: 80 }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr><td colSpan="11" className="text-center py-4 text-muted">No budgets found</td></tr>
                ) : pagedRows.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                      <input type="checkbox" className="form-check-input"
                        checked={selectedIds.has(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e.target.checked)} />
                    </td>
                    <td className="text-muted small">{pageOffset + idx + 1}</td>
                    <td><h6 className="fw-semibold text-slate-800 mb-0">{row.title}</h6></td>
                    <td>
                      <span className={`badge ${row.type === "Project" ? "bg-info-subtle text-info" : "bg-primary-subtle text-primary"}`}>{row.type}</span>
                    </td>
                    <td>{row.startDate}</td>
                    <td>{row.endDate}</td>
                    <td>{row.totalRevenue.toLocaleString()}</td>
                    <td>{row.totalExpense.toLocaleString()}</td>
                    <td>{row.taxAmount.toLocaleString()}</td>
                    <td>{row.budgetAmount.toLocaleString()}</td>
                    <td className="text-end">
                      <div className="dropdown">
                        <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="ti ti-dots-vertical" />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                          <li><button className="dropdown-item" onClick={() => openEdit(row)}><i className="ti ti-edit me-2" />Edit</button></li>
                          <li><button className="dropdown-item text-danger" onClick={() => openDelete(row)}><i className="ti ti-trash me-2" />Delete</button></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalRows > 0 && (
            <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
              <div className="text-muted small">
                Showing {totalRows > 0 ? pageOffset + 1 : 0} to {Math.min(pageOffset + pageSize, totalRows)} of {totalRows} entries
              </div>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, borderRadius: 6 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={clampedPage === 1}>
                  <i className="ti ti-chevron-left" />
                </button>
                {(() => {
                  const buttons = [];
                  for (let i = 1; i <= pageCount; i++) {
                    if (i === 1 || i === pageCount || (i >= clampedPage - 2 && i <= clampedPage + 2)) {
                      buttons.push(
                        <button key={i} className={`btn btn-sm border-0 ${clampedPage === i ? "btn-primary text-white" : "btn-light"}`} style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === i ? "#3b82f6" : undefined }} onClick={() => setPage(i)}>{i}</button>
                      );
                    } else if (i === clampedPage - 3 || i === clampedPage + 3) {
                      buttons.push(<span key={`dots-${i}`} className="px-1 text-muted">...</span>);
                    }
                  }
                  return buttons;
                })()}
                <button type="button" className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, borderRadius: 6 }} onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={clampedPage === pageCount}>
                  <i className="ti ti-chevron-right" />
                </button>
                <PageSizeSelector pageSize={pageSize} setPageSize={setPageSize} setPage={setPage} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating bulk bar */}
      {selectedIds.size > 0 && createPortal(
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", backgroundColor: "#0f172a", color: "#fff", padding: "12px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 16, zIndex: 9999, boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
          <span className="small">{selectedIds.size} row(s) selected</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedIds(new Set())}>Clear</button>
          <button className="btn btn-sm btn-primary" onClick={exportPdf}>Export Selected PDF</button>
        </div>,
        document.body
      )}

      {/* Add Modal */}
      {showAddModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h4 className="modal-title fw-bold">Add Budget</h4>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
                </div>
                <form onSubmit={handleAdd}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Budget Title</label>
                        <input type="text" className="form-control" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Choose Budget Type</label>
                        <div className="d-flex align-items-center gap-3">
                          <div className="form-check">
                            <input className="form-check-input" type="radio" id="add-type-project" name="add-type" checked={form.type === "Project"} onChange={() => setForm(p => ({ ...p, type: "Project" }))} />
                            <label className="form-label mb-0" htmlFor="add-type-project">Project</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="radio" id="add-type-category" name="add-type" checked={form.type === "Category"} onChange={() => setForm(p => ({ ...p, type: "Category" }))} />
                            <label className="form-label mb-0" htmlFor="add-type-category">Category</label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-control" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">End Date</label>
                        <input type="date" className="form-control" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Total Revenue</label>
                        <input type="number" min="0" className="form-control" value={form.totalRevenue} onChange={e => setForm(p => ({ ...p, totalRevenue: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Total Expense</label>
                        <input type="number" min="0" className="form-control" value={form.totalExpense} onChange={e => setForm(p => ({ ...p, totalExpense: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tax Amount</label>
                        <input type="number" min="0" className="form-control" value={form.taxAmount} onChange={e => setForm(p => ({ ...p, taxAmount: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Budget Amount</label>
                        <input type="number" min="0" className="form-control" value={form.budgetAmount} onChange={e => setForm(p => ({ ...p, budgetAmount: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Add Budget</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h4 className="modal-title fw-bold">Edit Budget</h4>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
                </div>
                <form onSubmit={handleEdit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Budget Title</label>
                        <input type="text" className="form-control" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} required />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Choose Budget Type</label>
                        <div className="d-flex align-items-center gap-3">
                           <div className="form-check">
                            <input className="form-check-input" type="radio" id="edit-type-project" name="edit-type" checked={editForm.type === "Project"} onChange={() => setEditForm(p => ({ ...p, type: "Project" }))} />
                            <label className="form-label mb-0" htmlFor="edit-type-project">Project</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="radio" id="edit-type-category" name="edit-type" checked={editForm.type === "Category"} onChange={() => setEditForm(p => ({ ...p, type: "Category" }))} />
                            <label className="form-label mb-0" htmlFor="edit-type-category">Category</label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-control" value={editForm.startDate} onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">End Date</label>
                        <input type="date" className="form-control" value={editForm.endDate} onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Total Revenue</label>
                        <input type="number" min="0" className="form-control" value={editForm.totalRevenue} onChange={e => setEditForm(p => ({ ...p, totalRevenue: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Total Expense</label>
                        <input type="number" min="0" className="form-control" value={editForm.totalExpense} onChange={e => setEditForm(p => ({ ...p, totalExpense: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tax Amount</label>
                        <input type="number" min="0" className="form-control" value={editForm.taxAmount} onChange={e => setEditForm(p => ({ ...p, taxAmount: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Budget Amount</label>
                        <input type="number" min="0" className="form-control" value={editForm.budgetAmount} onChange={e => setEditForm(p => ({ ...p, budgetAmount: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h4 className="modal-title fw-bold text-danger">Confirm Delete</h4>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} />
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete{deleteTarget?.title ? ` "${deleteTarget.title}"` : " this budget"}?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  );
}
