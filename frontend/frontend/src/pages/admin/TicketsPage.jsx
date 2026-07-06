import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createTicket, getTickets, updateTicket } from "../../api/ticketsApi";
import { createTicketCategory, getTicketCategories } from "../../api/ticketCategoriesApi";
import { getEmployees } from "../../api/employeesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

const initialForm = {
  title: "",
  categoryId: "",
  subject: "",
  assignedTo: "",
  description: "",
  priority: "LOW",
  status: "OPEN",
};

const PRIORITY_LABEL = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const STATUS_LABEL = {
  OPEN: "Open",
  ON_HOLD: "On Hold",
  REOPENED: "Reopened",
  CLOSED: "Closed",
  IN_PROGRESS: "In Progress",
};

export default function TicketsPage() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTickets();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load tickets"));
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    setMetaLoading(true);
    try {
      const [cats, emps] = await Promise.all([getTicketCategories(), getEmployees()]);
      setCategories(Array.isArray(cats) ? cats : []);
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch (e) {
      setCategories([]);
      setEmployees([]);
      showError(extractApiErrorMessage(e, "Failed to load ticket categories"));
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadMeta();
  }, []);

  const counts = useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => String(r.status || "").toUpperCase() === "OPEN").length;
    const closed = rows.filter((r) => String(r.status || "").toUpperCase() === "CLOSED").length;
    const pending = rows.filter((r) =>
      ["IN_PROGRESS", "ON_HOLD"].includes(String(r.status || "").toUpperCase()),
    ).length;
    return { total, open, closed, pending };
  }, [rows]);

  const categoryCounts = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const id = r?.categoryId ?? null;
      if (id == null) return;
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [rows]);

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "-";
    }
  };

  const handleAddTicket = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showError("Title is required");
      return;
    }
    if (!form.categoryId) {
      showError("Category is required");
      return;
    }
    setSaving(true);
    try {
      await createTicket({
        title: form.title.trim(),
        categoryId: Number(form.categoryId),
        subject: form.subject?.trim() || "",
        assignedTo: form.assignedTo?.trim() || "",
        description: form.description?.trim() || "",
        priority: form.priority,
        status: form.status,
      });
      setForm(initialForm);
      showSuccess("Ticket added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add ticket"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditForm({
      title: row?.title || "",
      categoryId: row?.categoryId ? String(row.categoryId) : "",
      subject: row?.subject || "",
      assignedTo: row?.assignedTo || "",
      description: row?.description || "",
      priority: String(row?.priority || "LOW").toUpperCase(),
      status: String(row?.status || "OPEN").toUpperCase(),
    });
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const handleEditTicket = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.title.trim()) {
      showError("Title is required");
      return;
    }
    if (!editForm.categoryId) {
      showError("Category is required");
      return;
    }
    setSaving(true);
    try {
      await updateTicket(selectedId, {
        title: editForm.title.trim(),
        categoryId: Number(editForm.categoryId),
        subject: editForm.subject?.trim() || "",
        assignedTo: editForm.assignedTo?.trim() || "",
        description: editForm.description?.trim() || "",
        priority: editForm.priority,
        status: editForm.status,
      });
      showSuccess("Ticket updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update ticket"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showError("Category name is required");
      return;
    }
    setSaving(true);
    try {
      await createTicketCategory({ name: categoryName.trim() });
      setCategoryName("");
      showSuccess("Category added");
      setShowAddCategoryModal(false);
      await loadMeta();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add category"));
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = useMemo(
    () =>
      (categories || [])
        .map((c) => ({ id: c?.id, name: c?.name }))
        .filter((c) => c.id != null && c.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const employeeOptions = useMemo(
    () =>
      (employees || [])
        .map((e) => ({
          id: e?.id,
          name: e?.name || e?.employeeName || e?.fullName || "",
        }))
        .filter((e) => e.id != null && e.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [employees],
  );

  return (
    <>
      <div className="content">

        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Tickets</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard">
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">Employee</li>
                <li className="breadcrumb-item active">Tickets</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="btn-group">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-light"}`}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-light"}`}
                onClick={() => setViewMode("grid")}
              >
                Grid
              </button>
            </div>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center"
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-circle-plus me-2"></i>Add Ticket
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="fw-medium fs-12 mb-1">New Tickets</p>
                <h4>{counts.total}</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="fw-medium fs-12 mb-1">Open Tickets</p>
                <h4>{counts.open}</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="fw-medium fs-12 mb-1">Solved Tickets</p>
                <h4>{counts.closed}</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="fw-medium fs-12 mb-1">Pending Tickets</p>
                <h4>{counts.pending}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-9 col-md-8">
            {loading ? (
              <div className="card">
                <div className="card-body">Loading...</div>
              </div>
            ) : rows.length === 0 ? (
              <div className="card">
                <div className="card-body">No tickets found</div>
              </div>
            ) : viewMode === "list" ? (
              <div className="card">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead className="thead-light">
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th>Created</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const priority = String(row.priority || "LOW").toUpperCase();
                          const status = String(row.status || "OPEN").toUpperCase();
                          return (
                            <tr key={row.id}>
                              <td>{row.id}</td>
                              <td>{row.title}</td>
                              <td>{row.categoryName || "-"}</td>
                              <td>{PRIORITY_LABEL[priority] || "Low"}</td>
                              <td>{STATUS_LABEL[status] || "Open"}</td>
                              <td>{row.assignedTo || "Unassigned"}</td>
                              <td>{formatDate(row.createdAt)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light"
                                  onClick={() => openEdit(row)}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              rows.map((row) => {
                const priority = String(row.priority || "LOW").toUpperCase();
                const status = String(row.status || "OPEN").toUpperCase();
                return (
                  <div className="card" key={row.id}>
                    <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                      <h5 className="text-info fw-medium">{row.categoryName || "Ticket"}</h5>
                      <div className="d-flex align-items-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-light me-2"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </button>
                        <span className="badge badge-danger d-inline-flex align-items-center">
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {PRIORITY_LABEL[priority] || "Low"}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div>
                        <span className="badge badge-info rounded-pill mb-2">Tic - {row.id}</span>
                        <div className="d-flex align-items-center mb-2">
                          <h5 className="fw-semibold me-2">{row.title}</h5>
                          <span className="badge bg-outline-pink d-flex align-items-center ms-1">
                            <i className="ti ti-circle-filled fs-5 me-1"></i>
                            {STATUS_LABEL[status] || "Open"}
                          </span>
                        </div>
                        <div className="d-flex align-items-center flex-wrap row-gap-2">
                          <p className="d-flex align-items-center mb-0 me-2">
                            Assigned to
                            <span className="text-dark ms-1">{row.assignedTo || "Unassigned"}</span>
                          </p>
                          {row.subject ? (
                            <p className="d-flex align-items-center mb-0 me-2">
                              <i className="ti ti-message-share me-1"></i>
                              {row.subject}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="col-xl-3 col-md-4">
            <div className="card">
              <div className="card-header">
                <div className="d-flex align-items-center justify-content-between">
                  <h4 className="mb-0">Ticket Categories</h4>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm btn-light d-inline-flex align-items-center justify-content-center"
                    onClick={() => setShowAddCategoryModal(true)}
                    aria-label="Add category"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="d-flex flex-column">
                  {(categories || []).length === 0 ? (
                    <div className="p-3">No categories</div>
                  ) : (
                    categories.map((c) => (
                      <div key={c.id} className="d-flex align-items-center justify-content-between border-bottom p-3">
                        <span>{c.name}</span>
                        <span className="badge badge-xs bg-dark rounded-circle">
                          {categoryCounts.get(c.id) || 0}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Ticket</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="18" y1="6" x2="6" y2="18" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleAddTicket}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Ticket Category</label>
                          <select
                            className="form-select"
                            value={form.categoryId}
                            onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                            disabled={metaLoading}
                          >
                            <option value="">Select</option>
                            {categoryOptions.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Subject</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.subject}
                            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Assign To</label>
                          <select
                            className="form-select"
                            value={form.assignedTo}
                            onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                            disabled={metaLoading}
                          >
                            <option value="">Select</option>
                            {employeeOptions.map((e) => (
                              <option key={e.id} value={e.name}>
                                {e.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Ticket Description</label>
                          <textarea
                            className="form-control"
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Priority</label>
                          <select
                            className="form-select"
                            value={form.priority}
                            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                          >
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                          </select>
                        </div>
                        <div className="mb-0">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={form.status}
                            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="OPEN">Open</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="REOPENED">Reopened</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-light me-2" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Adding..." : "Add Ticket"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showEditModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Ticket</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowEditModal(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="18" y1="6" x2="6" y2="18" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleEditTicket}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.title}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Ticket Category</label>
                          <select
                            className="form-select"
                            value={editForm.categoryId}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                            disabled={metaLoading}
                          >
                            <option value="">Select</option>
                            {categoryOptions.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Subject</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.subject}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, subject: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Assign To</label>
                          <select
                            className="form-select"
                            value={editForm.assignedTo}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                            disabled={metaLoading}
                          >
                            <option value="">Select</option>
                            {employeeOptions.map((e) => (
                              <option key={e.id} value={e.name}>
                                {e.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Ticket Description</label>
                          <textarea
                            className="form-control"
                            value={editForm.description}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Priority</label>
                          <select
                            className="form-select"
                            value={editForm.priority}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value }))}
                          >
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                          </select>
                        </div>
                        <div className="mb-0">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={editForm.status}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="OPEN">Open</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="REOPENED">Reopened</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-light me-2" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showAddCategoryModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Ticket Category</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddCategoryModal(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="18" y1="6" x2="6" y2="18" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleAddCategory}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Category Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-light me-2" onClick={() => setShowAddCategoryModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Adding..." : "Add Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  );
}
