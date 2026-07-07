import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDealById } from "../../api/dealsApi";
import { updateProductionWorkStatus } from "../../api/dealsApi";
import { getDesignRequirement } from "../../api/designRequirementApi";
import { getStockRequests } from "../../api/stocksApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import FilePreviewModal from "../../components/admin/FilePreviewModal";
import api from "../../utils/api";

const PRODUCTION_STATUSES = [
  { value: "Not Started", label: "Not Started", badge: "secondary", icon: "ti ti-clock" },
  { value: "In Progress", label: "In Progress", badge: "warning", icon: "ti ti-progress" },
  { value: "Quality Check", label: "Quality Check", badge: "info", icon: "ti ti-shield-check" },
  { value: "Ready for Delivery", label: "Ready for Delivery", badge: "success", icon: "ti ti-truck" },
];

function getStatusBadge(status) {
  const found = PRODUCTION_STATUSES.find(s => s.value === status);
  return found ? found.badge : "secondary";
}

function DetailField({ label, value, className = "col-md-4", multiline = false }) {
  return (
    <div className={className}>
      <div className="border rounded p-3 h-100 bg-light">
        <label className="form-label fw-bold text-dark mb-2">{label}</label>
        <div className="text-muted" style={multiline ? { whiteSpace: "pre-wrap", wordWrap: "break-word" } : undefined}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function ProductionDetailPage() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [deal, setDeal] = useState(null);
  const [designRequirement, setDesignRequirement] = useState(null);
  const [stockRequest, setStockRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!dealId || !user) return;
      setLoading(true);
      try {
        const data = await getDealById(dealId);
        setDeal(data);
        if (data?.sourceLeadId) {
          const [designRow, stockRows] = await Promise.all([
            getDesignRequirement(data.sourceLeadId).catch(() => null),
            getStockRequests({ leadId: data.sourceLeadId }).catch(() => []),
          ]);
          setDesignRequirement(designRow || null);
          const sortedStock = Array.isArray(stockRows) ? stockRows.sort((a, b) => b.id - a.id) : [];
          setStockRequest(sortedStock[0] || null);
        }
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load production details"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dealId, user]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setSaving(true);
      const updated = await updateProductionWorkStatus(dealId, newStatus);
      setDeal((prev) => ({
        ...prev,
        productionWorkStatus: updated?.productionWorkStatus || newStatus,
        status: updated?.status || prev?.status,
      }));
      if (newStatus === "Ready for Delivery") {
        showSuccess("Production complete! Order moved to Delivery and customer notified.");
      } else {
        showSuccess(`Status updated to "${newStatus}"`);
      }
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  const downloadDealFile = async (filePath, fileName) => {
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

  const renderDownloadFile = (label, fileName, filePath, buttonClass = "btn-outline-secondary") => {
    if (!fileName) return null;
    return (
      <div className="col-md-6">
        <div className="border rounded p-3 h-100 bg-light">
          <label className="form-label fw-bold text-dark mb-2">{label}</label>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="text-muted text-break">{fileName}</span>
            {filePath && (
              <>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setPreviewFile({ fileName, filePath })}>
                  <i className="ti ti-eye me-1"></i>View
                </button>
                <button type="button" className={`btn btn-sm ${buttonClass}`} onClick={() => downloadDealFile(filePath, fileName)}>
                  <i className="ti ti-download me-1"></i>Download
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="content"><div className="text-center p-4">Loading...</div></div>;
  if (!deal) return <div className="content"><div className="text-center p-4 text-muted">Production request not found.</div></div>;

  const currentStatus = deal.productionWorkStatus || "Not Started";
  const currentIdx = PRODUCTION_STATUSES.findIndex(s => s.value === currentStatus);
  const isCompleted = currentStatus === "Ready for Delivery";

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div className="my-auto mb-2">
          <h2 className="mb-1">Production Request Details</h2>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="/admin-dashboard"><i className="ti ti-smart-home"></i></a></li>
              <li className="breadcrumb-item">CRM</li>
              <li className="breadcrumb-item"><a href="/production">Production</a></li>
              <li className="breadcrumb-item active">Details</li>
            </ol>
          </nav>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={() => navigate("/production")}>
          <i className="ti ti-arrow-left me-1"></i>Back to Production
        </button>
      </div>

      {/* Work Status Progress Card */}
      <div className="card mb-3">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">Production Work Status</h5>
          <span className={`badge bg-${getStatusBadge(currentStatus)} fs-6 px-3 py-2`}>{currentStatus}</span>
        </div>
        <div className="card-body">
          {/* Progress Steps */}
          <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
            {PRODUCTION_STATUSES.map((s, i) => {
              const isDone = i < currentIdx;
              const isCurrent = s.value === currentStatus;
              return (
                <div key={s.value} className="d-flex align-items-center gap-2">
                  <span className={`badge px-3 py-2 ${isCurrent ? `bg-${s.badge}` : isDone ? "bg-success" : "bg-secondary bg-opacity-25 text-muted"}`}>
                    {isDone ? <i className="ti ti-check me-1"></i> : <i className={`${s.icon} me-1`}></i>}
                    {s.label}
                  </span>
                  {i < PRODUCTION_STATUSES.length - 1 && <i className="ti ti-chevron-right text-muted"></i>}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {!isCompleted ? (
            <div>
              <p className="text-muted small mb-2 fw-semibold">Move to next stage:</p>
              <div className="d-flex flex-wrap gap-2">
                {PRODUCTION_STATUSES.filter((_, i) => i > currentIdx).map(s => (
                  <button
                    key={s.value}
                    className={`btn btn-${s.badge === "warning" ? "warning" : s.badge === "info" ? "info" : s.badge === "success" ? "success" : "secondary"}`}
                    onClick={() => handleUpdateStatus(s.value)}
                    disabled={saving}
                  >
                    {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className={`${s.icon} me-1`}></i>}
                    {s.value === "Ready for Delivery" ? "✓ Mark Ready for Delivery" : `→ ${s.label}`}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="alert alert-success d-flex align-items-center gap-3 mb-0">
              <i className="ti ti-circle-check-filled fs-3"></i>
              <div>
                <div className="fw-semibold">Production Complete!</div>
                <div className="small">This order has been moved to the Delivery stage and the customer has been notified via email.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {deal.designFinalFileName && (
        <div className="card mb-3">
          <div className="card-header"><h5 className="mb-0">Final Design</h5></div>
          <div className="card-body">
            <div className="row g-3">
              {renderDownloadFile("Final Design File", deal.designFinalFileName, deal.designFinalFilePath, "btn-outline-primary")}
            </div>
          </div>
        </div>
      )}

      {deal.requirementFileName && (
        <div className="card mb-3">
          <div className="card-header"><h5 className="mb-0">Requirement Details File</h5></div>
          <div className="card-body">
            <div className="row g-3">
              {renderDownloadFile("Requirement Details File", deal.requirementFileName, deal.requirementFilePath, "btn-outline-info")}
            </div>
          </div>
        </div>
      )}

      {designRequirement && (
        <div className="card mb-3">
          <div className="card-header"><h5 className="mb-0">Design Requirement Details</h5></div>
          <div className="card-body">
            <div className="row g-3">
              <DetailField label="Requirement Type" value={designRequirement.requirementType || "-"} />
              <DetailField label="Product Type" value={designRequirement.designProductType || "-"} />
              <DetailField label="Size" value={designRequirement.designSize || "-"} />
              <DetailField label="Orientation" value={designRequirement.designOrientation || "-"} />
              <DetailField label="Description" value={designRequirement.designDescription || "-"} className="col-12" multiline />
              <DetailField label="Additional Notes" value={designRequirement.designAdditionalNotes || designRequirement.requirementNotes || "-"} className="col-12" multiline />
              {renderDownloadFile("Brand Guidelines", designRequirement.designBrandGuidelinesFileName, designRequirement.designBrandGuidelinesFilePath)}
              {renderDownloadFile("Logo File", designRequirement.designLogoFileName, designRequirement.designLogoFilePath)}
            </div>
          </div>
        </div>
      )}

      {!stockRequest && (
        <div className="card mb-3 border-warning">
          <div className="card-body text-warning">
            <i className="ti ti-alert-circle me-2"></i>No stock request created yet.
          </div>
        </div>
      )}

      <FilePreviewModal
        show={Boolean(previewFile)}
        fileName={previewFile?.fileName}
        filePath={previewFile?.filePath}
        onClose={() => setPreviewFile(null)}
        onError={showError}
      />
    </div>
  );
}
