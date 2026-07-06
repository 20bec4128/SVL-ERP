import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUserDepartments, createUserDepartment, updateUserDepartment, deleteUserDepartment } from "../../api/userPermissionsApi";
import { getBranches } from "../../api/branchesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import "../../../public/assets/css/addModalShared.css";

const initialForm = {
  branchId: "",
  name: "",
};

const initialEditForm = {
  id: "",
  branchId: "",
  name: "",
};

export default function UserDepartmentsPage() {
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    branchId: "",
    q: "",
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingRow, setDeletingRow] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  const load = async () => {
    setLoading(true);
    try {
      // If filters.branchId is omitted or "", pass null/undefined to retrieve all (findAll fallback)
      const branchParam = filters.branchId ? Number(filters.branchId) : null;
      const data = await getUserDepartments(branchParam);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load user departments"));
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(Array.isArray(data) ? data.filter(b => b.status !== "INACTIVE") : []);
    } catch {
      setBranches([]);
    }
  };

  useEffect(() => {
    load();
  }, [filters.branchId]);

  useEffect(() => {
    loadBranches();
  }, []);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = String(filters.q || "").trim().toLowerCase();
    return orderedRows.filter((row) => {
      const qOk = !q || String(row?.name || "").toLowerCase().includes(q);
      const branchOk = !filters.branchId || String(row?.branch?.id || "") === String(filters.branchId);
      return qOk && branchOk;
    });
  }, [orderedRows, filters.q, filters.branchId]);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!form.branchId) {
      showError("Branch is required");
      return;
    }
    if (!form.name.trim()) {
      showError("Department name is required");
      return;
    }
    setSaving(true);
    try {
      await createUserDepartment({
        branchId: Number(form.branchId),
        name: form.name.trim(),
      });
      setForm(initialForm);
      showSuccess("User Department added successfully");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add user department"));
    } finally {
      setSaving(false);
    }
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    if (!editForm.branchId) {
      showError("Branch is required");
      return;
    }
    if (!editForm.name.trim()) {
      showError("Department name is required");
      return;
    }
    setSaving(true);
    try {
      await updateUserDepartment(editForm.id, {
        branchId: Number(editForm.branchId),
        name: editForm.name.trim(),
      });
      setEditForm(initialEditForm);
      showSuccess("User Department updated successfully");
      setShowEditModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update user department"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deletingRow) return;
    setSaving(true);
    try {
      await deleteUserDepartment(deletingRow.id);
      showSuccess("User Department deleted successfully");
      setShowDeleteModal(false);
      setDeletingRow(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete user department"));
    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">User Departments</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard">
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active">User Departments</li>
              </ol>
            </nav>
          </div>
          <div className="mb-2 d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center"
              onClick={() => {
                setForm(initialForm);
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-circle-plus me-2"></i>Add User Department
            </button>
          </div>
        </div>

        <div className="card">
          {filterOpen && (
            <>
              <div
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ background: "rgba(0,0,0,0.35)", zIndex: 1048 }}
                onClick={() => setFilterOpen(false)}
              />
              <div
                className="position-fixed top-0 end-0 h-100 bg-white border-start shadow"
                style={{ width: 380, zIndex: 1049 }}
              >
                <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                  <h6 className="mb-0">Filters</h6>
                  <button type="button" className="btn-close" onClick={() => setFilterOpen(false)} />
                </div>

                <div className="p-3">
                  <div className="mb-3">
                    <label className="form-label">Branch</label>
                    <select
                      className="form-select"
                      value={draftFilters.branchId}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({ ...prev, branchId: e.target.value }))
                      }
                    >
                      <option value="">All Branches</option>
                      {branches
                        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Search</label>
                    <input
                      className="form-control"
                      value={draftFilters.q}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({ ...prev, q: e.target.value }))
                      }
                      placeholder="Search by name"
                    />
                  </div>
                </div>

                <div className="p-3 border-top d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-light w-50"
                    onClick={() => setDraftFilters({ branchId: "", q: "" })}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary w-50"
                    onClick={() => {
                      setFilters(draftFilters);
                      setFilterOpen(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5>User Department List</h5>
            <button
              type="button"
              className="btn btn-outline-warning leads-toolbar-btn"
              onClick={() => {
                setDraftFilters(filters);
                setFilterOpen(true);
              }}
            >
              <i className="ti ti-filter me-1" />
              Filter
            </button>
          </div>
          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th style={{ width: "80px" }}>ID</th>
                    <th>User Department</th>
                    <th>HRM Branch</th>
                    <th className="text-end" style={{ width: "100px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        No user departments found
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.name || "-"}</td>
                        <td>{row.branch?.name || "-"}</td>
                        <td className="text-end">
                          <div className="action-icon d-inline-flex">
                            <button
                              type="button"
                              className="btn btn-link p-0 me-2"
                              onClick={() => {
                                setEditForm({
                                  id: row.id,
                                  branchId: row.branch?.id || "",
                                  name: row.name || "",
                                });
                                setShowEditModal(true);
                              }}
                              aria-label="Edit user department"
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-link p-0 text-danger"
                              onClick={() => {
                                setDeletingRow(row);
                                setShowDeleteModal(true);
                              }}
                              aria-label="Delete user department"
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Add User Department</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleAddDepartment}>
              <div className="avm-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">HRM Branch</label>
                      <select
                        className="form-select"
                        value={form.branchId}
                        onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value }))}
                      >
                        <option value="">Select Branch</option>
                        {branches
                          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">User Department Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. User Engineering"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div />
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn primary" disabled={saving}>
                    {saving ? "Adding..." : "Add User Department"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Edit User Department</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowEditModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleEditDepartment}>
              <div className="avm-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">HRM Branch</label>
                      <select
                        className="form-select"
                        value={editForm.branchId}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, branchId: e.target.value }))}
                      >
                        <option value="">Select Branch</option>
                        {branches
                          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">User Department Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. User Engineering"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div />
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Confirm Delete</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowDeleteModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <div className="avm-body">
              <p>
                Are you sure you want to delete the user department
                {deletingRow?.name ? ` "${deletingRow.name}"` : ""}?
              </p>
              <p className="text-warning mb-0">
                <small>Warning: Deleting this department will also delete all user designations associated with it.</small>
              </p>
            </div>
            <div className="avm-footer">
              <div />
              <div className="avm-footer-right">
                <button type="button" className="avm-btn light" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="avm-btn primary" onClick={handleDeleteDepartment} disabled={saving}>
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
