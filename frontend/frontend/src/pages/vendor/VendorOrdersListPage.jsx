import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVendorOrders, updateVendorOrderApi } from "../../api/vendorOrdersApi";
import { getVendorSession } from "../../utils/vendorSession";
import "./VendorOrdersDashboardPage.css";

const STATUS_CLASS = {
  New: "status-new",
  Draft: "status-draft",
  Sent: "status-sent",
  Accepted: "status-accepted",
  Rejected: "status-rejected",
  "Work Started": "status-work-started",
  "Work Finished": "status-delivered",
  "In Production": "status-in-production",
  Delivered: "status-delivered",
  Cancelled: "status-cancelled",
};

export default function VendorOrdersListPage({ view, title }) {
  const [orders, setOrders] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [modalOrderId, setModalOrderId] = useState(null);
  const [modalAction, setModalAction] = useState(null); // "accept" or "reject"
  const session = getVendorSession();
  const navigate = useNavigate();

  const vendorId = useMemo(() => session?.vendorId ?? null, [session]);
  const vendorOrders = useMemo(() => orders, [orders]);

  useEffect(() => {
    const loadOrders = async () => {
      const data = await getVendorOrders(vendorId).catch(() => []);
      setOrders(Array.isArray(data) ? data : []);
    };
    if (vendorId) {
      loadOrders();
    }
  }, [vendorId]);

  useEffect(() => {
    vendorOrders.forEach((order) => {
      setDrafts((prev) => ({
        ...prev,
        [order.id]: {
          deadline: prev[order.id]?.deadline ?? order.vendorDeadline ?? "",
          quotationFileName:
            prev[order.id]?.quotationFileName ?? order.quotationFileName ?? "",
          quotationFile: prev[order.id]?.quotationFile ?? null,
          status:
            prev[order.id]?.status ??
            (order.status === "Rejected" ? "Rejected" : "Accepted"),
          rejectionNotes: prev[order.id]?.rejectionNotes ?? "",
        },
      }));
    });
  }, [vendorOrders]);

  const categorized = useMemo(() => {
    const next = {
      newOrders: [],
      pending: [],
      delivered: [],
      paymentPending: [],
    };
    vendorOrders.forEach((order) => {
      const status = String(order.status || "New");
      const paymentStatus = String(order.paymentStatus || "Pending");
      const hasAdvanceReceived = paymentStatus === "Advance Paid";

      if (["New", "Draft", "Sent"].includes(status)) {
        next.newOrders.push(order);
      } else if (status === "Accepted" && !hasAdvanceReceived) {
        next.newOrders.push(order);
      } else if (
        (status === "Accepted" && hasAdvanceReceived) ||
        status === "Work Started" ||
        status === "Work Finished"
      ) {
        next.pending.push(order);
      } else if (status === "Delivered") {
        next.delivered.push(order);
      } else if (status === "Payment Pending") {
        next.paymentPending.push(order);
      }
    });
    return next;
  }, [vendorOrders]);

  const allOrders = useMemo(
    () => [...vendorOrders].sort((left, right) => Number(right?.id || 0) - Number(left?.id || 0)),
    [vendorOrders],
  );

  const pageConfig = useMemo(() => {
    switch (view) {
      case "new":
        return { rows: categorized.newOrders, isNew: true, canUpdate: true };
      case "pending":
        return { rows: categorized.pending, isNew: false, canUpdate: true };
      case "delivered":
        return { rows: categorized.delivered, isNew: false, canUpdate: false };
      case "paymentPending":
        return { rows: categorized.paymentPending, isNew: false, canUpdate: false };
      case "all":
      default:
        return { rows: allOrders, isNew: false, canUpdate: false };
    }
  }, [allOrders, categorized, view]);

  const applyOrderUpdate = async (orderId, updates) => {
    const currentOrder = vendorOrders.find((order) => String(order.id) === String(orderId));
    if (!currentOrder) return;
    const updated = await updateVendorOrderApi(orderId, {
      ...currentOrder,
      ...updates,
    }).catch(() => null);
    if (!updated) return;
    setOrders((prev) =>
      prev.map((order) => (String(order.id) === String(orderId) ? updated : order)),
    );
  };

  const handleAcceptOrder = async (orderId) => {
    const draft = drafts[orderId] || {};
    if (!draft.deadline || !draft.quotationFileName) return;
    await applyOrderUpdate(orderId, {
      vendorDeadline: draft.deadline,
      quotationFileName: draft.quotationFileName,
      quotationFile: draft.quotationFile || null,
      status: "Accepted",
      paymentStatus: "Pending",
    });
    setModalOrderId(null);
    setModalAction(null);
  };

  const handleRejectOrder = async (orderId) => {
    const draft = drafts[orderId] || {};
    await applyOrderUpdate(orderId, {
      status: "Rejected",
      paymentStatus: "Pending",
      rejectionNotes: draft.rejectionNotes || "",
    });
    setModalOrderId(null);
    setModalAction(null);
  };

  const handleStatusUpdate = async (orderId, newStatus = null) => {
    const draft = drafts[orderId] || {};
    const statusToUpdate = newStatus || draft.status;
    if (!statusToUpdate) return;
    const currentOrder = vendorOrders.find((order) => String(order.id) === String(orderId));
    const updates = { status: statusToUpdate };
    if (statusToUpdate === "Work Started") {
      updates.paymentStatus = "Pending";
    }
    if (statusToUpdate === "Work Finished" || statusToUpdate === "Delivered") {
      updates.paymentStatus = currentOrder?.paymentStatus || "Pending";
    }
    await applyOrderUpdate(orderId, updates);
  };

  const handleQuotationFileChange = (orderId, file) => {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        quotationFileName: file ? file.name : "",
        quotationFile: file || null,
      },
    }));
  };

  const renderRow = (order, { isNew, canUpdate, view }) => {
    const draft = drafts[order.id] || {};
    const isEditing = editingOrderId === order.id;
    const nextStatusOptions =
      order.status === "Accepted"
        ? ["Work Started"]
        : order.status === "Work Started"
          ? ["Work Finished"]
          : [];

    // For "all" view, show only View button
    if (view === "all" && !isNew) {
      return (
        <tr key={order.id}>
          <td className="vod-text-semibold">{order.projectName || "--"}</td>
          <td>{order.materialName || "--"}</td>
          <td>{order.quantity || "--"}</td>
          <td>{order.requiredDate || "--"}</td>
          <td>
            <span
              className={`vod-badge ${STATUS_CLASS[order.status] || "status-draft"}`}
              style={
                order.status === "Accepted"
                  ? { display: "inline-flex", flexDirection: "column", alignItems: "center", whiteSpace: "normal" }
                  : undefined
              }
            >
              {order.status || "New"}
              {order.status === "Accepted" && order.paymentStatus === "Pending" && (
                <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "#e65100" }}>
                  Waiting for Advance Amount
                </span>
              )}
              {order.status === "Accepted" && order.paymentStatus === "Advance Paid" && (
                <span style={{ fontSize: "0.75rem", fontWeight: "500" }}>
                  Ready to Start Work
                </span>
              )}
            </span>
          </td>
          <td>
            <button
              type="button"
              className="vod-btn vod-btn-view-text"
              onClick={() => navigate(`/vendor/order/${order.id}`)}
              title="View Details"
            >
              View
            </button>
          </td>
        </tr>
      );
    }

    if (isNew) {
      return (
        <tr key={order.id}>
          <td className="vod-text-semibold">{order.projectName || "--"}</td>
          <td>{order.materialName || "--"}</td>
          <td>{order.quantity || "--"}</td>
          <td>{order.requiredDate || "--"}</td>
          <td>
            {order.uploadDesignUrl ? (
              <a href={order.uploadDesignUrl} target="_blank" rel="noreferrer">
                View Design
              </a>
            ) : (
              "--"
            )}
          </td>
          <td>
            <span
              className={`vod-badge ${STATUS_CLASS[order.status] || "status-draft"}`}
              style={
                order.status === "Accepted"
                  ? { display: "inline-flex", flexDirection: "column", alignItems: "center", whiteSpace: "normal" }
                  : undefined
              }
            >
              {order.status || "New"}
              {order.status === "Accepted" && order.paymentStatus === "Pending" && (
                <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "#e65100" }}>
                  Waiting for Advance Amount
                </span>
              )}
              {order.status === "Accepted" && order.paymentStatus === "Advance Paid" && (
                <span style={{ fontSize: "0.75rem", fontWeight: "500" }}>
                  Ready to Start Work
                </span>
              )}
            </span>
          </td>
          <td>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                className="vod-btn vod-btn-view-text"
                onClick={() => navigate(`/vendor/order/${order.id}`)}
                title="View Details"
              >
                View
              </button>
              {order.status !== "Accepted" && order.status !== "Rejected" && (
                <>
                  <button
                    type="button"
                    className="vod-btn vod-btn-accept-text"
                    onClick={() => {
                      setModalOrderId(order.id);
                      setModalAction("accept");
                    }}
                    title="Accept Order"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="vod-btn vod-btn-reject-text"
                    onClick={() => {
                      setModalOrderId(order.id);
                      setModalAction("reject");
                    }}
                    title="Reject Order"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </td>
        </tr>
      );
    }

    return (
      <Fragment key={order.id}>
        <tr>
          <td className="vod-text-semibold">{order.projectName || "--"}</td>
          <td>{order.materialName || "--"}</td>
          <td>{order.quantity || "--"}</td>
          <td>{order.requiredDate || "--"}</td>
          <td>
            <span
              className={`vod-badge ${
                order.status === "Work Finished"
                  ? "status-delivered"
                  : order.status === "Accepted"
                    ? "status-accepted"
                    : STATUS_CLASS[order.status] || "status-draft"
              }`}
              style={
                (order.status === "Accepted" || order.status === "Work Finished")
                  ? { display: "inline-flex", flexDirection: "column", alignItems: "center", whiteSpace: "normal" }
                  : undefined
              }
            >
              {order.status === "Work Finished"
                ? "Work Completed"
                : (order.status === "Accepted" && order.paymentStatus === "Advance Paid")
                  ? "Advance Paid"
                  : (order.status || "New")}
              {order.status === "Accepted" && order.paymentStatus === "Pending" && (
                <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "#e65100" }}>
                  Waiting for Advance to be Paid
                </span>
              )}
              {order.status === "Accepted" && order.paymentStatus === "Advance Paid" && (
                <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "#2e7d32" }}>
                  Ready to Start Work
                </span>
              )}
            </span>
          </td>
          <td>
            {view === "all" ? (
              <button
                type="button"
                className="vod-btn vod-btn-view-text"
                onClick={() => navigate(`/vendor/order/${order.id}`)}
                title="View Details"
              >
                View
              </button>
            ) : view === "pending" ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  className="vod-btn vod-btn-view-text"
                  onClick={() => navigate(`/vendor/order/${order.id}`)}
                  title="View Details"
                >
                  View
                </button>
                {order.status === "Accepted" && order.paymentStatus === "Advance Paid" && (
                  <button
                    type="button"
                    className="vod-btn vod-btn-accept-text"
                    onClick={() => handleStatusUpdate(order.id, "Work Started")}
                    title="Start Work"
                  >
                    Start Work
                  </button>
                )}
                {order.status === "Work Started" && (
                  <button
                    type="button"
                    className="vod-btn vod-btn-accept-text"
                    onClick={() => handleStatusUpdate(order.id, "Work Finished")}
                    title="Work Finished"
                  >
                    Work Finished
                  </button>
                )}
              </div>
            ) : view === "delivered" || view === "paymentPending" ? (
              <button
                type="button"
                className="vod-btn primary"
                onClick={() =>
                  setEditingOrderId((current) => (current === order.id ? null : order.id))
                }
              >
                {isEditing ? "Close" : "Edit"}
              </button>
            ) : null}
          </td>
        </tr>
        {isEditing && (view === "delivered" || view === "paymentPending") ? (
          <tr>
            <td colSpan={5}>
              <div className="vod-edit-panel">
                <div className="vod-edit-grid">
                  <div>
                    <label className="vod-label">Deadline</label>
                    <input
                      type="date"
                      className="vod-input"
                      value={draft.deadline || ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [order.id]: { ...draft, deadline: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="vod-label">Quotation File</label>
                    <input
                      type="file"
                      className="vod-input"
                      onChange={(e) =>
                        handleQuotationFileChange(order.id, e.target.files?.[0] || null)
                      }
                    />
                    <div className="vod-text-muted">
                      {draft.quotationFileName || order.quotationFileName || "Upload quotation file"}
                    </div>
                  </div>
                  {canUpdate && (
                    <div>
                      <label className="vod-label">Status</label>
                      <select
                        className="vod-select"
                        value={draft.status || order.status || "New"}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [order.id]: { ...draft, status: e.target.value },
                          }))
                        }
                      >
                        {[order.status || "New", ...nextStatusOptions].map((status, index, array) =>
                          array.indexOf(status) === index ? (
                            <option key={status} value={status}>{status}</option>
                          ) : null,
                        )}
                      </select>
                    </div>
                  )}
                </div>
                <div className="vod-edit-actions">
                  {canUpdate && (
                    <button
                      type="button"
                      className="vod-btn primary"
                      onClick={() => handleStatusUpdate(order.id)}
                    >
                      Save Changes
                    </button>
                  )}
                  <button
                    type="button"
                    className="vod-btn light"
                    onClick={() => setEditingOrderId(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </td>
          </tr>
        ) : null}
      </Fragment>
    );
  };

  const renderTable = (rows, { isNew, canUpdate, view }) => (
    <div className="vod-table-wrap">
      <table className="vod-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Material</th>
            <th>Qty</th>
            <th>Required</th>
            {isNew ? <th>Design</th> : null}
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="vod-empty-row">
              <td colSpan={isNew ? 7 : 6}>No orders</td>
            </tr>
          ) : (
            rows.map((order) => renderRow(order, { isNew, canUpdate, view }))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="content">
      <div className="vod-card">
        <div className="vod-card-header">
          <h5 className="vod-card-title">{title}</h5>
          <span className="vod-count-badge">
            {pageConfig.rows.length} order{pageConfig.rows.length !== 1 ? "s" : ""}
          </span>
        </div>
        {renderTable(pageConfig.rows, { isNew: pageConfig.isNew, canUpdate: pageConfig.canUpdate, view })}
      </div>

      {/* Accept Modal */}
      {modalOrderId && modalAction === "accept" && (
        <div className="vod-modal-backdrop" onClick={() => { setModalOrderId(null); setModalAction(null); }}>
          <div className="vod-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vod-modal-header">
              <h3>Accept Order</h3>
              <button
                type="button"
                className="vod-modal-close"
                onClick={() => { setModalOrderId(null); setModalAction(null); }}
              >
                ✕
              </button>
            </div>
            <div className="vod-modal-body">
              <div className="vod-modal-field">
                <label className="vod-label">Deadline *</label>
                <input
                  type="date"
                  className="vod-input"
                  value={drafts[modalOrderId]?.deadline || ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [modalOrderId]: { ...prev[modalOrderId], deadline: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="vod-modal-field">
                <label className="vod-label">Quotation File *</label>
                <input
                  type="file"
                  className="vod-input"
                  onChange={(e) =>
                    handleQuotationFileChange(modalOrderId, e.target.files?.[0] || null)
                  }
                />
                {drafts[modalOrderId]?.quotationFileName && (
                  <div className="vod-text-muted">
                    Selected: {drafts[modalOrderId].quotationFileName}
                  </div>
                )}
              </div>
            </div>
            <div className="vod-modal-footer">
              <button
                type="button"
                className="vod-btn primary"
                onClick={() => handleAcceptOrder(modalOrderId)}
                disabled={!drafts[modalOrderId]?.deadline || !drafts[modalOrderId]?.quotationFileName}
              >
                Accept Order
              </button>
              <button
                type="button"
                className="vod-btn light"
                onClick={() => { setModalOrderId(null); setModalAction(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modalOrderId && modalAction === "reject" && (
        <div className="vod-modal-backdrop" onClick={() => { setModalOrderId(null); setModalAction(null); }}>
          <div className="vod-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vod-modal-header">
              <h3>Reject Order</h3>
              <button
                type="button"
                className="vod-modal-close"
                onClick={() => { setModalOrderId(null); setModalAction(null); }}
              >
                ✕
              </button>
            </div>
            <div className="vod-modal-body">
              <div className="vod-modal-field">
                <label className="vod-label">Notes (Optional)</label>
                <textarea
                  className="vod-input"
                  rows="4"
                  placeholder="Add rejection notes..."
                  value={drafts[modalOrderId]?.rejectionNotes || ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [modalOrderId]: { ...prev[modalOrderId], rejectionNotes: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div className="vod-modal-footer">
              <button
                type="button"
                className="vod-btn outline-danger"
                onClick={() => handleRejectOrder(modalOrderId)}
              >
                Reject Order
              </button>
              <button
                type="button"
                className="vod-btn light"
                onClick={() => { setModalOrderId(null); setModalAction(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
