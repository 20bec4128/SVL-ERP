import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplates,
  saveEmailTemplate,
} from "../../api/emailTemplateApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./LeadsPage.css";

const EMPTY_FORM = {
  templateName: "",
  templateKey: "",
  subject: "",
  body: "",
  active: true,
};

export default function EmailTemplatePage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [editorMode, setEditorMode] = useState(null); // add | view | edit | null
  const [selectedRow, setSelectedRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Search, pagination, selection & kebab state
  const [search, setSearch] = useState("");
  const [selectedTemplateKeys, setSelectedTemplateKeys] = useState(new Set());
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getEmailTemplates();
      setRows(Array.isArray(data?.templates) ? data.templates : []);
    } catch (error) {
      showError(extractApiErrorMessage(error, "Failed to load email templates"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        String(a?.templateName || "").localeCompare(String(b?.templateName || ""))
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    let result = sortedRows;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          (r.templateName || "").toLowerCase().includes(q) ||
          (r.templateKey || "").toLowerCase().includes(q) ||
          (r.subject || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sortedRows, search]);

  // Pagination calculations
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
  }, [clampedPage]);

  // Selection toggle handlers
  const toggleSelectAll = () => {
    // Only select templates that are NOT builtIn (because builtIn templates cannot be deleted)
    const pageKeys = pagedRows.filter((r) => !r.builtIn).map((r) => r.templateKey);
    if (pageKeys.length === 0) return;
    const allSelectedOnPage = pageKeys.every((key) => selectedTemplateKeys.has(key));
    setSelectedTemplateKeys((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageKeys.forEach((key) => next.delete(key));
        return next;
      }
      pageKeys.forEach((key) => next.add(key));
      return next;
    });
  };

  const toggleTemplateSelection = (key) => {
    setSelectedTemplateKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const startAdd = () => {
    setSelectedRow(null);
    setForm(EMPTY_FORM);
    setEditorMode("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startView = (row) => {
    setSelectedRow(row);
    setForm({
      templateName: row?.templateName || "",
      templateKey: row?.templateKey || "",
      subject: row?.subject || "",
      body: row?.body || "",
      active: row?.active !== false,
    });
    setEditorMode("view");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (row) => {
    setSelectedRow(row);
    setForm({
      templateName: row?.templateName || "",
      templateKey: row?.templateKey || "",
      subject: row?.subject || "",
      body: row?.body || "",
      active: row?.active !== false,
    });
    setEditorMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeEditor = () => {
    setEditorMode(null);
    setSelectedRow(null);
    setForm(EMPTY_FORM);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.templateName.trim()) {
      showError("Template name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        templateName: form.templateName.trim(),
        templateKey: form.templateKey.trim() || null,
        subject: form.subject,
        body: form.body,
        active: form.active,
      };

      if (editorMode === "add") {
        await createEmailTemplate(payload);
        showSuccess("Template created successfully");
      } else if (editorMode === "edit" && selectedRow?.templateKey) {
        await saveEmailTemplate(selectedRow.templateKey, payload);
        showSuccess("Template updated successfully");
      }

      await loadTemplates();
      closeEditor();
    } catch (error) {
      showError(extractApiErrorMessage(error, "Failed to save template"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (row, isChecked) => {
    try {
      const payload = {
        templateName: row.templateName,
        templateKey: row.templateKey,
        subject: row.subject,
        body: row.body,
        active: isChecked,
      };
      await saveEmailTemplate(row.templateKey, payload);
      showSuccess(`Template "${row.templateName}" ${isChecked ? "activated" : "deactivated"}`);
      await loadTemplates();
    } catch (error) {
      showError(extractApiErrorMessage(error, "Failed to update template status"));
    }
  };

  const handleDelete = async (row) => {
    if (!row?.templateKey) return;
    if (row?.builtIn) {
      showError("Default templates cannot be deleted");
      return;
    }
    const confirmed = window.confirm(`Delete template "${row.templateName}"?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteEmailTemplate(row.templateKey);
      showSuccess("Template deleted successfully");
      await loadTemplates();
      if (selectedRow?.templateKey === row.templateKey) {
        closeEditor();
      }
    } catch (error) {
      showError(extractApiErrorMessage(error, "Failed to delete template"));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTemplateKeys.size === 0) return;
    if (window.confirm(`Are you sure you want to delete the selected ${selectedTemplateKeys.size} custom templates?`)) {
      setSaving(true);
      try {
        await Promise.all(Array.from(selectedTemplateKeys).map((key) => deleteEmailTemplate(key)));
        showSuccess(`${selectedTemplateKeys.size} templates deleted successfully`);
        setSelectedTemplateKeys(new Set());
        await loadTemplates();
      } catch (e) {
        showError("Failed to delete some templates");
      } finally {
        setSaving(false);
      }
    }
  };

  const exportCsv = () => {
    const targetRows = selectedTemplateKeys.size > 0
      ? filteredRows.filter((r) => selectedTemplateKeys.has(r.templateKey))
      : filteredRows;

    const headers = ["Template Name", "Template Key", "Type", "Status", "Subject", "Updated At"];
    const body = targetRows.map((row) => [
      row.templateName || "",
      row.templateKey || "",
      row.builtIn ? "Default" : "Custom",
      row.active !== false ? "Active" : "Inactive",
      row.subject || "",
      row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-",
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
    link.download = `email-templates-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedTemplateKeys.size > 0
      ? filteredRows.filter((r) => selectedTemplateKeys.has(r.templateKey))
      : filteredRows;

    const headers = ["Template Name", "Template Key", "Type", "Status", "Subject", "Updated At"];
    const body = targetRows.map((row) => [
      row.templateName || "",
      row.templateKey || "",
      row.builtIn ? "Default" : "Custom",
      row.active !== false ? "Active" : "Inactive",
      row.subject || "",
      row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-",
    ]);

    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>EmailTemplates</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
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
    link.download = `email-templates-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedTemplateKeys.size > 0
      ? filteredRows.filter((r) => selectedTemplateKeys.has(r.templateKey))
      : filteredRows;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Email Templates Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [["Template Name", "Template Key", "Type", "Status", "Subject", "Updated At"]];
    const body = targetRows.map((row) => [
      row.templateName || "",
      row.templateKey || "",
      row.builtIn ? "Default" : "Custom",
      row.active !== false ? "Active" : "Inactive",
      row.subject || "",
      row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 8 },
    });

    doc.save(`email-templates-${Date.now()}.pdf`);
  };

  return (
    <div className="content">
      {/* Custom Header Card */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Email Templates</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Settings</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Email Templates</li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
              onClick={startAdd}
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            >
              <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
              Add Template
            </button>
          </div>
        </div>
      </div>

      {/* Editor card if template editor is active */}
      {editorMode && (
        <div className="card border-0 shadow-sm mb-4 animate-fadeIn" style={{ borderRadius: 12 }}>
          <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0" style={{ fontWeight: "600", color: "#0f172a" }}>
                {editorMode === "add"
                  ? "Create Template"
                  : editorMode === "edit"
                    ? `Edit Template: ${selectedRow?.templateName}`
                    : `View Template: ${selectedRow?.templateName}`}
              </h5>
              <div className="text-muted small">
                {editorMode === "view"
                  ? "Read-only details view"
                  : "Modify the template subject line and body copy."}
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 8 }} onClick={closeEditor}>
              Close
            </button>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Template Name</label>
                <input
                  type="text"
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.templateName}
                  onChange={(e) => updateField("templateName", e.target.value)}
                  disabled={editorMode === "view"}
                  placeholder="e.g. Welcome Email"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Template Key</label>
                <input
                  type="text"
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.templateKey}
                  onChange={(e) => updateField("templateKey", e.target.value)}
                  disabled={editorMode !== "add"}
                  placeholder="Auto-generated key if left blank"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Subject</label>
                <input
                  type="text"
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  disabled={editorMode === "view"}
                  placeholder="Subject line of the email"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Body Content</label>
                <textarea
                  className="form-control animate-focus"
                  rows={10}
                  value={form.body}
                  onChange={(e) => updateField("body", e.target.value)}
                  disabled={editorMode === "view"}
                  placeholder="Design your template HTML or plain text here..."
                  style={{ minHeight: 220, borderRadius: 8 }}
                />
              </div>
              <div className="col-12">
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input animate-focus"
                    type="checkbox"
                    id="templateActiveToggle"
                    checked={!!form.active}
                    onChange={(e) => updateField("active", e.target.checked)}
                    disabled={editorMode === "view"}
                    style={{ cursor: "pointer", width: "40px", height: "20px" }}
                  />
                  <label className="form-check-label fw-semibold text-dark ms-2" htmlFor="templateActiveToggle" style={{ fontSize: "0.95rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    Active Status: <span style={{ color: "#ffffff", backgroundColor: form.active ? "#16a34a" : "#dc2626", padding: "3px 8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", display: "inline-block" }}>{form.active ? "Active" : "Inactive"}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="text-muted small mt-3">
              Supported template placeholders: <code>{`{{employee_name}}`}</code>, <code>{`{{designation}}`}</code>, and <code>{`{{company_name}}`}</code>.
            </div>

            {editorMode !== "view" && (
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-light" style={{ borderRadius: 8, padding: "10px 20px" }} onClick={closeEditor} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", borderRadius: 8, padding: "10px 20px", fontWeight: "600" }} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        {/* Controls bar inside the card, above the table */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
          <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
            <input
              className="form-control search-leads-input"
              style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
              value={search}
              placeholder="Search template..."
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
          <div
            className="custom-datatable-filter table-responsive"
            style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
          >
            <table className="table table-hover align-middle mb-0">
              <thead className="thead-light">
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={
                        pagedRows.length > 0 &&
                        pagedRows.filter((r) => !r.builtIn).length > 0 &&
                        pagedRows.filter((r) => !r.builtIn).every((r) => selectedTemplateKeys.has(r.templateKey))
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ width: "50px" }}>#</th>
                  <th>Template Name / Subject</th>
                  <th>Template Key</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th style={{ width: "80px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">Loading templates...</td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">No templates found</td>
                  </tr>
                ) : (
                  pagedRows.map((row, idx) => (
                    <tr key={row.templateKey}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          disabled={!!row.builtIn}
                          checked={selectedTemplateKeys.has(row.templateKey)}
                          onChange={() => toggleTemplateSelection(row.templateKey)}
                        />
                      </td>
                      <td>{pageOffset + idx + 1}</td>
                      <td>
                        <div className="fw-semibold text-dark">{row.templateName}</div>
                        <div className="text-muted small">{row.subject || "No subject"}</div>
                      </td>
                      <td>
                        <code>{row.templateKey}</code>
                      </td>
                      <td>
                        <span className={`badge ${row.builtIn ? "bg-secondary" : "bg-info"}`} style={{ color: "#fff", padding: "4px 8px" }}>
                          {row.builtIn ? "Default" : "Custom"}
                        </span>
                      </td>
                      <td>
                        <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`status-toggle-${row.templateKey}`}
                            checked={row.active !== false}
                            onChange={(e) => handleToggleActive(row, e.target.checked)}
                            style={{ cursor: "pointer", width: "36px", height: "18px" }}
                          />
                          <label 
                            className="form-check-label mb-0 small fw-semibold" 
                            htmlFor={`status-toggle-${row.templateKey}`}
                            style={{ 
                              cursor: "pointer", 
                              color: row.active !== false ? "#16a34a" : "#dc2626",
                              fontSize: "0.85rem" 
                            }}
                          >
                            {row.active !== false ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td className="text-muted small">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"}
                      </td>
                      <td>
                        <button
                          className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeActionsRow?.templateKey === row.templateKey) {
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
              startView(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-eye" style={{ fontSize: "1rem", color: "#64748b" }} /> View Template
          </button>
          <button
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem" }}
            onClick={() => {
              startEdit(activeActionsRow);
              setActiveActionsRow(null);
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: "1rem", color: "#64748b" }} /> Edit Template
          </button>
          {!activeActionsRow.builtIn && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2 text-danger"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                handleDelete(activeActionsRow);
                setActiveActionsRow(null);
              }}
            >
              <i className="ti ti-trash" style={{ fontSize: "1rem", color: "#ef4444" }} /> Delete Template
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedTemplateKeys.size > 0 && (
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
              {selectedTemplateKeys.size}
            </span>
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>templates selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "#dc2626", color: "#ffffff", border: "none" }}
              onClick={handleBulkDelete}
              disabled={saving}
            >
              <i className="ti ti-trash" />
              Delete Selected
            </button>
            <button
              className="btn btn-sm btn-secondary"
              style={{ borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "transparent", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#ffffff" }}
              onClick={() => setSelectedTemplateKeys(new Set())}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
