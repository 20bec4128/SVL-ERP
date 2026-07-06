import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUserDesignations, createUserDesignation, getUserDepartments, updateUserDesignation, deleteUserDesignation } from "../../api/userPermissionsApi";
import { getBranches } from "../../api/branchesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import "../../../public/assets/css/addModalShared.css";

const initialForm = {
  branchId: "",
  userDepartmentId: "",
  name: "",
};

const initialEditForm = {
  id: "",
  branchId: "",
  userDepartmentId: "",
  name: "",
};

export default function UserDesignationsPage() {
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filterDepartments, setFilterDepartments] = useState([]); // for filter cascade
  const [modalDepartments, setModalDepartments] = useState([]); // for modal cascade
  const [editModalDepartments, setEditModalDepartments] = useState([]); // for edit modal cascade
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    branchId: "",
    userDepartmentId: "",
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
      const deptParam = filters.userDepartmentId ? Number(filters.userDepartmentId) : null;
      const data = await getUserDesignations(deptParam);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load user designations"));
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
  }, [filters.userDepartmentId]);

  useEffect(() => {
    loadBranches();
  }, []);

  // Filter Drawer Cascading Dropdown: Fetch user departments when branch changes
  useEffect(() => {
    (async () => {
      const bId = draftFilters.branchId;
      if (!bId) {
        setFilterDepartments([]);
        setDraftFilters(prev => ({ ...prev, userDepartmentId: "" }));
        return;
      }
      try {
        const data = await getUserDepartments(Number(bId));
        setFilterDepartments(Array.isArray(data) ? data : []);
      } catch {
        setFilterDepartments([]);
      }
      setDraftFilters(prev => ({ ...prev, userDepartmentId: "" }));
    })();
  }, [draftFilters.branchId]);

  // Modal Cascading Dropdown: Fetch user departments when branch changes
  useEffect(() => {
    (async () => {
      const bId = form.branchId;
      if (!bId) {
        setModalDepartments([]);
        setForm(prev => ({ ...prev, userDepartmentId: "" }));
        return;
      }
      try {
        const data = await getUserDepartments(Number(bId));
        setModalDepartments(Array.isArray(data) ? data : []);
      } catch {
        setModalDepartments([]);
      }
      setForm(prev => ({ ...prev, userDepartmentId: "" }));
    })();
  }, [form.branchId]);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = String(filters.q || "").trim().toLowerCase();
    return orderedRows.filter((row) => {
      const qOk = !q || String(row?.name || "").toLowerCase().includes(q);
      const deptOk = !filters.userDepartmentId || String(row?.userDepartment?.id || "") === String(filters.userDepartmentId);
      const branchOk = !filters.branchId || String(row?.userDepartment?.branch?.id || "") === String(filters.branchId);
      return qOk && deptOk && branchOk;
    });
  }, [orderedRows, filters.q, filters.userDepartmentId, filters.branchId]);

  const handleAddDesignation = async (e) => {
    e.preventDefault();
    if (!form.branchId) {
      showError("HRM Branch is required");
      return;
    }
    if (!form.userDepartmentId) {
      showError("User Department is required");
      return;
    }
    if (!form.name.trim()) {
      showError("Designation name is required");
      return;
    }
    setSaving(true);
    try {
      await createUserDesignation({
        userDepartmentId: Number(form.userDepartmentId),
        name: form.name.trim(),
      });
      setForm(initialForm);
      showSuccess("User Designation added successfully");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add user designation"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (row) => {
    const branchId = row.userDepartment?.branch?.id || "";
    const deptId = row.userDepartment?.id || "";
    try {
      if (branchId) {
        const data = await getUserDepartments(Number(branchId));
        setEditModalDepartments(Array.isArray(data) ? data : []);
      } else {
        setEditModalDepartments([]);
      }
      setEditForm({
        id: row.id,
        branchId: branchId,
        userDepartmentId: deptId,
        name: row.name || "",
      });
      setShowEditModal(true);
    } catch (e) {
      showError("Failed to load departments for editing");
    }
  };

  const handleEditBranchChange = async (branchId) => {
    setEditForm((prev) => ({ ...prev, branchId, userDepartmentId: "" }));
    if (!branchId) {
      setEditModalDepartments([]);
      return;
    }
    try {
      const data = await getUserDepartments(Number(branchId));
      setEditModalDepartments(Array.isArray(data) ? data : []);
    } catch {
      setEditModalDepartments([]);
    }
  };

  const handleEditDesignation = async (e) => {
    e.preventDefault();
    if (!editForm.branchId) {
      showError("HRM Branch is required");
      return;
    }
    if (!editForm.userDepartmentId) {
      showError("User Department is required");
      return;
    }
    if (!editForm.name.trim()) {
      showError("Designation name is required");
      return;
    }
    setSaving(true);
    try {
      await updateUserDesignation(editForm.id, {
        userDepartmentId: Number(editForm.userDepartmentId),
        name: editForm.name.trim(),
      });
      setEditForm(initialEditForm);
      showSuccess("User Designation updated successfully");
      setShowEditModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update user designation"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDesignation = async () => {
    if (!deletingRow) return;
    setSaving(true);
    try {
      await deleteUserDesignation(deletingRow.id);
      showSuccess("User Designation deleted successfully");
      setShowDeleteModal(false);
      setDeletingRow(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete user designation"));
    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">User Designations</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard">
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active">User Designations</li>
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
              <i className="ti ti-circle-plus me-2"></i>Add User Designation
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
                    <label className="form-label">HRM Branch</label>
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
                    <label className="form-label">User Department</label>
                    <select
                      className="form-select"
                      value={draftFilters.userDepartmentId}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({ ...prev, userDepartmentId: e.target.value }))
                      }
                      disabled={!draftFilters.branchId}
                    >
                      <option value="">{draftFilters.branchId ? "All Departments" : "Select branch first"}</option>
                      {filterDepartments
                        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
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
                    onClick={() => setDraftFilters({ branchId: "", userDepartmentId: "", q: "" })}
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
            <h5>User Designation List</h5>
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
                    <th>User Designation</th>
                    <th>User Department</th>
                    <th>HRM Branch</th>
                    <th className="text-end" style={{ width: "100px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No user designations found
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.name || "-"}</td>
                        <td>{row.userDepartment?.name || "-"}</td>
                        <td>{row.userDepartment?.branch?.name || "-"}</td>
                        <td className="text-end">
                          <div className="action-icon d-inline-flex">
                            <button
                              type="button"
                              className="btn btn-link p-0 me-2"
                              onClick={() => openEdit(row)}
                              aria-label="Edit user designation"
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
                              aria-label="Delete user designation"
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
              <h2 className="avm-modal-title">Add User Designation</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleAddDesignation}>
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
                      <label className="form-label">User Department</label>
                      <select
                        className="form-select"
                        value={form.userDepartmentId}
                        onChange={(e) => setForm((prev) => ({ ...prev, userDepartmentId: e.target.value }))}
                        disabled={!form.branchId}
                      >
                        <option value="">{form.branchId ? "Select User Department" : "Select Branch first"}</option>
                        {modalDepartments
                          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">User Designation Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. User Engineer Level 1"
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
                    {saving ? "Adding..." : "Add User Designation"}
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
              <h2 className="avm-modal-title">Edit User Designation</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowEditModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleEditDesignation}>
              <div className="avm-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">HRM Branch</label>
                      <select
                        className="form-select"
                        value={editForm.branchId}
                        onChange={(e) => handleEditBranchChange(e.target.value)}
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
                      <label className="form-label">User Department</label>
                      <select
                        className="form-select"
                        value={editForm.userDepartmentId}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, userDepartmentId: e.target.value }))}
                        disabled={!editForm.branchId}
                      >
                        <option value="">{editForm.branchId ? "Select User Department" : "Select Branch first"}</option>
                        {editModalDepartments
                          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">User Designation Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. User Engineer Level 1"
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
                Are you sure you want to delete the user designation
                {deletingRow?.name ? ` "${deletingRow.name}"` : ""}?
              </p>
            </div>
            <div className="avm-footer">
              <div />
              <div className="avm-footer-right">
                <button type="button" className="avm-btn light" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="avm-btn primary" onClick={handleDeleteDesignation} disabled={saving}>
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
