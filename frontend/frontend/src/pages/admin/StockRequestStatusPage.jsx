import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import {
  getStockRequestById,
  getStockItems,
  uploadStockRequestBill,
  getStockRequestBillUrl,
  closeStockRequest,
} from "../../api/stocksApi";
import { getVendors } from "../../api/vendorsApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";

const FLOW_STATUSES = ["Stock Request", "Accounts Review", "Approval", "Verification", "Verified", "Closed"];

function parseItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items !== "string" || !items.trim()) return [];
  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function StockRequestStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const { showSuccess, showError } = useToast();

  const [request, setRequest] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // bill upload form state
  const [billFile, setBillFile] = useState(null);
  const [billNote, setBillNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [closing, setClosing] = useState(false);
  const fileInputRef = useRef(null);

  const currentStatusIndex = useMemo(() => {
    if (!request?.status) return -1;
    const s = String(request.status).toLowerCase();
    return FLOW_STATUSES.findIndex((st) => String(st).toLowerCase() === s);
  }, [request?.status]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [data, itemRows, vendorRows] = await Promise.all([
          getStockRequestById(id),
          getStockItems(),
          getVendors(),
        ]);
        setRequest(data);
        setStockItems(Array.isArray(itemRows) ? itemRows : []);
        setVendors(Array.isArray(vendorRows) ? vendorRows : []);
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load stock request"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBillUpload = async () => {
    if (!billFile) {
      showError("Please select a bill file to upload.");
      return;
    }
    setUploading(true);
    try {
      const updated = await uploadStockRequestBill(id, billFile, billNote);
      setRequest(updated);
      setBillFile(null);
      setBillNote("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      showSuccess("Bill uploaded \u2014 status updated to Verification, awaiting account review");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to upload bill"));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <PageLoader />;

  const items = request ? parseItems(request.items) : [];
  const isApproved = ["approval", "verification", "verified", "closed"].includes(
    String(request?.status || "").toLowerCase()
  );
  const canUploadBill =
    String(request?.status || "").toLowerCase() === "approval" &&
    !request?.billFilePath;

  return (
    <div className="container-fluid">
      <PageHeader
        title={`Stock Request #${id} — Status`}
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Stock Requests", path: "/stock-requests" },
          { label: `#${id} Status`, path: "" },
        ]}
      />

      <div className="mb-3 d-flex gap-2">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      {isApproved && (
        <div className="alert alert-success d-flex align-items-center gap-2">
          <i className="ti ti-circle-check fs-5"></i>
          <span>
            <strong>Stock Request Approved!</strong> The stock has been approved for purchase.
            {String(request?.status || "").toLowerCase() === "approval" && !request?.billFilePath
              ? " Upload the bill once you have received the stock."
              : ""}
          </span>
        </div>
      )}

      {/* Status Timeline */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Status Timeline</h5>
          <div className="lead-status-timeline">
            {FLOW_STATUSES.map((step, index) => {
              const stateClass =
                currentStatusIndex === -1
                  ? ""
                  : index < currentStatusIndex
                  ? "is-done"
                  : index === currentStatusIndex
                  ? "is-current"
                  : "";
              return (
                <div key={step} className={`lead-status-step ${stateClass}`}>
                  <div className="lead-status-dot" />
                  <div className="lead-status-label">{step}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          {/* Request Info */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Request Information</h6>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label fw-bold">Lead</label>
                  <p className="text-muted mb-0">
                    {request?.leadName || request?.leadDisplayId || request?.leadId || "-"}
                  </p>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold">Requested By</label>
                  <p className="text-muted mb-0">
                    {request?.requestedByName || request?.requestedBy || "-"}
                  </p>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold">Current Status</label>
                  <p className="mb-0">
                    <span className="badge bg-primary">{request?.status || "-"}</span>
                  </p>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold">Purchase Value</label>
                  <p className="text-muted mb-0">
                    {request?.purchaseValue ? `₹${Number(request.purchaseValue).toLocaleString()}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Items &amp; Assigned Vendors</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Vendor</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">
                          No items.
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => {
                        const detail = stockItems.find(
                          (si) => String(si.id) === String(it.itemId),
                        );
                        const label = detail
                          ? detail.name || `Item ${it.itemId}`
                          : it.name || `Item ${it.itemId || ""}`;
                        const vendor = vendors.find(
                          (v) => String(v.id) === String(it.vendorId),
                        );
                        return (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{label}</td>
                            <td>{it.qty}</td>
                            <td>
                              {vendor ? (
                                <span className="badge bg-secondary">
                                  {vendor.vendorName || vendor.name}
                                </span>
                              ) : (
                                <span className="text-muted">Not assigned</span>
                              )}
                            </td>
                            <td className="text-muted small">{it.notes || "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          {/* Bill Upload — shown only when status is Approval and bill not yet uploaded */}
          {canUploadBill && (
            <div className="card mb-4 border-warning">
              <div className="card-header bg-warning text-dark">
                <h6 className="mb-0">
                  <i className="ti ti-upload me-1"></i>Upload Bill
                </h6>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-3">
                  Upload the vendor bill/invoice with notes.
                  This will move the request to <strong>Verification</strong> for account review.
                </p>
                <div className="mb-3">
                  <label className="form-label">Bill File (image / PDF)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-control"
                    accept="image/*,application/pdf"
                    onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Note</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add a note about the bill (optional)"
                    value={billNote}
                    onChange={(e) => setBillNote(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-warning w-100"
                  onClick={handleBillUpload}
                  disabled={uploading || !billFile}
                >
                  {uploading ? "Uploading…" : "Submit Bill"}
                </button>
              </div>
            </div>
          )}

          {/* Bill already uploaded — visible to everyone */}
          {request?.billFilePath && (
            <div className="card mb-4 border-success">
              <div className="card-header bg-success text-white d-flex align-items-center gap-2">
                <i className="ti ti-file-invoice"></i>
                <h6 className="mb-0">Bill Uploaded</h6>
              </div>
              <div className="card-body">
                <div className="mb-2">
                  <strong>File:</strong>{" "}
                  <a
                    href={getStockRequestBillUrl(id)}
                    download={request.billFileName || "bill"}
                    className="text-decoration-none"
                  >
                    {request.billFileName || "View Bill"}
                  </a>
                </div>
                {request.billNote && (
                  <div className="mb-2">
                    <strong>Note:</strong>
                    <p className="mb-0 text-muted" style={{ whiteSpace: "pre-wrap" }}>
                      {request.billNote}
                    </p>
                  </div>
                )}
                {request.billUploadedAt && (
                  <div className="text-muted small">
                    Uploaded {new Date(request.billUploadedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verified — user can close the request */}
          {String(request?.status || "").toLowerCase() === "verified" && (
            <div className="card mb-4 border-success">
              <div className="card-header bg-success text-white">
                <h6 className="mb-0"><i className="ti ti-circle-check me-1"></i>Bill Verified</h6>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-3">The bill has been reviewed and verified. You may now close this stock request.</p>
                <button
                  className="btn btn-danger w-100"
                  onClick={async () => {
                    setClosing(true);
                    try {
                      const updated = await closeStockRequest(id);
                      setRequest(updated);
                    } catch (e) {
                      showError(extractApiErrorMessage(e, "Failed to close request"));
                    } finally {
                      setClosing(false);
                    }
                  }}
                  disabled={closing}
                >
                  {closing ? "Closing\u2026" : "Close Request"}
                </button>
              </div>
            </div>
          )}

          {/* Status info box when not yet approved */}
          {!canUploadBill && !request?.billFilePath && (
            <div className="card mb-4">
              <div className="card-body text-center text-muted py-4">
                <i className="ti ti-info-circle fs-3 d-block mb-2"></i>
                Bill upload will be available once the request has been approved.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
