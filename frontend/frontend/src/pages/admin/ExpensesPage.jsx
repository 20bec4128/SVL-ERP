import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../../api/expensesApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";

const ExpensesPage = () => {
  const { showSuccess, showError } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", date: "", amount: "", method: "Cash" });
  const [editExpense, setEditExpense] = useState(null);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load expenses"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.amount) {
      showError("Please fill all required fields");
      return;
    }
    try {
      const payload = {
        name: formData.name.trim(),
        date: formData.date.trim(),
        method: formData.method.trim(),
        amount: Math.abs(Number(formData.amount) || 0)
      };
      await createExpense(payload);
      showSuccess("Expense added successfully");
      setFormData({ name: "", date: "", amount: "", method: "Cash" });
      const closeBtn = document.querySelector("#add_expenses [data-bs-dismiss='modal']");
      if (closeBtn) closeBtn.click();
      await loadExpenses();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to add expense"));
    }
  };

  const handleEditClick = (exp) => {
    setEditExpense({ ...exp, amount: String(exp.amount) });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editExpense.name || !editExpense.date || !editExpense.amount) {
      showError("Please fill all required fields");
      return;
    }
    try {
      const payload = {
        name: editExpense.name.trim(),
        date: editExpense.date.trim(),
        method: editExpense.method.trim(),
        amount: Math.abs(Number(editExpense.amount) || 0)
      };
      await updateExpense(editExpense.id, payload);
      showSuccess("Expense updated successfully");
      const closeBtn = document.querySelector("#edit_expenses [data-bs-dismiss='modal']");
      if (closeBtn) closeBtn.click();
      await loadExpenses();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to update expense"));
    }
  };

  const handleDeleteClick = (exp) => {
    setEditExpense(exp);
  };

  const confirmDelete = async () => {
    if (!editExpense) return;
    try {
      await deleteExpense(editExpense.id);
      showSuccess("Expense deleted successfully");
      const closeBtn = document.querySelector("#delete_modal [data-bs-dismiss='modal']");
      if (closeBtn) closeBtn.click();
      await loadExpenses();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to delete expense"));
    }
  };

  const formatDate = (val) => {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="content">
        {/* Breadcrumb section matching standard UI */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Expenses</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard">
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <span className="text-muted">Application</span>
                </li>
                <li className="breadcrumb-item active">Expenses</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Expenses List Header Card */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Expenses List</h2>
              <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>Add, view and manage all business operation expenditures.</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#add_expenses"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-plus" />
                Add Expenses
              </Link>
            </div>
          </div>
        </div>

        {/* List UI wrapper matching Lead list page */}
        {loading ? (
          <div className="p-5 text-center bg-white shadow-sm" style={{ borderRadius: 12 }}>
            <LoadingSpinner />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-5 text-center text-muted bg-white shadow-sm" style={{ borderRadius: 12 }}>No expenses found.</div>
        ) : (
          <div
            className="table-responsive leads-table-wrap border-0 shadow-sm mb-4 bg-white"
            style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x", borderRadius: 12, minHeight: "260px" }}
          >
            <table className="table table-hover align-middle leads-table mb-0">
              <thead>
                <tr>
                  <th className="col-select" style={{ width: 36 }}>
                    <input className="form-check-input" type="checkbox" id="select-all" />
                  </th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Expense Name</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Date</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Payment Method</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Amount</th>
                  <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="col-select">
                      <input className="form-check-input" type="checkbox" />
                    </td>
                    <td style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: "500" }}>{exp.name}</td>
                    <td style={{ fontSize: "0.9rem", color: "#475569" }}>{formatDate(exp.date)}</td>
                    <td style={{ fontSize: "0.9rem", color: "#475569" }}>
                      <span className="badge bg-light text-dark">{exp.method}</span>
                    </td>
                    <td className="fw-semibold text-danger" style={{ fontSize: "0.9rem" }}>
                      ₹{Number(exp.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="col-actions">
                      <div className="action-icon d-inline-flex gap-2">
                        <Link
                          to="#"
                          className="d-flex align-items-center justify-content-center"
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                          data-bs-toggle="modal"
                          data-bs-target="#edit_expenses"
                          onClick={() => handleEditClick(exp)}
                        >
                          <i className="ti ti-edit" style={{ fontSize: "1.1rem" }}></i>
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                          className="d-flex align-items-center justify-content-center text-danger"
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent" }}
                          onClick={() => handleDeleteClick(exp)}
                        >
                          <i className="ti ti-trash" style={{ fontSize: "1.1rem" }}></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <div className="modal fade" id="add_expenses">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Expenses</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Expense Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Amount</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={formData.method}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white border me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Expenses</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Expense Modal */}
      <div className="modal fade" id="edit_expenses">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Expenses</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            {editExpense && (
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body pb-0">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Expense Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editExpense.name}
                        onChange={(e) => setEditExpense({ ...editExpense, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editExpense.date}
                        onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={editExpense.amount}
                        onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        value={editExpense.method}
                        onChange={(e) => setEditExpense({ ...editExpense, method: e.target.value })}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-white border me-2" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36"></i>
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3">Are you sure you want to delete this expense record? This action cannot be undone.</p>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-light me-3" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpensesPage;
