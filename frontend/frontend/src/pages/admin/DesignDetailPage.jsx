import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDealById } from "../../api/dealsApi";
import { getDesignRequirement } from "../../api/designRequirementApi";
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

function renderValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
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

export default function DesignDetailPage() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [deal, setDeal] = useState(null);
  const [designRequirement, setDesignRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!dealId || !user) return;
      setLoading(true);
      try {
        const data = await getDealById(dealId);
        setDeal(data);
        if (data?.sourceLeadId) {
          const designRow = await getDesignRequirement(data.sourceLeadId).catch(() => null);
          setDesignRequirement(designRow || null);
        } else {
          setDesignRequirement(null);
        }
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load design details"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dealId, user]);

  const downloadProtectedFile = async (filePath, fileName) => {
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

  const renderDownloadFile = (label, fileName, filePath) => {
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
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPreviewFile({ fileName, filePath })}
                >
                  <i className="ti ti-eye me-1"></i>View
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => downloadProtectedFile(filePath, fileName)}
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

  if (loading) {
    return (
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Design Request Details</h2>
          </div>
        </div>
        <div className="text-center p-4">Loading…</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Design Request Details</h2>
          </div>
        </div>
        <div className="text-center p-4 text-muted">Design request not found.</div>
      </div>
    );
  }

  return (
    <div className="content">
      {/* Breadcrumb */}
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div className="my-auto mb-2">
          <h2 className="mb-1">Design Request Details</h2>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/admin-dashboard">
                  <i className="ti ti-smart-home"></i>
                </a>
              </li>
              <li className="breadcrumb-item">CRM</li>
              <li className="breadcrumb-item">
                <a href="/design">Design</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Details
              </li>
            </ol>
          </nav>
        </div>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => navigate("/design")}
        >
          <i className="ti ti-arrow-left me-1"></i>Back to Design Requests
        </button>
      </div>

      {!designRequirement && (
      <div className="card mb-3">
        <div className="card-header">
          <h5 className="mb-0">Requirement Details</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Requirement Type</label>
              <p className="text-muted">{deal.requirementType || "-"}</p>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Requirement File</label>
              <p className="text-muted">
                {deal.requirementFileName ? (
                  <span className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="text-break">{deal.requirementFileName}</span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() =>
                        setPreviewFile({
                          fileName: deal.requirementFileName,
                          filePath: deal.requirementFilePath || `/api/v1/requirements/download/${deal.id}`,
                        })
                      }
                    >
                      <i className="ti ti-eye me-1"></i>View
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() =>
                        downloadProtectedFile(
                          deal.requirementFilePath || `/api/v1/requirements/download/${deal.id}`,
                          deal.requirementFileName,
                        )
                      }
                    >
                      <i className="ti ti-download me-1"></i>Download
                    </button>
                  </span>
                ) : (
                  "-"
                )}
              </p>
            </div>
          </div>
          <div className="row">
            <div className="col-12 mb-3">
              <label className="form-label fw-bold">Requirement Notes</label>
              <p className="text-muted" style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                {deal.requirementNotes || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {designRequirement && (
      <div className="card mb-3">
        <div className="card-header">
          <h5 className="mb-0">Design Requirement Details</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <DetailField label="Requirement Type" value={designRequirement.requirementType || "-"} />
            <DetailField label="Product Type" value={designRequirement.designProductType || "-"} />
            <DetailField label="Size" value={designRequirement.designSize || "-"} />
            <DetailField label="Orientation" value={designRequirement.designOrientation || "-"} />
            <DetailField label="Pages" value={designRequirement.designNumPages || "-"} />
            <DetailField label="Purpose" value={designRequirement.designPurpose || "-"} />
            <DetailField label="Target Audience" value={designRequirement.designTargetAudience || "-"} className="col-md-6" />
            <DetailField label="Style Preference" value={designRequirement.designStylePref || "-"} className="col-md-6" />
            <DetailField label="Brand Colors" value={renderValue(designRequirement.designBrandColors)} className="col-md-6" />
            <DetailField label="Fonts" value={renderValue(designRequirement.designFonts)} className="col-md-6" />
            <DetailField label="Deadline" value={designRequirement.designDeadline ? formatDateTime(designRequirement.designDeadline) : "-"} />
            <DetailField label="Priority" value={designRequirement.designPriority || "-"} />
            <DetailField label="Reference Links" value={designRequirement.designReferenceLinks || "-"} />
            <DetailField label="Description" value={designRequirement.designDescription || "-"} className="col-12" multiline />
            <DetailField label="Text Content" value={renderValue(designRequirement.designTextContent)} className="col-md-4" multiline />
            <DetailField label="Website" value={renderValue(designRequirement.designWebsite)} />
            <DetailField
              label="Phone"
              value={renderValue(`${designRequirement.designPhoneCountryCode || ""} ${designRequirement.designPhone || ""}`.trim())}
            />
            <DetailField label="Address" value={renderValue(designRequirement.designAddress)} />
            <DetailField label="Social Media" value={renderValue(designRequirement.designSocialMedia)} />
            <DetailField label="QR Code" value={renderValue(designRequirement.designQrCode)} />
            <DetailField
              label="Additional Notes"
              value={designRequirement.designAdditionalNotes || designRequirement.requirementNotes || "-"}
              className="col-12"
              multiline
            />
            <DetailField label="Restrictions" value={renderValue(designRequirement.designRestrictions)} className="col-12" multiline />
            <DetailField label="Color Preferences" value={renderValue(designRequirement.designColorPrefs)} className="col-12" multiline />
            {renderDownloadFile(
              "Brand Guidelines",
              designRequirement.designBrandGuidelinesFileName,
              designRequirement.designBrandGuidelinesFilePath,
            )}
            {renderDownloadFile(
              "Logo File",
              designRequirement.designLogoFileName,
              designRequirement.designLogoFilePath,
            )}
            {renderDownloadFile(
              "Client Images",
              designRequirement.designImagesFileName,
              designRequirement.designImagesFilePath,
            )}
            {renderDownloadFile(
              "Reference Images",
              designRequirement.designReferenceImagesFileName,
              designRequirement.designReferenceImagesFilePath,
            )}
            {renderDownloadFile(
              "Previous Designs",
              designRequirement.designPreviousDesignsFileName,
              designRequirement.designPreviousDesignsFilePath,
            )}
          </div>
        </div>
      </div>
      )}

      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014 - 2025 &copy; SmartHR.</p>
        <p>
          Designed &amp; Developed By{" "}
          <a href="javascript:void(0);" className="text-primary">
            Dreams
          </a>
        </p>
      </div>

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
