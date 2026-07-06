import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import RequirementFormModal from "./RequirementFormModal";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { getServiceTypes } from "../../api/serviceTypesApi";
import { getLeads } from "../../api/leadsApi";
import { getRequirementsByLeadId, deleteRequirement } from "../../api/requirementApi";
import LeadExportDropdown from "../../components/admin/LeadExportDropdown";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./RequirementsPage.css";

export default function RequirementsPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [requirementMap, setRequirementMap] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewingSpecs, setViewingSpecs] = useState(null);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [requirementModalKey, setRequirementModalKey] = useState(0);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [modalLeadId, setModalLeadId] = useState(null);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await getLeads();
      const leadsList = Array.isArray(res) ? res : res?.leads || [];
      setLeads(leadsList);

      const reqPromises = leadsList.map(async (lead) => {
        try {
          const reqs = await getRequirementsByLeadId(lead.id);
          return { leadId: lead.id, reqs: Array.isArray(reqs) ? reqs : [] };
        } catch (e) {
          console.error(`Error loading requirements for lead ${lead.id}:`, e);
          return { leadId: lead.id, reqs: [] };
        }
      });
      const results = await Promise.all(reqPromises);
      const map = {};
      results.forEach((item) => {
        map[item.leadId] = item.reqs;
      });
      setRequirementMap(map);
    } catch (e) {
      showError(extractApiErrorMessage(e) || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const loadServiceMaster = async () => {
    try {
      const [cats, types] = await Promise.all([
        getServiceCategories(),
        getServiceTypes(),
      ]);
      setServiceCategories(cats || []);
      setServiceTypes(types || []);
    } catch (e) {
      console.error("Failed to load service master data:", e);
    }
  };

  useEffect(() => {
    loadLeads();
    loadServiceMaster();
  }, []);

  const refreshRequirements = async (leadId) => {
    try {
      const reqs = await getRequirementsByLeadId(leadId);
      setRequirementMap((prev) => ({
        ...prev,
        [leadId]: Array.isArray(reqs) ? reqs : [],
      }));
    } catch (e) {
      console.error(`Error refreshing requirements for lead ${leadId}:`, e);
    }
  };

  const openAddRequirementModal = (lead) => {
    navigate(`/requirements/add?leadId=${lead.id}`);
  };

  const openEditRequirementModal = (lead, req) => {
    navigate(`/requirements/${req.id}/edit?leadId=${lead.id}`);
  };

  const handleDeleteRequirement = async (lead, req) => {
    if (!req?.id) return;
    if (!window.confirm("Delete this requirement?")) return;
    try {
      await deleteRequirement(req.id);
      await refreshRequirements(lead.id);
      showSuccess("Requirement deleted");
    } catch (e) {
      showError(extractApiErrorMessage(e) || "Failed to delete requirement");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Live filter and sort
  const filteredLeads = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    let result = leads;
    if (term) {
      result = leads.filter(
        (lead) =>
          (lead.name || "").toLowerCase().includes(term) ||
          (lead.mobile || "").toLowerCase().includes(term) ||
          (lead.owner || "").toLowerCase().includes(term)
      );
    }

    return [...result].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      if (sortField === "name") {
        aVal = a.name || "";
        bVal = b.name || "";
      } else if (sortField === "mobile") {
        aVal = a.mobile || "";
        bVal = b.mobile || "";
      } else if (sortField === "owner") {
        aVal = a.owner || "";
        bVal = b.owner || "";
      } else if (sortField === "no_of_requirements") {
        const countA = requirementMap[a.id] ? requirementMap[a.id].length : 0;
        const countB = requirementMap[b.id] ? requirementMap[b.id].length : 0;
        return sortOrder === "asc" ? countA - countB : countB - countA;
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [leads, searchText, sortField, sortOrder, requirementMap]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchText]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const pagedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page, pageSize]);

  const downloadTextFile = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = ["Name", "Mobile", "Owner", "No of Requirements"];
    const body = filteredLeads.map((lead) => {
      const count = requirementMap[lead.id] ? requirementMap[lead.id].length : 0;
      return [
        lead.name || "",
        lead.mobile || "",
        lead.owner || "",
        String(count),
      ];
    });
    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    downloadTextFile(`requirements-summary-${Date.now()}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const exportExcel = () => {
    const headers = ["Name", "Mobile", "Owner", "No of Requirements"];
    const escapeXml = (unsafe) => {
      return String(unsafe ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const headerHtml = `      <tr>
        ${headers.map((h) => `<th>${escapeXml(h)}</th>`).join("\n        ")}
      </tr>`;

    const rowsHtml = filteredLeads
      .map((lead) => {
        const count = requirementMap[lead.id] ? requirementMap[lead.id].length : 0;
        return `      <tr>
        <td>${escapeXml(lead.name)}</td>
        <td>${escapeXml(lead.mobile)}</td>
        <td>${escapeXml(lead.owner)}</td>
        <td>${count}</td>
      </tr>`;
      })
      .join("\n");

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>Requirements Summary</x:Name>
        <x:WorksheetOptions>
          <x:DisplayGridlines/>
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
</head>
<body>
  <table>
    <thead>
${headerHtml}
    </thead>
    <tbody>
${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    downloadTextFile(`requirements-summary-${Date.now()}.xls`, template, "application/vnd.ms-excel;charset=utf-8;");
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const title = "Requirements Summary Export";
    const generatedAt = new Date().toLocaleString();
    doc.setFontSize(14);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${generatedAt}`, 40, 58);

    const headers = [["Name", "Mobile", "Owner", "No of Requirements"]];
    const data = filteredLeads.map((lead) => {
      const count = requirementMap[lead.id] ? requirementMap[lead.id].length : 0;
      return [
        lead.name || "",
        lead.mobile || "",
        lead.owner || "",
        String(count),
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: headers,
      body: data,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`requirements-summary-${Date.now()}.pdf`);
  };

  const requirementsForSelected = selectedLead ? requirementMap[selectedLead.id] || [] : [];

  if (!selectedLead) {
    // LEADS LIST VIEW
    return (
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Requirements</h4>
              <h6>Manage requirement statuses for leads</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <a data-bs-toggle="tooltip" title="Refresh" onClick={loadLeads} style={{ cursor: "pointer" }}>
                <i className="ti ti-refresh-dot"></i>
              </a>
            </li>
          </ul>
        </div>

        <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body">
            {/* Redesigned Controls Row */}
            <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              {/* Search Box */}
              <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
                <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
                <input
                  type="text"
                  className="form-control border-0 bg-transparent shadow-none"
                  placeholder="Search by name, mobile, or owner..."
                  style={{ height: 36, fontSize: "0.9rem" }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* Export Dropdown */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <LeadExportDropdown
                  exportExcel={exportExcel}
                  exportCsv={exportCsv}
                  exportPdf={exportPdf}
                />
              </div>
            </div>

            {loading ? (
              <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: "260px" }}>
                <LoadingSpinner size="page" />
              </div>
            ) : pagedLeads.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No requirements found</p>
              </div>
            ) : (
              <div
                className="table-responsive leads-table-wrap border-0 shadow-sm mb-4"
                style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x", borderRadius: 12, minHeight: "260px" }}
              >
                <table className="table table-hover align-middle leads-table mb-0">
                  <thead>
                    <tr>
                      <th className="col-index text-nowrap text-muted" style={{ fontWeight: "600", fontSize: "0.85rem", width: 50 }}>#</th>
                      <th
                        className="col-name text-muted"
                        style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                        onClick={() => handleSort("name")}
                      >
                        Name {sortField === "name" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                      </th>
                      <th
                        className="col-mobile text-muted"
                        style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                        onClick={() => handleSort("mobile")}
                      >
                        Mobile {sortField === "mobile" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                      </th>
                      <th
                        className="col-owner text-muted"
                        style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                        onClick={() => handleSort("owner")}
                      >
                        Owner {sortField === "owner" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                      </th>
                      <th
                        className="col-reqs text-muted"
                        style={{ fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}
                        onClick={() => handleSort("no_of_requirements")}
                      >
                        No of Requirements {sortField === "no_of_requirements" && <span className="ms-1 sort-indicator text-muted">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                      </th>
                      <th className="col-actions text-muted text-center" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedLeads.map((lead, index) => {
                      const reqs = requirementMap[lead.id];
                      const count = reqs ? reqs.length : 0;
                      return (
                        <tr key={lead.id}>
                          <td className="col-index text-muted" style={{ fontSize: "0.9rem" }}>{(page - 1) * pageSize + index + 1}</td>
                          <td className="col-name fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{lead.name || "-"}</td>
                          <td className="col-mobile" style={{ fontSize: "0.9rem" }}>{lead.mobile || "-"}</td>
                          <td className="col-owner" style={{ fontSize: "0.9rem", color: "#475569" }}>{lead.owner || "-"}</td>
                          <td className="col-reqs" style={{ fontSize: "0.9rem" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: 28,
                                height: 24,
                                padding: "0 8px",
                                borderRadius: 12,
                                backgroundColor: count > 0 ? "#3b82f6" : "#e2e8f0",
                                color: count > 0 ? "#fff" : "#64748b",
                                fontSize: "0.78rem",
                                fontWeight: "600",
                              }}
                            >
                              {count}
                            </span>
                          </td>
                          <td className="col-actions">
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary d-inline-flex align-items-center gap-2 px-3"
                                style={{ minHeight: 32, borderRadius: 8, fontWeight: 600, whiteSpace: "nowrap" }}
                                onClick={() => openAddRequirementModal(lead)}
                                data-bs-toggle="tooltip"
                                title="Add Requirement"
                              >
                                <i className="ti ti-plus" />
                                <span>Add Requirement</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border d-inline-flex align-items-center gap-2 px-3"
                                style={{ minHeight: 32, borderRadius: 8, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer" }}
                                onClick={() => setSelectedLead(lead)}
                                data-bs-toggle="tooltip"
                                title="View Requirements"
                              >
                                <i className="ti ti-eye" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {!loading && filteredLeads.length > 0 && (
              <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
                <span className="entries-info text-muted small">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredLeads.length)} of {filteredLeads.length} entries
                </span>

                <div className="pagination-numbers-container d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <i className="ti ti-chevron-left" />
                  </button>

                  {(() => {
                    const buttons = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, page - 2);
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    if (maxVisible - 1 > endPage - startPage) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }

                    if (startPage > 1) {
                      buttons.push(
                        <button
                          key={1}
                          className={`btn-pagination-num btn btn-sm border-0 ${page === 1 ? 'btn-primary text-white' : 'btn-light'}`}
                          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === 1 ? "#3b82f6" : undefined }}
                          onClick={() => setPage(1)}
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        buttons.push(<span key="dots-start" className="pagination-dots px-1 text-muted">...</span>);
                      }
                    }

                    for (let i = startPage; endPage >= i; i++) {
                      buttons.push(
                        <button
                          key={i}
                          className={`btn-pagination-num btn btn-sm border-0 ${page === i ? 'btn-primary text-white' : 'btn-light'}`}
                          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === i ? "#3b82f6" : undefined }}
                          onClick={() => setPage(i)}
                        >
                          {i}
                        </button>
                      );
                    }

                    if (totalPages > endPage) {
                      if (totalPages - 1 > endPage) {
                        buttons.push(<span key="dots-end" className="pagination-dots px-1 text-muted">...</span>);
                      }
                      buttons.push(
                        <button
                          key={totalPages}
                          className={`btn-pagination-num btn btn-sm border-0 ${page === totalPages ? 'btn-primary text-white' : 'btn-light'}`}
                          style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === totalPages ? "#3b82f6" : undefined }}
                          onClick={() => setPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return buttons;
                  })()}

                  <button
                    type="button"
                    className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>

                <PageSizeSelector
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  setPage={setPage}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  // REQUIREMENTS DETAIL VIEW
  return (
    <div className="content">
      {/* Header Block */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
              {selectedLead.name}&apos;s Requirements
            </h2>
            <p className="leads-header-subtitle text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              View and manage customer requirements.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            onClick={() => setSelectedLead(null)}
          >
            Back
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Requirements</h6>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => navigate("/quotation", { state: { prefillLead: selectedLead } })}
                disabled={!selectedLead}
              >
                <i className="ti ti-file-invoice me-1" />
                Create Quotation
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => openAddRequirementModal(selectedLead)}
              >
                <i className="ti ti-plus me-1" />
                Add Requirement
              </button>
            </div>
          </div>

          {requirementsForSelected.length === 0 && (
            <div className="alert alert-info py-2">
              No requirements added yet. Click &quot;Add Requirement&quot; to create one.
            </div>
          )}

          {requirementsForSelected.length > 0 && (
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Category</th>
                    <th>Product</th>
                    <th>Sub-type</th>
                    <th>Quantity</th>
                    <th>Specifications</th>
                    <th>Design Mode</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requirementsForSelected.map((req, index) => {
                    let parsedSpecs = null;
                    try {
                      parsedSpecs = req.specs ? JSON.parse(req.specs) : null;
                    } catch {
                      parsedSpecs = null;
                    }
                    return (
                      <tr key={req.id}>
                        <td>{index + 1}</td>
                        <td>{req.categoryName || "-"}</td>
                        <td>{req.typeName || "-"}</td>
                        <td>{req.subtypeName || "-"}</td>
                        <td>{req.quantity || "-"}</td>
                        <td style={{ minWidth: 260 }}>
                          {parsedSpecs && Object.keys(parsedSpecs).length > 0 ? (
                            <button
                              type="button"
                              className="spec-view-btn"
                              onClick={() => setViewingSpecs({ specs: parsedSpecs, req })}
                            >
                              <i className="ti ti-eye" /> View
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {req.designStatus ? (
                            <span className="badge bg-info">
                              {req.designStatus === "design_only"
                                ? "Design Only"
                                : req.designStatus === "production_only"
                                ? "Production Only"
                                : req.designStatus === "design_production"
                                ? "Design + Production"
                                : req.designStatus}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEditRequirementModal(selectedLead, req)}
                              title="Edit"
                              style={{ width: "32px", height: "32px", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <i className="ti ti-pencil" style={{ fontSize: "0.95rem" }} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteRequirement(selectedLead, req)}
                              title="Delete"
                              style={{ width: "32px", height: "32px", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <i className="ti ti-trash" style={{ fontSize: "0.95rem" }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Specs Viewer Modal */}
      {viewingSpecs && (
        <div
          className="modal fade show"
          id="specsModal"
          tabIndex="-1"
          aria-labelledby="specsModalLabel"
          aria-hidden="true"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Specifications</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingSpecs(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {viewingSpecs.specs && (
                  <div>
                    {Object.entries(viewingSpecs.specs).map(([key, value]) => (
                      <div key={key} className="mb-3">
                        <label className="form-label text-capitalize">
                          {key.replace(/_/g, " ")}
                        </label>
                        <p className="text-muted">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
