import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from '../../context/AuthContext';
import * as attendanceApi from '../../api/attendanceApi';
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";
import "../../../public/assets/css/addModalShared.css";

/* ── helpers ── */
function fmtTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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

const AttendanceEmployeePage = () => {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const [today, setToday] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpsError, setGpsError] = useState('');
  const gpsRef = useRef(null);

  // Table pagination and selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* ── GPS helper ── */
  const getGPS = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          gpsRef.current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          resolve(gpsRef.current);
        },
        (err) => reject(new Error(`GPS error: ${err.message}`)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  /* ── Load data ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [todayData, summaryData, historyData] = await Promise.all([
        attendanceApi.getToday().catch(() => null),
        attendanceApi.getSummary().catch(() => null),
        attendanceApi.getHistory(
          new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ).catch(() => []),
      ]);
      setToday(todayData);
      setSummary(summaryData);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setSelectedIds(new Set());
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const isTimeWithinWindow = (startStr, endStr) => {
    if (!startStr || !endStr) return false;
    
    // Get current time in Asia/Kolkata timezone
    const now = new Date();
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(now);
      
      const hourStr = parts.find(p => p.type === 'hour').value;
      const minuteStr = parts.find(p => p.type === 'minute').value;
      const currentMinutes = Number(hourStr) * 60 + Number(minuteStr);

      const [startH, startM] = startStr.split(':').map(Number);
      const startMinutes = startH * 60 + startM;

      const [endH, endM] = endStr.split(':').map(Number);
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    } catch (e) {
      // Fallback to local time if Intl fails
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = startStr.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const [endH, endM] = endStr.split(':').map(Number);
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    }
  };

  /* ── Actions ── */
  const handleAction = async (action) => {
    setActionLoading(true);
    setError('');
    setGpsError('');
    try {
      let gps;
      if (action === 'checkIn' || action === 'checkOut') {
        try {
          gps = await getGPS();
        } catch (e) {
          setGpsError(e.message);
          setActionLoading(false);
          return;
        }
      }
      switch (action) {
        case 'checkIn':
          await attendanceApi.checkIn(gps);
          break;
        case 'checkOut':
          await attendanceApi.checkOut(gps);
          break;
        case 'breakStart':
          await attendanceApi.startBreak({ breakType: 'BREAK' });
          break;
        case 'breakEnd':
          await attendanceApi.endBreak({ breakType: 'BREAK' });
          break;
        case 'break1Start':
          await attendanceApi.startBreak({ breakType: 'BREAK_1' });
          break;
        case 'break1End':
          await attendanceApi.endBreak({ breakType: 'BREAK_1' });
          break;
        case 'lunchStart':
          await attendanceApi.startBreak({ breakType: 'LUNCH' });
          break;
        case 'lunchEnd':
          await attendanceApi.endBreak({ breakType: 'LUNCH' });
          break;
        case 'break2Start':
          await attendanceApi.startBreak({ breakType: 'BREAK_2' });
          break;
        case 'break2End':
          await attendanceApi.endBreak({ breakType: 'BREAK_2' });
          break;
        default:
          break;
      }
      await loadData();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || e.message || 'Action failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Status helpers ── */
  const status = today?.status;
  const isCheckedIn = status === 'CHECKED_IN';
  const isOnBreak = status === 'ON_BREAK';
  const isOnBreak1 = status === 'ON_BREAK_1';
  const isOnLunch = status === 'ON_LUNCH';
  const isOnBreak2 = status === 'ON_BREAK_2';
  const isCheckedOut = status === 'CHECKED_OUT' || status === 'AUTO_CHECKOUT';
  const isActive = isCheckedIn || isOnBreak || isOnBreak1 || isOnLunch || isOnBreak2;
  const hasNotCheckedIn = !today;

  const nowStr = new Date().toLocaleString([], {
    hour: '2-digit', minute: '2-digit', hour12: true,
    day: '2-digit', month: 'short', year: 'numeric'
  });

  // Client-side search and pagination for history
  const filteredHistory = history.filter(r => {
    const workStatus = (r.workStatus || '').toLowerCase();
    const dateStr = fmtDate(r.attendanceDate).toLowerCase();
    const query = searchQuery.toLowerCase();
    return workStatus.includes(query) || dateStr.includes(query);
  });

  const totalRows = filteredHistory.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedHistory = filteredHistory.slice(pageOffset, pageOffset + pageSize);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(pagedHistory.map(r => r.id)));
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
      ? history.filter(r => selectedIds.has(r.id))
      : history;
    const headers = ["Date", "Check In", "Status", "Check Out", "Break", "Lunch", "Late", "Net Work", "Work Status"];
    const escapeXml = (unsafe) => String(unsafe ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows.map(r => `
      <tr>
        <td>${escapeXml(fmtDate(r.attendanceDate))}</td>
        <td>${escapeXml(fmtTime(r.checkInTime))}</td>
        <td>${escapeXml(r.status)}</td>
        <td>${escapeXml(fmtTime(r.checkOutTime))}</td>
        <td>${escapeXml(r.breakTimeMinutes > 0 ? `${r.breakTimeMinutes} Min` : '-')}</td>
        <td>${escapeXml(r.lunchTimeMinutes > 0 ? `${r.lunchTimeMinutes} Min` : '-')}</td>
        <td>${escapeXml(r.lateMinutes > 0 ? `${r.lateMinutes} Min` : '-')}</td>
        <td>${escapeXml(r.netWorkMinutes ? fmtDuration(r.netWorkMinutes) : '-')}</td>
        <td>${escapeXml(r.workStatus || '-')}</td>
      </tr>
    `).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-history-${Date.now()}.xls`;
    link.click();
  };

  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? history.filter(r => selectedIds.has(r.id))
      : history;
    const headers = ["Date", "Check In", "Status", "Check Out", "Break", "Lunch", "Late", "Net Work", "Work Status"];
    const csvContent = [
      headers.join(","),
      ...targetRows.map(r => [
        `"${fmtDate(r.attendanceDate)}"`,
        `"${fmtTime(r.checkInTime)}"`,
        `"${r.status || ''}"`,
        `"${fmtTime(r.checkOutTime)}"`,
        `"${r.breakTimeMinutes || 0}"`,
        `"${r.lunchTimeMinutes || 0}"`,
        `"${r.lateMinutes || 0}"`,
        `"${r.netWorkMinutes ? fmtDuration(r.netWorkMinutes) : '-'}"`,
        `"${r.workStatus || '-'}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-history-${Date.now()}.csv`;
    link.click();
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? history.filter(r => selectedIds.has(r.id))
      : history;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Attendance History", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const headers = [["Date", "Check In", "Status", "Check Out", "Break", "Lunch", "Late", "Net Work", "Work Status"]];
    const body = targetRows.map(r => [
      fmtDate(r.attendanceDate),
      fmtTime(r.checkInTime),
      r.status || '',
      fmtTime(r.checkOutTime),
      r.breakTimeMinutes > 0 ? `${r.breakTimeMinutes} Min` : '-',
      r.lunchTimeMinutes > 0 ? `${r.lunchTimeMinutes} Min` : '-',
      r.lateMinutes > 0 ? `${r.lateMinutes} Min` : '-',
      r.netWorkMinutes ? fmtDuration(r.netWorkMinutes) : '-',
      r.workStatus || '-'
    ]);
    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 24, right: 24 }
    });
    doc.save(`attendance-history-${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="content">
        {/* White top header card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Employee Attendance</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <a href="/admin-dashboard" className="text-muted text-decoration-none">
                      <i className="ti ti-smart-home" />
                    </a>
                  </li>
                  <li className="breadcrumb-item text-muted">Employee</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Employee Attendance</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              {role !== "SUPER_ADMIN" && (
                <button className="btn btn-primary d-flex align-items-center gap-2" style={{ borderRadius: 8 }} disabled={actionLoading || !hasNotCheckedIn} onClick={() => handleAction('checkIn')}>
                  {actionLoading ? <LoadingSpinner size="sm" className="me-0" label="Processing check in" /> : <i className="ti ti-fingerprint"></i>}
                  Check In
                </button>
              )}
              {isCheckedIn && (
                <>
                  <button
                    className="btn btn-outline-warning d-flex align-items-center gap-2"
                    style={{ borderRadius: 8 }}
                    disabled={actionLoading || !isTimeWithinWindow(today?.break1StartTime, today?.break1EndTime)}
                    onClick={() => handleAction('break1Start')}
                    title={today?.break1StartTime ? `Allowed: ${today.break1StartTime.substring(0, 5)} to ${today.break1EndTime.substring(0, 5)}${!isTimeWithinWindow(today.break1StartTime, today.break1EndTime) ? ' (Currently Closed)' : ''}` : ''}
                  >
                    <i className="ti ti-coffee"></i>Break 1 {today?.break1StartTime ? `(${today.break1StartTime.substring(0,5)}-${today.break1EndTime.substring(0,5)})` : ''}
                  </button>
                  <button
                    className="btn btn-outline-info d-flex align-items-center gap-2"
                    style={{ borderRadius: 8 }}
                    disabled={actionLoading || !isTimeWithinWindow(today?.lunchStartTime, today?.lunchEndTime)}
                    onClick={() => handleAction('lunchStart')}
                    title={today?.lunchStartTime ? `Allowed: ${today.lunchStartTime.substring(0, 5)} to ${today.lunchEndTime.substring(0, 5)}${!isTimeWithinWindow(today.lunchStartTime, today.lunchEndTime) ? ' (Currently Closed)' : ''}` : ''}
                  >
                    <i className="ti ti-meat"></i>Lunch {today?.lunchStartTime ? `(${today.lunchStartTime.substring(0,5)}-${today.lunchEndTime.substring(0,5)})` : ''}
                  </button>
                  <button
                    className="btn btn-outline-warning d-flex align-items-center gap-2"
                    style={{ borderRadius: 8 }}
                    disabled={actionLoading || !isTimeWithinWindow(today?.break2StartTime, today?.break2EndTime)}
                    onClick={() => handleAction('break2Start')}
                    title={today?.break2StartTime ? `Allowed: ${today.break2StartTime.substring(0, 5)} to ${today.break2EndTime.substring(0, 5)}${!isTimeWithinWindow(today.break2StartTime, today.break2EndTime) ? ' (Currently Closed)' : ''}` : ''}
                  >
                    <i className="ti ti-coffee"></i>Break 2 {today?.break2StartTime ? `(${today.break2StartTime.substring(0,5)}-${today.break2EndTime.substring(0,5)})` : ''}
                  </button>
                  <button className="btn btn-danger d-flex align-items-center gap-2" style={{ borderRadius: 8 }} disabled={actionLoading} onClick={() => handleAction('checkOut')}>
                    {actionLoading ? <LoadingSpinner size="sm" className="me-0" label="Processing check out" /> : <i className="ti ti-logout"></i>}
                    Check Out
                  </button>
                </>
              )}
              {isOnBreak1 && (
                <button className="btn btn-warning d-flex align-items-center gap-2" style={{ borderRadius: 8 }} disabled={actionLoading} onClick={() => handleAction('break1End')}>
                  {actionLoading ? <LoadingSpinner size="sm" className="me-0" label="Ending break 1" /> : <i className="ti ti-player-play"></i>}
                  End Break 1
                </button>
              )}
              {isOnLunch && (
                <button className="btn btn-info text-white d-flex align-items-center gap-2" style={{ borderRadius: 8 }} disabled={actionLoading} onClick={() => handleAction('lunchEnd')}>
                  {actionLoading ? <LoadingSpinner size="sm" className="me-0" label="Ending lunch" /> : <i className="ti ti-player-play"></i>}
                  End Lunch
                </button>
              )}
              {isOnBreak2 && (
                <button className="btn btn-warning d-flex align-items-center gap-2" style={{ borderRadius: 8 }} disabled={actionLoading} onClick={() => handleAction('break2End')}>
                  {actionLoading ? <LoadingSpinner size="sm" className="me-0" label="Ending break 2" /> : <i className="ti ti-player-play"></i>}
                  End Break 2
                </button>
              )}
              {isOnBreak && (
                <button className="btn btn-warning d-flex align-items-center gap-2" style={{ borderRadius: 8 }} disabled={actionLoading} onClick={() => handleAction('breakEnd')}>
                  {actionLoading ? <LoadingSpinner size="sm" className="me-0" label="Ending break" /> : <i className="ti ti-player-play"></i>}
                  End Break
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}
        {gpsError && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="ti ti-map-pin-off me-1"></i>{gpsError}
            <button type="button" className="btn-close" onClick={() => setGpsError('')}></button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5"><LoadingSpinner size="page" label="Loading attendance details" /></div>
        ) : (
          <div className="row mb-4">
            {/* ── Punch Card ── */}
            <div className="col-xl-3 col-lg-4 d-flex mb-3 mb-xl-0">
              <div className="card border-0 shadow-sm flex-fill bg-white" style={{ borderRadius: 10 }}>
                <div className="card-body">
                  <div className="mb-3 text-center">
                    <h6 className="fw-medium text-muted mb-2">
                      {hasNotCheckedIn ? 'Good ' + (new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening')
                        : isActive ? 'Currently Working' : 'Day Complete'}
                      {user?.firstName ? `, ${user.firstName}` : ''}
                    </h6>
                    <h5 className="fw-bold">{nowStr}</h5>
                  </div>

                  {today?.checkInTime && (
                    <h6 className="fw-semibold d-flex align-items-center justify-content-center text-slate-800 mb-2">
                      <i className="ti ti-fingerprint text-primary me-2" style={{ fontSize: "1.1rem" }}></i>
                      Punch In at {fmtTime(today.checkInTime)}
                    </h6>
                  )}
                  {today?.checkOutTime && (
                    <h6 className="fw-semibold d-flex align-items-center justify-content-center text-slate-800 mb-2">
                      <i className="ti ti-logout text-danger me-2" style={{ fontSize: "1.1rem" }}></i>
                      Punch Out at {fmtTime(today.checkOutTime)}
                    </h6>
                  )}

                  {isOnBreak && <div className="badge bg-warning w-100 py-2 mb-2">On Break</div>}
                  {isOnLunch && <div className="badge bg-info w-100 py-2 mb-2">On Lunch</div>}

                  {today?.netWorkMinutes > 0 && (
                    <div className="badge bg-primary w-100 py-2 mb-3">
                      Production: {fmtDuration(today.netWorkMinutes)}
                    </div>
                  )}

                  <div className="text-center d-grid gap-2">
                    {(isOnBreak || isOnLunch) && (
                      <button className="btn btn-dark" style={{ borderRadius: 8 }} disabled={actionLoading} onClick={() => handleAction('checkOut')}>
                        <i className="ti ti-logout me-1"></i>End & Punch Out
                      </button>
                    )}

                    {isCheckedOut && (
                      <div className="badge bg-success-transparent p-2">
                        <i className="ti ti-check me-1"></i>Day Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="col-xl-9 col-lg-8 d-flex flex-column gap-3">
              <div className="row flex-fill">
                <div className="col-xl-3 col-md-6 mb-3 mb-xl-0">
                  <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 10 }}>
                    <div className="card-body">
                      <div className="border-bottom mb-2 pb-2">
                        <span className="avatar avatar-sm bg-primary text-white d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 32, height: 32, borderRadius: 6 }}><i className="ti ti-clock-stop"></i></span>
                        <h3 className="mb-2 fw-bold text-slate-800">
                          {summary ? `${summary.totalHoursToday || 0}h ${summary.totalMinutesToday || 0}m` : '-'}
                        </h3>
                        <p className="fw-medium text-muted mb-0">Total Hours Today</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6 mb-3 mb-xl-0">
                  <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 10 }}>
                    <div className="card-body">
                      <div className="border-bottom mb-2 pb-2">
                        <span className="avatar avatar-sm bg-dark text-white d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 32, height: 32, borderRadius: 6 }}><i className="ti ti-clock-up"></i></span>
                        <h3 className="mb-2 fw-bold text-slate-800">
                          {summary ? `${summary.totalHoursWeek || 0}h ${summary.totalMinutesWeek || 0}m` : '-'}
                        </h3>
                        <p className="fw-medium text-muted mb-0">Total Hours Week</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6 mb-3 mb-xl-0">
                  <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 10 }}>
                    <div className="card-body">
                      <div className="border-bottom mb-2 pb-2">
                        <span className="avatar avatar-sm bg-info text-white d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 32, height: 32, borderRadius: 6 }}><i className="ti ti-calendar-up"></i></span>
                        <h3 className="mb-2 fw-bold text-slate-800">
                          {summary ? `${summary.totalHoursMonth || 0}h ${summary.totalMinutesMonth || 0}m` : '-'}
                        </h3>
                        <p className="fw-medium text-muted mb-0">Total Hours Month</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6 mb-3 mb-xl-0">
                  <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 10 }}>
                    <div className="card-body">
                      <div className="border-bottom mb-2 pb-2">
                        <span className="avatar avatar-sm bg-pink text-white d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 32, height: 32, borderRadius: 6 }}><i className="ti ti-calendar-star"></i></span>
                        <h3 className="mb-2 fw-bold text-slate-800">
                          {summary ? fmtDuration(summary.overtimeMinutesMonth || 0) : '-'}
                        </h3>
                        <p className="fw-medium text-muted mb-0">Overtime this Month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Today's Timeline ── */}
              {today && (
                <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 10 }}>
                  <div className="card-body">
                    <div className="row text-center text-sm-start">
                      <div className="col-sm-3 col-6 mb-2 mb-sm-0">
                        <p className="text-muted d-flex align-items-center justify-content-center justify-content-sm-start mb-1">
                          <i className="ti ti-point-filled text-dark me-1" />Total Working
                        </p>
                        <h4 className="fw-bold text-slate-800">{fmtDuration(today.totalWorkMinutes)}</h4>
                      </div>
                      <div className="col-sm-3 col-6 mb-2 mb-sm-0">
                        <p className="text-muted d-flex align-items-center justify-content-center justify-content-sm-start mb-1">
                          <i className="ti ti-point-filled text-success me-1" />Net Work
                        </p>
                        <h4 className="fw-bold text-slate-800">{fmtDuration(today.netWorkMinutes)}</h4>
                      </div>
                      <div className="col-sm-3 col-6">
                        <p className="text-muted d-flex align-items-center justify-content-center justify-content-sm-start mb-1">
                          <i className="ti ti-point-filled text-warning me-1" />Break
                        </p>
                        <h4 className="fw-bold text-slate-800">{fmtDuration(today.breakTimeMinutes)}</h4>
                      </div>
                      <div className="col-sm-3 col-6">
                        <p className="text-muted d-flex align-items-center justify-content-center justify-content-sm-start mb-1">
                          <i className="ti ti-point-filled text-info me-1" />Lunch
                        </p>
                        <h4 className="fw-bold text-slate-800">{fmtDuration(today.lunchTimeMinutes)}</h4>
                      </div>
                    </div>
                    {today.isLate && (
                      <div className="alert alert-warning py-2 mb-0 mt-3 d-flex align-items-center gap-2">
                        <i className="ti ti-alert-triangle"></i>
                        <span>Late by {today.lateMinutes} minutes</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Today's Events Timeline ── */}
              {today?.events?.length > 0 && (
                <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 10 }}>
                  <div className="card-header bg-white border-0 py-3 pb-0">
                    <h5 className="fw-bold text-slate-800 mb-0">Today's Timeline</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex flex-wrap gap-2">
                      {today.events.map((evt, idx) => {
                        const typeColors = {
                          CHECK_IN: 'success', CHECK_OUT: 'danger',
                          BREAK_START: 'warning', BREAK_END: 'warning',
                          LUNCH_START: 'info', LUNCH_END: 'info'
                        };
                        const typeLabels = {
                          CHECK_IN: 'Punch In', CHECK_OUT: 'Punch Out',
                          BREAK_START: 'Break Start', BREAK_END: 'Break End',
                          LUNCH_START: 'Lunch Start', LUNCH_END: 'Lunch End'
                        };
                        const color = typeColors[evt.eventType] || 'secondary';
                        return (
                          <div key={evt.id || idx} className={`badge bg-${color}-transparent text-${color} p-2`}>
                            <i className="ti ti-clock me-1"></i>
                            {typeLabels[evt.eventType] || evt.eventType} — {fmtTime(evt.occurredAt)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Attendance History Table Card ── */}
        {!loading && history.length > 0 && (
          <div className="card border-0 shadow-sm bg-white mt-4" style={{ borderRadius: 12, overflow: "hidden" }}>
            {/* Table Controls Bar */}
            <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 350 }}>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "8px 0 0 8px" }}><i className="ti ti-search text-muted" /></span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    style={{ borderRadius: "0 8px 8px 0", height: 38 }}
                    placeholder="Search history by date or status..."
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
                    id="historyExportDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
                  >
                    <i className="ti ti-download" /> Export
                  </button>
                  <ul className="dropdown-menu shadow border-0" aria-labelledby="historyExportDropdown">
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
                        checked={pagedHistory.length > 0 && pagedHistory.every(r => selectedIds.has(r.id))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Status</th>
                    <th>Check Out</th>
                    <th>Break</th>
                    <th>Lunch</th>
                    <th>Late</th>
                    <th>Net Work</th>
                    <th>Work Status</th>
                    <th style={{ width: 80 }} className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedHistory.length === 0 ? (
                    <tr><td colSpan="11" className="text-center text-muted py-4">No records found</td></tr>
                  ) : (
                    pagedHistory.map((att) => (
                      <tr key={att.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(att.id)}
                            onChange={(e) => handleSelectRow(att.id, e.target.checked)}
                          />
                        </td>
                        <td className="fw-semibold text-slate-800">{fmtDate(att.attendanceDate)}</td>
                        <td>{fmtTime(att.checkInTime)}</td>
                        <td>
                          <span className={`badge ${att.status === 'CHECKED_OUT' || att.status === 'AUTO_CHECKOUT' ? 'badge-success-transparent text-success' : 'badge-info-transparent text-info'} d-inline-flex align-items-center`}>
                            <i className="ti ti-point-filled me-1"></i>
                            {att.status === 'CHECKED_OUT' ? 'Present' : att.status === 'AUTO_CHECKOUT' ? 'Auto Out' : att.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{fmtTime(att.checkOutTime)}</td>
                        <td>{att.breakTimeMinutes > 0 ? `${att.breakTimeMinutes} Min` : '-'}</td>
                        <td>{att.lunchTimeMinutes > 0 ? `${att.lunchTimeMinutes} Min` : '-'}</td>
                        <td>{att.lateMinutes > 0 ? `${att.lateMinutes} Min` : '-'}</td>
                        <td>
                          {att.netWorkMinutes != null ? (
                            <span className={`badge ${att.workStatus === 'COMPLETED' ? 'badge-success bg-success-light text-success' : att.workStatus === 'HALF_DAY' ? 'badge-warning bg-warning-light text-warning' : 'badge-danger bg-danger-light text-danger'} d-inline-flex align-items-center`}>
                              <i className="ti ti-clock-hour-11 me-1"></i>{fmtDuration(att.netWorkMinutes)}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <span className={`badge ${att.workStatus === 'COMPLETED' ? 'badge-success-transparent text-success' : att.workStatus === 'HALF_DAY' ? 'badge-warning-transparent text-warning' : 'badge-danger-transparent text-danger'}`}>
                            {att.workStatus || '-'}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="dropdown">
                            <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="ti ti-dots-vertical" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                              <li>
                                <button className="dropdown-item" onClick={() => {
                                  setSelectedIds(new Set([att.id]));
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
            </div>

            {/* Custom Pagination Footer */}
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
    </>
  );
};

export default AttendanceEmployeePage;
