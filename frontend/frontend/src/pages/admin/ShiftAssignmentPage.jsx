import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getEmployees } from "../../api/employeesApi";
import {
  listShifts,
  listLocations,
  assignShift,
  getEmployeeShift,
} from "../../api/attendanceApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";
import "../../../public/assets/css/addModalShared.css";

const EMPTY_FORM = {
  shiftId: "",
  locationId: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
};

function fmtTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

export default function ShiftAssignmentPage() {
  const { showSuccess, showError } = useToast();

  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  /* per-employee active assignment cache: { [employeeId]: EmployeeShiftResponse[] } */
  const [assignmentsCache, setAssignmentsCache] = useState({});

  /* modal state */
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* table and bulk state */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, shiftList, locList] = await Promise.all([
        getEmployees().catch(() => []),
        listShifts().catch(() => []),
        listLocations().catch(() => []),
      ]);
      setEmployees(Array.isArray(emps) ? emps : []);
      setShifts(Array.isArray(shiftList) ? shiftList : []);
      setLocations(Array.isArray(locList) ? locList : []);
      setSelectedIds(new Set());
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadAssignmentForEmp = useCallback(async (empId) => {
    try {
      const data = await getEmployeeShift(empId);
      setAssignmentsCache((prev) => ({ ...prev, [empId]: Array.isArray(data) ? data : [] }));
    } catch {
      /* ignore silently */
    }
  }, []);

  /* Pre-fetch assignments for visible employees */
  useEffect(() => {
    employees.forEach((emp) => {
      if (emp?.id != null) loadAssignmentForEmp(emp.id);
    });
  }, [employees, loadAssignmentForEmp]);

  const openAssign = (emp) => {
    setSelectedEmp(emp);
    /* pre-fill with most recent active assignment if any */
    const existing = (assignmentsCache[emp.id] || []).find((a) => !a.effectiveTo);
    setForm({
      shiftId: existing?.shiftId ? String(existing.shiftId) : "",
      locationId: existing?.locationId ? String(existing.locationId) : "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shiftId) {
      showError("Please select a shift.");
      return;
    }
    if (!form.locationId) {
      showError("Please select a location.");
      return;
    }
    setSaving(true);
    try {
      await assignShift({
        employeeId: selectedEmp.id,
        shiftId: Number(form.shiftId),
        locationId: Number(form.locationId),
        effectiveFrom: form.effectiveFrom || null,
        effectiveTo: form.effectiveTo || null,
      });
      showSuccess(`Shift assigned to ${selectedEmp.name || "employee"}`);
      setShowModal(false);
      await loadAssignmentForEmp(selectedEmp.id);
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to assign shift"));
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (emp.name || "").toLowerCase().includes(q) ||
        (emp.email || "").toLowerCase().includes(q) ||
        (emp.employeeCode || emp.employeeId || "").toLowerCase().includes(q) ||
        (emp.dept || emp.department || "").toLowerCase().includes(q) ||
        (emp.designation || "").toLowerCase().includes(q)
      );
    });
  }, [employees, searchQuery]);

  const getActiveAssignment = (empId) => {
    const list = assignmentsCache[empId] || [];
    const today = new Date().toISOString().slice(0, 10);
    return (
      list.find((a) => {
        const from = a.effectiveFrom || "0000-01-01";
        const to = a.effectiveTo || "9999-12-31";
        return today >= from && today <= to;
      }) || list.find((a) => !a.effectiveTo) || null
    );
  };

  // Pagination calculations
  const totalRows = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = filtered.slice(pageOffset, pageOffset + pageSize);

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
      ? employees.filter(emp => selectedIds.has(emp.id))
      : employees;
    const headers = ["Employee Code", "Name", "Email", "Department", "Designation", "Current Shift", "Location", "Effective From"];
    const escapeXml = (unsafe) => String(unsafe ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows.map(emp => {
      const active = getActiveAssignment(emp.id);
      const shiftDisplay = active ? `${active.shiftName || `Shift #${active.shiftId}`} (${fmtTime(active.shiftStartTime)} - ${fmtTime(active.shiftEndTime)})` : 'Unassigned';
      return `
        <tr>
          <td>${escapeXml(emp.employeeCode || emp.employeeId || '')}</td>
          <td>${escapeXml(emp.name)}</td>
          <td>${escapeXml(emp.email)}</td>
          <td>${escapeXml(emp.dept || emp.department || '')}</td>
          <td>${escapeXml(emp.designation || '')}</td>
          <td>${escapeXml(shiftDisplay)}</td>
          <td>${escapeXml(active?.locationName || '')}</td>
          <td>${escapeXml(active?.effectiveFrom || '')}</td>
        </tr>
      `;
    }).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shift-assignments-${Date.now()}.xls`;
    link.click();
  };

  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? employees.filter(emp => selectedIds.has(emp.id))
      : employees;
    const headers = ["Employee Code", "Name", "Email", "Department", "Designation", "Current Shift", "Location", "Effective From"];
    const csvContent = [
      headers.join(","),
      ...targetRows.map(emp => {
        const active = getActiveAssignment(emp.id);
        const shiftDisplay = active ? `${active.shiftName || `Shift #${active.shiftId}`} (${fmtTime(active.shiftStartTime)} - ${fmtTime(active.shiftEndTime)})` : 'Unassigned';
        return [
          `"${(emp.employeeCode || emp.employeeId || '').replace(/"/g, '""')}"`,
          `"${(emp.name || '').replace(/"/g, '""')}"`,
          `"${(emp.email || '').replace(/"/g, '""')}"`,
          `"${(emp.dept || emp.department || '').replace(/"/g, '""')}"`,
          `"${(emp.designation || '').replace(/"/g, '""')}"`,
          `"${shiftDisplay.replace(/"/g, '""')}"`,
          `"${(active?.locationName || '').replace(/"/g, '""')}"`,
          `"${active?.effectiveFrom || ''}"`
        ].join(",");
      })
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shift-assignments-${Date.now()}.csv`;
    link.click();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? employees.filter(emp => selectedIds.has(emp.id))
      : employees;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Shift Assignments Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const headers = [["Code", "Name", "Email", "Department", "Shift", "Location", "Effective From"]];
    const body = targetRows.map(emp => {
      const active = getActiveAssignment(emp.id);
      return [
        emp.employeeCode || emp.employeeId || '',
        emp.name || '',
        emp.email || '',
        emp.dept || emp.department || '',
        active ? active.shiftName || `Shift #${active.shiftId}` : 'Unassigned',
        active?.locationName || '',
        active?.effectiveFrom || ''
      ];
    });
    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 40, right: 40 }
    });
    doc.save(`shift-assignments-${Date.now()}.pdf`);
  };

  return (
    <div className="content">
      {/* White top header card */}
      <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Shift Assignment</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item text-muted">Administration</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">Shift Assignment</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Employees table card */}
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
                placeholder="Search employee..."
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
                id="shiftsAssignExportDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
              >
                <i className="ti ti-download" /> Export
              </button>
              <ul className="dropdown-menu shadow border-0" aria-labelledby="shiftsAssignExportDropdown">
                <li><button className="dropdown-item" onClick={exportExcel}>Excel</button></li>
                <li><button className="dropdown-item" onClick={exportCsv}>CSV</button></li>
                <li><button className="dropdown-item" onClick={exportPdf}>PDF</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="table-responsive">
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
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Current Shift</th>
                <th>Location</th>
                <th>Effective From</th>
                <th style={{ width: 100 }} className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center py-4">Loading...</td></tr>
              ) : pagedRows.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-4 text-muted">No employees found</td></tr>
              ) : (
                pagedRows.map((emp) => {
                  const active = getActiveAssignment(emp.id);
                  return (
                    <tr key={emp.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedIds.has(emp.id)}
                          onChange={(e) => handleSelectRow(emp.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold text-slate-800">{emp.name || "-"}</div>
                          <small className="text-muted">{emp.employeeCode || emp.employeeId || ""}</small>
                        </div>
                      </td>
                      <td>{emp.email || "-"}</td>
                      <td>{emp.dept || emp.department || "-"}</td>
                      <td>{emp.designation || "-"}</td>
                      <td>
                        {active ? (
                          <span className="badge bg-success-subtle text-success">
                            {active.shiftName || `Shift #${active.shiftId}`}
                            {active.shiftStartTime && active.shiftEndTime && (
                              <span className="ms-1 fw-normal text-muted">
                                ({fmtTime(active.shiftStartTime)}–{fmtTime(active.shiftEndTime)})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary">Unassigned</span>
                        )}
                      </td>
                      <td>{active?.locationName || <span className="text-muted">-</span>}</td>
                      <td>{active?.effectiveFrom || <span className="text-muted">-</span>}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openAssign(emp)}
                          style={{ borderRadius: 6 }}
                        >
                          Assign Shift
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination Footer */}
        {!loading && filtered.length > 0 && (
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

      {/* Assign Shift Modal */}
      {showModal && selectedEmp && (
        <div className="avm-backdrop" role="presentation">
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Assign Shift - {selectedEmp.name}</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="avm-field">
                      <label className="avm-label">Shift <span className="text-danger">*</span></label>
                      <select
                        className="avm-select"
                        value={form.shiftId}
                        onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
                        required
                      >
                        <option value="">Select shift</option>
                        {shifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                            {s.startTime && s.endTime
                              ? ` (${fmtTime(s.startTime)} - ${fmtTime(s.endTime)})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="avm-field">
                      <label className="avm-label">Location <span className="text-danger">*</span></label>
                      <select
                        className="avm-select"
                        value={form.locationId}
                        onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                        required
                      >
                        <option value="">Select location</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">Effective From</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={form.effectiveFrom}
                        onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avm-field">
                      <label className="avm-label">
                        Effective To <small className="text-muted">(leave blank = indefinite)</small>
                      </label>
                      <input
                        type="date"
                        className="avm-input"
                        value={form.effectiveTo}
                        min={form.effectiveFrom}
                        onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div></div>
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn primary" disabled={saving}>
                    {saving ? "Saving..." : "Assign Shift"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
