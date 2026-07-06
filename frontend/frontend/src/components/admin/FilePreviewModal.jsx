import { useEffect, useState } from "react";
import api from "../../utils/api";
import { extractApiErrorMessage } from "../../utils/errorMessage";

function getPreviewKind(mimeType = "", fileName = "") {
  const lowerMime = String(mimeType).toLowerCase();
  const lowerName = String(fileName).toLowerCase();

  if (lowerMime.startsWith("image/")) return "image";
  if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";
  return "unsupported";
}

export default function FilePreviewModal({ show, fileName, filePath, onClose, onError }) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    let localUrl = "";

    const loadPreview = async () => {
      if (!show || !filePath) return;
      setLoading(true);
      setLoadError("");
      setPreviewUrl("");
      setMimeType("");

      try {
        const response = await api.get(filePath, { responseType: "blob" });
        if (!active) return;

        localUrl = window.URL.createObjectURL(response.data);
        setPreviewUrl(localUrl);
        setMimeType(response.data?.type || "");
      } catch (error) {
        if (!active) return;
        const message = extractApiErrorMessage(error, "Failed to load preview");
        setLoadError(message);
        if (typeof onError === "function") onError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      active = false;
      if (localUrl) {
        window.URL.revokeObjectURL(localUrl);
      }
    };
  }, [show, filePath, onError]);

  if (!show) return null;

  const previewKind = getPreviewKind(mimeType, fileName);

  const handleDownload = () => {
    if (!previewUrl) return;
    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = fileName || "download";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleOpenInNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="modal fade show d-block"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className="ti ti-eye"></i>
              File Preview
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <div className="text-muted small">File Name</div>
              <div className="fw-semibold text-break">{fileName || "-"}</div>
            </div>

            {loading && <div className="text-center py-4">Loading preview...</div>}

            {!loading && loadError && (
              <div className="alert alert-danger mb-0">
                <i className="ti ti-alert-circle me-1"></i>
                {loadError}
              </div>
            )}

            {!loading && !loadError && previewUrl && previewKind === "image" && (
              <img
                src={previewUrl}
                alt={fileName || "Preview"}
                className="img-fluid rounded border"
                style={{ maxHeight: "60vh", width: "100%", objectFit: "contain" }}
              />
            )}

            {!loading && !loadError && previewUrl && previewKind === "pdf" && (
              <iframe
                src={previewUrl}
                title={fileName || "PDF Preview"}
                className="w-100 border rounded"
                style={{ height: "60vh" }}
              />
            )}

            {!loading && !loadError && previewUrl && previewKind === "unsupported" && (
              <div className="alert alert-info mb-0">
                <i className="ti ti-info-circle me-1"></i>
                Inline preview is not supported for this file type. Use View or Download.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleOpenInNewTab} disabled={!previewUrl}>
              <i className="ti ti-external-link me-1"></i>View
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleDownload} disabled={!previewUrl}>
              <i className="ti ti-download me-1"></i>Download
            </button>
            <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
