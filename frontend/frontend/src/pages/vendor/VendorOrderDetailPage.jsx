import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVendorOrders } from "../../api/vendorOrdersApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import api from "../../utils/api";
import "./VendorOrderDetailPage.css";

const STATUS_CLASS = {
  New: "new",
  Draft: "draft",
  Sent: "sent",
  Accepted: "accepted",
  Rejected: "rejected",
  "Work Started": "work-started",
  "In Production": "in-production",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

const PAY_CLASS = {
  Pending: "pending",
  "Advance Paid": "advance-paid",
  Paid: "paid",
};

function Field({ label, value, full }) {
  const display =
    value !== null && value !== undefined && String(value).trim() !== ""
      ? String(value)
      : null;
  return (
    <div className={`vovd-field${full ? " full" : ""}`}>
      <span className="vovd-field-label">{label}</span>
      {display ? (
        <span className="vovd-field-value">{display}</span>
      ) : (
        <span className="vovd-field-value empty">—</span>
      )}
    </div>
  );
}

function FileField({ label, fileName, fileUrl, onView, onDownload }) {
  return (
    <div className="vovd-field">
      <span className="vovd-field-label">{label}{fileName ? ` — ${fileName}` : ""}</span>
      {fileUrl ? (
        <div className="vovd-file-row">
          <button type="button" className="vovd-file-btn" onClick={onView}>
            <i className="ti ti-eye" /> View
          </button>
          <button type="button" className="vovd-file-btn" onClick={onDownload}>
            <i className="ti ti-download" /> Download
          </button>
        </div>
      ) : (
        <span className="vovd-field-value empty">—</span>
      )}
    </div>
  );
}

export default function VendorOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const orders = await getVendorOrders();
        const found = Array.isArray(orders)
          ? orders.find((o) => o.id === Number(id))
          : null;
        setOrder(found || null);
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load order details"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, showError]);

  const viewFile = async (filePath) => {
    if (!filePath) return;
    try {
      const response = await api.get(filePath, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(response.data);
      const newTab = window.open(blobUrl, "_blank");
      if (newTab) setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to view file"));
    }
  };

  const downloadFile = async (filePath, fileName) => {
    if (!filePath || !fileName) return;
    try {
      const response = await api.get(filePath, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download file"));
    }
  };

  const formatDate = (value) => {
    if (!value) return null;
    try { return new Date(value).toLocaleDateString(); } catch { return String(value); }
  };

  if (loading) {
    return (
      <div className="content">
        <div className="vovd-empty-state">Loading…</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="content">
        <div className="vovd-empty-state">
          <p>Order not found.</p>
          <button type="button" className="vovd-btn light" onClick={() => navigate(-1)}>
            <i className="ti ti-arrow-left" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const status = order.status || "New";
  const payStatus = order.paymentStatus || "Pending";
  const statusClass = STATUS_CLASS[status] || "new";
  const payClass = PAY_CLASS[payStatus] || "pending";
  const showStatusCard = status !== "New";

  return (
    <div className="content vovd-page">

      {/* Hero */}
      <div className="vovd-hero">
        <div className="vovd-hero-left">
          <div className="vovd-hero-icon">
            <i className="ti ti-clipboard-list" />
          </div>
          <div className="vovd-hero-info">
            <div className="vovd-hero-name">{order.projectName || `Order #${order.id}`}</div>
            <div className="vovd-hero-meta">
              <span className={`vovd-status-badge ${statusClass}`}>{status}</span>
              {showStatusCard && (
                <span className={`vovd-pay-badge ${payClass}`}>{payStatus}</span>
              )}
            </div>
          </div>
        </div>
        <div className="vovd-hero-actions">
          <button type="button" className="vovd-btn light" onClick={() => navigate(-1)}>
            <i className="ti ti-arrow-left" /> Back
          </button>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="vovd-section-grid">
        <div className="vovd-info-card">
          <div className="vovd-card-title">Order Info</div>
          <div className="vovd-fields cols-1">
            <Field label="Project Name" value={order.projectName} />
            <Field label="Quantity" value={order.quantity} />
            <Field label="Required Date" value={formatDate(order.requiredDate)} />
            <Field label="Vendor Deadline" value={formatDate(order.vendorDeadline)} />
          </div>
        </div>

        <div className="vovd-info-card">
          <div className="vovd-card-title">Service Details</div>
          <div className="vovd-fields cols-1">
            <Field label="Category" value={order.categoryName} />
            <Field label="Type" value={order.typeName} />
            <Field label="Sub Type" value={order.subtypeName} />
            <Field label="Material" value={order.materialName} />
            <Field label="Notes" value={order.notes} />
          </div>
        </div>
      </div>

      {/* Status & Payment — hidden for New orders */}
      {showStatusCard && (
        <div className="vovd-info-card">
          <div className="vovd-card-title">Status & Payment</div>
          <div className="vovd-fields">
            <div className="vovd-field">
              <span className="vovd-field-label">Order Status</span>
              <span className={`vovd-status-badge ${statusClass}`} style={{ alignSelf: "flex-start" }}>
                {status}
              </span>
              {status === "Accepted" && payStatus === "Pending" && (
                <span className="vovd-pay-note">Waiting for advance payment</span>
              )}
              {status === "Accepted" && payStatus === "Advance Paid" && (
                <span className="vovd-pay-note" style={{ color: "#1565c0" }}>Ready to start work</span>
              )}
            </div>
            <div className="vovd-field">
              <span className="vovd-field-label">Payment Status</span>
              <span className={`vovd-pay-badge ${payClass}`} style={{ alignSelf: "flex-start" }}>
                {payStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Files */}
      <div className="vovd-info-card">
        <div className="vovd-card-title">Files</div>
        <div className="vovd-fields cols-3">
          <FileField
            label="Design File"
            fileUrl={order.uploadDesignUrl}
            onView={() => viewFile(order.uploadDesignUrl)}
            onDownload={() => downloadFile(order.uploadDesignUrl, `design-${order.id}`)}
          />
          <FileField
            label="Quotation"
            fileName={order.quotationFileName}
            fileUrl={order.quotationFileName && order.quotationFileUrl ? order.quotationFileUrl : null}
            onView={() => viewFile(order.quotationFileUrl)}
            onDownload={() => downloadFile(order.quotationFileUrl, order.quotationFileName)}
          />
          <FileField
            label="Advance Proof"
            fileUrl={order.advancePaidProofUrl}
            onView={() => viewFile(order.advancePaidProofUrl)}
            onDownload={() =>
              downloadFile(order.advancePaidProofUrl, `advance-proof-${order.id}`)
            }
          />
        </div>
      </div>
    </div>
  );
}
