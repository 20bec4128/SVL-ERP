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

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function DetailField({ label, value, className = "col-md-4", multiline = false }) {
  return (
    <div className={className}>
      <div className="border rounded p-3 h-100 bg-light">
        <label className="form-label fw-bold text-dark mb-2">{label}</label>
        <div
          className="text-muted"
          style={multiline ? { whiteSpace: "pre-wrap", wordWrap: "break-word" } : undefined}
        >
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
  const [startingWork, setStartingWork] = useState(false);
  const [completingWork, setCompletingWork] = useState(false);
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
          // use the most recent stock request for this lead
          const sortedStock = Array.isArray(stockRows)
            ? stockRows.sort((a, b) => b.id - a.id)
            : [];
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

  const handleStartWork = async () => {
    try {
      setStartingWork(true);
      await updateProductionWorkStatus(dealId, "Started");
      setDeal((prev) => ({ ...prev, productionWorkStatus: "Started" }));
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to start work"));
    } finally {
      setStartingWork(false);
    }
  };

  const handleCompleteProduction = async () => {
    try {
      setCompletingWork(true);
      await updateProductionWorkStatus(dealId, "Completed");
      setDeal((prev) => ({ ...prev, productionWorkStatus: "Completed" }));
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to complete production"));
    } finally {
      setCompletingWork(false);
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

  const renderDownloadFile = (
    label,
    fileName,
    filePath,
    buttonClass = "btn-outline-secondary",
  ) => {
    if (!fileName) return null;
    return (
      <div className="col-md-6">
        <div className="border rounded p-3 h-100 bg-light">
          <label className="form-label fw-bold text-dark mb-2">{label}</label>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="text-muted text-break">{fileName}</span>
            {filePath && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setPreviewFile({ fileName, filePath })}
                >
                  <i className="ti ti-eye me-1"></i>View
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${buttonClass}`}
                  onClick={() => downloadDealFile(filePath, fileName)}
                >
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

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div className="my-auto mb-2">
          <h2 className="mb-1">Production Request Details</h2>
        </div>
        <div className="d-flex gap-2">
          {deal.productionWorkStatus !== "Started" && deal.productionWorkStatus !== "Completed" && (
            <button
              className="btn btn-sm btn-success"
              onClick={handleStartWork}
              disabled={startingWork}
            >
              <i className="ti ti-play me-1"></i>
              {startingWork ? "Starting..." : "Start Work"}
            </button>
          )}
          {deal.productionWorkStatus === "Started" && (
            <button
              className="btn btn-sm btn-success"
              onClick={handleCompleteProduction}
              disabled={completingWork}
            >
              <i className="ti ti-check me-1"></i>
              {completingWork ? "Completing..." : "Production Completed"}
            </button>
          )}
          <button className="btn btn-sm btn-secondary" onClick={() => navigate("/production")}>
            <i className="ti ti-arrow-left me-1"></i>Back to Production
          </button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header"><h5 className="mb-0">Production Work Status</h5></div>
        <div className="card-body">
          <span className={`badge ${
            deal.productionWorkStatus === "Completed"
              ? "bg-success"
              : deal.productionWorkStatus === "Started"
              ? "bg-info"
              : "bg-secondary"
          }`}>{deal.productionWorkStatus || "Not Started"}</span>
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
              <DetailField label="Custom Product Type" value={designRequirement.designCustomProductType || "-"} />
              <DetailField label="Size" value={designRequirement.designSize || "-"} />
              <DetailField label="Custom Size" value={designRequirement.designCustomSize || "-"} />
              <DetailField label="Orientation" value={designRequirement.designOrientation || "-"} />
              <DetailField label="Pages" value={designRequirement.designNumPages || "-"} />
              <DetailField label="Purpose" value={designRequirement.designPurpose || "-"} />
              <DetailField label="Custom Purpose" value={designRequirement.designCustomPurpose || "-"} />
              <DetailField label="Target Audience" value={designRequirement.designTargetAudience || "-"} className="col-12" multiline />
              <DetailField label="Style Preference" value={designRequirement.designStylePref || "-"} className="col-12" multiline />
              <DetailField label="Brand Colors" value={designRequirement.designBrandColors || "-"} />
              <DetailField label="Fonts" value={designRequirement.designFonts || "-"} />
              <DetailField label="Description" value={designRequirement.designDescription || "-"} className="col-12" multiline />
              <DetailField label="Text Content" value={designRequirement.designTextContent || "-"} className="col-12" multiline />
              <DetailField label="Website" value={designRequirement.designWebsite || "-"} />
              <DetailField label="Phone" value={designRequirement.designPhone || "-"} />
              <DetailField label="Address" value={designRequirement.designAddress || "-"} className="col-12" multiline />
              <DetailField label="Social Media" value={designRequirement.designSocialMedia || "-"} className="col-12" multiline />
              <DetailField label="QR Code" value={designRequirement.designQrCode || "-"} />
              <DetailField label="Reference Links" value={designRequirement.designReferenceLinks || "-"} className="col-12" multiline />
              <DetailField label="Deadline" value={designRequirement.designDeadline ? formatDateTime(designRequirement.designDeadline) : "-"} />
              <DetailField label="Priority" value={designRequirement.designPriority || "-"} />
              <DetailField label="Additional Notes" value={designRequirement.designAdditionalNotes || designRequirement.requirementNotes || "-"} className="col-12" multiline />
              <DetailField label="Restrictions" value={designRequirement.designRestrictions || "-"} className="col-12" multiline />
              <DetailField label="Color Preferences" value={designRequirement.designColorPrefs || "-"} className="col-12" multiline />
              {renderDownloadFile("Requirement File", designRequirement.requirementFileName, designRequirement.requirementFilePath, "btn-outline-info")}
              {renderDownloadFile("Brand Guidelines", designRequirement.designBrandGuidelinesFileName, designRequirement.designBrandGuidelinesFilePath, "btn-outline-secondary")}
              {renderDownloadFile("Logo File", designRequirement.designLogoFileName, designRequirement.designLogoFilePath, "btn-outline-secondary")}
              {renderDownloadFile("Client Images", designRequirement.designImagesFileName, designRequirement.designImagesFilePath, "btn-outline-secondary")}
              {renderDownloadFile("Reference Images", designRequirement.designReferenceImagesFileName, designRequirement.designReferenceImagesFilePath, "btn-outline-secondary")}
              {renderDownloadFile("Previous Designs", designRequirement.designPreviousDesignsFileName, designRequirement.designPreviousDesignsFilePath, "btn-outline-secondary")}
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
