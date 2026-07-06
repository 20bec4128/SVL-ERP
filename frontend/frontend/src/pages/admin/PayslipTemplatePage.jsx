import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPayslipTemplate, savePayslipTemplate } from "../../api/payslipTemplateApi";
import "./QuotationPage.css";
import "./QuotationTemplatePage.css";

const EMPTY_FORM = {
  companyName: "",
  companyTagline: "",
  address: "",
  phone1: "",
  phone2: "",
  workPhone: "",
  email: "",
  website: "",
  gstin: "",
  udyamNumber: "",
  logoBase64: null,
  topImageBase64: null,
  bottomImageBase64: null,
  signatureBase64: null,
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

function convertImageToPng(dataUrl, maxPxWidth = 400) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.includes(",")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const srcW = img.naturalWidth || 400;
        const srcH = img.naturalHeight || 150;
        const scale = Math.min(1, maxPxWidth / srcW);
        const outW = Math.round(srcW * scale);
        const outH = Math.round(srcH * scale);
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(img, 0, 0, outW, outH);
        const output = canvas.toDataURL("image/png");
        resolve(output);
      } catch (_e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function PayslipTemplatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setLoading(true);
    getPayslipTemplate()
      .then((data) => {
        if (data && typeof data === "object") {
          setForm({
            ...EMPTY_FORM,
            ...data,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(field, value) {
    setSaveStatus("");
    setSaveError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(field, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      setSaveStatus("");
      setSaveError("");
      const rawBase64 = loadEvent.target?.result || null;
      if (rawBase64) {
        const widthLimit = field === "logoBase64" ? 400 : (field === "signatureBase64" ? 300 : 1200);
        const pngBase64 = await convertImageToPng(rawBase64, widthLimit);
        setForm((prev) => ({ ...prev, [field]: pngBase64 }));
      } else {
        setForm((prev) => ({ ...prev, [field]: null }));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveStatus("");
    setSaveError("");

    try {
      await savePayslipTemplate(form);
      setSaveStatus("success");
    } catch (error) {
      setSaveError(error?.response?.data?.message || "Failed to save template.");
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="qp-page">
        <div className="qt-loading-card qp-card">Loading template settings...</div>
      </div>
    );
  }

  return (
    <div className="qp-page">
      <div className="qp-header">
        <button className="qp-btn-ghost" onClick={() => navigate("/payslip")}>
          <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
          Back
        </button>

        <div className="qp-header-center">
          <div className="qp-title">Payslip Template</div>
          <div className="qp-subtitle">Configure company details and banners for Payslips</div>
        </div>

        <div className="qt-header-actions">
          <button
            type="button"
            className="qp-btn-save"
            style={{ background: "#45597a", color: "#fff" }}
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
          Template saved successfully.
        </div>
      )}
      {saveStatus === "error" && (
        <div className="qt-save-alert error">
          <i className="ti ti-alert-circle" style={{ fontSize: 16 }} />
          {saveError}
        </div>
      )}

      <div className="qp-card">
        <div className="qp-card-label">Company Info</div>

        <div className="qt-fields-grid qt-fields-grid-3">
          <div className="qp-field-group">
            <div className="qp-field-label">Company Name</div>
            <input className="qp-field-input" value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Company Tagline</div>
            <input className="qp-field-input" value={form.companyTagline} onChange={(e) => handleChange("companyTagline", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Email</div>
            <input className="qp-field-input" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Website</div>
            <input className="qp-field-input" value={form.website} onChange={(e) => handleChange("website", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">GSTIN</div>
            <input className="qp-field-input" value={form.gstin} onChange={(e) => handleChange("gstin", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">UDYAM Number</div>
            <input className="qp-field-input" value={form.udyamNumber} onChange={(e) => handleChange("udyamNumber", e.target.value)} />
          </div>
        </div>

        <div className="qt-section-space">
          <div className="qp-field-group">
            <div className="qp-field-label">Address</div>
            <textarea className="qp-field-input" rows={3} value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
          </div>
        </div>

        <div className="qt-fields-grid qt-fields-grid-3 qt-section-space">
          <div className="qp-field-group">
            <div className="qp-field-label">Phone 1</div>
            <input className="qp-field-input" value={form.phone1} onChange={(e) => handleChange("phone1", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Phone 2</div>
            <input className="qp-field-input" value={form.phone2} onChange={(e) => handleChange("phone2", e.target.value)} />
          </div>
          <div className="qp-field-group">
            <div className="qp-field-label">Work Phone</div>
            <input className="qp-field-input" value={form.workPhone} onChange={(e) => handleChange("workPhone", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">Banners &amp; Logo</div>
        <div className="qt-upload-sections" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          <ImageUploadBlock
            label="Top Banner (Header Image)"
            helperLabel="Full-width header image. Recommended aspect ratio: 6:1 (e.g. 1200x200 px)."
            maxPreviewHeight={120}
            value={form.topImageBase64}
            onChange={(e) => handleImageChange("topImageBase64", e)}
            onClear={() => handleChange("topImageBase64", null)}
          />
          <ImageUploadBlock
            label="Center Logo"
            helperLabel="Company logo displayed in the header. Use high quality PNG with white or transparent background."
            maxPreviewHeight={120}
            value={form.logoBase64}
            onChange={(e) => handleImageChange("logoBase64", e)}
            onClear={() => handleChange("logoBase64", null)}
          />
          <ImageUploadBlock
            label="Bottom Banner (Footer Image)"
            helperLabel="Full-width footer image. Recommended aspect ratio: 8:1 (e.g. 1200x150 px)."
            maxPreviewHeight={120}
            value={form.bottomImageBase64}
            onChange={(e) => handleImageChange("bottomImageBase64", e)}
            onClear={() => handleChange("bottomImageBase64", null)}
          />
        </div>
      </div>

      <div className="qp-card">
        <div className="qp-card-label">Authorised Signature</div>
        <div className="qt-upload-sections qt-upload-sections-single">
          <ImageUploadBlock
            label="Authorised Signature"
            helperLabel="Signature shown at bottom right of Payslip PDF"
            maxPreviewHeight={80}
            value={form.signatureBase64}
            onChange={(e) => handleImageChange("signatureBase64", e)}
            onClear={() => handleChange("signatureBase64", null)}
          />
        </div>
      </div>
    </div>
  );
}
