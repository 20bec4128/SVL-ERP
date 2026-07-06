import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as attendanceApi from '../../api/attendanceApi';
import { getUsers } from '../../api/userAdminApi';
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import { useToast } from '../../components/system/ToastProvider';
import "./LeadsPage.css";
import "../../../public/assets/css/addModalShared.css";

function fmtTime(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDuration(mins) {
  if (mins == null || mins <= 0) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}



function toDatetimeLocalString(dateString) {
  if (!dateString) return "";
  if (typeof dateString === 'string' && dateString.length >= 16) {
    return dateString.slice(0, 16);
  }
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const AttendanceAdminPage = () => {
  const { showSuccess, showError } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Bulk operation and search states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Edit Timings Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    checkInTime: "",
    checkOutTime: "",
    status: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  // Late Check-in override states
  const [showLateCheckinModal, setShowLateCheckinModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [selectedOverrideUserId, setSelectedOverrideUserId] = useState('');
  const [overrideDate, setOverrideDate] = useState(selectedDate);
  const [savingOverride, setSavingOverride] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [rec, uList] = await Promise.all([
        attendanceApi.getAdminView(selectedDate).catch(() => []),
        getUsers(0, 1000).catch(() => null)
      ]);
      setRecords(Array.isArray(rec) ? rec : []);
      if (uList && Array.isArray(uList.items)) {
        setUsersList(uList.items);
      }
      setSelectedIds(new Set());
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const presentCount = records.filter(r => ['CHECKED_IN', 'ON_BREAK', 'ON_LUNCH', 'CHECKED_OUT', 'AUTO_CHECKOUT'].includes(r.status)).length;
  const lateCount = records.filter(r => r.isLate).length;
  const absentCount = records.filter(r => !r.checkInTime).length;

  // Search & filter
  const filteredRecords = records.filter(r => {
    const name = (r.userName || `User ${r.userId}`).toLowerCase();
    const role = (r.userRole || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  // Client side pagination
  const totalRows = filteredRecords.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRecords = filteredRecords.slice(pageOffset, pageOffset + pageSize);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(pagedRecords.map(r => r.id)));
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

  // Open Edit Timing Modal
  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      checkInTime: toDatetimeLocalString(record.checkInTime),
      checkOutTime: toDatetimeLocalString(record.checkOutTime),
      status: record.status || "CHECKED_IN",
      notes: record.notes || ""
    });
    setShowEditModal(true);
  };

  // Submit Edit Timing
  const handleSaveTiming = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSaving(true);
    try {
      const payload = {
        checkInTime: editForm.checkInTime ? (editForm.checkInTime.length === 16 ? editForm.checkInTime + ":00" : editForm.checkInTime) : null,
        checkOutTime: editForm.checkOutTime ? (editForm.checkOutTime.length === 16 ? editForm.checkOutTime + ":00" : editForm.checkOutTime) : null,
        status: editForm.status,
        notes: editForm.notes
      };
      await attendanceApi.updateAttendanceAdmin(editingRecord.id, payload);
      showSuccess("Attendance timing updated successfully");
      setShowEditModal(false);
      loadData();
    } catch (err) {
      showError(err?.response?.data?.message || err.message || "Failed to update attendance timings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!selectedOverrideUserId) return;
    setSavingOverride(true);
    try {
      await attendanceApi.allowLateCheckin(selectedOverrideUserId, overrideDate);
      showSuccess("Late check-in override enabled successfully");
      setShowLateCheckinModal(false);
      await loadData();
    } catch (err) {
      showError(err?.response?.data?.message || err.message || "Failed to allow late check-in");
    } finally {
      setSavingOverride(false);
    }
  };

  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? records.filter(r => selectedIds.has(r.id))
      : records;
    const headers = ["Employee", "Role", "Date", "Check In Location", "Check Out Location", "Check In", "Check Out", "Work Time", "Status", "Late", "Overtime", "Checkout Status"];
    const escapeXml = (unsafe) => String(unsafe ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows.map(r => `
      <tr>
        <td>${escapeXml(r.userName || `User ${r.userId}`)}</td>
        <td>${escapeXml(r.userRole || '-')}</td>
        <td>${escapeXml(fmtDate(r.attendanceDate))}</td>
        <td>${escapeXml(r.checkInLocationName || '-')}</td>
        <td>${escapeXml(r.checkOutLocationName || '-')}</td>
        <td>${escapeXml(fmtTime(r.checkInTime))}</td>
        <td>${escapeXml(fmtTime(r.checkOutTime))}</td>
        <td>${escapeXml(r.netWorkMinutes ? fmtDuration(r.netWorkMinutes) : '-')}</td>
        <td>${escapeXml(r.status)}</td>
        <td>${escapeXml(r.isLate ? 'Yes' : 'No')}</td>
        <td>${escapeXml(r.overtimeMinutes > 0 ? fmtDuration(r.overtimeMinutes) : '-')}</td>
        <td>${escapeXml(r.isMissedCheckout ? 'Missed' : '-')}</td>
      </tr>
    `).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-admin-${Date.now()}.xls`;
    link.click();
  };

  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? records.filter(r => selectedIds.has(r.id))
      : records;
    const headers = ["Employee", "Role", "Date", "Check In Location", "Check Out Location", "Check In", "Check Out", "Work Time", "Status", "Late", "Overtime", "Checkout Status"];
    const csvContent = [
      headers.join(","),
      ...targetRows.map(r => [
        `"${String(r.userName || `User ${r.userId}`).replace(/"/g, '""')}"`,
        `"${String(r.userRole || '-').replace(/"/g, '""')}"`,
        `"${fmtDate(r.attendanceDate)}"`,
        `"${String(r.checkInLocationName || '-').replace(/"/g, '""')}"`,
        `"${String(r.checkOutLocationName || '-').replace(/"/g, '""')}"`,
        `"${fmtTime(r.checkInTime)}"`,
        `"${fmtTime(r.checkOutTime)}"`,
        `"${r.netWorkMinutes ? fmtDuration(r.netWorkMinutes) : '-'}"`,
        `"${r.status || ''}"`,
        `"${r.isLate ? 'Yes' : 'No'}"`,
        `"${r.overtimeMinutes > 0 ? fmtDuration(r.overtimeMinutes) : '-'}"`,
        `"${r.isMissedCheckout ? 'Missed' : '-'}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-admin-${Date.now()}.csv`;
    link.click();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? records.filter(r => selectedIds.has(r.id))
      : records;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Attendance Records", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const headers = [["Employee", "Role", "Date", "Check In", "Check Out", "Work Time", "Status", "Late"]];
    const body = targetRows.map(r => [
      r.userName || `User ${r.userId}`,
      r.userRole || '-',
      fmtDate(r.attendanceDate),
      fmtTime(r.checkInTime),
      fmtTime(r.checkOutTime),
      r.netWorkMinutes ? fmtDuration(r.netWorkMinutes) : '-',
      r.status || '',
      r.isLate ? 'Yes' : 'No'
    ]);
    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 24, right: 24 }
    });
    doc.save(`attendance-admin-${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="content">
        {/* Custom Header Card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Attendance Records</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Employee</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Attendance Records</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Present/Late/Absent counters */}
        <div className="row mb-4">
          <div className="col-xl-3 col-md-6 mb-3 mb-xl-0">
            <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: 10 }}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted fs-12 fw-medium mb-1">Present</p>
                    <h4 className="mb-0 fw-bold">{presentCount}</h4>
                  </div>
                  <div className="icon-box icon-box-lg icon-box-primary bg-primary-light text-primary" style={{ padding: 12, borderRadius: 8 }}><i className="ti ti-check" style={{ fontSize: "1.4rem" }}></i></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 mb-3 mb-xl-0">
            <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: 10 }}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted fs-12 fw-medium mb-1">Late Arrivals</p>
                    <h4 className="mb-0 fw-bold">{lateCount}</h4>
                  </div>
                  <div className="icon-box icon-box-lg icon-box-warning bg-warning-light text-warning" style={{ padding: 12, borderRadius: 8 }}><i className="ti ti-clock-exclamation" style={{ fontSize: "1.4rem" }}></i></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 mb-3 mb-xl-0">
            <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: 10 }}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted fs-12 fw-medium mb-1">Absent</p>
                    <h4 className="mb-0 fw-bold">{absentCount}</h4>
                  </div>
                  <div className="icon-box icon-box-lg icon-box-danger bg-danger-light text-danger" style={{ padding: 12, borderRadius: 8 }}><i className="ti ti-x" style={{ fontSize: "1.4rem" }}></i></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 mb-3 mb-xl-0">
            <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: 10 }}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted fs-12 fw-medium mb-1">Total Records</p>
                    <h4 className="mb-0 fw-bold">{records.length}</h4>
                  </div>
                  <div className="icon-box icon-box-lg icon-box-info bg-info-light text-info" style={{ padding: 12, borderRadius: 8 }}><i className="ti ti-database" style={{ fontSize: "1.4rem" }}></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter Card styled nicely */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 10 }}>
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-8">
                <label className="form-label fw-semibold text-secondary">Select Date</label>
                <input type="date" className="form-control" style={{ borderRadius: 8 }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              <div className="col-md-4">
                <button className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2" style={{ height: 38, borderRadius: 8 }} onClick={loadData} disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="me-0" label="Loading records" /> : <i className="ti ti-search"></i>}
                  Load Records
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main List Table Card */}
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
                  placeholder="Search employee or role..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                type="button"
                style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
                onClick={() => {
                  setSelectedOverrideUserId("");
                  setOverrideDate(selectedDate);
                  setShowLateCheckinModal(true);
                }}
              >
                <i className="ti ti-plus" /> Allow Late Check-In
              </button>
              <div className="dropdown">
                <button
                  className="btn btn-white border d-flex align-items-center gap-2 dropdown-toggle"
                  type="button"
                  id="exportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
                >
                  <i className="ti ti-download" /> Export
                </button>
                <ul className="dropdown-menu shadow border-0" aria-labelledby="exportDropdown">
                  <li><button className="dropdown-item" onClick={exportExcel}>Excel</button></li>
                  <li><button className="dropdown-item" onClick={exportCsv}>CSV</button></li>
                  <li><button className="dropdown-item" onClick={exportPdf}>PDF</button></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><LoadingSpinner size="page" label="Loading attendance records" /></div>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={pagedRecords.length > 0 && pagedRecords.every(r => selectedIds.has(r.id))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Check In Location</th>
                    <th>Check Out Location</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Time</th>
                    <th>Status</th>
                    <th>Late?</th>
                    <th>Overtime</th>
                    <th>Checkout Status</th>
                    <th style={{ width: 80 }} className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRecords.length === 0 ? (
                    <tr><td colSpan="13" className="text-center text-muted py-4">No records found</td></tr>
                  ) : (
                    pagedRecords.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(r.id)}
                            onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                          />
                        </td>
                        <td>
                          <div>
                            <span className="fw-bold text-dark">{r.userName || `User ${r.userId}`}</span>
                            <br />
                            <small className="text-muted">{r.userRole || '-'}</small>
                          </div>
                        </td>
                        <td className="small text-dark fw-medium">{fmtDate(r.attendanceDate)}</td>
                        <td><small className="text-muted">{r.checkInLocationName || '-'}</small></td>
                        <td><small className="text-muted">{r.checkOutLocationName || '-'}</small></td>
                        <td className="small text-dark fw-medium">{fmtTime(r.checkInTime)}</td>
                        <td className="small text-dark fw-medium">{fmtTime(r.checkOutTime)}</td>
                        <td>
                          <span className="badge bg-primary-transparent text-primary" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                            {r.netWorkMinutes ? fmtDuration(r.netWorkMinutes) : '-'}
                          </span>
                        </td>
                        <td>
                          {r.status === 'CHECKED_IN' ? (
                            <span className="badge bg-info-transparent text-info" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              Checked In
                            </span>
                          ) : r.status === 'CHECKED_OUT' ? (
                            <span className="badge bg-success-transparent text-success" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              Checked Out
                            </span>
                          ) : r.status === 'AUTO_CHECKOUT' ? (
                            <span className="badge bg-danger-transparent text-danger" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              Auto Checkout
                            </span>
                          ) : r.status === 'ON_BREAK' ? (
                            <span className="badge bg-warning-transparent text-warning" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              On Break
                            </span>
                          ) : r.status === 'ON_LUNCH' ? (
                            <span className="badge bg-info-transparent text-info" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              On Lunch
                            </span>
                          ) : (
                            <span className="badge bg-secondary-transparent text-secondary" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              {r.status || '-'}
                            </span>
                          )}
                        </td>
                        <td>
                          {r.isLate ? (
                            <span className="badge bg-danger-transparent text-danger" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              Yes (+{r.lateMinutes}m)
                            </span>
                          ) : (
                            <span className="badge bg-success-transparent text-success" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              No
                            </span>
                          )}
                        </td>
                        <td>
                          {r.overtimeMinutes > 0 ? (
                            <span className="badge bg-warning-transparent text-warning" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              {fmtDuration(r.overtimeMinutes)}
                            </span>
                          ) : (
                            <span className="text-muted small">0m</span>
                          )}
                        </td>
                        <td>
                          {r.isMissedCheckout && r.status === 'AUTO_CHECKOUT' ? (
                            <span className="badge bg-warning-transparent text-warning" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              Auto Checkout
                            </span>
                          ) : r.isMissedCheckout && r.status !== 'CHECKED_OUT' && r.status !== 'AUTO_CHECKOUT' ? (
                            <span className="badge bg-danger-transparent text-danger" style={{ borderRadius: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                              Missed Checkout
                            </span>
                          ) : '-'}
                        </td>
                        <td className="text-end">
                          <div className="dropdown">
                            <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="ti ti-dots-vertical" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                              <li>
                                <button className="dropdown-item" onClick={() => handleOpenEdit(r)}>
                                  Edit Timing
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => {
                                  setSelectedIds(new Set([r.id]));
                                  exportPdf();
                                }}>
                                  Export Row PDF
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
            )}
          </div>

          {/* Custom Pagination Footer */}
          {!loading && records.length > 0 && (
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

      {/* Edit Timing Modal */}
      {showEditModal && createPortal(
        <div className="avm-backdrop" role="presentation" style={{ zIndex: 10050 }}>
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 500 }}>
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Edit Attendance Timing</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowEditModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleSaveTiming}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <p className="mb-2"><strong>Employee:</strong> {editingRecord?.userName || `User ${editingRecord?.userId}`}</p>
                    <p className="mb-2"><strong>Date:</strong> {fmtDate(editingRecord?.attendanceDate)}</p>
                  </div>
                  
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Check In Time</label>
                      <input
                        type="datetime-local"
                        className="avm-input"
                        value={editForm.checkInTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Check Out Time</label>
                      <input
                        type="datetime-local"
                        className="avm-input"
                        value={editForm.checkOutTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                      />
                      <small className="text-muted">Leave empty if employee is still checked in</small>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Status</label>
                      <select
                        className="avm-select"
                        value={editForm.status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                        required
                      >
                        <option value="CHECKED_IN">Checked In</option>
                        <option value="CHECKED_OUT">Checked Out</option>
                        <option value="AUTO_CHECKOUT">Auto Checkout</option>
                        <option value="ON_BREAK">On Break</option>
                        <option value="ON_LUNCH">On Lunch</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Notes / Reason for Edit</label>
                      <textarea
                        className="avm-input"
                        rows="3"
                        placeholder="Add a reason for manually editing these times..."
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div />
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
        </div>,
        document.body
      )}

      {/* Allow Late Check-In Override Modal */}
      {showLateCheckinModal && createPortal(
        <div className="avm-backdrop" role="presentation" style={{ zIndex: 10050 }}>
          <div className="avm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 500 }}>
            <div className="avm-modal-header">
              <h2 className="avm-modal-title">Allow Late Check-In</h2>
              <button type="button" className="avm-modal-close" onClick={() => setShowLateCheckinModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form onSubmit={handleSaveOverride}>
              <div className="avm-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Select Employee</label>
                      <select
                        className="avm-select"
                        value={selectedOverrideUserId}
                        onChange={(e) => setSelectedOverrideUserId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Employee --</option>
                        {usersList
                          .filter((u) => u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.username || u.name || `User ${u.id}`} ({u.email})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="avm-field">
                      <label className="avm-label">Target Date</label>
                      <input
                        type="date"
                        className="avm-input"
                        value={overrideDate}
                        onChange={(e) => setOverrideDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="avm-footer">
                <div />
                <div className="avm-footer-right">
                  <button type="button" className="avm-btn light" onClick={() => setShowLateCheckinModal(false)} disabled={savingOverride}>
                    Cancel
                  </button>
                  <button type="submit" className="avm-btn primary" disabled={savingOverride || !selectedOverrideUserId}>
                    {savingOverride ? "Saving..." : "Allow Late Check-In"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AttendanceAdminPage;
