import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getVendorOrders } from "../../api/vendorOrdersApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import api from "../../utils/api";
import PageLoader from "../../components/common/PageLoader";
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
    <div className={`voad-field${full ? " full" : ""}`}>
      <span className="voad-field-label">{label}</span>
      {display ? (
        <span className="voad-field-value">{display}</span>
      ) : (
        <span className="voad-field-value empty">—</span>
      )}
    </div>
  );
}

function FileField({ label, fileName, fileUrl, onView, onDownload }) {
  return (
    <div className="voad-field">
      <span className="voad-field-label">{label}{fileName ? ` — ${fileName}` : ""}</span>
      {fileUrl ? (
        <div className="voad-file-row">
          <button type="button" className="voad-file-btn" onClick={onView}>
            <i className="ti ti-eye" /> View
          </button>
          <button type="button" className="voad-file-btn" onClick={onDownload}>
            <i className="ti ti-download" /> Download
          </button>
        </div>
      ) : (
        <span className="voad-field-value empty">—</span>
      )}
    </div>
  );
}

export default function VendorOrderDetailPage() {
  const { id } = useParams();
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
        showError(extractApiErrorMessage(e, "Failed to load vendor order details"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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

  const formatDateTime = (value) => {
    if (!value) return null;
    try { return new Date(value).toLocaleString(); } catch { return String(value); }
  };

  if (loading) return <PageLoader />;

  if (!order) {
    return (
      <div className="content">
        <div className="voad-empty-state">
          <p>Vendor order not found.</p>
          <Link to="/stocks/vendor-orders" className="voad-btn light">
            <i className="ti ti-arrow-left" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const status = order.status || "New";
  const payStatus = order.paymentStatus || "Pending";
  const statusClass = STATUS_CLASS[status] || "new";
  const payClass = PAY_CLASS[payStatus] || "pending";

  return (
    <div className="content voad-page">

      {/* Hero */}
      <div className="voad-hero">
        <div className="voad-hero-left">
          <div className="voad-hero-icon">
            <i className="ti ti-clipboard-list" />
          </div>
          <div className="voad-hero-info">
            <div className="voad-hero-name">{order.projectName || `Order #${order.id}`}</div>
            <div className="voad-hero-meta">
              <span className={`voad-status-badge ${statusClass}`}>{status}</span>
              <span className={`voad-pay-badge ${payClass}`}>{payStatus}</span>
            </div>
          </div>
        </div>
        <div className="voad-hero-actions">
          <Link to="/stocks/vendor-orders" className="voad-btn light">
            <i className="ti ti-arrow-left" /> Back
          </Link>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="voad-section-grid">
        <div className="voad-info-card">
          <div className="voad-card-title">Order Info</div>
          <div className="voad-fields cols-1">
            <Field label="Project Name" value={order.projectName} />
            <Field label="Vendor" value={order.vendorName} />
            <Field label="Quantity" value={order.quantity} />
            <Field label="Required Date" value={formatDate(order.requiredDate)} />
            <Field label="Vendor Deadline" value={formatDate(order.vendorDeadline)} />
          </div>
        </div>

        <div className="voad-info-card">
          <div className="voad-card-title">Service Details</div>
          <div className="voad-fields cols-1">
            <Field label="Category" value={order.categoryName} />
            <Field label="Type" value={order.typeName} />
            <Field label="Sub Type" value={order.subtypeName} />
            <Field label="Material" value={order.materialName} />
            <Field label="Notes" value={order.notes} />
          </div>
        </div>
      </div>

      {/* Status & Payment */}
      <div className="voad-info-card">
        <div className="voad-card-title">Status & Payment</div>
        <div className="voad-fields">
          <div className="voad-field">
            <span className="voad-field-label">Order Status</span>
            <span className={`voad-status-badge ${statusClass}`} style={{ alignSelf: "flex-start" }}>{status}</span>
          </div>
          <div className="voad-field">
            <span className="voad-field-label">Payment Status</span>
            <span className={`voad-pay-badge ${payClass}`} style={{ alignSelf: "flex-start" }}>{payStatus}</span>
          </div>
          <Field label="Accounts Status" value={order.accountsStatus} />
          <Field label="Advance Paid At" value={formatDateTime(order.advancePaidAt)} />
          <Field
            label="Advance Amount"
            value={
              order.advanceAmount != null && order.advanceAmount !== ""
                ? String(order.advanceAmount)
                : null
            }
          />
          <Field label="Advance Notes" value={order.advancePaidNotes} />
        </div>
      </div>

      {/* Files */}
      <div className="voad-info-card">
        <div className="voad-card-title">Files</div>
        <div className="voad-fields cols-3">
          <FileField
            label="Design File"
            fileUrl={order.uploadDesignUrl}
            onView={() => viewFile(order.uploadDesignUrl)}
            onDownload={() =>
              downloadFile(order.uploadDesignUrl, order.uploadDesignUrl?.split("/").pop())
            }
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
