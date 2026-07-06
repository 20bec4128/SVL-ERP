import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createLeave, deleteLeave, getLeaves, updateLeave } from "../../api/leavesApi";
import { getEmployees } from "../../api/employeesApi";
import { getLeaveEligibility } from "../../api/leaveSettingsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";
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

export default function LeavesPage() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
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

  // Search, Selection and Pagination States
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLeaves();
      setRows(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load leaves"));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    setMetaLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      setEmployees([]);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadEmployees();
  }, []);

  useEffect(() => {
    const loadEligibility = async () => {
      if (!form.employeeId) {
        setEligibleAdd(emptyEligibility);
        return;
      }
      try {
        const data = await getLeaveEligibility(form.employeeId);
        setEligibleAdd(Array.isArray(data) ? data : []);
      } catch (e) {
        setEligibleAdd(emptyEligibility);
        showError(extractApiErrorMessage(e, "Failed to load leave eligibility"));
      }
    };
    loadEligibility();
  }, [form.employeeId]);

  useEffect(() => {
    const loadEligibility = async () => {
      if (!editForm.employeeId) {
        setEligibleEdit(emptyEligibility);
        return;
      }
      try {
        const data = await getLeaveEligibility(editForm.employeeId);
        setEligibleEdit(Array.isArray(data) ? data : []);
      } catch (e) {
        setEligibleEdit(emptyEligibility);
        showError(extractApiErrorMessage(e, "Failed to load leave eligibility"));
      }
    };
    loadEligibility();
  }, [editForm.employeeId]);

  const employeeOptions = useMemo(
    () =>
      (employees || [])
        .map((e) => ({
          id: e?.id,
          name: e?.name || e?.employeeName || e?.fullName || "",
          department: e?.dept || e?.department || "",
        }))
        .filter((e) => e.id != null && e.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [employees],
  );

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => String(b.fromDate || "").localeCompare(String(a.fromDate || ""))),
    [rows],
  );

  const resolveEmployee = (row) => {
    const name = row?.employeeName || "";
    if (name) return { name, department: row?.department || "" };
    const match = employeeOptions.find((e) => Number(e.id) === Number(row?.employeeId));
    return { name: match?.name || "-", department: match?.department || "" };
  };

  const resolvePolicyName = (row) => row?.policyName || row?.leaveType || "";

  // Filter & Search
  const filteredRows = orderedRows.filter(r => {
    const emp = resolveEmployee(r);
    const empName = emp.name.toLowerCase();
    const dept = emp.department.toLowerCase();
    const leaveType = resolvePolicyName(r).toLowerCase();
    const status = String(r.status || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return empName.includes(q) || dept.includes(q) || leaveType.includes(q) || status.includes(q);
  });

  // Client side pagination
  const totalRows = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = filteredRows.slice(pageOffset, pageOffset + pageSize);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(pagedRows.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const headers = ["Employee", "Department", "Leave Type", "From", "To", "No of Days", "Status", "Reason"];
    const escapeXml = (unsafe) => String(unsafe ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows.map(r => {
      const emp = resolveEmployee(r);
      return `
        <tr>
          <td>${escapeXml(emp.name)}</td>
          <td>${escapeXml(emp.department)}</td>
          <td>${escapeXml(resolvePolicyName(r))}</td>
          <td>${escapeXml(formatDate(r.fromDate))}</td>
          <td>${escapeXml(formatDate(r.toDate))}</td>
          <td>${escapeXml(r.noOfDays ?? calcDays(r.fromDate, r.toDate))}</td>
          <td>${escapeXml(r.status)}</td>
          <td>${escapeXml(r.reason || '-')}</td>
        </tr>
      `;
    }).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leaves-${Date.now()}.xls`;
    link.click();
  };

  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const headers = ["Employee", "Department", "Leave Type", "From", "To", "No of Days", "Status", "Reason"];
    const csvContent = [
      headers.join(","),
      ...targetRows.map(r => {
        const emp = resolveEmployee(r);
        return [
          `"${emp.name.replace(/"/g, '""')}"`,
          `"${emp.department.replace(/"/g, '""')}"`,
          `"${resolvePolicyName(r).replace(/"/g, '""')}"`,
          `"${formatDate(r.fromDate)}"`,
          `"${formatDate(r.toDate)}"`,
          `"${r.noOfDays ?? calcDays(r.fromDate, r.toDate)}"`,
          `"${r.status || ''}"`,
          `"${(r.reason || '').replace(/"/g, '""')}"`
        ].join(",");
      })
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leaves-${Date.now()}.csv`;
    link.click();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : rows;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Leaves Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const headers = [["Employee", "Department", "Leave Type", "From", "To", "Days", "Status"]];
    const body = targetRows.map(r => {
      const emp = resolveEmployee(r);
      return [
        emp.name,
        emp.department,
        resolvePolicyName(r),
        formatDate(r.fromDate),
        formatDate(r.toDate),
        String(r.noOfDays ?? calcDays(r.fromDate, r.toDate)),
        r.status || ''
      ];
    });
    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 24, right: 24 }
    });
    doc.save(`leaves-${Date.now()}.pdf`);
  };

  const openAdd = () => {
    setForm(initialForm);
    setShowAddModal(true);
  };

  const openEdit = (row) => {
    setEditForm({
      employeeId: row?.employeeId ? String(row.employeeId) : "",
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
    if (!form.employeeId) {
      showError("Employee is required");
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
        employeeId: Number(form.employeeId),
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
    if (!editForm.employeeId) {
      showError("Employee is required");
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
        employeeId: Number(editForm.employeeId),
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
        {/* White top header card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Leaves</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Employee</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Leaves</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-primary create-lead-btn d-flex align-items-center gap-2" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }} onClick={openAdd}>
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>Add Leave
              </button>
            </div>
          </div>
        </div>

        {/* Leave list Card */}
        <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12, overflow: "hidden" }}>
          {/* Table Controls Bar */}
          <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 350 }}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "8px 0 0 8px" }}><i className="ti ti-search text-muted" /></span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  style={{ borderRadius: "0 8px 8px 0", height: 38 }}
                  placeholder="Search leaves..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <button
                  className="btn btn-white border d-flex align-items-center gap-2 dropdown-toggle"
                  type="button"
                  id="leavesExportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
                >
                  <i className="ti ti-download" /> Export
                </button>
                <ul className="dropdown-menu shadow border-0" aria-labelledby="leavesExportDropdown">
                  <li><button className="dropdown-item" onClick={exportExcel}>Excel</button></li>
                  <li><button className="dropdown-item" onClick={exportCsv}>CSV</button></li>
                  <li><button className="dropdown-item" onClick={exportPdf}>PDF</button></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="table-responsive" style={{ overflow: "visible" }}>
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={pagedRows.length > 0 && pagedRows.every(r => selectedIds.has(r.id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>No of Days</th>
                  <th>Status</th>
                  <th style={{ width: 80 }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
                ) : pagedRows.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-muted">No leaves found</td></tr>
                ) : (
                  pagedRows.map((row) => {
                    const emp = resolveEmployee(row);
                    const status = String(row?.status || "NEW").toUpperCase();
                    return (
                      <tr key={row.id || `${row.employeeId}-${row.fromDate}`}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(row.id)}
                            onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-md border avatar-rounded me-2 bg-light d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32, borderRadius: "50%" }}>
                              <i className="ti ti-user text-muted" />
                            </span>
                            <div>
                              <h6 className="fw-semibold mb-0 text-slate-800">{emp.name || "-"}</h6>
                              <small className="text-muted">{emp.department || "-"}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-semibold text-slate-800">{resolvePolicyName(row) || "-"}</span>
                            {row.reason ? (
                              <span className="ms-2" title={row.reason}>
                                <i className="ti ti-info-circle text-info"></i>
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>{formatDate(row.fromDate)}</td>
                        <td>{formatDate(row.toDate)}</td>
                        <td>{(row.noOfDays ?? calcDays(row.fromDate, row.toDate)) || "-"}</td>
                        <td>
                          <span
                            className={`badge d-inline-flex align-items-center justify-content-center ${
                              status === "APPROVED"
                                ? "badge-success bg-success-light text-dark"
                                : status === "DECLINED"
                                  ? "badge-danger bg-danger-light text-dark"
                                  : "badge-warning bg-warning-light text-dark"
                            }`}
                            style={{ minWidth: 88, padding: "0.45rem 0.75rem", fontWeight: 700, lineHeight: 1 }}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="dropdown" style={{ position: "relative", zIndex: 5 }}>
                            <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="ti ti-dots-vertical" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                              <li>
                                <button className="dropdown-item" onClick={() => openEdit(row)}>
                                  Edit
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-danger" onClick={() => confirmDelete(row)}>
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Custom Pagination Footer */}
          {!loading && rows.length > 0 && (
            <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
              <div className="text-muted small">
                Showing {totalRows > 0 ? pageOffset + 1 : 0} to {Math.min(pageOffset + pageSize, totalRows)} of {totalRows} entries
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={clampedPage === 1}
                >
                  <i className="ti ti-chevron-left" />
                </button>
                {(() => {
                  const buttons = [];
                  for (let i = 1; i <= pageCount; i++) {
                    if (i === 1 || i === pageCount || (i >= clampedPage - 2 && i <= clampedPage + 2)) {
                      buttons.push(
                        <button
                          key={i}
                          className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === i ? 'btn-primary text-white' : 'btn-light'}`}
                          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: clampedPage === i ? "#3b82f6" : undefined }}
                          onClick={() => setPage(i)}
                        >
                          {i}
                        </button>
                      );
                    } else if (i === clampedPage - 3 || i === clampedPage + 3) {
                      buttons.push(<span key={`dots-${i}`} className="px-1 text-muted">...</span>);
                    }
                  }
                  return buttons;
                })()}
                <button
                  type="button"
                  className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  disabled={clampedPage === pageCount}
                >
                  <i className="ti ti-chevron-right" />
                </button>
                <PageSizeSelector
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  setPage={setPage}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Dark Bottom Actions Bar */}
      {selectedIds.size > 0 && createPortal(
        <div className="floating-bulk-bar" style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#0f172a",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
          zIndex: 9999,
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
        }}>
          <span className="small">{selectedIds.size} row(s) selected</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedIds(new Set())}>Clear</button>
          <button className="btn btn-sm btn-primary" onClick={exportPdf}>Export Selected PDF</button>
        </div>,
        document.body
      )}

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
                      <select
                        className="avm-select"
                        value={form.employeeId}
                        onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                        disabled={metaLoading}
                      >
                        <option value="">Select</option>
                        {employeeOptions.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Leave Type</label>
                      <select
                        className="avm-select"
                        value={form.leaveType}
                        onChange={(e) => setForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                        disabled={!form.employeeId}
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
                      <select
                        className="avm-select"
                        value={form.status}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      >
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
                      <select
                        className="avm-select"
                        value={editForm.employeeId}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                        disabled={metaLoading}
                      >
                        <option value="">Select</option>
                        {employeeOptions.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Leave Type</label>
                      <select
                        className="avm-select"
                        value={editForm.leaveType}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                        disabled={!editForm.employeeId}
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
                      <select
                        className="avm-select"
                        value={editForm.status}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                      >
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
