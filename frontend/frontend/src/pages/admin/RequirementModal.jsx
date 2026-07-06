import React, { useCallback, useEffect, useState } from "react";
import { COUNTRY_CODE_OPTIONS, defaultCountryOption, ensureCountryCodeValue, getCountryAllowedLengths, getCountryDisplayMaxLength, getCountryOptionByValue, sanitizePhoneDigits, validatePhoneNumber } from "../../utils/phoneUtils";
import { sendLeadChatAttachment } from "../../api/leadsApi";
import { useToast } from "../../components/system/ToastProvider";

// All form state is managed inside this modal so keystrokes only re-render
// the modal itself — not the large parent page (LeadEditPage/DealEditPage).
const RequirementModal = React.memo(({
  showRequirementModal,
  setShowRequirementModal,
  requirementSaving,
  onSubmit,
}) => {
  const { showError } = useToast();
  const normalizeIsoDateWithFourDigitYear = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return "";
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1 || year > 9999) return "";
    if (month < 1 || month > 12) return "";
    if (day < 1 || day > 31) return "";
    return raw;
  };
  const isSundayIsoDate = (value) => {
    const normalized = normalizeIsoDateWithFourDigitYear(value);
    if (!normalized) return false;
    const [year, month, day] = normalized.split("-").map(Number);
    return new Date(year, month - 1, day).getDay() === 0;
  };
  // ── Form state ────────────────────────────────────────────────────────────
  const [requirementType, setRequirementType] = useState("");
  const [requirementFile, setRequirementFile] = useState(null);
  const [requirementFileName, setRequirementFileName] = useState("");
  const [requirementNotes, setRequirementNotes] = useState("");

  // Design Brief Fields
  const [designProductType, setDesignProductType] = useState("");
  const [designCustomProductType, setDesignCustomProductType] = useState("");
  const [designSize, setDesignSize] = useState("");
  const [designCustomSize, setDesignCustomSize] = useState("");
  const [designOrientation, setDesignOrientation] = useState("");
  const [designNumPages, setDesignNumPages] = useState("");
  const [designDescription, setDesignDescription] = useState("");
  const [designPurpose, setDesignPurpose] = useState("");
  const [designCustomPurpose, setDesignCustomPurpose] = useState("");
  const [designTargetAudience, setDesignTargetAudience] = useState("");
  const [designStylePref, setDesignStylePref] = useState("");
  const [designBrandColors, setDesignBrandColors] = useState("");
  const [designFonts, setDesignFonts] = useState("");
  const [designBrandGuidelinesFile, setDesignBrandGuidelinesFile] = useState(null);
  const [designBrandGuidelinesName, setDesignBrandGuidelinesName] = useState("");
  const [designLogoFile, setDesignLogoFile] = useState(null);
  const [designLogoName, setDesignLogoName] = useState("");
  const [designImagesFile, setDesignImagesFile] = useState(null);
  const [designImagesName, setDesignImagesName] = useState("");
  const [designTextContent, setDesignTextContent] = useState("");
  const [designWebsite, setDesignWebsite] = useState("");
  const [designPhone, setDesignPhone] = useState("");
  const [designPhoneCountryCode, setDesignPhoneCountryCode] = useState(defaultCountryOption.value);
  const [designPhoneError, setDesignPhoneError] = useState("");
  const [designAddress, setDesignAddress] = useState("");
  const [designSocialMedia, setDesignSocialMedia] = useState("");
  const [designQrCode, setDesignQrCode] = useState("");
  const [designReferenceImagesFile, setDesignReferenceImagesFile] = useState(null);
  const [designReferenceImagesName, setDesignReferenceImagesName] = useState("");
  const [designReferenceLinks, setDesignReferenceLinks] = useState("");
  const [designPreviousDesignsFile, setDesignPreviousDesignsFile] = useState(null);
  const [designPreviousDesignsName, setDesignPreviousDesignsName] = useState("");
  const [designDeadline, setDesignDeadline] = useState("");
  const [designPriority, setDesignPriority] = useState("");
  const [designCustomPriority, setDesignCustomPriority] = useState("");
  const [designAdditionalNotes, setDesignAdditionalNotes] = useState("");
  const [designRestrictions, setDesignRestrictions] = useState("");
  const [designColorPrefs, setDesignColorPrefs] = useState("");

  // Production Brief Fields
  const [productionProductType, setProductionProductType] = useState("");
  const [productionCustomProductType, setProductionCustomProductType] = useState("");
  const [productionQuantity, setProductionQuantity] = useState("");
  const [productionNumPages, setProductionNumPages] = useState("");
  const [productionPaperSize, setProductionPaperSize] = useState("");
  const [productionCustomSizeWidth, setProductionCustomSizeWidth] = useState("");
  const [productionCustomSizeHeight, setProductionCustomSizeHeight] = useState("");
  const [productionCustomSizeUnit, setProductionCustomSizeUnit] = useState("mm");
  const [productionPaperType, setProductionPaperType] = useState("");
  const [productionPaperGsm, setProductionPaperGsm] = useState("");
  const [productionColorType, setProductionColorType] = useState("");
  const [productionPrintSides, setProductionPrintSides] = useState("");
  const [productionPrintingMethod, setProductionPrintingMethod] = useState("");
  const [productionFinishingOptions, setProductionFinishingOptions] = useState("");
  const [productionFoldingType, setProductionFoldingType] = useState("");
  const [productionArtworkFile, setProductionArtworkFile] = useState(null);
  const [productionArtworkFileName, setProductionArtworkFileName] = useState("");
  const [productionAdditionalNotes, setProductionAdditionalNotes] = useState("");
  const [productionPrintDeadline, setProductionPrintDeadline] = useState("");
  const [productionDeliveryDate, setProductionDeliveryDate] = useState("");
  const [productionPriority, setProductionPriority] = useState("Normal");

  // Reset all fields each time the modal is opened
  useEffect(() => {
    if (!showRequirementModal) return;
    setRequirementType(""); setRequirementFile(null); setRequirementFileName(""); setRequirementNotes("");
    setDesignProductType(""); setDesignCustomProductType(""); setDesignSize(""); setDesignCustomSize("");
    setDesignOrientation(""); setDesignNumPages(""); setDesignDescription(""); setDesignPurpose("");
    setDesignCustomPurpose(""); setDesignTargetAudience(""); setDesignStylePref("");
    setDesignBrandColors(""); setDesignFonts("");
    setDesignBrandGuidelinesFile(null); setDesignBrandGuidelinesName("");
    setDesignLogoFile(null); setDesignLogoName("");
    setDesignImagesFile(null); setDesignImagesName("");
    setDesignTextContent(""); setDesignWebsite(""); setDesignPhone("");
    setDesignPhoneCountryCode(defaultCountryOption.value); setDesignPhoneError("");
    setDesignAddress(""); setDesignSocialMedia(""); setDesignQrCode("");
    setDesignReferenceImagesFile(null); setDesignReferenceImagesName("");
    setDesignReferenceLinks("");
    setDesignPreviousDesignsFile(null); setDesignPreviousDesignsName("");
    setDesignDeadline(""); setDesignPriority(""); setDesignCustomPriority("");
    setDesignAdditionalNotes(""); setDesignRestrictions(""); setDesignColorPrefs("");
    setProductionProductType(""); setProductionCustomProductType("");
    setProductionQuantity(""); setProductionNumPages(""); setProductionPaperSize("");
    setProductionCustomSizeWidth(""); setProductionCustomSizeHeight(""); setProductionCustomSizeUnit("mm");
    setProductionPaperType(""); setProductionPaperGsm(""); setProductionColorType("");
    setProductionPrintSides(""); setProductionPrintingMethod(""); setProductionFinishingOptions("");
    setProductionFoldingType("");
    setProductionArtworkFile(null); setProductionArtworkFileName("");
    setProductionAdditionalNotes(""); setProductionPrintDeadline(""); setProductionDeliveryDate("");
    setProductionPriority("Normal");
  }, [showRequirementModal]);

  // Validate then hand off all form data to the parent's submit handler
  const handleSubmit = () => {
    const isCombinedRequirement = requirementType === "Design + Production";
    const resolvedDesignProductType = isCombinedRequirement
      ? (designProductType || productionProductType)
      : designProductType;
    const resolvedDesignCustomProductType = isCombinedRequirement
      ? (designCustomProductType || productionCustomProductType)
      : designCustomProductType;
    const resolvedDesignSize = isCombinedRequirement
      ? (designSize || productionPaperSize)
      : designSize;
    const resolvedDesignCustomSize = isCombinedRequirement
      ? (
          designCustomSize ||
          (
            productionPaperSize === "Custom" && productionCustomSizeWidth && productionCustomSizeHeight
              ? `${productionCustomSizeWidth} x ${productionCustomSizeHeight} ${productionCustomSizeUnit}`
              : ""
          )
        )
      : designCustomSize;
    const productionQuantityNumber = Number(productionQuantity);
    const productionFinishingList = (() => {
      try {
        return productionFinishingOptions ? JSON.parse(productionFinishingOptions) : [];
      } catch {
        return [];
      }
    })();

    if (!requirementType || !requirementNotes) {
      showError("Please select category and add notes");
      return;
    }
    if (requirementType === "Design") {
      if (!resolvedDesignProductType) {
        showError("Please select a design product type");
        return;
      }
      if (designProductType === "Custom" && !resolvedDesignCustomProductType) {
        showError("Please enter the custom design product type");
        return;
      }
      if (!resolvedDesignSize) {
        showError("Please select a design size");
        return;
      }
      if (designSize === "Custom" && !resolvedDesignCustomSize) {
        showError("Please enter the custom design size");
        return;
      }
      if (!designOrientation) {
        showError("Please select a design orientation");
        return;
      }
      if (!designDeadline) {
        showError("Please select a design deadline");
        return;
      }
      if (designPhone && designPhone.trim()) {
        const phoneErr = validatePhoneNumber(designPhone, designPhoneCountryCode);
        if (phoneErr) { setDesignPhoneError(phoneErr); showError(phoneErr); return; }
      }
    }
    if (isCombinedRequirement) {
      if (!productionProductType) {
        showError("Please select a product type");
        return;
      }
      if (productionProductType === "Custom" && !productionCustomProductType) {
        showError("Please enter the custom product type");
        return;
      }
      if (!productionQuantity || !Number.isFinite(productionQuantityNumber) || productionQuantityNumber <= 0) {
        showError("Please enter a valid quantity");
        return;
      }
      if (!productionPaperSize) {
        showError("Please select a paper size");
        return;
      }
      if (!productionPaperType) {
        showError("Please select a paper type");
        return;
      }
      if (!productionColorType) {
        showError("Please select a color type");
        return;
      }
      if (productionPaperSize === "Custom" && (!productionCustomSizeWidth || !productionCustomSizeHeight)) {
        showError("Please fill in custom size width and height");
        return;
      }
      if (!resolvedDesignProductType) {
        showError("Please select a design product type");
        return;
      }
      if (productionProductType === "Custom" && !resolvedDesignCustomProductType) {
        showError("Please enter the custom design product type");
        return;
      }
      if (!resolvedDesignSize) {
        showError("Please select a design size");
        return;
      }
      if (productionPaperSize === "Custom" && !resolvedDesignCustomSize) {
        showError("Please enter the custom design size");
        return;
      }
      if (productionFinishingList.includes("Folding") && !productionFoldingType) {
        showError("Please select a folding type");
        return;
      }
      if (!designDeadline) {
        showError("Please select a design deadline");
        return;
      }
      if (designPhone && designPhone.trim()) {
        const phoneErr = validatePhoneNumber(designPhone, designPhoneCountryCode);
        if (phoneErr) { setDesignPhoneError(phoneErr); showError(phoneErr); return; }
      }
    }
    if (requirementType === "Production") {
      if (!productionProductType) {
        showError("Please select a product type");
        return;
      }
      if (productionProductType === "Custom" && !productionCustomProductType) {
        showError("Please enter the custom product type");
        return;
      }
      if (!productionQuantity || !Number.isFinite(productionQuantityNumber) || productionQuantityNumber <= 0) {
        showError("Please enter a valid quantity");
        return;
      }
      if (!productionPaperSize) {
        showError("Please select a paper size");
        return;
      }
      if (!productionPaperType) {
        showError("Please select a paper type");
        return;
      }
      if (!productionColorType) {
        showError("Please select a color type");
        return;
      }
      if (productionPaperSize === "Custom" && (!productionCustomSizeWidth || !productionCustomSizeHeight)) {
        showError("Please fill in custom size width and height");
        return;
      }
      if (productionFinishingList.includes("Folding") && !productionFoldingType) {
        showError("Please select a folding type");
        return;
      }
      if (!productionPrintDeadline) {
        showError("Please select a production deadline");
        return;
      }
    }
    onSubmit?.({
      requirementType, requirementFile, requirementFileName, requirementNotes,
      designProductType: resolvedDesignProductType,
      designCustomProductType: resolvedDesignCustomProductType,
      designSize: resolvedDesignSize,
      designCustomSize: resolvedDesignCustomSize,
      designOrientation, designNumPages, designDescription, designPurpose,
      designCustomPurpose, designTargetAudience, designStylePref,
      designBrandColors, designFonts,
      designBrandGuidelinesFile, designBrandGuidelinesName,
      designLogoFile, designLogoName, designImagesFile, designImagesName,
      designTextContent, designWebsite, designPhone, designPhoneCountryCode,
      designAddress, designSocialMedia, designQrCode,
      designReferenceImagesFile, designReferenceImagesName,
      designReferenceLinks, designPreviousDesignsFile, designPreviousDesignsName,
      designDeadline, designPriority, designCustomPriority,
      designAdditionalNotes, designRestrictions, designColorPrefs,
      productionProductType, productionCustomProductType, productionQuantity,
      productionNumPages, productionPaperSize, productionCustomSizeWidth,
      productionCustomSizeHeight, productionCustomSizeUnit,
      productionPaperType, productionPaperGsm, productionColorType,
      productionPrintSides, productionPrintingMethod, productionFinishingOptions,
      productionFoldingType, productionArtworkFile, productionArtworkFileName,
      productionAdditionalNotes, productionPrintDeadline, productionDeliveryDate,
      productionPriority,
    });
  };

  // Memoized text input handlers
  const handleDesignDescriptionChange = useCallback((e) => setDesignDescription(e.target.value), []);
  const handleDesignBrandColorsChange = useCallback((e) => setDesignBrandColors(e.target.value), []);
  const handleDesignFontsChange = useCallback((e) => setDesignFonts(e.target.value), []);
  const handleDesignTextContentChange = useCallback((e) => setDesignTextContent(e.target.value), []);
  const handleDesignWebsiteChange = useCallback((e) => setDesignWebsite(e.target.value), []);
  const handleDesignAddressChange = useCallback((e) => setDesignAddress(e.target.value), []);
  const handleDesignSocialMediaChange = useCallback((e) => setDesignSocialMedia(e.target.value), []);
  const handleDesignQrCodeChange = useCallback((e) => setDesignQrCode(e.target.value), []);
  const handleDesignTargetAudienceChange = useCallback((e) => setDesignTargetAudience(e.target.value), []);
  const handleDesignReferenceLinksChange = useCallback((e) => setDesignReferenceLinks(e.target.value), []);
  const handleDesignAdditionalNotesChange = useCallback((e) => setDesignAdditionalNotes(e.target.value), []);
  const handleDesignRestrictionsChange = useCallback((e) => setDesignRestrictions(e.target.value), []);
  const handleDesignColorPrefsChange = useCallback((e) => setDesignColorPrefs(e.target.value), []);
  const handleDesignCustomProductTypeChange = useCallback((e) => setDesignCustomProductType(e.target.value), []);
  const handleDesignCustomSizeChange = useCallback((e) => setDesignCustomSize(e.target.value), []);
  const handleDesignCustomPurposeChange = useCallback((e) => setDesignCustomPurpose(e.target.value), []);
  const handleDesignCustomPriorityChange = useCallback((e) => setDesignCustomPriority(e.target.value), []);
  const handleDesignNumPagesChange = useCallback((e) => setDesignNumPages(e.target.value), []);
  const handleDesignOrientationChange = useCallback((e) => setDesignOrientation(e.target.value), []);
  const handleDesignDeadlineChange = useCallback((e) => setDesignDeadline(e.target.value), []);

  // Dropdown handlers
  const handleDesignProductTypeChange = useCallback((value) => {
    setDesignProductType(value);
    if (value !== "Custom") setDesignCustomProductType("");
  }, []);

  const handleDesignSizeChange = useCallback((value) => {
    setDesignSize(value);
    if (value !== "Custom") setDesignCustomSize("");
  }, []);

  const handleDesignPurposeChange = useCallback((value) => {
    setDesignPurpose(value);
    if (value !== "Custom") setDesignCustomPurpose("");
  }, []);

  const handleDesignPriorityChange = useCallback((value) => {
    setDesignPriority(value);
    if (value !== "Custom") setDesignCustomPriority("");
  }, []);

  const handleDesignPhoneCountryCodeChange = useCallback((value) => {
    setDesignPhoneCountryCode(ensureCountryCodeValue(value));
    setDesignPhone("");
    setDesignPhoneError("");
  }, []);

  const handleDesignPhoneChange = useCallback((value) => {
    const option = getCountryOptionByValue(designPhoneCountryCode);
    const lengths = getCountryAllowedLengths(designPhoneCountryCode);
    setDesignPhone(sanitizePhoneDigits(value, option?.maxLength, lengths));
    setDesignPhoneError("");
  }, [designPhoneCountryCode]);

  const handleDesignStylePrefChange = useCallback((style, currentValue) => {
    if (currentValue.includes(style)) {
      const styles = currentValue.split(",").filter(s => s.trim() !== style);
      return styles.join(",");
    } else {
      return currentValue ? `${currentValue},${style}` : style;
    }
  }, []);

  if (!showRequirementModal) return null;

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
        <div className="modal-dialog modal-lg" style={{ maxWidth: requirementType === "Design" || requirementType === "Production" || requirementType === "Design + Production" ? "900px" : "520px" }}>
          <div className="modal-content">
            <div className="modal-header sticky-top bg-white" style={{ zIndex: 1022 }}>
              <h5 className="modal-title">Requirement Details</h5>
              <button className="btn-close" onClick={() => setShowRequirementModal(false)} />
            </div>
            <div className="modal-body" style={{ maxHeight: "80vh", overflowY: "auto" }}>
              
              <div className="mb-3">
                <label className="form-label">Category <span className="text-danger">*</span></label>
                <select className="form-select" value={requirementType} onChange={(e) => setRequirementType(e.target.value)}>
                  <option value="">Select Category</option>
                  <option value="Design">Design only</option>
                  <option value="Production">Production only</option>
                  <option value="Design + Production">Design + Production</option>
                </select>
              </div>

              {requirementType === "Design" && (
                <>
                  <hr />
                  <h6 className="fw-bold mb-3">1️⃣ Product Details</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Product Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={designProductType} onChange={(e) => handleDesignProductTypeChange(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Flyer">Flyer</option>
                        <option value="Brochure">Brochure</option>
                        <option value="Banner">Banner</option>
                        <option value="Business Card">Business Card</option>
                        <option value="Poster">Poster</option>
                        <option value="Social Media Post">Social Media Post</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {designProductType === "Custom" && (
                        <input className="form-control mt-2" value={designCustomProductType} onChange={handleDesignCustomProductTypeChange} placeholder="Enter custom product type" />
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Size <span className="text-danger">*</span></label>
                      <select className="form-select" value={designSize} onChange={(e) => handleDesignSizeChange(e.target.value)}>
                        <option value="">Select</option>
                        <option value="A4">A4</option>
                        <option value="A5">A5</option>
                        <option value="A3">A3</option>
                        <option value="Custom">Custom Size</option>
                      </select>
                      {designSize === "Custom" && (
                        <input className="form-control mt-2" value={designCustomSize} onChange={handleDesignCustomSizeChange} placeholder="e.g., 10x15 cm" />
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Orientation <span className="text-danger">*</span></label>
                      <select className="form-select" value={designOrientation} onChange={handleDesignOrientationChange}>
                        <option value="">Select</option>
                        <option value="Portrait">Portrait</option>
                        <option value="Landscape">Landscape</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Number of Pages</label>
                      <input className="form-control" type="number" value={designNumPages} onChange={handleDesignNumPagesChange} placeholder="2" />
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">2️⃣ Design Brief</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Design Description</label>
                      <textarea className="form-control" rows={2} value={designDescription} onChange={handleDesignDescriptionChange} placeholder="Describe the design..." />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Purpose</label>
                      <select className="form-select" value={designPurpose} onChange={(e) => handleDesignPurposeChange(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Event">Event</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {designPurpose === "Custom" && (
                        <input className="form-control mt-2" value={designCustomPurpose} onChange={handleDesignCustomPurposeChange} placeholder="Enter custom purpose" />
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Target Audience</label>
                      <input className="form-control" value={designTargetAudience} onChange={handleDesignTargetAudienceChange} placeholder="e.g., Young professionals" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Style Preference</label>
                      <div className="d-flex flex-wrap gap-2">
                        {["Modern", "Minimal", "Corporate", "Creative"].map((style) => (
                          <div className="form-check" key={style}>
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id={`style-${style}`} 
                              checked={designStylePref.includes(style)} 
                              onChange={() => setDesignStylePref(handleDesignStylePrefChange(style, designStylePref))}
                            />
                            <label className="form-check-label" htmlFor={`style-${style}`}>{style}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">3️⃣ Brand Details</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Brand Colors</label>
                      <input className="form-control" value={designBrandColors} onChange={handleDesignBrandColorsChange} placeholder="e.g., Blue (#0066cc), White" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Preferred Fonts</label>
                      <input className="form-control" value={designFonts} onChange={handleDesignFontsChange} placeholder="e.g., Arial, Helvetica" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Brand Guidelines</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignBrandGuidelinesFile(file);
                          setDesignBrandGuidelinesName(file?.name || "");
                        }} 
                      />
                      {designBrandGuidelinesName && <div className="text-muted mt-1 small">{designBrandGuidelinesName}</div>}
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">4️⃣ Content from Client</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Logo Upload</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignLogoFile(file);
                          setDesignLogoName(file?.name || "");
                        }} 
                      />
                      {designLogoName && <div className="text-muted mt-1 small">{designLogoName}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Images Upload</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        multiple 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignImagesFile(file);
                          setDesignImagesName(file?.name || "");
                        }} 
                      />
                      {designImagesName && <div className="text-muted mt-1 small">{designImagesName}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Text Content</label>
                      <textarea className="form-control" rows={2} value={designTextContent} onChange={handleDesignTextContentChange} placeholder="Provide all text to be included..." />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Website</label>
                      <input className="form-control" value={designWebsite} onChange={handleDesignWebsiteChange} placeholder="www.example.com" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Phone</label>
                      <div className="input-group">
                        <select
                          className="form-select text-dark bg-white"
                          style={{ maxWidth: "100px", color: "#212529", backgroundColor: "#fff" }}
                          value={designPhoneCountryCode}
                          onChange={(e) => handleDesignPhoneCountryCodeChange(e.target.value)}
                        >
                          {COUNTRY_CODE_OPTIONS.map((option) => (
                            <option key={`${option.country}-${option.callingCode}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <input 
                          className="form-control" 
                          value={designPhone} 
                          onChange={(e) => handleDesignPhoneChange(e.target.value)}
                          placeholder={`${getCountryDisplayMaxLength(designPhoneCountryCode) || ""} digits`}
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={getCountryDisplayMaxLength(designPhoneCountryCode) || undefined}
                        />
                      </div>
                      {designPhoneError && <small className="text-danger mt-1 d-block">{designPhoneError}</small>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address</label>
                      <input className="form-control" value={designAddress} onChange={handleDesignAddressChange} placeholder="City, Country" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Social Media Handles</label>
                      <input className="form-control" value={designSocialMedia} onChange={handleDesignSocialMediaChange} placeholder="@handle" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">QR Code</label>
                      <input className="form-control" value={designQrCode} onChange={handleDesignQrCodeChange} placeholder="URL or text" />
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">5️⃣ Reference Designs</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Reference Images</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        multiple 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignReferenceImagesFile(file);
                          setDesignReferenceImagesName(file?.name || "");
                        }} 
                      />
                      {designReferenceImagesName && <div className="text-muted mt-1 small">{designReferenceImagesName}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Reference Links</label>
                      <textarea className="form-control" rows={2} value={designReferenceLinks} onChange={handleDesignReferenceLinksChange} placeholder="Paste reference links..." />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Previous Designs</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        multiple 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignPreviousDesignsFile(file);
                          setDesignPreviousDesignsName(file?.name || "");
                        }} 
                      />
                      {designPreviousDesignsName && <div className="text-muted mt-1 small">{designPreviousDesignsName}</div>}
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">6️⃣ Deadline</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Design Deadline <span className="text-danger">*</span></label>
                      <input className="form-control" type="date" value={designDeadline} onChange={handleDesignDeadlineChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Priority</label>
                      <select className="form-select" value={designPriority} onChange={(e) => handleDesignPriorityChange(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {designPriority === "Custom" && (
                        <input className="form-control mt-2" value={designCustomPriority} onChange={handleDesignCustomPriorityChange} placeholder="Enter custom priority" />
                      )}
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">7️⃣ Special Instructions</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Additional Notes</label>
                      <textarea className="form-control" rows={2} value={designAdditionalNotes} onChange={handleDesignAdditionalNotesChange} placeholder="Any special instructions..." />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Restrictions</label>
                      <textarea className="form-control" rows={2} value={designRestrictions} onChange={handleDesignRestrictionsChange} placeholder="e.g., No red colors, Must include logo" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Color Preferences</label>
                      <textarea className="form-control" rows={2} value={designColorPrefs} onChange={handleDesignColorPrefsChange} placeholder="Specify color preferences..." />
                    </div>
                  </div>
                </>
              )}

              {requirementType === "Design + Production" && (
                <>
                  <hr />
                  <h6 className="fw-bold mb-3">1️⃣ Product Details</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Product Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={productionProductType} onChange={(e) => {
                        setProductionProductType(e.target.value);
                        if (e.target.value !== "Custom") setProductionCustomProductType("");
                      }}>
                        <option value="">Select</option>
                        <option value="Business Card">Business Card</option>
                        <option value="Flyer">Flyer</option>
                        <option value="Brochure">Brochure</option>
                        <option value="Poster">Poster</option>
                        <option value="Banner">Banner</option>
                        <option value="Sticker">Sticker</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {productionProductType === "Custom" && (
                        <input className="form-control mt-2" value={productionCustomProductType} onChange={(e) => setProductionCustomProductType(e.target.value)} placeholder="Enter custom product type" />
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Quantity <span className="text-danger">*</span></label>
                      <input className="form-control" type="number" value={productionQuantity} onChange={(e) => setProductionQuantity(e.target.value)} placeholder="Number of units" min="1" />
                    </div>
                    {["Brochure", "Booklet", "Catalog"].includes(productionProductType) && (
                      <div className="col-md-6">
                        <label className="form-label">Number of Pages</label>
                        <input className="form-control" type="number" value={productionNumPages} onChange={(e) => setProductionNumPages(e.target.value)} placeholder="Pages" min="1" />
                      </div>
                    )}
                  </div>

                  <h6 className="fw-bold mb-3">2️⃣ Size & Layout</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-12">
                      <label className="form-label">Paper Size <span className="text-danger">*</span></label>
                      <select className="form-select" value={productionPaperSize} onChange={(e) => {
                        setProductionPaperSize(e.target.value);
                        if (e.target.value !== "Custom") {
                          setProductionCustomSizeWidth("");
                          setProductionCustomSizeHeight("");
                          setProductionCustomSizeUnit("mm");
                        }
                      }}>
                        <option value="">Select</option>
                        <option value="A0">A0</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="A4">A4</option>
                        <option value="A5">A5</option>
                        <option value="Business Card (3.5 × 2 in)">Business Card (3.5 × 2 in)</option>
                        <option value="Custom">Custom Size</option>
                      </select>
                    </div>
                    {productionPaperSize === "Custom" && (
                      <>
                        <div className="col-md-4">
                          <label className="form-label">Width</label>
                          <input className="form-control" type="number" value={productionCustomSizeWidth} onChange={(e) => setProductionCustomSizeWidth(e.target.value)} placeholder="Width" step="0.1" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Height</label>
                          <input className="form-control" type="number" value={productionCustomSizeHeight} onChange={(e) => setProductionCustomSizeHeight(e.target.value)} placeholder="Height" step="0.1" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Unit</label>
                          <select className="form-select" value={productionCustomSizeUnit} onChange={(e) => setProductionCustomSizeUnit(e.target.value)}>
                            <option value="mm">mm</option>
                            <option value="inches">inches</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <h6 className="fw-bold mb-3">3️⃣ Design Brief</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Design Description</label>
                      <textarea className="form-control" rows={2} value={designDescription} onChange={handleDesignDescriptionChange} placeholder="Describe what you want designed..." />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Purpose</label>
                      <select className="form-select" value={designPurpose} onChange={(e) => handleDesignPurposeChange(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Event">Event</option>
                        <option value="Advertisement">Advertisement</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {designPurpose === "Custom" && (
                        <input className="form-control mt-2" value={designCustomPurpose} onChange={handleDesignCustomPurposeChange} placeholder="Enter custom purpose" />
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Target Audience</label>
                      <input className="form-control" value={designTargetAudience} onChange={handleDesignTargetAudienceChange} placeholder="Who is this for?" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Style Preference</label>
                      <div className="d-flex flex-wrap gap-2">
                        {["Modern", "Minimal", "Corporate", "Creative"].map((style) => (
                          <div key={style} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`style_${style}`}
                              checked={designStylePref.includes(style)}
                              onChange={() => {
                                const updated = designStylePref.includes(style)
                                  ? designStylePref.replace(style, "").trim()
                                  : (designStylePref ? designStylePref + ", " + style : style);
                                setDesignStylePref(updated);
                              }}
                            />
                            <label className="form-check-label" htmlFor={`style_${style}`}>{style}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">4️⃣ Brand Details</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Brand Colors</label>
                      <input className="form-control" value={designBrandColors} onChange={handleDesignBrandColorsChange} placeholder="e.g., Blue, White, Gold" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Preferred Fonts</label>
                      <input className="form-control" value={designFonts} onChange={handleDesignFontsChange} placeholder="e.g., Arial, Georgia" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Brand Guidelines</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignBrandGuidelinesFile(file);
                          setDesignBrandGuidelinesName(file?.name || "");
                        }} 
                      />
                      {designBrandGuidelinesName && <div className="text-muted mt-1 small">{designBrandGuidelinesName}</div>}
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">5️⃣ Client Content</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Logo Upload</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignLogoFile(file);
                          setDesignLogoName(file?.name || "");
                        }} 
                      />
                      {designLogoName && <div className="text-muted mt-1 small">{designLogoName}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Images Upload</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        multiple
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignImagesFile(file);
                          setDesignImagesName(file?.name || "");
                        }} 
                      />
                      {designImagesName && <div className="text-muted mt-1 small">{designImagesName}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Text Content</label>
                      <textarea className="form-control" rows={2} value={designTextContent} onChange={handleDesignTextContentChange} placeholder="Copy/headlines..." />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Website</label>
                      <input className="form-control" value={designWebsite} onChange={handleDesignWebsiteChange} placeholder="Your website" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <div className="d-flex gap-2">
                        <select
                          className="form-select text-dark bg-white"
                          style={{ maxWidth: "120px", color: "#212529", backgroundColor: "#fff" }}
                          value={designPhoneCountryCode}
                          onChange={(e) => handleDesignPhoneCountryCodeChange(e.target.value)}
                        >
                          {COUNTRY_CODE_OPTIONS.map((option) => (
                            <option key={`${option.country}-${option.callingCode}`} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <input
                          className="form-control"
                          type="text"
                          value={designPhone}
                          onChange={(e) => handleDesignPhoneChange(e.target.value)}
                          placeholder={`${getCountryDisplayMaxLength(designPhoneCountryCode) || ""} digits`}
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={getCountryDisplayMaxLength(designPhoneCountryCode) || undefined}
                        />
                      </div>
                      {designPhoneError && <small className="text-danger mt-1 d-block">{designPhoneError}</small>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Address</label>
                      <input className="form-control" value={designAddress} onChange={handleDesignAddressChange} placeholder="City, Country" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Social Media Handles</label>
                      <input className="form-control" value={designSocialMedia} onChange={handleDesignSocialMediaChange} placeholder="@handle" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">QR Code</label>
                      <input className="form-control" value={designQrCode} onChange={handleDesignQrCodeChange} placeholder="URL or text" />
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">6️⃣ Reference Designs</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Reference Images</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        multiple 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignReferenceImagesFile(file);
                          setDesignReferenceImagesName(file?.name || "");
                        }} 
                      />
                      {designReferenceImagesName && <div className="text-muted mt-1 small">{designReferenceImagesName}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Reference Links</label>
                      <textarea className="form-control" rows={2} value={designReferenceLinks} onChange={handleDesignReferenceLinksChange} placeholder="Paste reference links..." />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Previous Designs</label>
                      <input 
                        className="form-control" 
                        type="file" 
                        multiple 
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDesignPreviousDesignsFile(file);
                          setDesignPreviousDesignsName(file?.name || "");
                        }} 
                      />
                      {designPreviousDesignsName && <div className="text-muted mt-1 small">{designPreviousDesignsName}</div>}
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">7️⃣ Printing Specifications</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Paper Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={productionPaperType} onChange={(e) => setProductionPaperType(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Matte">Matte</option>
                        <option value="Glossy">Glossy</option>
                        <option value="Art Paper">Art Paper</option>
                        <option value="Art Card">Art Card</option>
                        <option value="Sticker">Sticker</option>
                        <option value="Vinyl">Vinyl</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Paper GSM</label>
                      <select className="form-select" value={productionPaperGsm} onChange={(e) => setProductionPaperGsm(e.target.value)}>
                        <option value="">Select</option>
                        <option value="100 GSM">100 GSM</option>
                        <option value="130 GSM">130 GSM</option>
                        <option value="170 GSM">170 GSM</option>
                        <option value="250 GSM">250 GSM</option>
                        <option value="300 GSM">300 GSM</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Color Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={productionColorType} onChange={(e) => setProductionColorType(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Full Color (CMYK)">Full Color (CMYK)</option>
                        <option value="Black & White">Black & White</option>
                        <option value="Pantone">Pantone</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Print Sides</label>
                      <select className="form-select" value={productionPrintSides} onChange={(e) => setProductionPrintSides(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Single Side">Single Side</option>
                        <option value="Double Side">Double Side</option>
                      </select>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Printing Method</label>
                      <select className="form-select" value={productionPrintingMethod} onChange={(e) => setProductionPrintingMethod(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Digital Printing">Digital Printing</option>
                        <option value="Offset Printing">Offset Printing</option>
                        <option value="Large Format">Large Format</option>
                      </select>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">8️⃣ Finishing Options</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Select all that apply:</label>
                      <div className="d-flex flex-wrap gap-2">
                        {["Matte Lamination", "Gloss Lamination", "Spot UV", "Emboss", "Foil Stamping", "Die Cut", "Folding"].map((option) => {
                          const selected = productionFinishingOptions ? JSON.parse(productionFinishingOptions || "[]").includes(option) : false;
                          return (
                            <div key={option} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`prod_finishing_${option}`}
                                checked={selected}
                                onChange={() => {
                                  try {
                                    const current = productionFinishingOptions ? JSON.parse(productionFinishingOptions) : [];
                                    const updated = current.includes(option)
                                      ? current.filter((item) => item !== option)
                                      : [...current, option];
                                    setProductionFinishingOptions(JSON.stringify(updated));
                                  } catch {
                                    setProductionFinishingOptions(JSON.stringify([option]));
                                  }
                                }}
                              />
                              <label className="form-check-label" htmlFor={`prod_finishing_${option}`}>{option}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {productionFinishingOptions && JSON.parse(productionFinishingOptions).includes("Folding") && (
                      <div className="col-md-6">
                        <label className="form-label">Folding Type</label>
                        <select className="form-select" value={productionFoldingType} onChange={(e) => setProductionFoldingType(e.target.value)}>
                          <option value="">Select</option>
                          <option value="Bi-Fold">Bi-Fold</option>
                          <option value="Tri-Fold">Tri-Fold</option>
                          <option value="Z-Fold">Z-Fold</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <h6 className="fw-bold mb-3">9️⃣ Timeline</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Design Deadline <span className="text-danger">*</span></label>
                      <input className="form-control" type="date" value={designDeadline} onChange={handleDesignDeadlineChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Print Deadline <span className="text-danger">*</span></label>
                      <input className="form-control" type="date" value={productionPrintDeadline} onChange={(e) => setProductionPrintDeadline(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Delivery Date</label>
                      <input
                        className="form-control"
                        type="date"
                        max="9999-12-31"
                        value={productionDeliveryDate}
                        onChange={(e) => {
                          const nextValue = normalizeIsoDateWithFourDigitYear(e.target.value);
                          if (nextValue && isSundayIsoDate(nextValue)) {
                            setProductionDeliveryDate("");
                            showError("Sunday delivery dates are not allowed.");
                            return;
                          }
                          setProductionDeliveryDate(nextValue);
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Priority</label>
                      <select className="form-select" value={productionPriority} onChange={(e) => setProductionPriority(e.target.value)}>
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">Additional Notes</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Upload Design File</label>
                      <input
                        className="form-control"
                        type="file"
                        accept=".pdf,.ai,.psd,.eps"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setProductionArtworkFile(file);
                          setProductionArtworkFileName(file?.name || "");
                        }}
                      />
                      {productionArtworkFileName && <div className="text-muted mt-1 small">{productionArtworkFileName}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Special Instructions</label>
                      <textarea className="form-control" rows={2} value={productionAdditionalNotes} onChange={(e) => setProductionAdditionalNotes(e.target.value)} placeholder="Any special instructions or preferences..." />
                    </div>
                  </div>
                </>
              )}

              {requirementType === "Production" && (
                <>
                  <hr />
                  <h6 className="fw-bold mb-3">1️⃣ Product Details</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Product Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={productionProductType} onChange={(e) => {
                        setProductionProductType(e.target.value);
                        if (e.target.value !== "Custom") setProductionCustomProductType("");
                      }}>
                        <option value="">Select</option>
                        <option value="Business Card">Business Card</option>
                        <option value="Flyer">Flyer</option>
                        <option value="Brochure">Brochure</option>
                        <option value="Poster">Poster</option>
                        <option value="Banner">Banner</option>
                        <option value="Sticker">Sticker</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {productionProductType === "Custom" && (
                        <input className="form-control mt-2" value={productionCustomProductType} onChange={(e) => setProductionCustomProductType(e.target.value)} placeholder="Enter custom product type" />
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Quantity <span className="text-danger">*</span></label>
                      <input className="form-control" type="number" value={productionQuantity} onChange={(e) => setProductionQuantity(e.target.value)} placeholder="Number of units" min="1" />
                    </div>
                    {["Brochure", "Booklet", "Catalog"].includes(productionProductType) && (
                      <div className="col-md-6">
                        <label className="form-label">Number of Pages</label>
                        <input className="form-control" type="number" value={productionNumPages} onChange={(e) => setProductionNumPages(e.target.value)} placeholder="Pages" min="1" />
                      </div>
                    )}
                  </div>

                  <h6 className="fw-bold mb-3">2️⃣ Size Details</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-12">
                      <label className="form-label">Paper Size <span className="text-danger">*</span></label>
                      <select className="form-select" value={productionPaperSize} onChange={(e) => {
                        setProductionPaperSize(e.target.value);
                        if (e.target.value !== "Custom") {
                          setProductionCustomSizeWidth("");
                          setProductionCustomSizeHeight("");
                          setProductionCustomSizeUnit("mm");
                        }
                      }}>
                        <option value="">Select</option>
                        <option value="A0">A0</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="A4">A4</option>
                        <option value="A5">A5</option>
                        <option value="Business Card (3.5 × 2 in)">Business Card (3.5 × 2 in)</option>
                        <option value="Custom">Custom Size</option>
                      </select>
                    </div>
                    {productionPaperSize === "Custom" && (
                      <>
                        <div className="col-md-4">
                          <label className="form-label">Width</label>
                          <input className="form-control" type="number" value={productionCustomSizeWidth} onChange={(e) => setProductionCustomSizeWidth(e.target.value)} placeholder="Width" step="0.1" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Height</label>
                          <input className="form-control" type="number" value={productionCustomSizeHeight} onChange={(e) => setProductionCustomSizeHeight(e.target.value)} placeholder="Height" step="0.1" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Unit</label>
                          <select className="form-select" value={productionCustomSizeUnit} onChange={(e) => setProductionCustomSizeUnit(e.target.value)}>
                            <option value="mm">mm</option>
                            <option value="inches">inches</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <h6 className="fw-bold mb-3">3️⃣ Paper Specifications</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Paper Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={productionPaperType} onChange={(e) => setProductionPaperType(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Matte">Matte</option>
                        <option value="Glossy">Glossy</option>
                        <option value="Art Paper">Art Paper</option>
                        <option value="Art Card">Art Card</option>
                        <option value="Sticker">Sticker</option>
                        <option value="Vinyl">Vinyl</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Paper GSM</label>
                      <select className="form-select" value={productionPaperGsm} onChange={(e) => setProductionPaperGsm(e.target.value)}>
                        <option value="">Select</option>
                        <option value="100 GSM">100 GSM</option>
                        <option value="130 GSM">130 GSM</option>
                        <option value="170 GSM">170 GSM</option>
                        <option value="250 GSM">250 GSM</option>
                        <option value="300 GSM">300 GSM</option>
                      </select>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">4️⃣ Printing Specifications</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label">Color Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={productionColorType} onChange={(e) => setProductionColorType(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Full Color (CMYK)">Full Color (CMYK)</option>
                        <option value="Black & White">Black & White</option>
                        <option value="Pantone">Pantone</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Print Sides</label>
                      <select className="form-select" value={productionPrintSides} onChange={(e) => setProductionPrintSides(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Single Side">Single Side</option>
                        <option value="Double Side">Double Side</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Printing Method</label>
                      <select className="form-select" value={productionPrintingMethod} onChange={(e) => setProductionPrintingMethod(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Digital Printing">Digital Printing</option>
                        <option value="Offset Printing">Offset Printing</option>
                        <option value="Large Format">Large Format</option>
                      </select>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">5️⃣ Finishing Options</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Select all that apply:</label>
                      <div className="d-flex flex-wrap gap-2">
                        {["Matte Lamination", "Gloss Lamination", "Spot UV", "Emboss", "Foil Stamping", "Die Cut", "Folding"].map((option) => {
                          const selected = productionFinishingOptions ? JSON.parse(productionFinishingOptions || "[]").includes(option) : false;
                          return (
                            <div key={option} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`prod_finishing_${option}`}
                                checked={selected}
                                onChange={() => {
                                  try {
                                    const current = productionFinishingOptions ? JSON.parse(productionFinishingOptions) : [];
                                    const updated = current.includes(option)
                                      ? current.filter((item) => item !== option)
                                      : [...current, option];
                                    setProductionFinishingOptions(JSON.stringify(updated));
                                  } catch {
                                    setProductionFinishingOptions(JSON.stringify([option]));
                                  }
                                }}
                              />
                              <label className="form-check-label" htmlFor={`prod_finishing_${option}`}>{option}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {productionFinishingOptions && JSON.parse(productionFinishingOptions).includes("Folding") && (
                      <div className="col-md-6">
                        <label className="form-label">Folding Type</label>
                        <select className="form-select" value={productionFoldingType} onChange={(e) => setProductionFoldingType(e.target.value)}>
                          <option value="">Select</option>
                          <option value="Bi-Fold">Bi-Fold</option>
                          <option value="Tri-Fold">Tri-Fold</option>
                          <option value="Z-Fold">Z-Fold</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <h6 className="fw-bold mb-3">6️⃣ Client Artwork Upload</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Upload Design File</label>
                      <input
                        className="form-control"
                        type="file"
                        accept=".pdf,.ai,.psd,.eps"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setProductionArtworkFile(file);
                          setProductionArtworkFileName(file?.name || "");
                        }}
                      />
                      {productionArtworkFileName && <div className="text-muted mt-1 small">{productionArtworkFileName}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Additional Notes</label>
                      <textarea className="form-control" rows={2} value={productionAdditionalNotes} onChange={(e) => setProductionAdditionalNotes(e.target.value)} placeholder="Any special instructions or notes..." />
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">7️⃣ Deadline & Delivery</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Print Deadline</label>
                      <input className="form-control" type="date" value={productionPrintDeadline} onChange={(e) => setProductionPrintDeadline(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Delivery Date</label>
                      <input
                        className="form-control"
                        type="date"
                        max="9999-12-31"
                        value={productionDeliveryDate}
                        onChange={(e) => {
                          const nextValue = normalizeIsoDateWithFourDigitYear(e.target.value);
                          if (nextValue && isSundayIsoDate(nextValue)) {
                            setProductionDeliveryDate("");
                            showError("Sunday delivery dates are not allowed.");
                            return;
                          }
                          setProductionDeliveryDate(nextValue);
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Priority</label>
                      <select className="form-select" value={productionPriority} onChange={(e) => setProductionPriority(e.target.value)}>
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {(requirementType === "Production" || requirementType === "Design + Production") && (
                <div className="mb-3">
                  <label className="form-label">Requirement File</label>
                  <input 
                    className="form-control" 
                    type="file" 
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setRequirementFile(file);
                      setRequirementFileName(file?.name || "");
                    }} 
                  />
                  {requirementFileName && <div className="text-muted mt-1 small">{requirementFileName}</div>}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Notes <span className="text-danger">*</span></label>
                <textarea className="form-control" rows={3} value={requirementNotes} onChange={(e) => setRequirementNotes(e.target.value)} placeholder="Add notes..." />
              </div>
            </div>
            <div className="modal-footer sticky-bottom bg-white" style={{ zIndex: 1022 }}>
              <button className="btn btn-light" onClick={() => setShowRequirementModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={requirementSaving}>
                {requirementSaving ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
});

RequirementModal.displayName = "RequirementModal";

export default RequirementModal;
