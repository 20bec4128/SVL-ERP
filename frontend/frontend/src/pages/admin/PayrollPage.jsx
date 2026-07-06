import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import {
  getAdditions, createAddition, updateAddition, deleteAddition,
  getOvertimes, createOvertime, updateOvertime, deleteOvertime,
  getDeductions, createDeduction, updateDeduction, deleteDeduction
} from "../../api/payrollItemsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

const PayrollPage = () => {
  const [activeTab, setActiveTab] = useState("additions"); // additions, overtimes, deductions
  const [rows, setRows] = useState([]);
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
    name: "",
    category: "MONTHLY", // for additions: MONTHLY/ADDITIONAL
    rateType: "HOURLY", // for overtimes: HOURLY/DAILY
    rate: "0",          // for overtimes
    status: "Active"    // for additions & deductions
  });

  const [editForm, setEditForm] = useState({
    name: "",
    category: "MONTHLY",
    rateType: "HOURLY",
    rate: "0",
    status: "Active"
  });

  // (Kebab actions now handled via Bootstrap dropdown)

  const loadData = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      let data = [];
      if (activeTab === "additions") {
        data = await getAdditions();
      } else if (activeTab === "overtimes") {
        data = await getOvertimes();
      } else {
        data = await getDeductions();
      }
      setRows(data);
    } catch (e) {
      showError(extractApiErrorMessage(e, `Failed to load ${activeTab}`));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.rateType && r.rateType.toLowerCase().includes(q))
    );
  }, [rows, search]);

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
      ? rows.filter((r) => selectedIds.has(r.id))
      : filteredRows;
    let headers = ["Name"];
    let body = [];
    if (activeTab === "additions") {
      headers = ["Name", "Category", "Status"];
      body = targetRows.map((r) => [r.name, r.category, r.status]);
    } else if (activeTab === "overtimes") {
      headers = ["Name", "Rate Type", "Rate"];
      body = targetRows.map((r) => [r.name, r.rateType, r.rate]);
    } else {
      headers = ["Name", "Status"];
      body = targetRows.map((r) => [r.name, r.status]);
    }
    const csvContent = [headers, ...body]
      .map((line) => line.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTab}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    exportCsv();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter((r) => selectedIds.has(r.id))
      : filteredRows;
    const doc = new jsPDF();
    doc.text(`${activeTab.toUpperCase()} List`, 14, 15);
    let headers = [["Name"]];
    let body = [];
    if (activeTab === "additions") {
      headers = [["Name", "Category", "Status"]];
      body = targetRows.map((r) => [r.name, r.category, r.status || "Active"]);
    } else if (activeTab === "overtimes") {
      headers = [["Name", "Rate Type", "Rate"]];
      body = targetRows.map((r) => [r.name, r.rateType, `₹${r.rate}`]);
    } else {
      headers = [["Name", "Status"]];
      body = targetRows.map((r) => [r.name, r.status || "Active"]);
    }
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20,
    });
    doc.save(`${activeTab}_${Date.now()}.pdf`);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === "additions") {
        await createAddition(addForm);
      } else if (activeTab === "overtimes") {
        await createOvertime({ ...addForm, rate: parseFloat(addForm.rate) || 0 });
      } else {
        await createDeduction(addForm);
      }
      showSuccess(`Created successfully`);
      setShowAddModal(false);
      setAddForm({
        name: "",
        category: "MONTHLY",
        rateType: "HOURLY",
        rate: "0",
        status: "Active"
      });
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, `Failed to create`));
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === "additions") {
        await updateAddition(editTarget.id, editForm);
      } else if (activeTab === "overtimes") {
        await updateOvertime(editTarget.id, { ...editForm, rate: parseFloat(editForm.rate) || 0 });
      } else {
        await updateDeduction(editTarget.id, editForm);
      }
      showSuccess(`Updated successfully`);
      setShowEditModal(false);
      setEditTarget(null);
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, `Failed to update`));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        if (activeTab === "additions") {
          await deleteAddition(deleteTarget.id);
        } else if (activeTab === "overtimes") {
          await deleteOvertime(deleteTarget.id);
        } else {
          await deleteDeduction(deleteTarget.id);
        }
        showSuccess(`Deleted successfully`);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        setShowDeleteModal(false);
        setDeleteTarget(null);
        loadData();
      } catch (e) {
        showError(extractApiErrorMessage(e, `Failed to delete`));
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      if (activeTab === "additions") {
        await Promise.all(Array.from(selectedIds).map((id) => deleteAddition(id)));
      } else if (activeTab === "overtimes") {
        await Promise.all(Array.from(selectedIds).map((id) => deleteOvertime(id)));
      } else {
        await Promise.all(Array.from(selectedIds).map((id) => deleteDeduction(id)));
      }
      showSuccess(`Deleted selected items successfully`);
      setSelectedIds(new Set());
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, `Failed to delete some items`));
    }
  };

  return (
    <>
      <div className="content">
        {/* Custom White Header Card */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Payroll Items</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item" style={{ color: "#64748b" }}>HR</li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Payroll Items</li>
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
                Add {activeTab === "additions" ? "Addition" : activeTab === "overtimes" ? "Overtime" : "Deduction"}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="d-flex flex-wrap gy-2 justify-content-between mb-4">
          <div className="payroll-btns">
            <button
              onClick={() => setActiveTab("additions")}
              className={`btn border me-2 ${activeTab === "additions" ? "btn-primary active text-white" : "btn-white"}`}
              style={activeTab === "additions" ? { backgroundColor: "#3b82f6", borderColor: "#3b82f6" } : {}}
            >
              Additions
            </button>
            <button
              onClick={() => setActiveTab("overtimes")}
              className={`btn border me-2 ${activeTab === "overtimes" ? "btn-primary active text-white" : "btn-white"}`}
              style={activeTab === "overtimes" ? { backgroundColor: "#3b82f6", borderColor: "#3b82f6" } : {}}
            >
              Overtime
            </button>
            <button
              onClick={() => setActiveTab("deductions")}
              className={`btn border ${activeTab === "deductions" ? "btn-primary active text-white" : "btn-white"}`}
              style={activeTab === "deductions" ? { backgroundColor: "#3b82f6", borderColor: "#3b82f6" } : {}}
            >
              Deductions
            </button>
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
                placeholder={`Search ${activeTab}...`}
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
                      <th>Name</th>
                      {activeTab === "additions" && <th>Category</th>}
                      {activeTab === "overtimes" && <th>Rate Type</th>}
                      {activeTab === "overtimes" && <th>Rate</th>}
                      {(activeTab === "additions" || activeTab === "deductions") && <th>Status</th>}
                      <th style={{ width: "80px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">No data found</td>
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
                          {activeTab === "additions" && <td>{row.category}</td>}
                          {activeTab === "overtimes" && <td>{row.rateType}</td>}
                          {activeTab === "overtimes" && <td>₹{row.rate}</td>}
                          {(activeTab === "additions" || activeTab === "deductions") && (
                            <td>
                              <div className="form-check form-switch mb-0 d-flex align-items-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  checked={row.status === "Active" || row.status === "ACTIVE" || !row.status}
                                  onChange={async (e) => {
                                    const newStatus = e.target.checked ? "Active" : "Inactive";
                                    try {
                                      if (activeTab === "additions") {
                                        await updateAddition(row.id, { ...row, status: newStatus });
                                      } else {
                                        await updateDeduction(row.id, { ...row, status: newStatus });
                                      }
                                      showSuccess("Status updated successfully");
                                      loadData();
                                    } catch (err) {
                                      showError("Failed to update status");
                                    }
                                  }}
                                  style={{ cursor: "pointer" }}
                                />
                                <span className={`badge ms-2 ${row.status === "Inactive" ? "bg-light text-muted" : "bg-transparent-success text-success"}`} style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: 4 }}>
                                  {row.status === "Inactive" ? "Inactive" : "Active"}
                                </span>
                              </div>
                            </td>
                          )}
                          <td>
                            <div className="dropdown">
                              <button
                                type="button"
                                className="btn btn-kebab-actions d-flex align-items-center justify-content-center dropdown-toggle no-caret"
                                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                                data-bs-toggle="dropdown"
                                data-bs-boundary="viewport"
                                data-bs-popper-config='{"strategy":"fixed"}'
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: 10, minWidth: 160 }}>
                                <li>
                                  <button
                                    className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
                                    style={{ fontSize: "0.85rem" }}
                                    onClick={() => {
                                      setEditTarget(row);
                                      setEditForm({
                                        name: row.name || "",
                                        category: row.category || "MONTHLY",
                                        rateType: row.rateType || "HOURLY",
                                        rate: row.rate || "0",
                                        status: row.status || "Active"
                                      });
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Item
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
                                    style={{ fontSize: "0.85rem" }}
                                    onClick={() => {
                                      setDeleteTarget(row);
                                      setShowDeleteModal(true);
                                    }}
                                  >
                                    <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Item
                                  </button>
                                </li>
                              </ul>
                            </div>
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
                  <h4 className="modal-title">Add {activeTab === "additions" ? "Addition" : activeTab === "overtimes" ? "Overtime" : "Deduction"}</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleAddSubmit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={addForm.name}
                          onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                          required
                        />
                      </div>
                      
                      {activeTab === "additions" && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label">Category</label>
                          <select
                            className="form-select"
                            value={addForm.category}
                            onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                          >
                            <option value="MONTHLY">MONTHLY</option>
                            <option value="ADDITIONAL">ADDITIONAL</option>
                          </select>
                        </div>
                      )}

                      {activeTab === "overtimes" && (
                        <>
                          <div className="col-md-12 mb-3">
                            <label className="form-label">Rate Type</label>
                            <select
                              className="form-select"
                              value={addForm.rateType}
                              onChange={(e) => setAddForm({ ...addForm, rateType: e.target.value })}
                            >
                              <option value="HOURLY">HOURLY</option>
                              <option value="DAILY">DAILY</option>
                            </select>
                          </div>
                          <div className="col-md-12 mb-3">
                            <label className="form-label">Rate</label>
                            <input
                              type="number"
                              className="form-control"
                              value={addForm.rate}
                              onChange={(e) => setAddForm({ ...addForm, rate: e.target.value })}
                              required
                            />
                          </div>
                        </>
                      )}

                      {(activeTab === "additions" || activeTab === "deductions") && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label d-block">Status</label>
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="addStatus"
                              role="switch"
                              checked={addForm.status === "Active"}
                              onChange={(e) => setAddForm({ ...addForm, status: e.target.checked ? "Active" : "Inactive" })}
                              style={{ cursor: "pointer" }}
                            />
                            <label className="form-check-label ms-1" htmlFor="addStatus">
                              {addForm.status === "Active" ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }} disabled={saving}>
                      Add
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
                  <h4 className="modal-title">Edit {activeTab === "additions" ? "Addition" : activeTab === "overtimes" ? "Overtime" : "Deduction"}</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => { setShowEditModal(false); setEditTarget(null); }}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          required
                        />
                      </div>
                      
                      {activeTab === "additions" && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label">Category</label>
                          <select
                            className="form-select"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          >
                            <option value="MONTHLY">MONTHLY</option>
                            <option value="ADDITIONAL">ADDITIONAL</option>
                          </select>
                        </div>
                      )}

                      {activeTab === "overtimes" && (
                        <>
                          <div className="col-md-12 mb-3">
                            <label className="form-label">Rate Type</label>
                            <select
                              className="form-select"
                              value={editForm.rateType}
                              onChange={(e) => setEditForm({ ...editForm, rateType: e.target.value })}
                            >
                              <option value="HOURLY">HOURLY</option>
                              <option value="DAILY">DAILY</option>
                            </select>
                          </div>
                          <div className="col-md-12 mb-3">
                            <label className="form-label">Rate</label>
                            <input
                              type="number"
                              className="form-control"
                              value={editForm.rate}
                              onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                              required
                            />
                          </div>
                        </>
                      )}

                      {(activeTab === "additions" || activeTab === "deductions") && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label d-block">Status</label>
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="editStatus"
                              role="switch"
                              checked={editForm.status === "Active"}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.checked ? "Active" : "Inactive" })}
                              style={{ cursor: "pointer" }}
                            />
                            <label className="form-check-label ms-1" htmlFor="editStatus">
                              {editForm.status === "Active" ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </div>
                      )}
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
                  <p className="mb-3">Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
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

      {/* Kebab actions are now Bootstrap dropdowns — no portal needed */}

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

export default PayrollPage;
