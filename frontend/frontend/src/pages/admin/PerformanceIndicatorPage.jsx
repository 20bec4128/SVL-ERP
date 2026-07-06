import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getDepartmentsMaster } from "../../api/departmentsApi";
import { getDesignations } from "../../api/designationsApi";
import {
  createPerformanceIndicator,
  deletePerformanceIndicator,
  getPerformanceIndicators,
  updatePerformanceIndicator,
} from "../../api/performanceIndicatorApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";
import "../../../public/assets/css/addModalShared.css";

const initialForm = {
  designationId: "",
  departmentId: "",
  approvedBy: "",
  customerExperience: "",
  marketing: "",
  management: "",
  administration: "",
  presentationSkills: "",
  qualityOfWork: "",
  efficiency: "",
  integrity: "",
  professionalism: "",
  teamWork: "",
  criticalThinking: "",
  conflictManagement: "",
  attendance: "",
  abilityToMeetDeadline: "",
  status: "Active",
};

const scoreOptions = ["Advanced", "Intermediate", "Average", "None"];

export default function PerformanceIndicatorPage() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
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

  // Search/Filters and Pagination state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Kebab row actions state
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Close kebab action menu on outside scroll or click
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

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPerformanceIndicators();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load indicators"));
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [deps, desigs] = await Promise.all([getDepartmentsMaster(), getDesignations()]);
      setDepartments(Array.isArray(deps) ? deps : []);
      setDesignations(Array.isArray(desigs) ? desigs : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load departments/designations"));
    }
  };

  useEffect(() => {
    load();
    loadMeta();
  }, []);

  const departmentOptions = useMemo(
    () =>
      (departments || [])
        .map((d) => ({ id: d?.id, name: d?.name }))
        .filter((d) => d.id != null && d.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [departments],
  );

  const designationOptions = useMemo(
    () =>
      (designations || [])
        .map((d) => ({ id: d?.id, name: d?.name }))
        .filter((d) => d.id != null && d.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [designations],
  );

  // Filtered and sorted rows
  const filteredRows = useMemo(() => {
    let result = rows;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((r) =>
        (r.designationName || "").toLowerCase().includes(q) ||
        (r.departmentName || "").toLowerCase().includes(q) ||
        (r.approvedBy || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, search]);

  const orderedRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) =>
        String(b.createdDate || "").localeCompare(String(a.createdDate || ""))
      ),
    [filteredRows],
  );

  // Pagination calculations
  const totalRows = orderedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => orderedRows.slice(pageOffset, pageOffset + pageSize),
    [orderedRows, pageOffset, pageSize]
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage]);

  // Selection toggle handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleSelection = (id) => {
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

  const openAdd = () => {
    setForm(initialForm);
    setShowAddModal(true);
  };

  const openEdit = (row) => {
    setEditForm({
      designationId: row?.designationId ? String(row.designationId) : "",
      departmentId: row?.departmentId ? String(row.departmentId) : "",
      approvedBy: row?.approvedBy || "",
      customerExperience: row?.customerExperience || "",
      marketing: row?.marketing || "",
      management: row?.management || "",
      administration: row?.administration || "",
      presentationSkills: row?.presentationSkills || "",
      qualityOfWork: row?.qualityOfWork || "",
      efficiency: row?.efficiency || "",
      integrity: row?.integrity || "",
      professionalism: row?.professionalism || "",
      teamWork: row?.teamWork || "",
      criticalThinking: row?.criticalThinking || "",
      conflictManagement: row?.conflictManagement || "",
      attendance: row?.attendance || "",
      abilityToMeetDeadline: row?.abilityToMeetDeadline || "",
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.designationId || !form.departmentId) {
      showError("Designation and department are required");
      return;
    }
    setSaving(true);
    try {
      await createPerformanceIndicator({
        ...form,
        designationId: Number(form.designationId),
        departmentId: Number(form.departmentId),
      });
      setForm(initialForm);
      showSuccess("Indicator added");
      setShowAddModal(false);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to add indicator"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!editForm.designationId || !editForm.departmentId) {
      showError("Designation and department are required");
      return;
    }
    setSaving(true);
    try {
      await updatePerformanceIndicator(selectedId, {
        ...editForm,
        designationId: Number(editForm.designationId),
        departmentId: Number(editForm.departmentId),
      });
      showSuccess("Indicator updated");
      setShowEditModal(false);
      setSelectedId(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to update indicator"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deletePerformanceIndicator(selectedId);
      showSuccess("Indicator deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      setDeleteTarget(null);
      await load();
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to delete indicator"));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete the selected ${selectedIds.size} indicators?`)) {
      setSaving(true);
      try {
        await Promise.all(Array.from(selectedIds).map((id) => deletePerformanceIndicator(id)));
        showSuccess(`${selectedIds.size} indicators deleted successfully`);
        setSelectedIds(new Set());
        await load();
      } catch (e) {
        showError("Failed to delete some indicators");
      } finally {
        setSaving(false);
      }
    }
  };

  // Export functions
  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? orderedRows.filter((r) => selectedIds.has(r.id))
      : orderedRows;

    const headers = ["Designation", "Department", "Approved By", "Created Date", "Status"];
    const body = targetRows.map((row) => [
      row.designationName || "",
      row.departmentName || "",
      row.approvedBy || "",
      row.createdDate ? new Date(row.createdDate).toLocaleDateString("en-GB") : "",
      row.status || "Active",
    ]);
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `performance-indicators-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedIds.size > 0
      ? orderedRows.filter((r) => selectedIds.has(r.id))
      : orderedRows;

    const headers = ["Designation", "Department", "Approved By", "Created Date", "Status"];
    const body = targetRows.map((row) => [
      row.designationName || "",
      row.departmentName || "",
      row.approvedBy || "",
      row.createdDate ? new Date(row.createdDate).toLocaleDateString("en-GB") : "",
      row.status || "Active",
    ]);
    
    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Indicators</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    template += `<body><table><thead><tr>`;
    headers.forEach((h) => {
      template += `<th>${h}</th>`;
    });
    template += `</tr></thead><tbody>`;
    body.forEach((r) => {
      template += `<tr>`;
      r.forEach((c) => {
        template += `<td>${c}</td>`;
      });
      template += `</tr>`;
    });
    template += `</tbody></table></body></html>`;

    const blob = new Blob([template], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `performance-indicators-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? orderedRows.filter((r) => selectedIds.has(r.id))
      : orderedRows;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Performance Indicators Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["Designation", "Department", "Approved By", "Created Date", "Status"]];
    const body = targetRows.map((row) => [
      row.designationName || "",
      row.departmentName || "",
      row.approvedBy || "",
      row.createdDate ? new Date(row.createdDate).toLocaleDateString("en-GB") : "",
      row.status || "Active",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 8 },
    });

    doc.save(`performance-indicators-${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="content">
        {/* Custom Header Card with breadcrumb and primary blue add button */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Performance Indicator</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <span style={{ color: "#64748b" }}>Performance</span>
                  </li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Performance Indicator</li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
                onClick={openAdd}
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
              >
                <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
                Add Indicator
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls Bar inside the table card */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control search-leads-input"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search indicator..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="dropdown">
                <button
                  className="btn btn-outline-export dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  id="exportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
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
            <div className="custom-datatable-filter table-responsive" style={{ overflowX: "auto" }}>
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
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Approved By</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">Loading...</td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">No indicators found</td>
                    </tr>
                  ) : (
                    pagedRows.map((row, idx) => (
                      <tr key={row.id || `${row.designationId}-${row.departmentId}`}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelection(row.id)}
                          />
                        </td>
                        <td>{pageOffset + idx + 1}</td>
                        <td className="fw-semibold text-dark">{row.designationName || "-"}</td>
                        <td>{row.departmentName || "-"}</td>
                        <td>{row.approvedBy || "-"}</td>
                        <td>{row.createdDate ? new Date(row.createdDate).toLocaleDateString("en-GB") : "-"}</td>
                        <td>
                          {String(row.status || "Active").toLowerCase() === "inactive" ? (
                            <span className="badge bg-danger">Inactive</span>
                          ) : (
                            <span className="badge bg-success">Active</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="dropdown">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Pagination Footer */}
          <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top">
            <span className="entries-info text-muted small">
              {totalRows === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${pageOffset + 1} to ${Math.min(pageOffset + pageSize, totalRows)} of ${totalRows} entries`}
            </span>

            <div className="pagination-numbers-container d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
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
                    className={`btn-pagination-num btn btn-sm border-0 ${clampedPage === pageNum ? "active" : "btn-light"}`}
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
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

      {showAddModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add New Indicator</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleAdd}>
                  <div className="modal-body pb-0" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Designation</label>
                          <select
                            className="form-select"
                            value={form.designationId}
                            onChange={(e) => setForm((prev) => ({ ...prev, designationId: e.target.value }))}
                          >
                            <option value="">Select</option>
                            {designationOptions.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Department</label>
                          <select
                            className="form-select"
                            value={form.departmentId}
                            onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                          >
                            <option value="">Select</option>
                            {departmentOptions.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Approved By</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.approvedBy}
                            onChange={(e) => setForm((prev) => ({ ...prev, approvedBy: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="col-md-12"><div className="mb-3"><h5 className="fw-medium">Technical</h5></div></div>

                      {[
                        ["Customer Experience", "customerExperience"],
                        ["Marketing", "marketing"],
                        ["Management", "management"],
                        ["Administration", "administration"],
                        ["Presentation Skills", "presentationSkills"],
                        ["Quality of Work", "qualityOfWork"],
                        ["Efficiency", "efficiency"],
                      ].map(([label, key]) => (
                        <div className="col-md-3" key={key}>
                          <div className="mb-3">
                            <label className="form-label">{label}</label>
                            <select className="form-select" value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}>
                              <option value="">Select</option>
                              {scoreOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}

                      <div className="col-md-12"><div className="mb-3"><h5 className="fw-medium">Organizational</h5></div></div>

                      {[
                        ["Integrity", "integrity"],
                        ["Professionalism", "professionalism"],
                        ["Team Work", "teamWork"],
                        ["Critical Thinking", "criticalThinking"],
                        ["Conflict Management", "conflictManagement"],
                        ["Attendance", "attendance"],
                        ["Ability To Meet Deadline", "abilityToMeetDeadline"],
                      ].map(([label, key]) => (
                        <div className="col-md-3" key={key}>
                          <div className="mb-3">
                            <label className="form-label">{label}</label>
                            <select className="form-select" value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}>
                              <option value="">Select</option>
                              {scoreOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}

                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select className="form-select" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                            <option value="">Select</option>
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
                      {saving ? "Adding..." : "Add Indicator"}
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
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Indicator</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowEditModal(false)}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleEdit}>
                  <div className="modal-body pb-0" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Designation</label>
                          <select className="form-select" value={editForm.designationId} onChange={(e) => setEditForm((prev) => ({ ...prev, designationId: e.target.value }))}>
                            <option value="">Select</option>
                            {designationOptions.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Department</label>
                          <select className="form-select" value={editForm.departmentId} onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: e.target.value }))}>
                            <option value="">Select</option>
                            {departmentOptions.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Approved By</label>
                          <input type="text" className="form-control" value={editForm.approvedBy} onChange={(e) => setEditForm((prev) => ({ ...prev, approvedBy: e.target.value }))} />
                        </div>
                      </div>

                      <div className="col-md-12"><div className="mb-3"><h5 className="fw-medium">Technical</h5></div></div>
                      {[
                        ["Customer Experience", "customerExperience"],
                        ["Marketing", "marketing"],
                        ["Management", "management"],
                        ["Administration", "administration"],
                        ["Presentation Skills", "presentationSkills"],
                        ["Quality of Work", "qualityOfWork"],
                        ["Efficiency", "efficiency"],
                      ].map(([label, key]) => (
                        <div className="col-md-3" key={key}>
                          <div className="mb-3">
                            <label className="form-label">{label}</label>
                            <select className="form-select" value={editForm[key]} onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}>
                              <option value="">Select</option>
                              {scoreOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}

                      <div className="col-md-12"><div className="mb-3"><h5 className="fw-medium">Organizational</h5></div></div>
                      {[
                        ["Integrity", "integrity"],
                        ["Professionalism", "professionalism"],
                        ["Team Work", "teamWork"],
                        ["Critical Thinking", "criticalThinking"],
                        ["Conflict Management", "conflictManagement"],
                        ["Attendance", "attendance"],
                        ["Ability To Meet Deadline", "abilityToMeetDeadline"],
                      ].map(([label, key]) => (
                        <div className="col-md-3" key={key}>
                          <div className="mb-3">
                            <label className="form-label">{label}</label>
                            <select className="form-select" value={editForm[key]} onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}>
                              <option value="">Select</option>
                              {scoreOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}

                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select className="form-select" value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}>
                            <option value="">Select</option>
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
                      {saving ? "Saving..." : "Save Changes"}
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
                  <p className="mb-3">You want to delete this indicator, this cant be undone once you delete.</p>
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



      {/* Floating Bulk Operations Bar */}
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
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>indicators selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "#dc2626", color: "#ffffff", border: "none" }}
              onClick={handleBulkDelete}
              disabled={saving}
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
}
