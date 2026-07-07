import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { getDealById } from "../../api/dealsApi";
import {
  startDesignWork as apiStartDesignWork,
  uploadDesignDraft as apiUploadDesignDraft,
  uploadFinalDesign as apiUploadFinalDesign,
} from "../../api/dealsApi";
import { downloadLeadChatAttachment, getLeadChatMessages } from "../../api/leadsApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  } catch {
    return String(value);
  }
}

async function downloadFile(filePath, fileName) {
  if (!filePath || !fileName) return;
  const response = await api.get(filePath, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

const STATUS_ORDER = ["PENDING", "WORK_STARTED", "DRAFT_READY", "FINAL_UPLOADED"];

function statusLabel(s) {
  switch (s) {
    case "PENDING": return "Pending";
    case "WORK_STARTED": return "Work In Progress";
    case "DRAFT_READY": return "Draft Ready";
    case "FINAL_UPLOADED": return "Completed";
    default: return s || "Pending";
  }
}

function statusBadgeColor(s) {
  switch (s) {
    case "PENDING": return "secondary";
    case "WORK_STARTED": return "warning";
    case "DRAFT_READY": return "info";
    case "FINAL_UPLOADED": return "success";
    default: return "secondary";
  }
}

const DESIGN_THREAD_MARKER = "[[design-thread]]";

function hasDesignThreadMarker(value) {
  return String(value || "").trimStart().startsWith(DESIGN_THREAD_MARKER);
}

function stripDesignThreadMarker(value) {
  const raw = String(value || "");
  if (!hasDesignThreadMarker(raw)) return raw;
  const startTrimmed = raw.trimStart();
  const withoutMarker = startTrimmed.slice(DESIGN_THREAD_MARKER.length);
  return withoutMarker.replace(/^\s+/, "");
}

function getDesignThreadText(message) {
  return stripDesignThreadMarker(message || "").trim();
}

function isDesignActivityRow(row) {
  const text = getDesignThreadText(row?.message).toLowerCase();
  return (
    text.startsWith("work started") ||
    /draft\s*v?\d+/i.test(text) ||
    text === "final design uploaded"
  );
}

export default function DesignWorkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draftFile, setDraftFile] = useState(null);
  const [finalFile, setFinalFile] = useState(null);
  const [draftLogRows, setDraftLogRows] = useState([]);
  const [activityLogRows, setActivityLogRows] = useState([]);
  const [localActivityRows, setLocalActivityRows] = useState([]);

  useEffect(() => {
    if (!id) return;
    loadDeal();
  }, [id]);

  useEffect(() => {
    if (!deal?.sourceLeadId) {
      setDraftLogRows([]);
      setActivityLogRows([]);
      setLocalActivityRows([]);
      return;
    }
    loadActivityLog(deal.sourceLeadId);
  }, [deal?.sourceLeadId]);

  const loadDeal = async () => {
    setLoading(true);
    try {
      const data = await getDealById(id);
      setDeal(data);
    } catch (err) {
      showError("Failed to load deal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async (leadId) => {
    try {
      // Disabled chat/customer-side data loading for now
      // const rows = await getLeadChatMessages(leadId, "CUSTOMER");
      // const sourceRows = Array.isArray(rows) ? rows : [];
      // const draftRows = sourceRows
      //   .filter((row) => /draft\s*v?\d+/i.test(getDesignThreadText(row?.message)) && row?.attachmentName)
      //   .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
      // const activityRows = sourceRows
      //   .filter((row) => isDesignActivityRow(row))
      //   .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
      // setDraftLogRows(draftRows);
      // setActivityLogRows(activityRows);
      
      setDraftLogRows([]);
      setActivityLogRows([]);
    } catch (err) {
      if (err?.response?.status === 404) {
        setDraftLogRows([]);
        setActivityLogRows([]);
        return;
      }
      console.error(err);
      setDraftLogRows([]);
      setActivityLogRows([]);
    }
  };

  const handleDownloadDraftLogFile = async (message) => {
    if (!deal?.sourceLeadId || !message?.id) return;
    try {
      const blob = await downloadLeadChatAttachment(deal.sourceLeadId, message.id);
      if (!blob) {
        showError("Draft file not available");
        return;
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = message.attachmentName || `draft-${message.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      showError("Failed to download draft");
    }
  };

  const appendLocalActivityRow = (row) => {
    setLocalActivityRows((prev) => {
      const next = [row, ...prev];
      return next.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    });
  };

  const mergedActivityRows = [...activityLogRows, ...localActivityRows]
    .filter((row, index, arr) => {
      const key = `${row?.id || ""}|${row?.message || ""}|${row?.attachmentName || ""}|${row?.createdAt || ""}`;
      return arr.findIndex((item) => `${item?.id || ""}|${item?.message || ""}|${item?.attachmentName || ""}|${item?.createdAt || ""}` === key) === index;
    })
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

  const handleStartWork = async () => {
    setSaving(true);
    try {
      const updated = await apiStartDesignWork(id);
      setDeal(updated);
      appendLocalActivityRow({
        id: `local-work-started-${Date.now()}`,
        message: "Work started",
        createdAt: new Date().toISOString(),
      });
      if (updated?.sourceLeadId) {
        await loadActivityLog(updated.sourceLeadId);
      } else if (deal?.sourceLeadId) {
        await loadActivityLog(deal.sourceLeadId);
      }
      showSuccess("Work started successfully!");
    } catch (err) {
      showError("Failed to start work");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDraft = async () => {
    if (!draftFile) return;
    setSaving(true);
    try {
      const updated = await apiUploadDesignDraft(id, draftFile);
      setDeal(updated);
      appendLocalActivityRow({
        id: `local-draft-${Date.now()}`,
        message: `Draft V${draftVersion} uploaded`,
        attachmentName: draftFile?.name || updated?.designDraftFileName || "",
        createdAt: new Date().toISOString(),
      });
      if (updated?.sourceLeadId) {
        await loadActivityLog(updated.sourceLeadId);
      } else if (deal?.sourceLeadId) {
        await loadActivityLog(deal.sourceLeadId);
      }
      setDraftFile(null);
      const inp = document.getElementById("draft-file-input");
      if (inp) inp.value = "";
      showSuccess("Draft uploaded! Status updated to Draft Ready.");
    } catch (err) {
      showError("Failed to upload draft");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFinal = async () => {
    if (!finalFile) return;
    setSaving(true);
    try {
      const updated = await apiUploadFinalDesign(id, finalFile);
      setDeal(updated);
      appendLocalActivityRow({
        id: `local-final-${Date.now()}`,
        message: "Final design uploaded",
        attachmentName: finalFile?.name || updated?.designFinalFileName || "",
        createdAt: new Date().toISOString(),
      });
      if (updated?.sourceLeadId) {
        await loadActivityLog(updated.sourceLeadId);
      } else if (deal?.sourceLeadId) {
        await loadActivityLog(deal.sourceLeadId);
      }
      setFinalFile(null);
      const inp = document.getElementById("final-file-input");
      if (inp) inp.value = "";
      showSuccess("Final file uploaded! Order is now moving to Delivery.");
    } catch (err) {
      showError("Failed to upload final file");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="content">
        <div className="container-fluid text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="content">
        <div className="container-fluid">
          <div className="alert alert-danger">Deal not found</div>
          <button className="btn btn-secondary" onClick={() => navigate("/deals")}>Back to Deals</button>
        </div>
      </div>
    );
  }

  const designStatus = deal.designRequestStatus || "PENDING";
  const draftVersion = (deal.designDraftCount || 0) + 1;
  const hasDraft = !!deal.designDraftFileName;
  const hasFeedback = !!deal.designSalesFeedback;
  const isFinalUploaded = designStatus === "FINAL_UPLOADED";
  const hasFinalFile = !!deal.designFinalFileName;

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="row mb-3">
          <div className="col-12">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
              <i className="ti ti-arrow-left me-2"></i>Back 
            </button>
          </div>
        </div>

        {/* Deal Header */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h4 className="card-title mb-1">{deal.projectName || deal.name}</h4>
                <p className="text-muted mb-0">{deal.email} &nbsp;|&nbsp; {deal.mobile}</p>
              </div>
              <div className="col-md-4 text-md-end">
                <span className="badge bg-light text-dark me-2">{deal.status}</span>
                <span className={`badge bg-${statusBadgeColor(designStatus)}`}>
                  {statusLabel(designStatus)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Progress */}
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Workflow Progress</h6>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {STATUS_ORDER.map((s, i) => {
                const currentIdx = STATUS_ORDER.indexOf(designStatus);
                const isDone = currentIdx > i;
                const isCurrent = designStatus === s;
                return (
                  <div key={s} className="d-flex align-items-center gap-2">
                    <span className={`badge ${isCurrent ? `bg-${statusBadgeColor(s)}` : isDone ? "bg-success" : "bg-secondary bg-opacity-25 text-muted"}`}>
                      {isDone && <i className="ti ti-check me-1"></i>}
                      {statusLabel(s)}
                    </span>
                    {i < STATUS_ORDER.length - 1 && <i className="ti ti-chevron-right text-muted small"></i>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {mergedActivityRows.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-history me-2"></i>Design Activity Log
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                {mergedActivityRows.map((row, index) => (
                  <div
                    key={row.id || `${row.createdAt || "activity"}-${index}`}
                    className="d-flex align-items-start justify-content-between gap-3 flex-wrap border rounded p-3"
                  >
                    <div>
                      <div className="fw-semibold">{getDesignThreadText(row.message) || "Activity"}</div>
                      {row.attachmentName && (
                        <div className="text-muted small text-break">{row.attachmentName}</div>
                      )}
                      <div className="text-muted small">On {formatDateTime(row.createdAt)}</div>
                    </div>
                    {row.attachmentName && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        onClick={() => handleDownloadDraftLogFile(row)}
                      >
                        <i className="ti ti-download me-1"></i>Download
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Start Work */}
        {designStatus === "PENDING" && (
          <div className="card mb-4 border-warning">
            <div className="card-body text-center py-5">
              <i className="ti ti-palette display-4 text-warning mb-3"></i>
              <h5>Ready to start working on this design?</h5>
              <p className="text-muted">Click below to begin. The team will be notified.</p>
              <button className="btn btn-lg btn-primary mt-2" onClick={handleStartWork} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-player-play me-2"></i>}
                Start Work
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Upload Draft */}
        {(designStatus === "WORK_STARTED" || designStatus === "DRAFT_READY" || designStatus === "FEEDBACK_SENT") && !isFinalUploaded && (
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <i className="ti ti-cloud-upload me-2"></i>Upload Design Draft
              </h5>
              {hasDraft && (
                <span className="badge bg-info">V{deal.designDraftCount} uploaded</span>
              )}
            </div>
            <div className="card-body">
              {hasDraft && (
                <div className="alert alert-info d-flex align-items-center gap-3 mb-4">
                  <i className="ti ti-file fs-4"></i>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">Latest: {deal.designDraftFileName}</div>
                    <small className="text-muted">Version {deal.designDraftCount}</small>
                  </div>
                  {deal.designDraftFilePath && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info"
                      onClick={() => downloadFile(deal.designDraftFilePath, deal.designDraftFileName)}
                    >
                      <i className="ti ti-download me-1"></i>Download
                    </button>
                  )}
                </div>
              )}
              <div className="row g-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label fw-semibold">
                    Upload Draft V{draftVersion}
                    {hasDraft && <span className="text-muted ms-2 small">(uploads new version)</span>}
                  </label>
                  <input
                    id="draft-file-input"
                    className="form-control"
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.psd,.ai,.svg,.zip"
                    onChange={(e) => setDraftFile(e.target.files?.[0] || null)}
                  />
                  <small className="text-muted">PNG, JPG, PDF, PSD, AI, SVG, ZIP</small>
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleUploadDraft}
                    disabled={saving || !draftFile}
                  >
                    {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-upload me-2"></i>}
                    Upload V{draftVersion}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Feedback from Sales */}
        {hasFeedback && (
          <div className="card mb-4 border-primary">
            <div className="card-header" style={{ background: "#e8f0fe" }}>
              <h5 className="card-title mb-0 text-primary">
                <i className="ti ti-message-circle me-2"></i>Feedback from Sales Team
              </h5>
            </div>
            <div className="card-body">
              {deal.designSalesFeedback.split("\n---\n").map((fb, i) => (
                <div key={i} className="p-3 rounded mb-2 border-start border-primary border-3" style={{ background: "#f0f4ff" }}>
                  <div className="fw-semibold text-primary mb-1 small">Feedback #{i + 1}</div>
                  <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{fb}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Upload Final File — No approval required */}
        {(designStatus === "DRAFT_READY" || designStatus === "WORK_STARTED" || designStatus === "FEEDBACK_SENT") && !isFinalUploaded && hasDraft && (
          <div className="card mb-4 border-success">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="ti ti-circle-check me-2"></i>Upload Final Print-Ready File
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-success mb-4">
                <i className="ti ti-info-circle me-2"></i>Draft is ready. Upload the final print-ready file to complete this request and move it to Delivery.
              </div>
              <div className="row g-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label fw-semibold">Final Print-Ready File</label>
                  <input
                    id="final-file-input"
                    className="form-control"
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.psd,.ai,.svg,.zip,.tiff,.eps"
                    onChange={(e) => setFinalFile(e.target.files?.[0] || null)}
                  />
                  <small className="text-muted">High-res: PDF, AI, PSD, TIFF, EPS</small>
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-success w-100"
                    onClick={handleUploadFinal}
                    disabled={saving || !finalFile}
                  >
                    {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-upload me-2"></i>}
                    Upload Final File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {isFinalUploaded && (
          <div className="card mb-4 border-success">
            <div className="card-body text-center py-5">
              <i className="ti ti-circle-check-filled display-4 text-success mb-3"></i>
              <h4 className="text-success">Design Workflow Complete!</h4>
              <p className="text-muted">The final print-ready file has been delivered.</p>
              {hasFinalFile && (
                <button
                  type="button"
                  className="btn btn-outline-success mt-2"
                  onClick={() => downloadFile(deal.designFinalFilePath, deal.designFinalFileName)}
                >
                  <i className="ti ti-download me-2"></i>Download Final File ({deal.designFinalFileName})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
