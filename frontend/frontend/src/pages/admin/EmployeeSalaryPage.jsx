import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import { getEmployees } from "../../api/employeesApi";
import { getEmployeeSalaries, createEmployeeSalary, updateEmployeeSalary, deleteEmployeeSalary } from "../../api/employeeSalaryApi";
import { createPayslip } from "../../api/payslipApi";
import { getAdditions, getDeductions } from "../../api/payrollItemsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

const EmployeeSalaryPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [additionsList, setAdditionsList] = useState([]);
  const [deductionsList, setDeductionsList] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const isFieldActive = (fieldKey) => {
    if (["basic", "da", "hra", "conveyance"].includes(fieldKey)) {
      if (additionsList.length === 0) return true;
      const match = additionsList.find(item => {
        const name = (item.name || "").toLowerCase();
        if (fieldKey === "basic") return name.includes("basic");
        if (fieldKey === "da") return name.includes("da") || name.includes("dearness");
        if (fieldKey === "hra") return name.includes("hra") || name.includes("house rent");
        if (fieldKey === "conveyance") return name.includes("conveyance");
        return false;
      });
      if (match) {
        return match.status === "Active" || match.status === "ACTIVE";
      }
    } else if (["tds", "esi", "pf", "leaveDeduction"].includes(fieldKey)) {
      if (deductionsList.length === 0) return true;
      const match = deductionsList.find(item => {
        const name = (item.name || "").toLowerCase();
        if (fieldKey === "tds") return name.includes("tds");
        if (fieldKey === "esi") return name.includes("esi");
        if (fieldKey === "pf") return name.includes("pf");
        if (fieldKey === "leaveDeduction") return name.includes("leave") || name.includes("lop");
        return false;
      });
      if (match) {
        return match.status === "Active" || match.status === "ACTIVE";
      }
    }
    return true;
  };
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
  const [bulkMonth, setBulkMonth] = useState("January 2026");

  // Target states
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    employeeId: "",
    netSalary: "0.00",
    basic: "",
    da: "0",
    hra: "0",
    conveyance: "0",
    tds: "0",
    esi: "0",
    pf: "0",
    leaveDeduction: "0",
    status: "Active"
  });

  const [editForm, setEditForm] = useState({
    employeeId: "",
    netSalary: "0.00",
    basic: "",
    da: "0",
    hra: "0",
    conveyance: "0",
    tds: "0",
    esi: "0",
    pf: "0",
    leaveDeduction: "0",
    status: "Active"
  });

  // Floating Kebab Actions state
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [salList, empList, addList, dedList] = await Promise.all([
        getEmployeeSalaries(),
        getEmployees(),
        getAdditions(),
        getDeductions()
      ]);
      setSalaries(salList);
      setEmployees(empList);
      setAdditionsList(addList);
      setDeductionsList(dedList);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateNetSalary = (formState) => {
    const basic = parseFloat(formState.basic) || 0;
    const da = parseFloat(formState.da) || 0;
    const hra = parseFloat(formState.hra) || 0;
    const conveyance = parseFloat(formState.conveyance) || 0;
    const tds = parseFloat(formState.tds) || 0;
    const esi = parseFloat(formState.esi) || 0;
    const pf = parseFloat(formState.pf) || 0;
    const leaveDeduction = parseFloat(formState.leaveDeduction) || 0;

    const earnings = basic + da + hra + conveyance;
    const deductions = tds + esi + pf + leaveDeduction;
    const net = earnings - deductions;
    return Math.max(0, net).toFixed(2);
  };

  // Auto-calculate Net Salary for addForm
  useEffect(() => {
    const net = calculateNetSalary(addForm);
    if (String(addForm.netSalary) !== String(net)) {
      setAddForm(prev => ({ ...prev, netSalary: net }));
    }
  }, [addForm.basic, addForm.da, addForm.hra, addForm.conveyance, addForm.tds, addForm.esi, addForm.pf, addForm.leaveDeduction]);

  // Auto-calculate Net Salary for editForm
  useEffect(() => {
    const net = calculateNetSalary(editForm);
    if (String(editForm.netSalary) !== String(net)) {
      setEditForm(prev => ({ ...prev, netSalary: net }));
    }
  }, [editForm.basic, editForm.da, editForm.hra, editForm.conveyance, editForm.tds, editForm.esi, editForm.pf, editForm.leaveDeduction]);

  const handleNumberChange = (formType, field, val) => {
    // Strip out negative symbols or invalid chars to enforce positive numbers
    const cleanVal = val.replace(/[^0-9.]/g, "");
    if (formType === "add") {
      setAddForm(prev => ({ ...prev, [field]: cleanVal }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: cleanVal }));
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return salaries;
    return salaries.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.employeeCode && r.employeeCode.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.designation && r.designation.toLowerCase().includes(q))
    );
  }, [salaries, search]);

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

  // Selection toggle handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
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

  // Export functions
  const exportCsv = () => {
    const targetRows = selectedIds.size > 0
      ? salaries.filter((r) => selectedIds.has(r.id))
      : filteredRows;
    const headers = ["Emp ID", "Name", "Email", "Phone", "Designation", "Joining Date", "Salary"];
    const body = targetRows.map((r) => [r.employeeCode, r.name, r.email, r.phone, r.designation, r.joinDate, r.netSalary]);
    const csvContent = [headers, ...body]
      .map((line) => line.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employee_salaries_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    exportCsv(); // Excel compatible CSV
  };

  const exportPdf = () => {
    const targetRows = selectedIds.size > 0
      ? salaries.filter((r) => selectedIds.has(r.id))
      : filteredRows;
    const doc = new jsPDF();
    doc.text("Employee Salaries List", 14, 15);
    const headers = [["Emp ID", "Name", "Email", "Phone", "Designation", "Joining Date", "Salary"]];
    const body = targetRows.map((r) => [r.employeeCode, r.name, r.email, r.phone, r.designation, r.joinDate, `₹${r.netSalary}`]);
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20,
    });
    doc.save(`employee_salaries_${Date.now()}.pdf`);
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
        netSalary: parseFloat(addForm.netSalary) || 0,
        basic: parseFloat(addForm.basic) || 0,
        da: parseFloat(addForm.da) || 0,
        hra: parseFloat(addForm.hra) || 0,
        conveyance: parseFloat(addForm.conveyance) || 0,
        tds: parseFloat(addForm.tds) || 0,
        esi: parseFloat(addForm.esi) || 0,
        pf: parseFloat(addForm.pf) || 0,
        leaveDeduction: parseFloat(addForm.leaveDeduction) || 0
      };
      await createEmployeeSalary(payload);
      showSuccess("Salary record added successfully");
      setShowAddModal(false);
      setAddForm({
        employeeId: "",
        netSalary: "0.00",
        basic: "",
        da: "0",
        hra: "0",
        conveyance: "0",
        tds: "0",
        esi: "0",
        pf: "0",
        leaveDeduction: "0",
        status: "Active"
      });
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to create salary record"));
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
        netSalary: parseFloat(editForm.netSalary) || 0,
        basic: parseFloat(editForm.basic) || 0,
        da: parseFloat(editForm.da) || 0,
        hra: parseFloat(editForm.hra) || 0,
        conveyance: parseFloat(editForm.conveyance) || 0,
        tds: parseFloat(editForm.tds) || 0,
        esi: parseFloat(editForm.esi) || 0,
        pf: parseFloat(editForm.pf) || 0,
        leaveDeduction: parseFloat(editForm.leaveDeduction) || 0
      };
      await updateEmployeeSalary(editTarget.id, payload);
      showSuccess("Salary record updated successfully");
      setShowEditModal(false);
      setEditTarget(null);
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update salary record"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteEmployeeSalary(deleteTarget.id);
        showSuccess("Salary record deleted successfully");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        setShowDeleteModal(false);
        setDeleteTarget(null);
        loadData();
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to delete salary record"));
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteEmployeeSalary(id)));
      showSuccess("Selected salary records deleted successfully");
      setSelectedIds(new Set());
      loadData();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete some salary records"));
    }
  };

  const handleBulkGeneratePayslips = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedSalaries = salaries.filter((s) => selectedIds.has(s.id));
      await Promise.all(
        selectedSalaries.map((s) =>
          createPayslip({
            employeeId: s.employeeId,
            employeeSalaryId: s.id,
            month: bulkMonth,
          })
        )
      );
      showSuccess(`Payslips successfully generated for ${selectedSalaries.length} employee(s)`);
      setSelectedIds(new Set());
      setShowBulkGenerateModal(false);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to generate payslips for some employees"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="content">
        {/* Custom White Header Card */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Employee Salary</h2>
              <nav className="mb-0">
                <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                  <li className="breadcrumb-item">
                    <Link to="/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item" style={{ color: "#64748b" }}>HR</li>
                  <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Employee Salary</li>
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
                Add Salary
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
                placeholder="Search salary..."
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
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Designation</th>
                      <th>Joining Date</th>
                      <th>Salary</th>
                      <th>Payslip</th>
                      <th style={{ width: "80px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-4">No data found</td>
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
                          <td>{row.employeeCode}</td>
                          <td>
                            <div className="fw-semibold text-dark">{row.name}</div>
                          </td>
                          <td>{row.email}</td>
                          <td>{row.phone}</td>
                          <td>
                            <span className="badge bg-light text-dark">{row.designation}</span>
                          </td>
                          <td>{row.joinDate}</td>
                          <td>₹{row.netSalary}</td>
                          <td>
                            <Link to="/payslip" className="badge badge-dark badge-md text-decoration-none">
                              Generate Slip
                            </Link>
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
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Employee Salary</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowAddModal(false)}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleAddSubmit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
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
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Net Salary</label>
                          <input
                            type="number"
                            className="form-control"
                            value={addForm.netSalary}
                            readOnly
                            disabled
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row mt-2">
                      {isFieldActive("basic") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Basic</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={addForm.basic}
                            onChange={(e) => handleNumberChange("add", "basic", e.target.value)}
                            required
                          />
                        </div>
                      )}
                      {isFieldActive("da") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">DA</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={addForm.da}
                            onChange={(e) => handleNumberChange("add", "da", e.target.value)}
                          />
                        </div>
                      )}
                      {isFieldActive("hra") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">HRA</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={addForm.hra}
                            onChange={(e) => handleNumberChange("add", "hra", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="row">
                      {isFieldActive("conveyance") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Conveyance</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={addForm.conveyance}
                            onChange={(e) => handleNumberChange("add", "conveyance", e.target.value)}
                          />
                        </div>
                      )}
                      {isFieldActive("tds") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">TDS</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={addForm.tds}
                            onChange={(e) => handleNumberChange("add", "tds", e.target.value)}
                          />
                        </div>
                      )}
                      {isFieldActive("esi") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">ESI</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={addForm.esi}
                            onChange={(e) => handleNumberChange("add", "esi", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="row">
                      {isFieldActive("pf") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">PF</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={addForm.pf}
                            onChange={(e) => handleNumberChange("add", "pf", e.target.value)}
                          />
                        </div>
                      )}
                      {isFieldActive("leaveDeduction") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Leave Deduction</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={addForm.leaveDeduction}
                            onChange={(e) => handleNumberChange("add", "leaveDeduction", e.target.value)}
                          />
                        </div>
                      )}
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={addForm.status}
                          onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }} disabled={saving}>
                      {saving ? "Adding..." : "Add Employee Salary"}
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
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Employee Salary</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => { setShowEditModal(false); setEditTarget(null); }}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Employee Name</label>
                          <select className="form-select" disabled value={editForm.employeeId}>
                            <option value={editForm.employeeId}>{editTarget.name}</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Net Salary</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editForm.netSalary}
                            readOnly
                            disabled
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row mt-2">
                      {isFieldActive("basic") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Basic</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={editForm.basic}
                            onChange={(e) => handleNumberChange("edit", "basic", e.target.value)}
                            required
                          />
                        </div>
                      )}
                      {isFieldActive("da") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">DA</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={editForm.da}
                            onChange={(e) => handleNumberChange("edit", "da", e.target.value)}
                          />
                        </div>
                      )}
                      {isFieldActive("hra") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">HRA</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={editForm.hra}
                            onChange={(e) => handleNumberChange("edit", "hra", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="row">
                      {isFieldActive("conveyance") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Conveyance</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={editForm.conveyance}
                            onChange={(e) => handleNumberChange("edit", "conveyance", e.target.value)}
                          />
                        </div>
                      )}
                      {isFieldActive("tds") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">TDS</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={editForm.tds}
                            onChange={(e) => handleNumberChange("edit", "tds", e.target.value)}
                          />
                        </div>
                      )}
                      {isFieldActive("esi") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">ESI</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={editForm.esi}
                            onChange={(e) => handleNumberChange("edit", "esi", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="row">
                      {isFieldActive("pf") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">PF</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={editForm.pf}
                            onChange={(e) => handleNumberChange("edit", "pf", e.target.value)}
                          />
                        </div>
                      )}
                      {isFieldActive("leaveDeduction") && (
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Leave Deduction</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={editForm.leaveDeduction}
                            onChange={(e) => handleNumberChange("edit", "leaveDeduction", e.target.value)}
                          />
                        </div>
                      )}
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => { setShowEditModal(false); setEditTarget(null); }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }} disabled={saving}>
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
                  <p className="mb-3">Are you sure you want to delete the salary for <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
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
                netSalary: activeActionsRow.netSalary || "0.00",
                basic: activeActionsRow.basic || "",
                da: activeActionsRow.da || "0",
                hra: activeActionsRow.hra || "0",
                conveyance: activeActionsRow.conveyance || "0",
                tds: activeActionsRow.tds || "0",
                esi: activeActionsRow.esi || "0",
                pf: activeActionsRow.pf || "0",
                leaveDeduction: activeActionsRow.leaveDeduction || "0",
                status: activeActionsRow.status || "Active"
              });
              setShowEditModal(true);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Salary
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
            <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Salary
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
            minWidth: 460,
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
              className="btn btn-sm btn-primary d-flex align-items-center gap-1 me-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "#3b82f6", color: "#ffffff", border: "none" }}
              onClick={() => setShowBulkGenerateModal(true)}
            >
              <i className="ti ti-file-invoice" /> Generate Slip
            </button>
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

      {/* Bulk Generate Payslips Modal */}
      {showBulkGenerateModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content text-dark">
                <div className="modal-header">
                  <h4 className="modal-title">Bulk Generate Payslips</h4>
                  <button type="button" className="btn-close custom-btn-close" onClick={() => setShowBulkGenerateModal(false)}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleBulkGeneratePayslips}>
                  <div className="modal-body">
                    <p className="mb-3">Select the month for generating payslips for the <strong>{selectedIds.size}</strong> selected employee(s):</p>
                    <div className="mb-3">
                      <label className="form-label text-dark">Month</label>
                      <select
                        className="form-select"
                        value={bulkMonth}
                        onChange={(e) => setBulkMonth(e.target.value)}
                        required
                      >
                        {[
                          "January 2026", "February 2026", "March 2026", "April 2026",
                          "May 2026", "June 2026", "July 2026", "August 2026",
                          "September 2026", "October 2026", "November 2026", "December 2026"
                        ].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-white border me-2" onClick={() => setShowBulkGenerateModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }} disabled={saving}>
                      {saving ? "Generating..." : "Generate Payslips"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1030 }} />
        </>
      )}
    </>
  );
};

export default EmployeeSalaryPage;
