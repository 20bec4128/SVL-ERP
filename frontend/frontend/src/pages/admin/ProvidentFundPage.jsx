import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import { getEmployees } from "../../api/employeesApi";
import { getProvidentFunds, createProvidentFund, updateProvidentFund, deleteProvidentFund } from "../../api/providentFundApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

const ProvidentFundPage = () => {
  const [funds, setFunds] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Targets
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    employeeId: "",
    pfType: "Employee Provident Fund",
    employeeShareAmount: "",
    organizationShareAmount: "",
    description: "",
    status: "Pending"
  });

  const [editForm, setEditForm] = useState({
    employeeId: "",
    pfType: "Employee Provident Fund",
    employeeShareAmount: "",
    organizationShareAmount: "",
    description: "",
    status: "Pending"
  });

  // Kebab actions
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [pfList, empList] = await Promise.all([
        getProvidentFunds(),
        getEmployees()
      ]);
      setFunds(pfList);
      setEmployees(empList);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return funds;
    return funds.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.designation && r.designation.toLowerCase().includes(q)) ||
        (r.pfType && r.pfType.toLowerCase().includes(q))
    );
  }, [funds, search]);

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
  }, [clampedPage, page]);

  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
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

  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? funds.filter((r) => selectedIds.has(r.id))
      : filteredRows;
    const headers = ["Employee Name", "Designation", "Provident Fund Type", "Employee Share", "Organization Share", "Status"];
    const body = targetRows.map((r) => [r.name, r.designation, r.pfType, r.employeeShareAmount, r.organizationShareAmount, r.status]);
    const csvContent = [headers, ...body]
      .map((line) => line.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `provident_funds_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    exportCsv();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? funds.filter((r) => selectedIds.has(r.id))
      : filteredRows;
    const doc = new jsPDF();
    doc.text("Provident Funds List", 14, 15);
    const headers = [["Employee Name", "Designation", "Type", "Emp Share", "Org Share", "Status"]];
    const body = targetRows.map((r) => [r.name, r.designation, r.pfType, `$${r.employeeShareAmount}`, `$${r.organizationShareAmount}`, r.status]);
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20,
    });
    doc.save(`provident_funds_${Date.now()}.pdf`);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.employeeId) {
      showError("Please select an employee");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...addForm,
        employeeId: parseInt(addForm.employeeId),
        employeeShareAmount: parseFloat(addForm.employeeShareAmount) || 0,
        organizationShareAmount: parseFloat(addForm.organizationShareAmount) || 0
      };
      await createProvidentFund(payload);
      showSuccess("Provident Fund record added successfully");
      setShowAddModal(false);
      setAddForm({
        employeeId: "",
        pfType: "Employee Provident Fund",
        employeeShareAmount: "",
        organizationShareAmount: "",
        description: "",
        status: "Pending"
      });
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to create Provident Fund record"));
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        employeeId: parseInt(editForm.employeeId),
        employeeShareAmount: parseFloat(editForm.employeeShareAmount) || 0,
        organizationShareAmount: parseFloat(editForm.organizationShareAmount) || 0
      };
      await updateProvidentFund(editTarget.id, payload);
      showSuccess("Provident Fund record updated successfully");
      setShowEditModal(false);
      setEditTarget(null);
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update Provident Fund record"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteProvidentFund(deleteTarget.id);
        showSuccess("Provident Fund record deleted successfully");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        setShowDeleteModal(false);
        setDeleteTarget(null);
        loadData();
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to delete Provident Fund record"));
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteProvidentFund(id)));
      showSuccess("Selected Provident Fund records deleted successfully");
      setSelectedIds(new Set());
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete some Provident Fund records"));
    }
  };

  return (
    <>
      <div className="content">
        {/* Custom White Header Card */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Provident Fund</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item" style={{ color: "#64748b" }}>HR</li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Provident Fund</li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => setShowAddModal(true)}
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
                Add Provident Fund
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls Bar inside the table card */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search PF..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="dropdown">
                <button
                  className="btn btn-outline-light dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  id="exportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem", color: "#64748b", border: "1px solid #e2e8f0", backgroundColor: "#fff" }}
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
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
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
                      <th style={{ width: "50px" }}>#</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Provident Fund Type</th>
                      <th>Employee Share</th>
                      <th>Organization Share</th>
                      <th>Status</th>
                      <th style={{ width: "80px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-4">No data found</td>
                      </tr>
                    ) : (
                      pagedRows.map((row, idx) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.has(row.id)}
                              onChange={() => toggleRowSelection(row.id)}
                            />
                          </td>
                          <td>{pageOffset + idx + 1}</td>
                          <td className="fw-semibold text-dark">{row.name}</td>
                          <td>{row.designation}</td>
                          <td>{row.pfType}</td>
                          <td>${row.employeeShareAmount}</td>
                          <td>${row.organizationShareAmount}</td>
                          <td>
                            <span className={`badge ${row.status === "Approved" ? "bg-success" : "bg-warning"} text-white`}>
                              {row.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeActionsRow?.id === row.id) {
                                  setActiveActionsRow(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setActionsMenuPos({
                                    top: rect.top + window.scrollY,
                                    left: rect.right + window.scrollX,
                                  });
                                  setActiveActionsRow(row);
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
            )}
          </div>

          {/* Pagination Footer */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top bg-white" style={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <span className="text-muted small">
              {totalRows === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${pageOffset + 1} to ${Math.min(pageOffset + pageSize, totalRows)} of ${totalRows} entries`}
            </span>

            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
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
                    className={`btn btn-sm border-0 ${clampedPage === pageNum ? "btn-primary active text-white" : "btn-light"}`}
                    style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: clampedPage === pageNum ? "#3b82f6" : undefined }}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
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

      {/* Add Modal */}
      {showAddModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Provident Fund</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleAddSubmit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Employee Name</label>
                        <select
                          className="form-select"
                          value={addForm.employeeId}
                          onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                          required
                        >
                          <option value="">Select Employee</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.employeeCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Provident Fund Type</label>
                        <select
                          className="form-select"
                          value={addForm.pfType}
                          onChange={(e) => setAddForm({ ...addForm, pfType: e.target.value })}
                          required
                        >
                          <option value="Employee Provident Fund">Employee Provident Fund</option>
                          <option value="Voluntary Provident Fund">Voluntary Provident Fund</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Employee Share Amount ($)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={addForm.employeeShareAmount}
                          onChange={(e) => setAddForm({ ...addForm, employeeShareAmount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Organization Share Amount ($)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={addForm.organizationShareAmount}
                          onChange={(e) => setAddForm({ ...addForm, organizationShareAmount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          value={addForm.description}
                          onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                          rows="3"
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={addForm.status}
                          onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }} disabled={saving}>
                      Add Provident Fund
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editTarget && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Provident Fund</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => { setShowEditModal(false); setEditTarget(null); }}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Employee Name</label>
                        <select className="form-select" disabled value={editForm.employeeId}>
                          <option value={editForm.employeeId}>{editTarget.name}</option>
                        </select>
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Provident Fund Type</label>
                        <select
                          className="form-select"
                          value={editForm.pfType}
                          onChange={(e) => setEditForm({ ...editForm, pfType: e.target.value })}
                          required
                        >
                          <option value="Employee Provident Fund">Employee Provident Fund</option>
                          <option value="Voluntary Provident Fund">Voluntary Provident Fund</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Employee Share Amount ($)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editForm.employeeShareAmount}
                          onChange={(e) => setEditForm({ ...editForm, employeeShareAmount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Organization Share Amount ($)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editForm.organizationShareAmount}
                          onChange={(e) => setEditForm({ ...editForm, organizationShareAmount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows="3"
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => { setShowEditModal(false); setEditTarget(null); }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }} disabled={saving}>
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body text-center">
                  <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                    <i className="ti ti-trash-x fs-36"></i>
                  </span>
                  <h4 className="mb-1">Confirm Delete</h4>
                  <p className="mb-3">Are you sure you want to delete provident fund for <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
                  <div className="d-flex justify-content-center">
                    <button type="button" className="btn btn-light me-3" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>Cancel</button>
                    <button type="button" className="btn btn-danger" onClick={handleDelete}>Yes, Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

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
            minWidth: 150
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              setEditTarget(activeActionsRow);
              setEditForm({
                employeeId: activeActionsRow.employeeId,
                pfType: activeActionsRow.pfType || "Employee Provident Fund",
                employeeShareAmount: activeActionsRow.employeeShareAmount || "",
                organizationShareAmount: activeActionsRow.organizationShareAmount || "",
                description: activeActionsRow.description || "",
                status: activeActionsRow.status || "Pending"
              });
              setShowEditModal(true);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit PF
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              setDeleteTarget(activeActionsRow);
              setShowDeleteModal(true);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete PF
          </button>
        </div>,
        document.body
      )}

      {/* Floating Bulk Actions Bar */}
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
            <span className="fw-medium text-white">items selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "#dc2626", color: "#ffffff", border: "none" }}
              onClick={handleBulkDelete}
            >
              <i className="ti ti-trash" /> Delete
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
    </>
  );
};

export default ProvidentFundPage;
