import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createDesignation,
  deleteDesignation,
  getDesignations,
  updateDesignation,
} from "../../api/designationsApi";
import { getDepartmentsMaster, getDepartmentsMasterByBranch } from "../../api/departmentsApi";
import { getHeadOffices } from "../../api/headOfficesApi";
import { getBranches } from "../../api/branchesApi";
import { getEmployees } from "../../api/employeesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "../../../public/assets/css/addModalShared.css";

const initialForm = {
  name: "",
  departmentMasterIds: [],
  status: "ACTIVE",
};

function isActiveMaster(item) {
  return String(item?.status || "ACTIVE").toUpperCase() !== "INACTIVE";
}

function withInactiveSelected(items, selectedId) {
  const list = Array.isArray(items) ? items : [];
  const active = list.filter(isActiveMaster);
  if (!selectedId) return active;

  const selected = list.find((it) => String(it?.id) === String(selectedId));
  if (!selected || isActiveMaster(selected)) return active;

  return [
    ...active,
    { ...selected, name: `${selected?.name || "Selected"} (Inactive)` },
  ];
}

export default function DesignationsPage() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    headOfficeId: "",
    branchId: "",
    departmentId: "",
    status: "",
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [filterBranches, setFilterBranches] = useState([]);
  const [filterDepartments, setFilterDepartments] = useState([]);
  const [modalHeadOfficeId, setModalHeadOfficeId] = useState("");
  const [modalBranchId, setModalBranchId] = useState("");
  const [modalBranches, setModalBranches] = useState([]);
  const [modalDepartments, setModalDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Search & Pagination States
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = async () => {
    setLoading(true);
    try {
      const data = filters.departmentId ? await getDesignations(filters.departmentId) : await getDesignations();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load designations"));
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    setMetaLoading(true);
    try {
      const [hos, deps] = await Promise.all([getHeadOffices(), getDepartmentsMaster()]);
      setHeadOffices(Array.isArray(hos) ? hos : []);
      setAllDepartments(Array.isArray(deps) ? deps : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load masters"));
    } finally {
      setMetaLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadMeta();
    loadEmployees();
  }, []);

  useEffect(() => {
    load();
  }, [filters.departmentId]);

  useEffect(() => {
    (async () => {
      if (!filters.headOfficeId) {
        setBranches([]);
        setDepartments([]);
        return;
      }
      try {
        const data = await getBranches(filters.headOfficeId);
        setBranches(Array.isArray(data) ? data : []);
      } catch {
        setBranches([]);
      }
      setDepartments([]);
    })();
  }, [filters.headOfficeId]);

  useEffect(() => {
    (async () => {
      if (!filters.branchId) {
        setDepartments([]);
        return;
      }
      try {
        const deps = await getDepartmentsMasterByBranch(filters.branchId);
        setDepartments(Array.isArray(deps) ? deps : []);
      } catch {
        setDepartments([]);
      }
    })();
  }, [filters.branchId]);

  useEffect(() => {
    (async () => {
      if (!modalHeadOfficeId) {
        setModalBranches([]);
        setModalBranchId("");
        setModalDepartments([]);
        setForm((prev) => ({ ...prev, departmentId: "" }));
        return;
      }
      try {
        const data = await getBranches(modalHeadOfficeId);
        setModalBranches(Array.isArray(data) ? data : []);
      } catch {
        setModalBranches([]);
      }
      setModalBranchId("");
      setModalDepartments([]);
      setForm((prev) => ({ ...prev, departmentId: "" }));
    })();
  }, [modalHeadOfficeId]);

  useEffect(() => {
    (async () => {
      if (!modalBranchId) {
        setModalDepartments([]);
        setForm((prev) => ({ ...prev, departmentId: "" }));
        return;
      }
      try {
        const deps = await getDepartmentsMasterByBranch(modalBranchId);
        setModalDepartments(Array.isArray(deps) ? deps : []);
      } catch {
        setModalDepartments([]);
      }
      setForm((prev) => ({ ...prev, departmentId: "" }));
    })();
  }, [modalBranchId]);

  useEffect(() => {
    (async () => {
      const hoId = draftFilters.headOfficeId;
      if (!filterOpen || !hoId) {
        setFilterBranches([]);
        return;
      }
      try {
        const data = await getBranches(hoId);
        setFilterBranches(Array.isArray(data) ? data : []);
      } catch {
        setFilterBranches([]);
      }
    })();
  }, [filterOpen, draftFilters.headOfficeId]);

  useEffect(() => {
    (async () => {
      const branchId = draftFilters.branchId;
      if (!filterOpen || !branchId) {
        setFilterDepartments([]);
        return;
      }
      try {
        const deps = await getDepartmentsMasterByBranch(branchId);
        setFilterDepartments(Array.isArray(deps) ? deps : []);
      } catch {
        setFilterDepartments([]);
      }
    })();
  }, [filterOpen, draftFilters.branchId]);

  // Filter, Search & Pagination Logic
  const filteredRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
    const search = searchText.trim().toLowerCase();
    const deptIdSet = new Set((departments || []).map((d) => String(d.id)));
    return sorted.filter((row) => {
      const status = String(row?.status || "ACTIVE").toUpperCase();
      const statusOk = !filters.status || status === String(filters.status).toUpperCase();
      const searchOk =
        !search ||
        String(row?.name || "").toLowerCase().includes(search) ||
        (row.departmentMasterNames && row.departmentMasterNames.some(name => String(name).toLowerCase().includes(search)));
      const deptOk =
        !filters.departmentId ||
        (row.departmentMasterIds && row.departmentMasterIds.map(String).includes(String(filters.departmentId)));
      const branchOk =
        !filters.branchId ||
        !!filters.departmentId ||
        (row.departmentMasterIds && row.departmentMasterIds.some(id => deptIdSet.has(String(id))));
      return statusOk && searchOk && deptOk && branchOk;
    });
  }, [rows, searchText, filters.status, filters.departmentId, filters.branchId, departments]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [searchText, filters]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const orderedDepartments = useMemo(
    () => [...(departments || [])].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [departments],
  );

  const designationCounts = useMemo(() => {
    const map = new Map();
    employees.forEach((e) => {
      const d = String(e?.designation || "").trim();
      if (!d) return;
      map.set(d.toLowerCase(), (map.get(d.toLowerCase()) || 0) + 1);
    });
    return map;
  }, [employees]);

  const handleAddDesignation = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError("Designation name is required");
      return;
    }
    setSaving(true);
    try {
      await createDesignation({
        name: form.name.trim(),
        departmentMasterIds: [],
        status: form.status,
      });
      setForm(initialForm);
      showSuccess("Designation added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add designation"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditForm({
      name: row?.name || "",
      departmentMasterIds: row?.departmentMasterIds ? row.departmentMasterIds.map(Number) : [],
      status: String(row?.status || "ACTIVE").toUpperCase(),
    });
    setSelectedId(row?.id || null);
    setShowEditModal(true);
  };

  const handleEditDesignation = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.name.trim()) {
      showError("Designation name is required");
      return;
    }
    setSaving(true);
    try {
      await updateDesignation(selectedId, {
        name: editForm.name.trim(),
        departmentMasterIds: editForm.departmentMasterIds || [],
        status: editForm.status,
      });
      showSuccess("Designation updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update designation"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row || null);
    setSelectedId(row?.id || null);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deleteDesignation(selectedId);
      showSuccess("Designation deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete designation"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="container-fluid content">
        {/* Header Block */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Designations</h2>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-decoration-none text-muted">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Employee</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">
                    Designations
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
                onClick={() => {
                  setModalHeadOfficeId("");
                  setModalBranchId("");
                  setModalBranches([]);
                  setModalDepartments([]);
                  setForm(initialForm);
                  setShowAddModal(true);
                }}
              >
                <i className="ti ti-plus" />
                Add Designation
              </button>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body">
            {/* Search Controls Bar */}
            <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
                <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
                <input
                  type="text"
                  className="form-control border-0 bg-transparent shadow-none"
                  placeholder="Search designations..."
                  style={{ height: 36, fontSize: "0.9rem" }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={`btn btn-outline-filter d-flex align-items-center gap-2 ${filterOpen ? 'active' : ''}`}
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={() => {
                  setDraftFilters(filters);
                  setFilterOpen(true);
                }}
              >
                <i className="ti ti-filter" style={{ fontSize: "1rem" }} />
                Filters
              </button>
            </div>

            {/* Filter Drawer */}
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
                    <h6 className="mb-0 fw-bold">Filters</h6>
                    <button type="button" className="btn-close" onClick={() => setFilterOpen(false)} />
                  </div>

                  <div className="p-3">
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">Head Office</label>
                      <select
                        className="form-select"
                        value={draftFilters.headOfficeId}
                        onChange={(e) => {
                          const headOfficeId = e.target.value;
                          setDraftFilters((prev) => ({
                            ...prev,
                            headOfficeId,
                            branchId: "",
                            departmentId: "",
                          }));
                        }}
                        disabled={metaLoading}
                      >
                        <option value="">All</option>
                        {[...headOffices]
                          .filter(isActiveMaster)
                          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                          .map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">Branch</label>
                      <select
                        className="form-select"
                        value={draftFilters.branchId}
                        onChange={(e) => {
                          const branchId = e.target.value;
                          setDraftFilters((prev) => ({
                            ...prev,
                            branchId,
                            departmentId: "",
                          }));
                        }}
                        disabled={!draftFilters.headOfficeId}
                      >
                        <option value="">{draftFilters.headOfficeId ? "All" : "Select head office first"}</option>
                        {[...filterBranches]
                          .filter(isActiveMaster)
                          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">Department</label>
                      <select
                        className="form-select"
                        value={draftFilters.departmentId}
                        onChange={(e) =>
                          setDraftFilters((prev) => ({ ...prev, departmentId: e.target.value }))
                        }
                        disabled={!draftFilters.branchId}
                      >
                        <option value="">{draftFilters.branchId ? "All" : "Select branch first"}</option>
                        {[...filterDepartments]
                          .filter(isActiveMaster)
                          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">Status</label>
                      <select
                        className="form-select"
                        value={draftFilters.status}
                        onChange={(e) =>
                          setDraftFilters((prev) => ({ ...prev, status: e.target.value }))
                        }
                      >
                        <option value="">All</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 border-top d-flex gap-2 position-absolute bottom-0 w-100 bg-white">
                    <button
                      type="button"
                      className="btn btn-light w-50"
                      style={{ borderRadius: 8, fontWeight: "600" }}
                      onClick={() =>
                        setDraftFilters({ headOfficeId: "", branchId: "", departmentId: "", status: "" })
                      }
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary w-50"
                      style={{ borderRadius: 8, fontWeight: "600", backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
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

            {loading ? (
              <div className="text-center py-5 text-muted">Loading designations...</div>
            ) : (
              <>
                <div className="table-responsive leads-table-wrap border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
                  <table className="table table-hover align-middle leads-table mb-0">
                    <thead>
                      <tr>
                        <th className="text-muted" style={{ width: 100, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Designation</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Departments</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>No of Employees</th>
                        <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                        <th className="text-muted text-end" style={{ width: 180, fontWeight: "600", fontSize: "0.85rem" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            No designations found
                          </td>
                        </tr>
                      ) : (
                        pagedRows.map((row, idx) => {
                          const active = String(row?.status || "ACTIVE").toUpperCase() !== "INACTIVE";
                          return (
                            <tr key={row.id || `${row.name}`}>
                              <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{(page - 1) * pageSize + idx + 1}</td>
                              <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{row.name || "-"}</td>
                              <td>
                                {row.departmentMasterNames && row.departmentMasterNames.length > 0 ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {row.departmentMasterNames.map((name, i) => (
                                      <span key={i} className="badge bg-light text-dark border" style={{ fontSize: "0.75rem" }}>
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted small">No Departments</span>
                                )}
                              </td>
                              <td style={{ color: "#475569", fontSize: "0.9rem" }}>
                                {designationCounts.get(String(row.name || "").trim().toLowerCase()) ??
                                  row.employeeCount ??
                                  row.noOfEmployees ??
                                  0}
                              </td>
                              <td>
                                <span
                                  className={`badge d-inline-flex align-items-center badge-xs ${
                                    active ? "badge-success" : "badge-danger"
                                  }`}
                                >
                                  <i className="ti ti-point-filled me-1"></i>
                                  {active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    style={{ borderRadius: 8, fontWeight: "600" }}
                                    onClick={() => openEdit(row)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    style={{ borderRadius: 8, fontWeight: "600" }}
                                    onClick={() => confirmDelete(row)}
                                  >
                                    Delete
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

                {/* Pagination Footer */}
                {filteredRows.length > 0 && (
                  <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
                    <span className="entries-info text-muted small">
                      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} entries
                    </span>

                    <div className="pagination-numbers-container d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                        style={{ width: 32, height: 32, borderRadius: 6 }}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <i className="ti ti-chevron-left" />
                      </button>

                      {(() => {
                        const buttons = [];
                        const maxVisible = 5;
                        let startPage = Math.max(1, page - 2);
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                        if (maxVisible - 1 > endPage - startPage) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }

                        if (startPage > 1) {
                          buttons.push(
                            <button
                              key={1}
                              className={`btn-pagination-num btn btn-sm border-0 ${page === 1 ? 'btn-primary text-white' : 'btn-light'}`}
                              style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === 1 ? "#3b82f6" : undefined }}
                              onClick={() => setPage(1)}
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            buttons.push(<span key="dots-start" className="pagination-dots px-1 text-muted">...</span>);
                          }
                        }

                        for (let i = startPage; endPage >= i; i++) {
                          buttons.push(
                            <button
                              key={i}
                              className={`btn-pagination-num btn btn-sm border-0 ${page === i ? 'btn-primary text-white' : 'btn-light'}`}
                              style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === i ? "#3b82f6" : undefined }}
                              onClick={() => setPage(i)}
                            >
                              {i}
                            </button>
                          );
                        }

                        if (totalPages > endPage) {
                          if (totalPages - 1 > endPage) {
                            buttons.push(<span key="dots-end" className="pagination-dots px-1 text-muted">...</span>);
                          }
                          buttons.push(
                            <button
                              key={totalPages}
                              className={`btn-pagination-num btn btn-sm border-0 ${page === totalPages ? 'btn-primary text-white' : 'btn-light'}`}
                              style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === totalPages ? "#3b82f6" : undefined }}
                              onClick={() => setPage(totalPages)}
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return buttons;
                      })()}

                      <button
                        type="button"
                        className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                        style={{ width: 32, height: 32, borderRadius: 6 }}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        <i className="ti ti-chevron-right" />
                      </button>
                    </div>

                    <PageSizeSelector
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                      setPage={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Add Designation</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleAddDesignation}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Designation Name <span className="req">*</span></label>
                      <input
                        type="text"
                        className="avm-input"
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Status</label>
                      <select
                        className="avm-select"
                        value={form.status}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, status: e.target.value }))
                        }
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
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
                    {saving ? "Adding..." : "Add Designation"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: "550px" }}>
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Edit Designation</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowEditModal(false)} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleEditDesignation}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Designation Name <span className="req">*</span></label>
                      <input
                        type="text"
                        className="avm-input"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Status</label>
                      <select
                        className="form-select avm-select"
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, status: e.target.value }))
                        }
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label mb-2">Assign Departments</label>
                      <div className="border rounded p-3" style={{ maxHeight: "250px", overflowY: "auto", backgroundColor: "#f8fafc" }}>
                        <div className="row g-2">
                          {[...allDepartments]
                            .filter(isActiveMaster)
                            .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                            .map((dept) => {
                              const isChecked = editForm.departmentMasterIds?.includes(Number(dept.id));
                              return (
                                <div key={dept.id} className="col-sm-6">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`dept-chk-${dept.id}`}
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        const deptIdNum = Number(dept.id);
                                        setEditForm(prev => {
                                          const current = prev.departmentMasterIds || [];
                                          const next = checked
                                            ? [...current, deptIdNum]
                                            : current.filter(id => id !== deptIdNum);
                                          return { ...prev, departmentMasterIds: next };
                                        });
                                      }}
                                    />
                                    <label className="form-check-label small" htmlFor={`dept-chk-${dept.id}`}>
                                      {dept.name}
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
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
                ×
              </button>
            </div>
            <div className="avm-body">
              <p>
                Are you sure you want to delete
                {deleteTarget?.name ? ` "${deleteTarget.name}"` : " this designation"}
                ?
              </p>
            </div>
            <div className="avm-footer">
              <div />
              <div className="avm-footer-right">
                <button type="button" className="avm-btn light" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="avm-btn primary" onClick={handleDelete} disabled={saving}>
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
