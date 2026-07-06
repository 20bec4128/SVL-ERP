import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getVendorOrders, updateVendorOrderApi } from "../../api/vendorOrdersApi";
import CreateVendorOrderModal from "./CreateVendorOrderModal";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import "./VendorOrdersPage.css";
import "./LeadsPage.css";

const STATUS_CLASS = {
  New: "status-new",
  Draft: "status-draft",
  Sent: "status-sent",
  Accepted: "status-accepted",
  Rejected: "status-rejected",
  "Work Started": "status-work-started",
  Acknowledged: "status-acknowledged",
  "In Production": "status-in-production",
  Delivered: "status-delivered",
  Cancelled: "status-cancelled",
};

const PAYMENT_CLASS = {
  Pending: "pay-pending",
  "Sent To Accounts": "pay-sent-to-accounts",
  "Advance Paid": "pay-advance-paid",
  Verified: "pay-verified",
  "Final Payment Pending": "pay-final-pending",
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [advancePaidModalOpen, setAdvancePaidModalOpen] = useState(false);
  const [advancePaidOrderId, setAdvancePaidOrderId] = useState(null);
  const [advancePaidAmount, setAdvancePaidAmount] = useState("");
  const [advancePaidProofFile, setAdvancePaidProofFile] = useState(null);
  const [advancePaidNotes, setAdvancePaidNotes] = useState("");
  const [advancePaidError, setAdvancePaidError] = useState("");
  const [advancePaidSaving, setAdvancePaidSaving] = useState(false);

  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());

  // Kebab row actions state
  const [activeActionsRow, setActiveActionsRow] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState({ top: 0, left: 0 });

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter drawer state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
  });

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
    const data = await getVendorOrders().catch(() => []);
    setOrders(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((o) =>
        [o.projectName, o.vendorName, o.materialName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q)),
      );
    }

    if (filters.status) {
      result = result.filter((o) => (o.status || "Draft") === filters.status);
    }

    if (filters.paymentStatus) {
      result = result.filter((o) => {
        const status = o.status || "Draft";
        const paymentStatus =
          status === "Delivered" && (o.paymentStatus || "Pending") === "Pending"
            ? "Final Payment Pending"
            : o.paymentStatus || "Pending";
        return paymentStatus === filters.paymentStatus;
      });
    }

    return result;
  }, [orders, search, filters]);

  // Pagination calculations
  const totalRows = filteredOrders.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredOrders.slice(pageOffset, pageOffset + pageSize),
    [filteredOrders, pageOffset, pageSize],
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage]);

  // Selection handlers
  const toggleSelectAll = () => {
    const pageIds = pagedRows.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedOrderIds.has(id));
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleOrderSelection = (id) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

  // Export handlers
  const exportCsv = () => {
    const targetRows = selectedOrderIds.size > 0
      ? filteredOrders.filter((o) => selectedOrderIds.has(o.id))
      : filteredOrders;

    const headers = [
      "Project Name",
      "Vendor",
      "Material Name",
      "Required Date",
      "Deadline",
      "Status",
      "Payment Status",
    ];
    const body = targetRows.map((row) => [
      row.projectName || "",
      row.vendorName || "",
      row.materialName || "",
      formatDate(row.requiredDate),
      formatDate(row.vendorDeadline),
      row.status || "Draft",
      row.paymentStatus || "Pending",
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
    link.download = `vendor-orders-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const targetRows = selectedOrderIds.size > 0
      ? filteredOrders.filter((o) => selectedOrderIds.has(o.id))
      : filteredOrders;

    const headers = [
      "Project Name",
      "Vendor",
      "Material Name",
      "Required Date",
      "Deadline",
      "Status",
      "Payment Status",
    ];
    const body = targetRows.map((row) => [
      row.projectName || "",
      row.vendorName || "",
      row.materialName || "",
      formatDate(row.requiredDate),
      formatDate(row.vendorDeadline),
      row.status || "Draft",
      row.paymentStatus || "Pending",
    ]);
    
    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    template += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Vendor Orders</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
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
    link.download = `vendor-orders-${Date.now()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const targetRows = selectedOrderIds.size > 0
      ? filteredOrders.filter((o) => selectedOrderIds.has(o.id))
      : filteredOrders;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Vendor Orders Export", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    const headers = [[
      "Project Name",
      "Vendor",
      "Material Name",
      "Required Date",
      "Deadline",
      "Status",
      "Payment Status",
    ]];

    const body = targetRows.map((row) => [
      row.projectName || "",
      row.vendorName || "",
      row.materialName || "",
      formatDate(row.requiredDate),
      formatDate(row.vendorDeadline),
      row.status || "Draft",
      row.paymentStatus || "Pending",
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 70,
      styles: { fontSize: 8 },
    });

    doc.save(`vendor-orders-${Date.now()}.pdf`);
  };

  const openAdvancePaidModal = (orderId) => {
    const currentOrder = orders.find((order) => String(order.id) === String(orderId));
    if (!currentOrder) return;
    setAdvancePaidOrderId(orderId);
    setAdvancePaidAmount(currentOrder.advanceAmount || "");
    setAdvancePaidProofFile(null);
    setAdvancePaidNotes("");
    setAdvancePaidError("");
    setAdvancePaidModalOpen(true);
  };

  const submitAdvancePaid = async () => {
    const orderId = advancePaidOrderId;
    const currentOrder = orders.find((order) => String(order.id) === String(orderId));
    if (!currentOrder) return;

    const amount = String(advancePaidAmount || "").trim();
    if (!amount) {
      setAdvancePaidError("Amount is required.");
      return;
    }
    if (!(advancePaidProofFile instanceof File)) {
      setAdvancePaidError("Proof file is required.");
      return;
    }

    setAdvancePaidError("");
    setAdvancePaidSaving(true);
    const updated = await updateVendorOrderApi(orderId, {
      ...currentOrder,
      advanceAmount: amount,
      advancePaidAt: new Date().toISOString(),
      paymentStatus: "Advance Paid",
      advancePaidNotes: advancePaidNotes || "",
      advancePaidProofFile,
    }).catch(() => null);
    setAdvancePaidSaving(false);
    if (!updated) {
      setAdvancePaidError("Failed to mark advance as paid.");
      return;
    }
    setOrders((prev) =>
      prev.map((order) => (String(order.id) === String(orderId) ? updated : order)),
    );
    setAdvancePaidModalOpen(false);
  };

  return (
    <div className="content">
      {/* Styled Card Header containing Title, Breadcrumbs and Add Button like Leads page */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Vendor Orders</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/stocks/vendors" style={{ color: "#64748b", textDecoration: "none" }}>Vendor Management</Link>
                </li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Orders</li>
              </ol>
            </nav>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            >
              <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
              New Order Request
            </button>
          </div>
        </div>
      </div>

      <div className="vo-card">
        <div className="vo-card-header d-flex align-items-center justify-content-between p-3 border-bottom bg-white">
          <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
            <input
              className="form-control search-leads-input"
              style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
              value={search}
              placeholder="Search orders..."
              onChange={(e) => setSearch(e.target.value)}
            />
            <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className={`btn btn-outline-filter d-flex align-items-center gap-2 ${filterOpen ? "active" : ""}`}
              style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <i className="ti ti-filter" style={{ fontSize: "1rem" }} />
              Filters
            </button>

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

        {/* Filter Drawer */}
        {filterOpen && (
          <div className="p-3 border-bottom" style={{ backgroundColor: "#f8fafc" }}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Order Status</label>
                <select
                  className="form-select custom-filter-select"
                  style={{ height: 42, borderRadius: 8 }}
                  value={filters.status}
                  onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="">All Statuses</option>
                  {Object.keys(STATUS_CLASS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: "0.88rem" }}>Payment Status</label>
                <select
                  className="form-select custom-filter-select"
                  style={{ height: 42, borderRadius: 8 }}
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters((p) => ({ ...p, paymentStatus: e.target.value }))}
                >
                  <option value="">All Payment Statuses</option>
                  {Object.keys(PAYMENT_CLASS).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                className="btn btn-filter-reset"
                style={{ height: 40, padding: "0 20px", borderRadius: 8, fontWeight: "500" }}
                onClick={() => setFilters({ status: "", paymentStatus: "" })}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="vo-table-wrap table-responsive">
          <table className="vo-table table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={pagedRows.length > 0 && pagedRows.every((r) => selectedOrderIds.has(r.id))}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ width: 48 }}>#</th>
                <th>Project Name</th>
                <th>Vendor</th>
                <th>Material</th>
                <th>Design</th>
                <th>Required Date</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Payment</th>
                <th style={{ width: "80px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr className="vo-empty-row">
                  <td colSpan={11} className="text-center py-4">
                    {search || filters.status || filters.paymentStatus ? "No orders match your filters." : "No orders found."}
                  </td>
                </tr>
              ) : (
                pagedRows.map((order, idx) => {
                  const status = order.status || "Draft";
                  const paymentStatus =
                    status === "Delivered" && (order.paymentStatus || "Pending") === "Pending"
                      ? "Final Payment Pending"
                      : order.paymentStatus || "Pending";

                  return (
                    <tr key={order.id || idx}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedOrderIds.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                        />
                      </td>
                      <td className="vo-row-index">{pageOffset + idx + 1}</td>
                      <td><span className="vo-project-name">{order.projectName || "-"}</span></td>
                      <td className="vo-vendor-name">{order.vendorName || "-"}</td>
                      <td>{order.materialName || "-"}</td>
                      <td>
                        {order.uploadDesignUrl ? (
                          <a href={order.uploadDesignUrl} target="_blank" rel="noreferrer">View</a>
                        ) : (
                          <span className="vo-muted">-</span>
                        )}
                      </td>
                      <td>{formatDate(order.requiredDate)}</td>
                      <td>{formatDate(order.vendorDeadline)}</td>
                      <td>
                        <span className={`vo-badge ${STATUS_CLASS[status] || "status-draft"}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <span className={`vo-badge ${PAYMENT_CLASS[paymentStatus] || "pay-pending"}`}>
                          {paymentStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-kebab-actions d-flex align-items-center justify-content-center"
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeActionsRow?.id === order.id) {
                              setActiveActionsRow(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActionsMenuPos({
                                top: rect.top + window.scrollY,
                                left: rect.right + window.scrollX,
                              });
                              setActiveActionsRow(order);
                            }
                          }}
                        >
                          <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="leads-pagination-footer d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top bg-white">
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

      <CreateVendorOrderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={load}
      />

      {advancePaidModalOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Mark Advance Paid</h4>
                  <button
                    type="button"
                    className="btn-close custom-btn-close"
                    onClick={() => setAdvancePaidModalOpen(false)}
                    disabled={advancePaidSaving}
                  />
                </div>
                <div className="modal-body">
                  {advancePaidError ? (
                    <div className="alert alert-danger py-2">{advancePaidError}</div>
                  ) : null}

                  <div className="mb-3">
                    <label className="form-label">Amount<span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={advancePaidAmount}
                      onChange={(e) => setAdvancePaidAmount(e.target.value)}
                      placeholder="Enter advance amount"
                      disabled={advancePaidSaving}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Proof<span className="text-danger">*</span></label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setAdvancePaidProofFile(e.target.files?.[0] || null)}
                      disabled={advancePaidSaving}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Notes (optional)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={advancePaidNotes}
                      onChange={(e) => setAdvancePaidNotes(e.target.value)}
                      placeholder="Add notes..."
                      disabled={advancePaidSaving}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAdvancePaidModalOpen(false)}
                    disabled={advancePaidSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={submitAdvancePaid}
                    disabled={advancePaidSaving}
                  >
                    {advancePaidSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      ) : null}

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
          <Link
            to={`/stocks/vendor-orders/${activeActionsRow.id}`}
            className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem", textDecoration: "none" }}
            onClick={() => setActiveActionsRow(null)}
          >
            <i className="ti ti-eye" style={{ fontSize: "1rem", color: "#64748b" }} /> View details
          </Link>

          {activeActionsRow.status === "Accepted" && (activeActionsRow.paymentStatus || "Pending") === "Pending" && (
            <button
              className="dropdown-item py-2 px-3 text-start d-flex align-items-center gap-2"
              style={{ fontSize: "0.85rem" }}
              onClick={() => {
                openAdvancePaidModal(activeActionsRow.id);
                setActiveActionsRow(null);
              }}
            >
              <i className="ti ti-check" style={{ fontSize: "1rem", color: "#22c55e" }} /> Mark Advance Paid
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
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
              {selectedOrderIds.size}
            </span>
            <span className="fw-medium text-white" style={{ color: "#ffffff" }}>orders selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
              style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)" }}
              onClick={() => setSelectedOrderIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
