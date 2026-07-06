import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getEmployeeVerification,
  sendOfferLetterEmail,
  resendProfileCompletionMail,
  verifyEmployeeFields,
} from "../../api/employeesApi";
import { useToast } from "../../components/system/ToastProvider";
import api from "../../utils/api";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { defaultCountryOption } from "../../utils/phoneUtils";

const FIELD_LABELS = {
  PHONE: "Mobile Number",
  DATE_OF_BIRTH: "Date of Birth",
  GENDER: "Gender",
  CURRENT_ADDRESS: "Address",
  AADHAAR_NUMBER: "Aadhaar Number",
  PAN_NUMBER: "PAN Number",
  BANK_ACCOUNT_HOLDER_NAME: "Bank A/C Holder Name",
  BANK_ACCOUNT_NUMBER: "Bank A/C Number",
  BANK_IFSC: "IFSC Code",
  BANK_NAME_BRANCH: "Bank Name & Branch",
};

function statusBadge(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return "badge-success";
  if (s === "REJECTED") return "badge-danger";
  if (s === "PENDING") return "badge-warning";
  return "badge-secondary";
}

export default function EmployeeVerificationPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [fieldDecisions, setFieldDecisions] = useState({});
  const [fieldRemarks, setFieldRemarks] = useState({});
  const [docDecisions, setDocDecisions] = useState({});
  const [docRemarks, setDocRemarks] = useState({});
  const [lastLink, setLastLink] = useState(null);
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState("");
  const [previewMimeType, setPreviewMimeType] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await getEmployeeVerification(employeeId);
      setData(res);
      setLastLink(null);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load verification"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const hasNonApproved = useMemo(() => {
    const anyFieldNonApproved = (data?.fields || [])
      .filter((f) => f?.fieldKey !== "COUNTRY_CODE") // COUNTRY_CODE is treated as part of PHONE
      .some((f) => String(f.status || "").toUpperCase() !== "APPROVED");
    const anyDocNonApproved = (data?.documents || []).some((d) => String(d.status || "").toUpperCase() !== "APPROVED");
    return anyFieldNonApproved || anyDocNonApproved;
  }, [data]);

  const isVerifiedProfile = String(data?.profileStatus || "").toUpperCase() === "VERIFIED";
  const canVerifyProfile = !isVerifiedProfile && hasNonApproved;

  async function handleSave() {
    const countryCodeDecision = fieldDecisions.PHONE;
    const countryCodeRemarks = fieldRemarks.PHONE || "";
    const payload = {
      fieldDecisions: Object.entries(fieldDecisions)
        .filter(([, v]) => v)
        .map(([fieldKey, decision]) => ({
          fieldKey,
          decision,
          remarks: decision === "REJECT" ? (fieldRemarks[fieldKey] || "") : "",
        })),
      documentDecisions: Object.entries(docDecisions)
        .filter(([, v]) => v)
        .map(([documentId, decision]) => ({
          documentId: Number(documentId),
          decision,
          remarks: decision === "REJECT" ? (docRemarks[documentId] || "") : "",
        })),
    };

    // If admin decides on PHONE, apply the same decision to COUNTRY_CODE silently
    // so it doesn't stay pending in verification data.
    if (countryCodeDecision && !fieldDecisions.COUNTRY_CODE) {
      payload.fieldDecisions.push({
        fieldKey: "COUNTRY_CODE",
        decision: countryCodeDecision,
        remarks: countryCodeDecision === "REJECT" ? countryCodeRemarks : "",
      });
    }

    if (payload.fieldDecisions.length === 0 && payload.documentDecisions.length === 0) {
      showError("No changes selected");
      return;
    }

    setSaving(true);
    try {
      const res = await verifyEmployeeFields(employeeId, payload);
      setData(res);
      setFieldDecisions({});
      setFieldRemarks({});
      setDocDecisions({});
      setDocRemarks({});
      showSuccess("Verification updated");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save verification"));
    } finally {
      setSaving(false);
    }
  }

  async function handleResendProfileCompletionMail() {
    setSaving(true);
    try {
      const res = await resendProfileCompletionMail(employeeId);
      setLastLink(res?.publicUrl || null);
      showSuccess("Profile completion mail sent");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to resend profile completion mail"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSendOfferLetterMail() {
    setSaving(true);
    try {
      const res = await sendOfferLetterEmail(employeeId);
      setLastLink(res?.publicUrl || null);
      showSuccess("Offer letter sent");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to send offer letter"));
    } finally {
      setSaving(false);
    }
  }

  const shouldSendOfferLetter = !data?.profileLinkEverGenerated;
  const handleSendMail = shouldSendOfferLetter ? handleSendOfferLetterMail : handleResendProfileCompletionMail;
  const sendMailLabel = shouldSendOfferLetter ? "Send Offer Letter Mail" : "Send Profile Completion Mail";

  const openDocPreview = (doc) => {
    if (!doc) return;
    setPreviewDoc(doc);
    setDocPreviewOpen(true);
  };

  const closeDocPreview = () => {
    setDocPreviewOpen(false);
    setPreviewDoc(null);
    setPreviewBlobUrl("");
    setPreviewMimeType("");
    setPreviewLoading(false);
    setPreviewError("");
  };

  const previewUrl = useMemo(() => {
    const raw = String(previewDoc?.fileUrl || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return raw.startsWith("/") ? raw : `/${raw}`;
  }, [previewDoc]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    async function loadPreview() {
      if (!docPreviewOpen || !previewUrl) return;

      setPreviewLoading(true);
      setPreviewError("");
      setPreviewBlobUrl("");
      setPreviewMimeType("");

      try {
        const response = await api.get(previewUrl, { responseType: "blob" });
        const blob = response?.data;
        const contentType = String(response?.headers?.["content-type"] || blob?.type || "").toLowerCase();

        if (!blob || !(blob instanceof Blob)) {
          throw new Error("Failed to load preview file");
        }
        if (contentType.includes("text/html") || contentType.includes("application/json")) {
          throw new Error("Server returned a page instead of the document file");
        }

        if (!active) return;

        objectUrl = window.URL.createObjectURL(blob);
        setPreviewBlobUrl(objectUrl);
        setPreviewMimeType(contentType || blob.type || "");
      } catch (error) {
        if (!active) return;
        const message = extractApiErrorMessage(error, "Failed to load preview");
        setPreviewError(message);
        showError(message);
      } finally {
        if (active) setPreviewLoading(false);
      }
    }

    loadPreview();

    return () => {
      active = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [docPreviewOpen, previewUrl, showError]);

  const previewKind = useMemo(() => {
    const url = String(previewBlobUrl || previewUrl || "");
    const name = String(previewDoc?.originalFilename || "");
    const pickExt = (value) => {
      const raw = String(value || "");
      if (!raw) return "";
      const withoutQuery = raw.split("?")[0].split("#")[0];
      const lastDot = withoutQuery.lastIndexOf(".");
      if (lastDot < 0) return "";
      return withoutQuery.slice(lastDot + 1).toLowerCase();
    };

    const mime = String(previewMimeType || "").toLowerCase();
    if (mime.startsWith("image/")) return "image";
    if (mime.includes("pdf")) return "pdf";

    const ext = pickExt(name) || pickExt(url);
    if (!url) return "none";
    if (ext === "pdf") return "pdf";
    if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
    return "other";
  }, [previewBlobUrl, previewMimeType, previewDoc, previewUrl]);

  return (
    <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h3 className="page-title mb-1">Verify Employee Profile</h3>
            <div className="text-muted small">Employee ID: {employeeId}</div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button type="button" className="btn btn-light" onClick={load} disabled={loading || saving}>
              Refresh
            </button>
            {canVerifyProfile ? (
              <button className="btn btn-primary" onClick={handleSave} disabled={loading || saving}>
                {saving ? "Saving..." : "Save Decisions"}
              </button>
            ) : (
              <span className="badge bg-success align-self-center px-3 py-2">
                {isVerifiedProfile ? "Verified" : "No Pending Changes"}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="card">
            <div className="card-body">Loading...</div>
          </div>
        ) : (
          <>
            <div className="card mb-3">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-medium">Profile Status</div>
                  <div className="text-muted">{data?.profileStatus || "-"}</div>
                </div>
                <div>
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleSendMail}
                    disabled={saving || !hasNonApproved}
                    title={!hasNonApproved ? "No pending/rejected fields/files" : ""}
                  >
                    {sendMailLabel}
                  </button>
                </div>
              </div>
              {lastLink ? (
                <div className="card-footer">
                  <div className="fw-medium mb-1">Profile completion link</div>
                  <div className="d-flex gap-2 align-items-center">
                    <input className="form-control" readOnly value={lastLink} />
                    <button
                      className="btn btn-light"
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(lastLink)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

                <div className="card mb-3">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Scalar Fields</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table mb-0">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Decision</th>
                            <th>Remarks (for reject)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const fields = Array.isArray(data?.fields) ? data.fields : [];
                            const country = fields.find((x) => x?.fieldKey === "COUNTRY_CODE")?.valuePreview || defaultCountryOption.value;
                            return fields
                              .filter((f) => f?.fieldKey !== "COUNTRY_CODE")
                              .map((f) => {
                                const isPhone = f.fieldKey === "PHONE";
                                const combinedValue = isPhone
                                  ? `${String(country || "").trim()} ${String(f.valuePreview || "").trim()}`.trim()
                                  : (f.valuePreview || "-");
                                return (
                            <tr key={f.fieldKey}>
                              <td>{FIELD_LABELS[f.fieldKey] || f.fieldKey}</td>
                              <td className="text-muted">{combinedValue || "-"}</td>
                              <td>
                                <span className={`badge ${statusBadge(f.status)}`}>{f.status || "N/A"}</span>
                              </td>
                              <td style={{ minWidth: 180 }}>
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${
                                      fieldDecisions[f.fieldKey] === "APPROVE" ? "btn-success" : "btn-outline-success"
                                    }`}
                                    onClick={() =>
                                      setFieldDecisions((p) => ({ ...p, [f.fieldKey]: "APPROVE" }))
                                    }
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${
                                      fieldDecisions[f.fieldKey] === "REJECT" ? "btn-danger" : "btn-outline-danger"
                                    }`}
                                    onClick={() =>
                                      setFieldDecisions((p) => ({ ...p, [f.fieldKey]: "REJECT" }))
                                    }
                                  >
                                    Reject
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() =>
                                      setFieldDecisions((p) => {
                                        const next = { ...p };
                                        delete next[f.fieldKey];
                                        return next;
                                      })
                                    }
                                    title="Clear decision"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </td>
                              <td style={{ minWidth: 260 }}>
                                <input
                                  className="form-control form-control-sm"
                                  value={fieldRemarks[f.fieldKey] || ""}
                                  onChange={(e) =>
                                    setFieldRemarks((p) => ({ ...p, [f.fieldKey]: e.target.value }))
                                  }
                                  disabled={fieldDecisions[f.fieldKey] !== "REJECT"}
                                  placeholder={f.remarks || "Add remarks"}
                                />
                              </td>
                            </tr>
                                );
                              });
                          })()}
                          {((data?.fields || []).filter((f) => f?.fieldKey !== "COUNTRY_CODE")).length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-4 text-muted">
                                No scalar fields configured
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Uploaded Documents</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table mb-0">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>File</th>
                            <th>Status</th>
                            <th>Decision</th>
                            <th>Remarks (for reject)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.documents || []).map((d) => (
                            <tr key={d.id || d.docType}>
                              <td>{d.docType}</td>
                              <td>
                                {d.fileUrl ? (
                                  <div className="d-flex flex-wrap align-items-center gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openDocPreview(d);
                                      }}
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link p-0"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openDocPreview(d);
                                      }}
                                      title="Preview document"
                                    >
                                      {d.originalFilename || d.fileUrl}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-danger">Not Uploaded</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${statusBadge(d.status)}`}>{d.status || "N/A"}</span>
                              </td>
                              <td style={{ minWidth: 180 }}>
                                {d.id ? (
                                  <div className="d-flex gap-2">
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${
                                        docDecisions[d.id] === "APPROVE" ? "btn-success" : "btn-outline-success"
                                      }`}
                                      onClick={() => setDocDecisions((p) => ({ ...p, [d.id]: "APPROVE" }))}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${
                                        docDecisions[d.id] === "REJECT" ? "btn-danger" : "btn-outline-danger"
                                      }`}
                                      onClick={() => setDocDecisions((p) => ({ ...p, [d.id]: "REJECT" }))}
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() =>
                                        setDocDecisions((p) => {
                                          const next = { ...p };
                                          delete next[d.id];
                                          return next;
                                        })
                                      }
                                      title="Clear decision"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted small">-</span>
                                )}
                              </td>
                              <td style={{ minWidth: 260 }}>
                                {d.id ? (
                                  <input
                                    className="form-control form-control-sm"
                                    value={docRemarks[d.id] || ""}
                                    onChange={(e) => setDocRemarks((p) => ({ ...p, [d.id]: e.target.value }))}
                                    disabled={docDecisions[d.id] !== "REJECT"}
                                    placeholder={d.remarks || "Add remarks"}
                                  />
                                ) : (
                                  <span className="text-muted small">Required document missing</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {(data?.documents || []).length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-4 text-muted">
                                No documents uploaded yet
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
          </>
        )}

        {docPreviewOpen && previewDoc ? (
          <>
            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                  <div className="modal-header">
                    <div>
                      <h5 className="modal-title mb-0">Document Preview</h5>
                      <div className="text-muted small">
                        {previewDoc.docType}
                        {previewDoc.originalFilename ? ` • ${previewDoc.originalFilename}` : ""}
                      </div>
                    </div>
                    <button type="button" className="btn-close custom-btn-close" onClick={closeDocPreview} />
                  </div>
                  <div className="modal-body">
                    {previewLoading ? (
                      <div className="d-flex align-items-center justify-content-center py-5">
                        <div className="spinner-border text-primary" role="status" aria-label="Loading preview" />
                      </div>
                    ) : previewError ? (
                      <div className="alert alert-danger mb-0">{previewError}</div>
                    ) : previewKind === "pdf" ? (
                      <iframe
                        title="Document preview"
                        src={`${previewBlobUrl || previewUrl}#toolbar=0&navpanes=0`}
                        style={{ width: "100%", height: "70vh", border: "1px solid #eee", borderRadius: 6 }}
                      />
                    ) : previewKind === "image" ? (
                      <div className="text-center">
                        <img
                          alt={previewDoc.originalFilename || "document"}
                          src={previewBlobUrl || previewUrl}
                          style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 6 }}
                        />
                      </div>
                    ) : (
                      <div className="alert alert-info mb-0">
                        Inline preview is available for PDF and image files. Use Open in new tab to view or download this file.
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <a
                      className={`btn btn-light${previewBlobUrl ? "" : " disabled"}`}
                      href={previewBlobUrl || undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!previewBlobUrl}
                      tabIndex={previewBlobUrl ? undefined : -1}
                    >
                      Open in new tab
                    </a>
                    <button type="button" className="btn btn-primary" onClick={closeDocPreview}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" onClick={closeDocPreview} />
          </>
        ) : null}
    </div>
  );
}
