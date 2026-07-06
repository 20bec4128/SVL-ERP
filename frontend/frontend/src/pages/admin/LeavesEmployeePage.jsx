import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createLeave, deleteLeave, getLeaves, updateLeave } from "../../api/leavesApi";
import { getLeaveEligibility } from "../../api/leaveSettingsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import "../../../public/assets/css/addModalShared.css";

const initialForm = {
  employeeId: "",
  leaveType: "",
  fromDate: "",
  toDate: "",
  status: "NEW",
  reason: "",
};

function calcDays(fromDate, toDate) {
  if (!fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

const emptyEligibility = [];

function formatDate(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}

export default function LeavesEmployeePage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const [eligibleAdd, setEligibleAdd] = useState(emptyEligibility);
  const [eligibleEdit, setEligibleEdit] = useState(emptyEligibility);

  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const currentEmployeeId = currentUser?.employeeId ? String(currentUser.employeeId) : "";
  const currentEmployeeName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ").trim()
    || currentUser?.username
    || currentUser?.email
    || "Current employee";

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLeaves();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load leaves"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (currentEmployeeId) {
      setForm((prev) => ({
        ...prev,
        employeeId: currentEmployeeId,
      }));
      setEditForm((prev) => ({
        ...prev,
        employeeId: currentEmployeeId,
      }));
    }
  }, [currentEmployeeId]);

  useEffect(() => {
    const loadEligibility = async () => {
      if (!currentEmployeeId) {
        setEligibleAdd(emptyEligibility);
        return;
      }
      try {
        const data = await getLeaveEligibility(currentEmployeeId);
        setEligibleAdd(Array.isArray(data) ? data : []);
      } catch (e) {
        setEligibleAdd(emptyEligibility);
        showError(extractApiErrorMessage(e, "Failed to load leave eligibility"));
      }
    };
    loadEligibility();
  }, [currentEmployeeId]);

  useEffect(() => {
    const loadEligibility = async () => {
      if (!currentEmployeeId) {
        setEligibleEdit(emptyEligibility);
        return;
      }
      try {
        const data = await getLeaveEligibility(currentEmployeeId);
        setEligibleEdit(Array.isArray(data) ? data : []);
      } catch (e) {
        setEligibleEdit(emptyEligibility);
        showError(extractApiErrorMessage(e, "Failed to load leave eligibility"));
      }
    };
    loadEligibility();
  }, [currentEmployeeId]);

  const orderedRows = useMemo(
    () =>
      [...rows]
        .filter((row) => !currentEmployeeId || String(row?.employeeId || "") === currentEmployeeId)
        .sort((a, b) => String(b.fromDate || "").localeCompare(String(a.fromDate || ""))),
    [rows],
  );

  const counts = useMemo(() => {
    const lower = (v) => String(v || "").toLowerCase();
    const annual = orderedRows.filter((r) => lower(r.policyName || r.leaveType).includes("annual")).length;
    const medical = orderedRows.filter((r) => lower(r.policyName || r.leaveType).includes("medical")).length;
    const casual = orderedRows.filter((r) => lower(r.policyName || r.leaveType).includes("casual")).length;
    const other = Math.max(0, orderedRows.length - annual - medical - casual);
    return { annual, medical, casual, other, total: orderedRows.length };
  }, [orderedRows]);

  const openAdd = () => {
    setForm({
      ...initialForm,
      employeeId: currentEmployeeId,
    });
    setShowAddModal(true);
  };

  const openEdit = (row) => {
    setEditForm({
      employeeId: currentEmployeeId,
      leaveType: row?.policyName || row?.leaveType || "",
      fromDate: row?.fromDate ? String(row.fromDate).slice(0, 10) : "",
      toDate: row?.toDate ? String(row.toDate).slice(0, 10) : "",
      status: String(row?.status || "NEW").toUpperCase(),
      reason: row?.reason || "",
    });
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row || null);
    setSelectedId(row?.id || null);
    setShowDeleteModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentEmployeeId) {
      showError("Your employee profile is not linked");
      return;
    }
    if (!form.leaveType.trim()) {
      showError("Leave type is required");
      return;
    }
    if (!form.fromDate || !form.toDate) {
      showError("From and To dates are required");
      return;
    }
    setSaving(true);
    try {
      await createLeave({
        employeeId: Number(currentEmployeeId),
        leaveType: form.leaveType.trim(),
        policyName: form.leaveType.trim(),
        fromDate: form.fromDate,
        toDate: form.toDate,
        noOfDays: calcDays(form.fromDate, form.toDate),
        status: form.status,
        reason: form.reason?.trim() || "",
      });
      setForm(initialForm);
      showSuccess("Leave added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add leave"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!currentEmployeeId) {
      showError("Your employee profile is not linked");
      return;
    }
    if (!editForm.leaveType.trim()) {
      showError("Leave type is required");
      return;
    }
    if (!editForm.fromDate || !editForm.toDate) {
      showError("From and To dates are required");
      return;
    }
    setSaving(true);
    try {
      await updateLeave(selectedId, {
        employeeId: Number(currentEmployeeId),
        leaveType: editForm.leaveType.trim(),
        policyName: editForm.leaveType.trim(),
        fromDate: editForm.fromDate,
        toDate: editForm.toDate,
        noOfDays: calcDays(editForm.fromDate, editForm.toDate),
        status: editForm.status,
        reason: editForm.reason?.trim() || "",
      });
      showSuccess("Leave updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update leave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deleteLeave(selectedId);
      showSuccess("Leave deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete leave"));
    } finally {
      setSaving(false);
    }
  };

  const resolveEmployee = (row) => {
    return {
      name: row?.employeeName || currentEmployeeName,
      department: row?.department || "",
    };
  };

  const resolvePolicyName = (row) => row?.policyName || row?.leaveType || "";

  const buildPolicyOptions = (currentValue, list) => {
    const items = Array.isArray(list)
      ? list
          .map((l) => {
            const leaveType = String(l?.leaveType || "").trim();
            const policyName = String(l?.policyName || "").trim();
            const value = leaveType || policyName;
            if (!value) return null;
            const label =
              policyName && leaveType && policyName.toLowerCase() !== leaveType.toLowerCase()
                ? `${leaveType} - ${policyName}`
                : value;
            return { value, label };
          })
          .filter(Boolean)
      : [];
    const deduped = items.filter(
      (item, index, arr) => arr.findIndex((i) => i.value === item.value) === index,
    );
    if (currentValue && !deduped.some((opt) => opt.value === currentValue)) {
      return [{ value: currentValue, label: currentValue }, ...deduped];
    }
    return deduped;
  };

  const findEligibility = (list, policyName) => {
    if (!policyName) return null;
    const key = String(policyName).trim().toLowerCase();
    return Array.isArray(list)
      ? list.find((l) => String(l?.policyName || l?.leaveType || "").trim().toLowerCase() === key)
      : null;
  };

  return (
    <>
      <div className="content">

        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Leaves</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard"><i className="ti ti-smart-home"></i></Link>
                </li>
                <li className="breadcrumb-item">Employee</li>
                <li className="breadcrumb-item active" aria-current="page">Leaves</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
            <div className="mb-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center"
                onClick={openAdd}
                disabled={authLoading}
              >
                <i className="ti ti-circle-plus me-2"></i>Add Leave
              </button>
            </div>
          </div>
        </div>


        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="d-flex">
              <h5 className="me-2">Leave List</h5>
              <span className="badge bg-primary-transparent me-2">Total Leaves : {counts.total}</span>
              <span className="badge bg-secondary-transparent">Total Remaining Leaves : -</span>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>Leave Type</th>
                    <th>From</th>
                    <th>Employee</th>
                    <th>To</th>
                    <th>No of Days</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7}>Loading...</td>
                    </tr>
                  ) : orderedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No leaves found</td>
                    </tr>
                  ) : (
                    orderedRows.map((row) => {
                      const status = String(row?.status || "NEW").toUpperCase();
                      const emp = resolveEmployee(row);
                      return (
                        <tr key={row.id || `${row.employeeId}-${row.fromDate}`}>
                          <td>
                            <div className="d-flex align-items-center">
                              <p className="fs-14 fw-medium d-flex align-items-center mb-0">{resolvePolicyName(row) || "-"}</p>
                              {row.reason ? (
                                <span className="ms-2" title={row.reason}>
                                  <i className="ti ti-info-circle text-info"></i>
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>{formatDate(row.fromDate)}</td>
                          <td>
                            <div className="d-flex align-items-center file-name-icon">
                              <a href="javascript:void(0);" className="avatar avatar-md border avatar-rounded">
                                <img src="assets/img/users/user-34.jpg" className="img-fluid" alt="img" />
                              </a>
                              <div className="ms-2">
                                <h6 className="fw-medium"><a href="javascript:void(0);">-</a></h6>
                                <span className="fs-12 fw-normal ">{emp.department || "-"}</span>
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(row.toDate)}</td>
                          <td>{(row.noOfDays ?? calcDays(row.fromDate, row.toDate)) || "-"}</td>
                          <td>
                            <span
                              className={`badge d-inline-flex align-items-center ${
                                status === "APPROVED"
                                  ? "badge-success bg-success-light text-dark"
                                  : status === "DECLINED"
                                    ? "badge-danger bg-danger-light text-dark"
                                    : "badge-warning bg-warning-light text-dark"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td>
                            <div className="action-icon d-inline-flex">
                              <button type="button" className="btn btn-link p-0 me-2" onClick={() => openEdit(row)} aria-label="Edit leave">
                                <i className="ti ti-edit"></i>
                              </button>
                              <button type="button" className="btn btn-link p-0 text-danger" onClick={() => confirmDelete(row)} aria-label="Delete leave">
                                <i className="ti ti-trash"></i>
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
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Add Leave</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Employee</label>
                      <input className="avm-input" value={currentEmployeeName} disabled />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Leave Type</label>
                      <select
                        className="avm-select"
                        value={form.leaveType}
                        onChange={(e) => setForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                        disabled={!currentEmployeeId}
                      >
                        <option value="">Select</option>
                        {buildPolicyOptions(form.leaveType, eligibleAdd).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {(() => {
                        const info = findEligibility(eligibleAdd, form.leaveType);
                        if (!info) return null;
                        const allowed = info.allowedDays ?? "-";
                        const used = info.usedDays ?? "-";
                        const remaining = info.remainingDays ?? "-";
                        return (
                          <small className="text-muted d-block mt-1">
                            Balance: {remaining} remaining / {allowed} allowed (used {used})
                          </small>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">From</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={form.fromDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">To</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={form.toDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">No of Days</label>
                      <input type="text" className="avm-input" disabled value={calcDays(form.fromDate, form.toDate) || ""} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Status</label>
                      <select className="avm-select" value={form.status} disabled>
                        <option value="NEW">New</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Reason</label>
                      <textarea
                        className="avm-input"
                        rows="3"
                        value={form.reason}
                        onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div></div>
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowAddModal(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn primary" disabled={saving}>
                    {saving ? "Adding..." : "Add Leave"}
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
              <h2 className="avm-modal-title">Edit Leave</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowEditModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Employee</label>
                      <input className="avm-input" value={currentEmployeeName} disabled />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Leave Type</label>
                      <select
                        className="avm-select"
                        value={editForm.leaveType}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                        disabled={!currentEmployeeId}
                      >
                        <option value="">Select</option>
                        {buildPolicyOptions(editForm.leaveType, eligibleEdit).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {(() => {
                        const info = findEligibility(eligibleEdit, editForm.leaveType);
                        if (!info) return null;
                        const allowed = info.allowedDays ?? "-";
                        const used = info.usedDays ?? "-";
                        const remaining = info.remainingDays ?? "-";
                        return (
                          <small className="text-muted d-block mt-1">
                            Balance: {remaining} remaining / {allowed} allowed (used {used})
                          </small>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">From</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={editForm.fromDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">To</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={editForm.toDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, toDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">No of Days</label>
                      <input type="text" className="avm-input" disabled value={calcDays(editForm.fromDate, editForm.toDate) || ""} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Status</label>
                      <select className="avm-select" value={editForm.status} disabled>
                        <option value="NEW">New</option>
                        <option value="APPROVED">Approved</option>
                        <option value="DECLINED">Declined</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Reason</label>
                      <textarea
                        className="avm-input"
                        rows="3"
                        value={editForm.reason}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div></div>
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowEditModal(false)} disabled={saving}>
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
                Are you sure you want to delete
                {deleteTarget?.leaveType ? ` "${deleteTarget.leaveType}"` : " this leave"}
                ?
              </p>
            </div>
            <div className="avm-footer">
              <div></div>
              <div className="avm-footer-right">
                <button type="button" className="avm-btn light" onClick={() => setShowDeleteModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="avm-btn danger" onClick={handleDelete} disabled={saving}>
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



