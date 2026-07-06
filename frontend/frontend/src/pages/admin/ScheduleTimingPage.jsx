import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as attendanceApi from '../../api/attendanceApi';
import LocationPickerModal from '../../components/admin/LocationPickerModal';
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";
import "../../../public/assets/css/addModalShared.css";

/* helpers */
function fmtDuration(mins) {
  if (mins == null || mins <= 0) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function calculateShiftMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 0;

  const [startHours, startMinutes] = String(startTime).split(":").map(Number);
  const [endHours, endMinutes] = String(endTime).split(":").map(Number);

  const startTotal = (Number(startHours) || 0) * 60 + (Number(startMinutes) || 0);
  const endTotal = (Number(endHours) || 0) * 60 + (Number(endMinutes) || 0);
  const total = endTotal >= startTotal
    ? endTotal - startTotal
    : endTotal + 24 * 60 - startTotal;

  return Math.max(0, total);
}

const ScheduleTimingPage = () => {
  const [shifts, setShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('shifts'); // shifts | locations

  /* shift form state */
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    breakAllowedMinutes: 15,
    breakGraceMinutes: 5,
    break1StartTime: '',
    break1EndTime: '',
    break1AllowedMinutes: 15,
    break1GraceMinutes: 5,
    lunchStartTime: '',
    lunchEndTime: '',
    lunchAllowedMinutes: 60,
    lunchGraceMinutes: 10,
    break2StartTime: '',
    break2EndTime: '',
    break2AllowedMinutes: 15,
    break2GraceMinutes: 5,
    minWorkMinutes: 480,
    isNightShift: false,
    earlyCheckinBufferMinutes: 30,
    lateCheckinBufferMinutes: 15,
    maxOvertimeMinutes: 120
  });
  const [editingShiftId, setEditingShiftId] = useState(null);

  /* location form state */
  const [locForm, setLocForm] = useState({ name: '', latitude: '', longitude: '', radiusMeters: 50 });
  const [editingLocId, setEditingLocId] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);

  // Pagination, Search, and Selection States for Shifts
  const [selectedShiftIds, setSelectedShiftIds] = useState(new Set());
  const [searchQueryShifts, setSearchQueryShifts] = useState("");
  const [pageShifts, setPageShifts] = useState(1);
  const [pageSizeShifts, setPageSizeShifts] = useState(10);

  // Pagination, Search, and Selection States for Locations
  const [selectedLocIds, setSelectedLocIds] = useState(new Set());
  const [searchQueryLocations, setSearchQueryLocations] = useState("");
  const [pageLocations, setPageLocations] = useState(1);
  const [pageSizeLocations, setPageSizeLocations] = useState(10);

  const calculatedMinWorkMinutes = useMemo(
    () => {
      const totalShift = calculateShiftMinutes(shiftForm.startTime, shiftForm.endTime);
      const deduct = (shiftForm.break1AllowedMinutes || 0) + (shiftForm.lunchAllowedMinutes || 0) + (shiftForm.break2AllowedMinutes || 0);
      return Math.max(0, totalShift - deduct);
    },
    [shiftForm.startTime, shiftForm.endTime, shiftForm.break1AllowedMinutes, shiftForm.lunchAllowedMinutes, shiftForm.break2AllowedMinutes]
  );

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [shiftList, locList] = await Promise.all([
        attendanceApi.listShifts().catch(() => []),
        attendanceApi.listLocations().catch(() => []),
      ]);
      setShifts(Array.isArray(shiftList) ? shiftList : []);
      setLocations(Array.isArray(locList) ? locList : []);
      setSelectedShiftIds(new Set());
      setSelectedLocIds(new Set());
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Shift CRUD handlers ── */
  const handleShiftSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...shiftForm,
        minWorkMinutes: calculatedMinWorkMinutes,
      };
      if (editingShiftId) {
        await attendanceApi.updateShift(editingShiftId, payload);
      } else {
        await attendanceApi.createShift(payload);
      }
      setEditingShiftId(null);
      setShiftForm({
        name: '', startTime: '09:00', endTime: '18:00',
        breakAllowedMinutes: 15, breakGraceMinutes: 5,
        break1StartTime: '', break1EndTime: '', break1AllowedMinutes: 15, break1GraceMinutes: 5,
        lunchStartTime: '', lunchEndTime: '', lunchAllowedMinutes: 60, lunchGraceMinutes: 10,
        break2StartTime: '', break2EndTime: '', break2AllowedMinutes: 15, break2GraceMinutes: 5,
        minWorkMinutes: 480, isNightShift: false, earlyCheckinBufferMinutes: 30, lateCheckinBufferMinutes: 15, maxOvertimeMinutes: 120
      });
      setIsShiftModalOpen(false);
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Shift save failed');
    }
  };

  const handleShiftEdit = (s) => {
    setEditingShiftId(s.id);
    setShiftForm({
      name: s.name || '', startTime: s.startTime || '09:00', endTime: s.endTime || '18:00',
      breakAllowedMinutes: s.breakAllowedMinutes ?? 15, breakGraceMinutes: s.breakGraceMinutes ?? 5,
      break1StartTime: s.break1StartTime || '', break1EndTime: s.break1EndTime || '',
      break1AllowedMinutes: s.break1AllowedMinutes ?? 15, break1GraceMinutes: s.break1GraceMinutes ?? 5,
      lunchStartTime: s.lunchStartTime || '', lunchEndTime: s.lunchEndTime || '',
      lunchAllowedMinutes: s.lunchAllowedMinutes ?? 60, lunchGraceMinutes: s.lunchGraceMinutes ?? 10,
      break2StartTime: s.break2StartTime || '', break2EndTime: s.break2EndTime || '',
      break2AllowedMinutes: s.break2AllowedMinutes ?? 15, break2GraceMinutes: s.break2GraceMinutes ?? 5,
      minWorkMinutes: s.minWorkMinutes ?? calculateShiftMinutes(s.startTime, s.endTime), isNightShift: s.isNightShift ?? false,
      earlyCheckinBufferMinutes: s.earlyCheckinBufferMinutes ?? 30, lateCheckinBufferMinutes: s.lateCheckinBufferMinutes ?? 15, maxOvertimeMinutes: s.maxOvertimeMinutes ?? 120
    });
    setIsShiftModalOpen(true);
  };

  const handleShiftDelete = async (id) => {
    if (!window.confirm('Delete this shift?')) return;
    try { await attendanceApi.deleteShift(id); await loadData(); }
    catch (e) { setError(e?.response?.data?.message || 'Delete failed'); }
  };

  /* ── Location CRUD handlers ── */
  const handleLocSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...locForm, latitude: parseFloat(locForm.latitude), longitude: parseFloat(locForm.longitude), radiusMeters: parseInt(locForm.radiusMeters, 10) };
      if (editingLocId) {
        await attendanceApi.updateLocation(editingLocId, payload);
      } else {
        await attendanceApi.createLocation(payload);
      }
      setEditingLocId(null);
      setLocForm({ name: '', latitude: '', longitude: '', radiusMeters: 50 });
      setIsLocModalOpen(false);
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Location save failed');
    }
  };

  const handleLocEdit = (l) => {
    setEditingLocId(l.id);
    setLocForm({ name: l.name || '', latitude: l.latitude || '', longitude: l.longitude || '', radiusMeters: l.radiusMeters ?? 50 });
    setIsLocModalOpen(true);
  };

  const handleLocDelete = async (id) => {
    if (!window.confirm('Delete this location?')) return;
    try { await attendanceApi.deleteLocation(id); await loadData(); }
    catch (e) { setError(e?.response?.data?.message || 'Delete failed'); }
  };

  // Filter Shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const name = (s.name || "").toLowerCase();
      const q = searchQueryShifts.toLowerCase();
      return name.includes(q);
    });
  }, [shifts, searchQueryShifts]);

  // Paginate Shifts
  const totalShifts = filteredShifts.length;
  const shiftsPageCount = Math.max(1, Math.ceil(totalShifts / pageSizeShifts));
  const clampedShiftsPage = Math.min(Math.max(1, pageShifts), shiftsPageCount);
  const offsetShifts = (clampedShiftsPage - 1) * pageSizeShifts;
  const pagedShifts = filteredShifts.slice(offsetShifts, offsetShifts + pageSizeShifts);

  // Filter Locations
  const filteredLocs = useMemo(() => {
    return locations.filter(l => {
      const name = (l.name || "").toLowerCase();
      const q = searchQueryLocations.toLowerCase();
      return name.includes(q);
    });
  }, [locations, searchQueryLocations]);

  // Paginate Locations
  const totalLocs = filteredLocs.length;
  const locsPageCount = Math.max(1, Math.ceil(totalLocs / pageSizeLocations));
  const clampedLocsPage = Math.min(Math.max(1, pageLocations), locsPageCount);
  const offsetLocs = (clampedLocsPage - 1) * pageSizeLocations;
  const pagedLocs = filteredLocs.slice(offsetLocs, offsetLocs + pageSizeLocations);

  const handleSelectAllShifts = (checked) => {
    if (checked) {
      setSelectedShiftIds(new Set(pagedShifts.map(s => s.id)));
    } else {
      setSelectedShiftIds(new Set());
    }
  };

  const handleSelectShift = (id, checked) => {
    const next = new Set(selectedShiftIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedShiftIds(next);
  };

  const handleSelectAllLocs = (checked) => {
    if (checked) {
      setSelectedLocIds(new Set(pagedLocs.map(l => l.id)));
    } else {
      setSelectedLocIds(new Set());
    }
  };

  const handleSelectLoc = (id, checked) => {
    const next = new Set(selectedLocIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedLocIds(next);
  };

  const exportShiftsExcel = () => {
    const target = selectedShiftIds.size > 0 ? shifts.filter(s => selectedShiftIds.has(s.id)) : shifts;
    const headers = ["Name", "Start Time", "End Time", "Break Allowed", "Lunch Allowed", "Min Work Time", "Night Shift"];
    const escapeXml = (u) => String(u ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = target.map(s => `
      <tr>
        <td>${escapeXml(s.name)}</td>
        <td>${escapeXml(s.startTime)}</td>
        <td>${escapeXml(s.endTime)}</td>
        <td>${s.breakAllowedMinutes}m</td>
        <td>${s.lunchAllowedMinutes}m</td>
        <td>${fmtDuration(s.minWorkMinutes)}</td>
        <td>${s.isNightShift ? "Yes" : "No"}</td>
      </tr>
    `).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shifts-${Date.now()}.xls`;
    link.click();
  };

  const exportShiftsPdf = () => {
    const target = selectedShiftIds.size > 0 ? shifts.filter(s => selectedShiftIds.has(s.id)) : shifts;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.text("Shifts Report", 40, 40);
    const headers = [["Name", "Start", "End", "Break", "Lunch", "Min Work", "Night"]];
    const body = target.map(s => [
      s.name,
      s.startTime,
      s.endTime,
      `${s.breakAllowedMinutes}m`,
      `${s.lunchAllowedMinutes}m`,
      fmtDuration(s.minWorkMinutes),
      s.isNightShift ? "Yes" : "No"
    ]);
    autoTable(doc, { head: headers, body, startY: 60 });
    doc.save(`shifts-${Date.now()}.pdf`);
  };

  const exportLocsExcel = () => {
    const target = selectedLocIds.size > 0 ? locations.filter(l => selectedLocIds.has(l.id)) : locations;
    const headers = ["Name", "Latitude", "Longitude", "Radius (m)", "Active"];
    const escapeXml = (u) => String(u ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = target.map(l => `
      <tr>
        <td>${escapeXml(l.name)}</td>
        <td>${l.latitude}</td>
        <td>${l.longitude}</td>
        <td>${l.radiusMeters}</td>
        <td>${l.active ? "Yes" : "No"}</td>
      </tr>
    `).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `locations-${Date.now()}.xls`;
    link.click();
  };

  const exportLocsPdf = () => {
    const target = selectedLocIds.size > 0 ? locations.filter(l => selectedLocIds.has(l.id)) : locations;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.text("Locations Report", 40, 40);
    const headers = [["Name", "Latitude", "Longitude", "Radius", "Active"]];
    const body = target.map(l => [
      l.name,
      String(l.latitude),
      String(l.longitude),
      `${l.radiusMeters}m`,
      l.active ? "Yes" : "No"
    ]);
    autoTable(doc, { head: headers, body, startY: 60 });
    doc.save(`locations-${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="content">
        {/* White top header card */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Schedule Timing</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item text-muted">Administration</li>
                  <li className="breadcrumb-item active text-primary" aria-current="page">Schedule Timing</li>
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

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'shifts' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('shifts')}>
              <i className="ti ti-clock me-1"></i>Shifts
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'locations' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('locations')}>
              <i className="ti ti-map-pin me-1"></i>Locations
            </button>
          </li>
        </ul>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
        ) : (
          <>
            {activeTab === 'shifts' && (
              <div className="row g-4">
                {/* Shift List - Full Width */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12, overflow: "hidden" }}>
                    {/* Controls Bar */}
                    <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
                      <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 250 }}>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0"><i className="ti ti-search text-muted" /></span>
                          <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search shifts..."
                            value={searchQueryShifts}
                            onChange={(e) => { setSearchQueryShifts(e.target.value); setPageShifts(1); }}
                          />
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary d-flex align-items-center gap-1" onClick={() => {
                          setEditingShiftId(null);
                          setShiftForm({
                            name: '', startTime: '09:00', endTime: '18:00',
                            breakAllowedMinutes: 15, breakGraceMinutes: 5,
                            break1StartTime: '', break1EndTime: '', break1AllowedMinutes: 15, break1GraceMinutes: 5,
                            lunchStartTime: '', lunchEndTime: '', lunchAllowedMinutes: 60, lunchGraceMinutes: 10,
                            break2StartTime: '', break2EndTime: '', break2AllowedMinutes: 15, break2GraceMinutes: 5,
                            minWorkMinutes: 480, isNightShift: false, earlyCheckinBufferMinutes: 30, lateCheckinBufferMinutes: 15, maxOvertimeMinutes: 120
                          });
                          setIsShiftModalOpen(true);
                        }}>
                          <i className="ti ti-plus" /> Add Shift
                        </button>
                        <div className="dropdown">
                          <button className="btn btn-white border dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="ti ti-download" /> Export
                          </button>
                          <ul className="dropdown-menu shadow border-0">
                            <li><button className="dropdown-item" onClick={exportShiftsExcel}>Excel</button></li>
                            <li><button className="dropdown-item" onClick={exportShiftsPdf}>PDF</button></li>
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
                                checked={pagedShifts.length > 0 && pagedShifts.every(s => selectedShiftIds.has(s.id))}
                                onChange={(e) => handleSelectAllShifts(e.target.checked)}
                              />
                            </th>
                            <th>Name</th>
                            <th>Start/End</th>
                            <th>Break 1</th>
                            <th>Lunch</th>
                            <th>Break 2</th>
                            <th>Min Work</th>
                            <th>Max OT</th>
                            <th>Night</th>
                            <th style={{ width: 80 }} className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedShifts.length === 0 ? (
                            <tr><td colSpan="11" className="text-center py-4 text-muted">No shifts configured</td></tr>
                          ) : (
                            pagedShifts.map(s => (
                              <tr key={s.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedShiftIds.has(s.id)}
                                    onChange={(e) => handleSelectShift(s.id, e.target.checked)}
                                  />
                                </td>
                                <td className="fw-semibold text-slate-800">{s.name}</td>
                                <td>{s.startTime} - {s.endTime}</td>
                                <td>{s.break1StartTime ? `${s.break1StartTime}-${s.break1EndTime} (${s.break1AllowedMinutes}m)` : '-'}</td>
                                <td>{s.lunchStartTime ? `${s.lunchStartTime}-${s.lunchEndTime} (${s.lunchAllowedMinutes}m)` : '-'}</td>
                                <td>{s.break2StartTime ? `${s.break2StartTime}-${s.break2EndTime} (${s.break2AllowedMinutes}m)` : '-'}</td>
                                <td>{fmtDuration(s.minWorkMinutes)}</td>
                                <td>{s.maxOvertimeMinutes === 0 ? 'None' : fmtDuration(s.maxOvertimeMinutes)}</td>
                                <td>{s.isNightShift ? <span className="badge bg-dark">Yes</span> : 'No'}</td>
                                <td className="text-end">
                                  <div className="dropdown">
                                    <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                                      <i className="ti ti-dots-vertical" />
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                      <li><button className="dropdown-item" onClick={() => handleShiftEdit(s)}>Edit</button></li>
                                      <li><button className="dropdown-item text-danger" onClick={() => handleShiftDelete(s.id)}>Delete</button></li>
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    {totalShifts > 0 && (
                      <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
                        <div className="text-muted small">
                          Showing {offsetShifts + 1} to {Math.min(offsetShifts + pageSizeShifts, totalShifts)} of {totalShifts} entries
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => setPageShifts(p => Math.max(1, p - 1))}
                            disabled={clampedShiftsPage === 1}
                          >
                            <i className="ti ti-chevron-left" />
                          </button>
                          <span className="small fw-semibold">{clampedShiftsPage} / {shiftsPageCount}</span>
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => setPageShifts(p => Math.min(shiftsPageCount, p + 1))}
                            disabled={clampedShiftsPage === shiftsPageCount}
                          >
                            <i className="ti ti-chevron-right" />
                          </button>
                          <PageSizeSelector
                            pageSize={pageSizeShifts}
                            setPageSize={setPageSizeShifts}
                            setPage={setPageShifts}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'locations' && (
              <div className="row g-4">
                {/* Location List - Full Width */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12, overflow: "hidden" }}>
                    {/* Controls Bar */}
                    <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
                      <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 250 }}>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0"><i className="ti ti-search text-muted" /></span>
                          <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search locations..."
                            value={searchQueryLocations}
                            onChange={(e) => { setSearchQueryLocations(e.target.value); setPageLocations(1); }}
                          />
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary d-flex align-items-center gap-1" onClick={() => {
                          setEditingLocId(null);
                          setLocForm({ name: '', latitude: '', longitude: '', radiusMeters: 50 });
                          setIsLocModalOpen(true);
                        }}>
                          <i className="ti ti-plus" /> Add Location
                        </button>
                        <div className="dropdown">
                          <button className="btn btn-white border dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="ti ti-download" /> Export
                          </button>
                          <ul className="dropdown-menu shadow border-0">
                            <li><button className="dropdown-item" onClick={exportLocsExcel}>Excel</button></li>
                            <li><button className="dropdown-item" onClick={exportLocsPdf}>PDF</button></li>
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
                                checked={pagedLocs.length > 0 && pagedLocs.every(l => selectedLocIds.has(l.id))}
                                onChange={(e) => handleSelectAllLocs(e.target.checked)}
                              />
                            </th>
                            <th>Name</th>
                            <th>Latitude</th>
                            <th>Longitude</th>
                            <th>Radius</th>
                            <th>Active</th>
                            <th style={{ width: 80 }} className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedLocs.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-4 text-muted">No locations configured</td></tr>
                          ) : (
                            pagedLocs.map(l => (
                              <tr key={l.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedLocIds.has(l.id)}
                                    onChange={(e) => handleSelectLoc(l.id, e.target.checked)}
                                  />
                                </td>
                                <td className="fw-semibold text-slate-800">{l.name}</td>
                                <td>{l.latitude?.toFixed(6)}</td>
                                <td>{l.longitude?.toFixed(6)}</td>
                                <td>{l.radiusMeters}m</td>
                                <td>{l.active ? <span className="badge bg-success">Yes</span> : <span className="badge bg-danger">No</span>}</td>
                                <td className="text-end">
                                  <div className="dropdown">
                                    <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                                      <i className="ti ti-dots-vertical" />
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                      <li><button className="dropdown-item" onClick={() => handleLocEdit(l)}>Edit</button></li>
                                      <li><button className="dropdown-item text-danger" onClick={() => handleLocDelete(l.id)}>Delete</button></li>
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    {totalLocs > 0 && (
                      <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
                        <div className="text-muted small">
                          Showing {offsetLocs + 1} to {Math.min(offsetLocs + pageSizeLocations, totalLocs)} of {totalLocs} entries
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => setPageLocations(p => Math.max(1, p - 1))}
                            disabled={clampedLocsPage === 1}
                          >
                            <i className="ti ti-chevron-left" />
                          </button>
                          <span className="small fw-semibold">{clampedLocsPage} / {locsPageCount}</span>
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => setPageLocations(p => Math.min(locsPageCount, p + 1))}
                            disabled={clampedLocsPage === locsPageCount}
                          >
                            <i className="ti ti-chevron-right" />
                          </button>
                          <PageSizeSelector
                            pageSize={pageSizeLocations}
                            setPageSize={setPageSizeLocations}
                            setPage={setPageLocations}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        show={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        radiusMeters={Number(locForm.radiusMeters) || 50}
        onRadiusChange={(value) =>
          setLocForm((p) => ({
            ...p,
            radiusMeters: value,
          }))
        }
        initialLocation={
          locForm.latitude && locForm.longitude
            ? { latitude: parseFloat(locForm.latitude), longitude: parseFloat(locForm.longitude) }
            : null
        }
        onSelectLocation={(location) => {
          setLocForm((p) => ({
            ...p,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
        }}
      />

      {/* Floating Dark Bottom Actions Bar for Shifts */}
      {activeTab === 'shifts' && selectedShiftIds.size > 0 && createPortal(
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
          <span className="small">{selectedShiftIds.size} shift(s) selected</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedShiftIds(new Set())}>Clear</button>
          <button className="btn btn-sm btn-primary" onClick={exportShiftsPdf}>Export Selected PDF</button>
        </div>,
        document.body
      )}

      {/* Floating Dark Bottom Actions Bar for Locations */}
      {activeTab === 'locations' && selectedLocIds.size > 0 && createPortal(
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
          <span className="small">{selectedLocIds.size} location(s) selected</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedLocIds(new Set())}>Clear</button>
          <button className="btn btn-sm btn-primary" onClick={exportLocsPdf}>Export Selected PDF</button>
        </div>,
        document.body
      )}

      {/* Shift Form Modal */}
      {isShiftModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow" style={{ borderRadius: 12 }}>
              <div className="modal-header border-bottom py-3">
                <h5 className="fw-bold text-slate-800 mb-0">{editingShiftId ? 'Edit Shift' : 'Add Shift'}</h5>
                <button type="button" className="btn-close" onClick={() => setIsShiftModalOpen(false)}></button>
              </div>
              <form onSubmit={handleShiftSave}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="mb-3">
                    <label className="form-label">Shift Name</label>
                    <input type="text" className="form-control" required value={shiftForm.name} onChange={e => setShiftForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-control" required value={shiftForm.startTime} onChange={e => setShiftForm(p => ({ ...p, startTime: e.target.value }))} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        required
                        value={shiftForm.endTime}
                        onChange={e =>
                          setShiftForm((p) => ({
                            ...p,
                            endTime: e.target.value,
                            minWorkMinutes: calculateShiftMinutes(p.startTime, e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  {/* Break 1 Section */}
                  <div className="border p-2 rounded mb-3 bg-light">
                    <h6 className="fw-bold text-slate-700 border-bottom pb-1 mb-2 small">Break 1</h6>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small mb-1">Start Time</label>
                        <input type="time" className="form-control form-control-sm" value={shiftForm.break1StartTime || ''} onChange={e => setShiftForm(p => ({ ...p, break1StartTime: e.target.value }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small mb-1">End Time</label>
                        <input type="time" className="form-control form-control-sm" value={shiftForm.break1EndTime || ''} onChange={e => setShiftForm(p => ({ ...p, break1EndTime: e.target.value }))} />
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small mb-1">Allowed (min)</label>
                        <input type="number" className="form-control form-control-sm" min="0" value={shiftForm.break1AllowedMinutes} onChange={e => setShiftForm(p => ({ ...p, break1AllowedMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small mb-1">Grace (min)</label>
                        <input type="number" className="form-control form-control-sm" min="0" value={shiftForm.break1GraceMinutes} onChange={e => setShiftForm(p => ({ ...p, break1GraceMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                      </div>
                    </div>
                  </div>

                  {/* Lunch Section */}
                  <div className="border p-2 rounded mb-3 bg-light">
                    <h6 className="fw-bold text-slate-700 border-bottom pb-1 mb-2 small">Lunch</h6>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small mb-1">Start Time</label>
                        <input type="time" className="form-control form-control-sm" value={shiftForm.lunchStartTime || ''} onChange={e => setShiftForm(p => ({ ...p, lunchStartTime: e.target.value }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small mb-1">End Time</label>
                        <input type="time" className="form-control form-control-sm" value={shiftForm.lunchEndTime || ''} onChange={e => setShiftForm(p => ({ ...p, lunchEndTime: e.target.value }))} />
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small mb-1">Allowed (min)</label>
                        <input type="number" className="form-control form-control-sm" min="0" value={shiftForm.lunchAllowedMinutes} onChange={e => setShiftForm(p => ({ ...p, lunchAllowedMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small mb-1">Grace (min)</label>
                        <input type="number" className="form-control form-control-sm" min="0" value={shiftForm.lunchGraceMinutes} onChange={e => setShiftForm(p => ({ ...p, lunchGraceMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                      </div>
                    </div>
                  </div>

                  {/* Break 2 Section */}
                  <div className="border p-2 rounded mb-3 bg-light">
                    <h6 className="fw-bold text-slate-700 border-bottom pb-1 mb-2 small">Break 2</h6>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small mb-1">Start Time</label>
                        <input type="time" className="form-control form-control-sm" value={shiftForm.break2StartTime || ''} onChange={e => setShiftForm(p => ({ ...p, break2StartTime: e.target.value }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small mb-1">End Time</label>
                        <input type="time" className="form-control form-control-sm" value={shiftForm.break2EndTime || ''} onChange={e => setShiftForm(p => ({ ...p, break2EndTime: e.target.value }))} />
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small mb-1">Allowed (min)</label>
                        <input type="number" className="form-control form-control-sm" min="0" value={shiftForm.break2AllowedMinutes} onChange={e => setShiftForm(p => ({ ...p, break2AllowedMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small mb-1">Grace (min)</label>
                        <input type="number" className="form-control form-control-sm" min="0" value={shiftForm.break2GraceMinutes} onChange={e => setShiftForm(p => ({ ...p, break2GraceMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Min Work (min)</label>
                    <input type="number" className="form-control" min="0" value={calculatedMinWorkMinutes} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Max Overtime (min)</label>
                    <input type="number" className="form-control" min="0" value={shiftForm.maxOvertimeMinutes} onChange={e => setShiftForm(p => ({ ...p, maxOvertimeMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Early Check-In (min before start)</label>
                      <input type="number" className="form-control" min="0" value={shiftForm.earlyCheckinBufferMinutes} onChange={e => setShiftForm(p => ({ ...p, earlyCheckinBufferMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Late Check-In (min after start)</label>
                      <input type="number" className="form-control" min="0" value={shiftForm.lateCheckinBufferMinutes} onChange={e => setShiftForm(p => ({ ...p, lateCheckinBufferMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-2">
                  <button type="button" className="btn btn-light" onClick={() => setIsShiftModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingShiftId ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Location Form Modal */}
      {isLocModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: 12 }}>
              <div className="modal-header border-bottom py-3">
                <h5 className="fw-bold text-slate-800 mb-0">{editingLocId ? 'Edit Location' : 'Add Location'}</h5>
                <button type="button" className="btn-close" onClick={() => setIsLocModalOpen(false)}></button>
              </div>
              <form onSubmit={handleLocSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Location Name</label>
                    <input type="text" className="form-control" required value={locForm.name} onChange={e => setLocForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={() => setLocationModalVisible(true)}
                    >
                      <i className="ti ti-map me-2"></i>
                      {locForm.latitude && locForm.longitude ? 'Change Location on Map' : 'Pick Location on Map'}
                    </button>
                  </div>
                  {locForm.latitude && locForm.longitude && (
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <small className="text-muted">Latitude</small>
                        <div className="fw-bold">{parseFloat(locForm.latitude).toFixed(6)}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Longitude</small>
                        <div className="fw-bold">{parseFloat(locForm.longitude).toFixed(6)}</div>
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Radius (meters)</label>
                    <input type="number" className="form-control" min="0" value={locForm.radiusMeters} onChange={e => setLocForm(p => ({ ...p, radiusMeters: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                  </div>
                </div>
                <div className="modal-footer border-top py-2">
                  <button type="button" className="btn btn-light" onClick={() => setIsLocModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingLocId ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScheduleTimingPage;
