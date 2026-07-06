import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getVendorOrders, updateVendorOrderApi } from "../../api/vendorOrdersApi";
import { getVendorSession } from "../../utils/vendorSession";
import "./VendorOrdersDashboardPage.css";

const NEW_ORDER_STATUS_OPTIONS = ["Accepted", "Rejected"];

const STATUS_CLASS = {
  New: "status-new",
  Draft: "status-draft",
  Sent: "status-sent",
  Accepted: "status-accepted",
  Rejected: "status-rejected",
  "Work Started": "status-work-started",
  "In Production": "status-in-production",
  Delivered: "status-delivered",
  Cancelled: "status-cancelled",
};

export default function VendorOrdersDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [modalOrderId, setModalOrderId] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const session = getVendorSession();
  const location = useLocation();
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

  const handleNewOrderDecision = async (orderId) => {
    const draft = drafts[orderId] || {};
    if (draft.status === "Rejected") {
      await handleRejectOrder(orderId);
      setEditingOrderId(null);
      return;
    }
    await handleAcceptOrder(orderId);
    setEditingOrderId(null);
    setModalOrderId(null);
    setModalAction(null);
  };

  const handleStatusUpdate = async (orderId, statusToUpdate = null) => {
    const draft = drafts[orderId] || {};
    const newStatus = statusToUpdate || draft.status;
    if (!newStatus) return;
    const currentOrder = vendorOrders.find((order) => String(order.id) === String(orderId));
    const updates = { status: newStatus };
    if (newStatus === "Work Started") {
      updates.paymentStatus = "Pending";
    }
    if (newStatus === "Delivered") {
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

  const handleAcceptModalConfirm = async (orderId) => {
    await handleAcceptOrder(orderId);
    setModalOrderId(null);
    setModalAction(null);
  };

  const renderRow = (order, { isNew, canUpdate, section }) => {
    const draft = drafts[order.id] || {};
    const isEditing = editingOrderId === order.id;
    const nextStatusOptions =
      order.status === "Accepted"
        ? ["Work Started"]
        : order.status === "Work Started"
          ? ["Delivered"]
          : [];

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
                  Waiting for Advance to be Paid
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
      <tr key={order.id}>
        <td className="vod-text-semibold">{order.projectName || "--"}</td>
        <td>{order.materialName || "--"}</td>
        <td>{order.quantity || "--"}</td>
        <td>{order.requiredDate || "--"}</td>
        <td>
          {section === "pending" ? (
            <span
              className={`vod-badge ${STATUS_CLASS[order.status] || "status-draft"}`}
              style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", whiteSpace: "normal" }}
            >
              {order.status === "Accepted" && order.paymentStatus === "Advance Paid" ? "Advance Paid" : order.status || "New"}
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
          ) : canUpdate ? (
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
          ) : (
            <span className={`vod-badge ${STATUS_CLASS[order.status] || "status-draft"}`}>
              {order.status || "New"}
            </span>
          )}
        </td>
        <td>
          {section === "pending" ? (
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
              {order.status === "Work Finished" && (
                <>
                  <button
                    type="button"
                    className="vod-btn vod-btn-accept-text"
                    onClick={async () => {
                      await handleStatusUpdate(order.id, "Payment Pending");
                      navigate("/vendor/payment-pending");
                    }}
                    title="Mark Payment Pending"
                  >
                    Payment
                  </button>
                  <button
                    type="button"
                    className="vod-btn vod-btn-accept-text"
                    onClick={async () => {
                      await handleStatusUpdate(order.id, "Delivered");
                      navigate("/vendor/delivered-orders");
                    }}
                    title="Mark as Delivered"
                  >
                    Delivery
                  </button>
                </>
              )}
            </div>
          ) : canUpdate ? (
            <button type="button" className="vod-btn primary" onClick={() => handleStatusUpdate(order.id)}>
              Update Status
            </button>
          ) : (
            <button
              type="button"
              className="vod-btn vod-btn-view-text"
              onClick={() => navigate(`/vendor/order/${order.id}`)}
              title="View Details"
            >
              View
            </button>
          )}
        </td>
      </tr>
    );
  };

  const renderTable = (rows, { isNew, canUpdate, section }) => (
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
            rows.map((order) => renderRow(order, { isNew, canUpdate, section }))
          )}
        </tbody>
      </table>
    </div>
  );

  const sections = [
    { key: "newOrders", title: "New Orders", rows: categorized.newOrders, isNew: true, canUpdate: true },
    { key: "pending", title: "Pending Orders", rows: categorized.pending, isNew: false, canUpdate: true },
    { key: "delivered", title: "Delivered Orders", rows: categorized.delivered, isNew: false, canUpdate: false },
    { key: "paymentPending", title: "Payment Pending", rows: categorized.paymentPending, isNew: false, canUpdate: false },
  ];

  const pathSectionMap = {
    "/vendor/new-orders": "newOrders",
    "/vendor/pending-orders": "pending",
    "/vendor/delivered-orders": "delivered",
    "/vendor/payment-pending": "paymentPending",
  };

  const activeSectionKey = pathSectionMap[location.pathname] || null;
  const visibleSections = activeSectionKey ? sections.filter((section) => section.key === activeSectionKey) : [];
  const allOrders = [...vendorOrders].sort((left, right) => Number(right?.id || 0) - Number(left?.id || 0));

  return (
    <div className="content">
      <div className="vod-header">
        <h2>Vendor Orders</h2>
        <p>
          Review new requests, update status, and track deliveries.
        </p>
      </div>

      {!activeSectionKey ? (
        <div className="vod-card">
          <div className="vod-card-header">
            <h5 className="vod-card-title">All Orders</h5>
            <span className="vod-count-badge">
              {allOrders.length} order{allOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
          {renderTable(allOrders, { isNew: false, canUpdate: false })}
        </div>
      ) : null}

      {visibleSections.map((section) => (
        <div key={section.key} className="vod-card">
          <div className="vod-card-header">
            <h5 className="vod-card-title">{section.title}</h5>
            <span className="vod-count-badge">
              {section.rows.length} order{section.rows.length !== 1 ? "s" : ""}
            </span>
          </div>
          {renderTable(section.rows, { isNew: section.isNew, canUpdate: section.canUpdate, section: section.key })}
        </div>
      ))}

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
                onClick={() => handleAcceptModalConfirm(modalOrderId)}
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
