import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "../../pages/admin/LeadsPage.css";
import { getBudgetExpenses, createBudgetExpense, updateBudgetExpense, deleteBudgetExpense } from "../../api/budgetExpensesApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";

const EXPENSE_CATEGORY_OPTIONS = [
  { value: "Technology", subCategories: ["Hardware Cost", "Software", "Maintenance"] },
  { value: "Taxes", subCategories: ["Payroll Taxes", "Compliance", "Tax Filing"] },
  { value: "Recruitment", subCategories: ["Advertisement", "Interviewing", "Onboarding"] },
  { value: "Corporate Events", subCategories: ["Decorations", "Catering", "Entertainment"] },
];

const initialForm = { name: "", category: "", subCategory: "", amount: "", date: "" };

export default function BudgetExpensesPage() {
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

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await getBudgetExpenses();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load expenses"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const getExpenseSubCategoryOptions = (category) =>
    EXPENSE_CATEGORY_OPTIONS.find((option) => option.value === category)?.subCategories || [];

  const handleCategoryChange = (value, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, category: value, subCategory: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, category: value, subCategory: "" }));
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.category || "").toLowerCase().includes(q) ||
      (r.subCategory || "").toLowerCase().includes(q) ||
      (r.date || "").toLowerCase().includes(q)
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
    const headers = ["Expense Name", "Category Name", "Sub Category Name", "Amount", "Expense Date"];
    const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows().map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.category)}</td><td>${esc(r.subCategory)}</td><td>${esc(r.amount)}</td><td>${esc(r.date)}</td></tr>`).join("");
    const html = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `budget-expenses-${Date.now()}.xls`; a.click();
  };

  const exportCsv = () => {
    const headers = ["Expense Name", "Category Name", "Sub Category Name", "Amount", "Expense Date"];
    const csv = [headers.join(","), ...targetRows().map(r => [
      `"${(r.name||"").replace(/"/g,'""')}"`,
      `"${(r.category||"").replace(/"/g,'""')}"`,
      `"${(r.subCategory||"").replace(/"/g,'""')}"`,
      r.amount,
      `"${r.date}"`
    ].join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `budget-expenses-${Date.now()}.csv`; a.click();
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14); doc.text("Budget Expenses Report", 40, 40);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    autoTable(doc, {
      head: [["Expense Name", "Category Name", "Sub Category Name", "Amount", "Expense Date"]],
      body: targetRows().map(r => [r.name, r.category, r.subCategory, r.amount, r.date]),
      startY: 72, styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] }, margin: { left: 40, right: 40 }
    });
    doc.save(`budget-expenses-${Date.now()}.pdf`);
  };

  const openEdit = (row) => { setEditTarget(row); setEditForm({ ...row, amount: String(row.amount) }); setShowEditModal(true); };
  const openDelete = (row) => { setDeleteTarget(row); setShowDeleteModal(true); };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        subCategory: form.subCategory.trim(),
        amount: Math.abs(Number(form.amount) || 0),
        date: form.date.trim()
      };
      await createBudgetExpense(payload);
      showSuccess("Expense added successfully");
      setForm(initialForm);
      setShowAddModal(false);
      await loadExpenses();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to add expense"));
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        subCategory: editForm.subCategory.trim(),
        amount: Math.abs(Number(editForm.amount) || 0),
        date: editForm.date.trim()
      };
      await updateBudgetExpense(editTarget.id, payload);
      showSuccess("Expense updated successfully");
      setShowEditModal(false);
      await loadExpenses();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to update expense"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBudgetExpense(deleteTarget.id);
      showSuccess("Expense deleted successfully");
      setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
      setDeleteTarget(null);
      setShowDeleteModal(false);
      await loadExpenses();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to delete expense"));
    }
  };

  return (
    <>
      <div className="content">
        {/* White header card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Budget Expenses</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-muted text-decoration-none"><i className="ti ti-smart-home" /></Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Finance</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Budget Expenses</li>
                </ol>
              </nav>
            </div>
            <button
              type="button"
              className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              onClick={() => { setForm(initialForm); setShowAddModal(true); }}
            >
              <i className="ti ti-plus" /> Add Expense
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
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="dropdown">
              <button
                className="btn btn-white border d-flex align-items-center gap-2 dropdown-toggle"
                type="button"
                id="budgetExpensesExportDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
              >
                <i className="ti ti-download" /> Export
              </button>
              <ul className="dropdown-menu shadow border-0" aria-labelledby="budgetExpensesExportDropdown">
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
                  <th>Expense Name</th>
                  <th>Category Name</th>
                  <th>Sub Category Name</th>
                  <th>Amount</th>
                  <th>Expense Date</th>
                  <th style={{ width: 80 }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">No expenses found</td></tr>
                ) : pagedRows.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                      <input type="checkbox" className="form-check-input"
                        checked={selectedIds.has(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e.target.checked)} />
                    </td>
                    <td className="text-muted small">{pageOffset + idx + 1}</td>
                    <td><h6 className="fw-semibold text-slate-800 mb-0">{row.name}</h6></td>
                    <td>{row.category}</td>
                    <td><span className="badge bg-secondary-subtle text-secondary">{row.subCategory}</span></td>
                    <td>{row.amount.toLocaleString()}</td>
                    <td>{row.date}</td>
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
                  <h4 className="modal-title fw-bold">Add Budget Expense</h4>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
                </div>
                <form onSubmit={handleAdd}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Expense Name</label>
                        <input type="text" className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Category Name</label>
                        <select
                          className="form-select"
                          value={form.category}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                          <option value="">Select category</option>
                          {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.value}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Sub Category Name</label>
                        <select
                          className="form-select"
                          value={form.subCategory}
                          onChange={(e) => setForm((prev) => ({ ...prev, subCategory: e.target.value }))}
                          disabled={!form.category}
                        >
                          <option value="">{form.category ? "Select sub category" : "Select category first"}</option>
                          {getExpenseSubCategoryOptions(form.category).map((subCategory) => (
                            <option key={subCategory} value={subCategory}>{subCategory}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Amount</label>
                        <input type="number" min="0" className="form-control" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Expense Date</label>
                        <input type="date" className="form-control" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Add Expense</button>
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
                  <h4 className="modal-title fw-bold">Edit Budget Expense</h4>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
                </div>
                <form onSubmit={handleEdit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Expense Name</label>
                        <input type="text" className="form-control" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Category Name</label>
                        <select
                          className="form-select"
                          value={editForm.category}
                          onChange={(e) => handleCategoryChange(e.target.value, true)}
                        >
                          <option value="">Select category</option>
                          {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.value}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Sub Category Name</label>
                        <select
                          className="form-select"
                          value={editForm.subCategory}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, subCategory: e.target.value }))}
                          disabled={!editForm.category}
                        >
                          <option value="">{editForm.category ? "Select sub category" : "Select category first"}</option>
                          {getExpenseSubCategoryOptions(editForm.category).map((subCategory) => (
                            <option key={subCategory} value={subCategory}>{subCategory}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Amount</label>
                        <input type="number" min="0" className="form-control" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Expense Date</label>
                        <input type="date" className="form-control" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
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
                  <p>Are you sure you want to delete{deleteTarget?.name ? ` "${deleteTarget.name}"` : " this expense"}?</p>
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
