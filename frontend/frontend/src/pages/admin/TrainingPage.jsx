import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getEmployees } from "../../api/employeesApi";
import { getTrainingTypes } from "../../api/trainingTypeApi";
import { getTrainers } from "../../api/trainersApi";
import { createTraining, deleteTraining, getTrainings, updateTraining } from "../../api/trainingApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

const initialForm = {
  trainingTypeId: "",
  trainerId: "",
  employeeIds: [],
  cost: "",
  startDate: "",
  endDate: "",
  description: "",
  status: "Active",
};

export default function TrainingPage() {
  const [rows, setRows] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTrainings();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load trainings"));
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [types, trainerList, employeeList] = await Promise.all([
        getTrainingTypes(),
        getTrainers(),
        getEmployees(),
      ]);
      setTrainingTypes(Array.isArray(types) ? types : []);
      setTrainers(Array.isArray(trainerList) ? trainerList : []);
      setEmployees(Array.isArray(employeeList) ? employeeList : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load training meta"));
    }
  };

  useEffect(() => {
    load();
    loadMeta();
  }, []);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || ""))),
    [rows],
  );

  const trainingTypeOptions = useMemo(
    () =>
      (trainingTypes || [])
        .map((t) => ({ id: t?.id, name: t?.trainingType || t?.typeName || "" }))
        .filter((t) => t.id != null && t.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [trainingTypes],
  );

  const trainerOptions = useMemo(
    () =>
      (trainers || [])
        .map((t) => ({
          id: t?.id,
          name: `${t?.firstName || ""} ${t?.lastName || ""}`.trim(),
        }))
        .filter((t) => t.id != null && t.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [trainers],
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

  const openAdd = () => {
    setForm(initialForm);
    setShowAddModal(true);
  };

  const openEdit = (row) => {
    setEditForm({
      trainingTypeId: row?.trainingTypeId ? String(row.trainingTypeId) : "",
      trainerId: row?.trainerId ? String(row.trainerId) : "",
      employeeIds: Array.isArray(row?.employeeIds) ? row.employeeIds : [],
      cost: row?.cost ?? "",
      startDate: row?.startDate ? String(row.startDate).slice(0, 10) : "",
      endDate: row?.endDate ? String(row.endDate).slice(0, 10) : "",
      description: row?.description || "",
      status: row?.status || "Active",
    });
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row || null);
    setSelectedId(row?.id || null);
    setShowDeleteModal(true);
  };

  const setSingleEmployee = (setFn, value) => {
    const id = value ? Number(value) : null;
    setFn((prev) => ({
      ...prev,
      employeeIds: id ? [id] : [],
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.trainingTypeId || !form.trainerId) {
      showError("Training type and trainer are required");
      return;
    }
    setSaving(true);
    try {
      await createTraining({
        trainingTypeId: Number(form.trainingTypeId),
        trainerId: Number(form.trainerId),
        employeeIds: form.employeeIds,
        cost: form.cost ? Number(form.cost) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        description: form.description?.trim() || "",
        status: form.status,
      });
      setForm(initialForm);
      showSuccess("Training added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add training"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.trainingTypeId || !editForm.trainerId) {
      showError("Training type and trainer are required");
      return;
    }
    setSaving(true);
    try {
      await updateTraining(selectedId, {
        trainingTypeId: Number(editForm.trainingTypeId),
        trainerId: Number(editForm.trainerId),
        employeeIds: editForm.employeeIds,
        cost: editForm.cost ? Number(editForm.cost) : null,
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        description: editForm.description?.trim() || "",
        status: editForm.status,
      });
      showSuccess("Training updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update training"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deleteTraining(selectedId);
      showSuccess("Training deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete training"));
    } finally {
      setSaving(false);
    }
  };

  const renderEmployeeSelect = (currentIds, setIds) => (
    <select
      className="form-select"
      value={currentIds?.[0] ? String(currentIds[0]) : ""}
      onChange={(e) => setSingleEmployee(setIds, e.target.value)}
    >
      <option value="">Select</option>
      {employeeOptions.map((e) => (
        <option key={e.id} value={e.id}>{e.name}</option>
      ))}
    </select>
  );

  const resolveTrainer = (row) => row?.trainerName || "-";
  const resolveType = (row) => row?.trainingTypeName || "-";
  const resolveEmployees = (row) => {
    if (Array.isArray(row?.employeeNames) && row.employeeNames.length) return row.employeeNames[0];
    if (Array.isArray(row?.employeeIds) && row.employeeIds.length) return "1 Employee";
    return "-";
  };

  return (
    <>
      <div className="content wf-shell">

        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Training</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">Performance</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Add Training
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
            <div className="mb-2">
              <button type="button" className="btn btn-primary d-flex align-items-center" onClick={openAdd}>
                <i className="ti ti-circle-plus me-2"></i>Add Training
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h5>Training List</h5>
          </div>
          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>Training Type</th>
                    <th>Trainer</th>
                    <th>Employee</th>
                    <th>Time Duration</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8}>Loading...</td>
                    </tr>
                  ) : orderedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8}>No trainings found</td>
                    </tr>
                  ) : (
                    orderedRows.map((row) => (
                      <tr key={row.id || `${row.trainingTypeId}-${row.startDate}`}>
                        <td>{resolveType(row)}</td>
                        <td>{resolveTrainer(row)}</td>
                        <td>{resolveEmployees(row)}</td>
                        <td>
                          {row.startDate || "-"} {row.endDate ? `- ${row.endDate}` : ""}
                        </td>
                        <td>{row.description || "-"}</td>
                        <td>{row.cost != null ? row.cost : "-"}</td>
                        <td>
                          {String(row.status || "Active").toLowerCase() === "inactive" ? (
                            <span className="badge badge-danger d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1"></i>Inactive
                            </span>
                          ) : (
                            <span className="badge badge-success d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1"></i>Active
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="d-inline-flex gap-2">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(row)}>
                              Edit
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(row)}>
                              Delete
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
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg wf-wizard-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Training</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleAdd}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Training Type</label>
                          <select
                            className="form-select"
                            value={form.trainingTypeId}
                            onChange={(e) => setForm((prev) => ({ ...prev, trainingTypeId: e.target.value }))}
                          >
                            <option value="">Select</option>
                            {trainingTypeOptions.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Trainer</label>
                          <select
                            className="form-select"
                            value={form.trainerId}
                            onChange={(e) => setForm((prev) => ({ ...prev, trainerId: e.target.value }))}
                          >
                            <option value="">Select</option>
                            {trainerOptions.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Employee</label>
                          {renderEmployeeSelect(form.employeeIds, setForm)}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Training Cost</label>
                          <input
                            type="number"
                            className="form-control"
                            value={form.cost}
                            onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Start Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={form.startDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">End Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={form.endDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={form.status}
                            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
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
                      {saving ? "Adding..." : "Add Training"}
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
            <div className="modal-dialog modal-dialog-centered modal-lg wf-wizard-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Training</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowEditModal(false)}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleEdit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Training Type</label>
                          <select
                            className="form-select"
                            value={editForm.trainingTypeId}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, trainingTypeId: e.target.value }))}
                          >
                            <option value="">Select</option>
                            {trainingTypeOptions.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Trainer</label>
                          <select
                            className="form-select"
                            value={editForm.trainerId}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, trainerId: e.target.value }))}
                          >
                            <option value="">Select</option>
                            {trainerOptions.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Employee</label>
                          {renderEmployeeSelect(editForm.employeeIds, setEditForm)}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Training Cost</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editForm.cost}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, cost: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Start Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={editForm.startDate}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">End Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={editForm.endDate}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            value={editForm.description}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={editForm.status}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
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
                      {saving ? "Saving..." : "Save Training"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {showDeleteModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body text-center">
                  <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                    <i className="ti ti-trash-x fs-36"></i>
                  </span>
                  <h4 className="mb-1">Confirm Delete</h4>
                  <p className="mb-3">
                    You want to delete this training, this cant be undone once you delete.
                  </p>
                  <div className="d-flex justify-content-center">
                    <button type="button" className="btn btn-light me-3" onClick={() => setShowDeleteModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                      {saving ? "Deleting..." : "Yes, Delete"}
                    </button>
                  </div>
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
