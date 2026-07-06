import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listQuotationTemplates,
  createQuotationTemplate,
  updateQuotationTemplate,
  deleteQuotationTemplate,
  activateQuotationTemplate
} from "../../api/quotationTemplateApi";
import "./QuotationPage.css";
import "./QuotationTemplatePage.css";

const EMPTY_FORM = {
  templateName: "",
  templateVariant: "standard",
  companyName: "",
  companyTagline: "",
  address: "",
  phone1: "",
  phone2: "",
  workPhone: "",
  email: "",
  website: "",
  gstin: "",
  stateCode: "",
  stateName: "",
  udyamNumber: "",
  logoBase64: null,
  signatureBase64: null,
  qrCodeBase64: null,
  watermarkBase64: null,
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branch: "",
  validityDays: 30,
  preparedByDefault: "",
  approvedByDefault: "",
  policyText: "",
  letterheadMode: "separate",
  singleBgImageBase64: null,
  topImageBase64: null,
  bottomImageBase64: null,
  active: false
};

function ImageUploadBlock({ label, helperLabel, maxPreviewHeight, value, onChange, onClear }) {
  const inputRef = useRef(null);

  return (
    <div className="qt-upload-block">
      <div className="qp-field-label">{label}</div>
      <div className="qt-upload-area" onClick={() => inputRef.current?.click()}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="qt-upload-hidden"
          onChange={onChange}
          onClick={(event) => event.stopPropagation()}
        />
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              className="qt-preview-img"
              style={{ maxHeight: maxPreviewHeight }}
            />
            <button
              type="button"
              className="qt-preview-clear"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              title="Remove image"
            >
              <i className="ti ti-x" />
            </button>
          </>
        ) : (
          <div className="qt-upload-placeholder">
            <i className="ti ti-cloud-upload" />
            <span className="qt-upload-placeholder-label">Click to upload</span>
            <span className="qt-upload-helper">PNG, JPG accepted</span>
          </div>
        )}
      </div>
      <div className="qt-upload-note">{helperLabel}</div>
    </div>
  );
}

export default function QuotationTemplatePage() {
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // "list" or "form"
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  function loadTemplates() {
    setLoading(true);
    listQuotationTemplates()
      .then((data) => {
        if (Array.isArray(data)) {
          setTemplates(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function handleAdd() {
    const hasPremiumTemplate = templates.some(
      (tpl) => String(tpl.templateVariant || "").toLowerCase() === "premium"
    );
    setForm({
      ...EMPTY_FORM,
      templateName: hasPremiumTemplate ? `Template ${templates.length + 1}` : "Premium Template",
      templateVariant: hasPremiumTemplate ? "standard" : "premium",
    });
    setIsEdit(false);
    setView("form");
    setSaveStatus("");
    setSaveError("");
  }

  function handleEdit(tpl) {
    setForm({
      ...EMPTY_FORM,
      ...tpl,
      validityDays: Number(tpl.validityDays) || 30
    });
    setIsEdit(true);
    setView("form");
    setSaveStatus("");
    setSaveError("");
  }

  function handleDelete(id, event) {
    event.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    deleteQuotationTemplate(id)
      .then(() => {
        loadTemplates();
      })
      .catch((error) => {
        alert(error?.response?.data?.message || "Failed to delete template.");
      });
  }

  function handleToggleActive(tpl, event) {
    event.stopPropagation();
    if (tpl.active) return; // Already active, cannot toggle off directly (must activate another)

    activateQuotationTemplate(tpl.id)
      .then(() => {
        loadTemplates();
      })
      .catch((error) => {
        alert(error?.response?.data?.message || "Failed to activate template.");
      });
  }

  function handleChange(field, value) {
    setSaveStatus("");
    setSaveError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(field, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setSaveStatus("");
      setSaveError("");
      handleChange(field, loadEvent.target?.result || null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleSave() {
    if (!form.templateName || !form.templateName.trim()) {
      setSaveError("Template name is required.");
      setSaveStatus("error");
      return;
    }

    setIsSaving(true);
    setSaveStatus("");
    setSaveError("");

    try {
      const payload = {
        ...form,
        validityDays: Number(form.validityDays) || 30
      };

      if (isEdit) {
        await updateQuotationTemplate(form.id, payload);
      } else {
        await createQuotationTemplate(payload);
      }
      setSaveStatus("success");
      setTimeout(() => {
        setView("list");
        loadTemplates();
      }, 1000);
    } catch (error) {
      setSaveError(error?.response?.data?.message || "Failed to save template.");
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading && templates.length === 0) {
    return (
      <div className="qp-page">
        <div className="qt-loading-card qp-card">Loading quotation templates...</div>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="qp-page">
        <div className="qp-header">
          <button className="qp-btn-ghost" onClick={() => navigate("/quotation")}>
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
            Back to Quotations
          </button>

          <div className="qp-header-center">
            <div className="qp-title">Quotation Templates</div>
            <div className="qp-subtitle">Manage multiple layout formats for your quotations</div>
          </div>

          <div className="qt-header-actions">
            <button
              type="button"
              className="qt-btn qt-btn-primary"
              onClick={handleAdd}
            >
              <i className="ti ti-plus" style={{ fontSize: 14 }} />
              Add Template
            </button>
          </div>
        </div>

        <div className="qt-list-container">
          {templates.map((tpl) => (
            <div key={tpl.id} className={`qt-template-card ${tpl.active ? "active" : ""}`}>
              <div className="qt-card-header">
                <span className="qt-template-title">{tpl.templateName || "Unnamed Template"}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span
                    className={`qt-status-badge ${String(tpl.templateVariant || "standard").toLowerCase() === "premium" ? "inactive" : "active"}`}
                    style={{ textTransform: "capitalize" }}
                  >
                    {String(tpl.templateVariant || "standard").toLowerCase() === "premium" ? "Premium" : "Standard"}
                  </span>
                  <span className={`qt-status-badge ${tpl.active ? "active" : "inactive"}`}>
                    {tpl.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="qt-company-subtitle">
                <strong>{tpl.companyName || "No Company Name"}</strong>
                <br />
                {tpl.email && <span>{tpl.email}</span>}
                {tpl.phone1 && <span> | {tpl.phone1}</span>}
              </div>

              <div className="qt-card-footer">
                <div
                  className="qt-switch-container"
                  onClick={(e) => handleToggleActive(tpl, e)}
                >
                  <label className="qt-switch">
                    <input
                      type="checkbox"
                      checked={tpl.active}
                      onChange={() => {}} // handled by click container
                    />
                    <span className="qt-slider"></span>
                  </label>
                  <span className="qt-switch-label">Active</span>
                </div>

                <div className="qt-actions-row">
                  <button
                    type="button"
                    className="qt-btn qt-btn-secondary"
                    onClick={() => handleEdit(tpl)}
                  >
                    <i className="ti ti-edit" />
                    Edit
                  </button>
                  {!tpl.active && (
                    <button
                      type="button"
                      className="qt-btn qt-btn-danger"
                      onClick={(e) => handleDelete(tpl.id, e)}
                    >
                      <i className="ti ti-trash" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="qp-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              <i className="ti ti-file-text" style={{ fontSize: "48px", color: "#94a3b8", marginBottom: "12px" }}></i>
              <div style={{ fontWeight: 600, color: "#475569" }}>No Templates Available</div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Click "Add Template" to create a template configuration.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="qp-page">
      <div className="qp-header">
        <button className="qp-btn-ghost" onClick={() => setView("list")}>
          <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
          Back to List
        </button>

        <div className="qp-header-center">
          <div className="qp-title">{isEdit ? "Edit Quotation Template" : "Add Quotation Template"}</div>
          <div className="qp-subtitle">Configure company details, logo, signature, QR code, and policies</div>
        </div>

        <div className="qt-header-actions">
          <button
            type="button"
            className="qt-btn qt-btn-secondary"
            onClick={() => setView("list")}
          >
            Cancel
          </button>
          <button
            type="button"
            className="qp-btn-save"
            style={{ background: "#45597a", color: "#fff", display: "inline-flex", gap: "6px" }}
            onClick={handleSave}
            disabled={isSaving}
          >
            <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {saveStatus === "success" && (
        <div className="qt-save-alert success">
          <i className="ti ti-circle-check" style={{ fontSize: 16 }} />
          Template saved successfully. Redirecting...
        </div>
      )}
      {saveStatus === "error" && (
        <div className="qt-save-alert error">
          <i className="ti ti-alert-circle" style={{ fontSize: 16 }} />
          {saveError}
        </div>
      )}

      <div className="qp-card">
        <div className="qp-card-label">Template Details</div>
        <div className="qt-fields-grid qt-fields-grid-3">
          <div className="qp-field-group">
            <div className="qp-field-label">Template Name (identifies this format in the list)</div>
            <input
              className="qp-field-input"
              value={form.templateName || ""}
              onChange={(e) => handleChange("templateName", e.target.value)}
              placeholder="e.g. Standard Template, Premium Template"
            />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Layout Style</div>
            <select
              className="qp-field-input"
              value={form.templateVariant || "standard"}
              onChange={(e) => handleChange("templateVariant", e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">Company Info</div>

        <div className="qt-fields-grid qt-fields-grid-3">
          <div className="qp-field-group">
            <div className="qp-field-label">Company Name</div>
            <input className="qp-field-input" value={form.companyName || ""} onChange={(e) => handleChange("companyName", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Company Tagline</div>
            <input className="qp-field-input" value={form.companyTagline || ""} onChange={(e) => handleChange("companyTagline", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Email</div>
            <input className="qp-field-input" type="email" value={form.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Website</div>
            <input className="qp-field-input" value={form.website || ""} onChange={(e) => handleChange("website", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">GSTIN</div>
            <input className="qp-field-input" value={form.gstin || ""} onChange={(e) => handleChange("gstin", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">UDYAM Number</div>
            <input className="qp-field-input" value={form.udyamNumber || ""} onChange={(e) => handleChange("udyamNumber", e.target.value)} />
          </div>
        </div>

        <div className="qt-section-space">
          <div className="qp-field-group">
            <div className="qp-field-label">Address</div>
            <textarea className="qp-field-input" rows={3} value={form.address || ""} onChange={(e) => handleChange("address", e.target.value)} />
          </div>
        </div>

        <div className="qt-fields-grid qt-fields-grid-4 qt-section-space">
          <div className="qp-field-group">
            <div className="qp-field-label">Phone 1</div>
            <input className="qp-field-input" value={form.phone1 || ""} onChange={(e) => handleChange("phone1", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Phone 2</div>
            <input className="qp-field-input" value={form.phone2 || ""} onChange={(e) => handleChange("phone2", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Work Phone</div>
            <input className="qp-field-input" value={form.workPhone || ""} onChange={(e) => handleChange("workPhone", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">State Code</div>
            <input className="qp-field-input" value={form.stateCode || ""} onChange={(e) => handleChange("stateCode", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">State Name</div>
            <input className="qp-field-input" value={form.stateName || ""} onChange={(e) => handleChange("stateName", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">Authorised Signature</div>
        <div className="qt-upload-sections qt-upload-sections-single">
          <ImageUploadBlock
            label="Authorised Signature"
            helperLabel="Signature shown at bottom right of PDF"
            maxPreviewHeight={80}
            value={form.signatureBase64}
            onChange={(e) => handleImageChange("signatureBase64", e)}
            onClear={() => handleChange("signatureBase64", null)}
          />
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">QR Code</div>
        <div className="qt-upload-sections qt-upload-sections-single">
          <ImageUploadBlock
            label="QR Code Image"
            helperLabel="Uploaded QR image appears in the quotation footer."
            maxPreviewHeight={110}
            value={form.qrCodeBase64}
            onChange={(e) => handleImageChange("qrCodeBase64", e)}
            onClear={() => handleChange("qrCodeBase64", null)}
          />
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">Letterhead Banners &amp; Watermark</div>
        <div className="qt-upload-sections" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          <ImageUploadBlock
            label="Top Image (Header Banner)"
            helperLabel="Full-width header image printed at the top of every page. Recommended aspect ratio: 6:1 (e.g. 1200x200 px)."
            maxPreviewHeight={120}
            value={form.topImageBase64}
            onChange={(e) => handleImageChange("topImageBase64", e)}
            onClear={() => handleChange("topImageBase64", null)}
          />
          <ImageUploadBlock
            label="Center Image (Watermark)"
            helperLabel="Faint background image repeated in the center of every PDF page. Use a transparent PNG for best results."
            maxPreviewHeight={120}
            value={form.watermarkBase64}
            onChange={(e) => handleImageChange("watermarkBase64", e)}
            onClear={() => handleChange("watermarkBase64", null)}
          />
          <ImageUploadBlock
            label="Bottom Image (Footer Banner)"
            helperLabel="Full-width footer image printed at the bottom of every page. Recommended aspect ratio: 8:1 (e.g. 1200x150 px)."
            maxPreviewHeight={120}
            value={form.bottomImageBase64}
            onChange={(e) => handleImageChange("bottomImageBase64", e)}
            onClear={() => handleChange("bottomImageBase64", null)}
          />
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">Bank Details</div>
        <div className="qt-fields-grid qt-fields-grid-4">
          <div className="qp-field-group">
            <div className="qp-field-label">Bank Name</div>
            <input className="qp-field-input" value={form.bankName || ""} onChange={(e) => handleChange("bankName", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Account Number</div>
            <input className="qp-field-input" value={form.accountNumber || ""} onChange={(e) => handleChange("accountNumber", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">IFSC Code</div>
            <input className="qp-field-input" value={form.ifscCode || ""} onChange={(e) => handleChange("ifscCode", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Branch</div>
            <input className="qp-field-input" value={form.branch || ""} onChange={(e) => handleChange("branch", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">Quotation Defaults</div>
        <div className="qt-fields-grid qt-fields-grid-3">
          <div className="qp-field-group">
            <div className="qp-field-label">Validity Days</div>
            <input
              className="qp-field-input"
              type="number"
              min="1"
              value={form.validityDays}
              onChange={(e) => handleChange("validityDays", Number(e.target.value) || 30)}
            />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Prepared By Default</div>
            <input className="qp-field-input" value={form.preparedByDefault || ""} onChange={(e) => handleChange("preparedByDefault", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Approved By Default</div>
            <input className="qp-field-input" value={form.approvedByDefault || ""} onChange={(e) => handleChange("approvedByDefault", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">Policy &amp; Guidelines / Terms</div>
        <div className="qp-field-group">
          <div className="qp-field-label">Policy Text</div>
          <div className="qt-upload-note">Each line will appear as a bullet point in the PDF</div>
          <textarea
            className="qp-field-input"
            rows={8}
            value={form.policyText || ""}
            placeholder="one policy point per line"
            onChange={(e) => handleChange("policyText", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
