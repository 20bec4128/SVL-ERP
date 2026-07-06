import React, { useCallback } from "react";
import { useToast } from "../../components/system/ToastProvider";

const PRODUCT_TYPE_OPTIONS = [
  "Business Card",
  "Flyer",
  "Brochure",
  "Poster",
  "Banner",
  "Sticker",
  "Packaging",
];

const PAPER_SIZE_OPTIONS = [
  "A0",
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "Business Card (3.5 × 2 in)",
  "Custom",
];

const PAPER_TYPE_OPTIONS = [
  "Matte",
  "Glossy",
  "Art Paper",
  "Art Card",
  "Sticker",
  "Vinyl",
];

const PAPER_GSM_OPTIONS = ["100 GSM", "130 GSM", "170 GSM", "250 GSM", "300 GSM"];

const COLOR_TYPE_OPTIONS = ["Full Color (CMYK)", "Black & White", "Pantone"];

const PRINT_SIDES_OPTIONS = ["Single Side", "Double Side"];

const PRINTING_METHOD_OPTIONS = ["Digital Printing", "Offset Printing", "Large Format"];

const FINISHING_OPTIONS_LIST = [
  "Matte Lamination",
  "Gloss Lamination",
  "Spot UV",
  "Emboss",
  "Foil Stamping",
  "Die Cut",
  "Folding",
];

const FOLDING_TYPE_OPTIONS = ["Bi-Fold", "Tri-Fold", "Z-Fold"];

const ProductionModal = React.memo(({
  showProductionModal,
  setShowProductionModal,
  productType,
  setProductType,
  customProductType,
  setCustomProductType,
  quantity,
  setQuantity,
  numPages,
  setNumPages,
  paperSize,
  setPaperSize,
  customSizeWidth,
  setCustomSizeWidth,
  customSizeHeight,
  setCustomSizeHeight,
  customSizeUnit,
  setCustomSizeUnit,
  paperType,
  setPaperType,
  paperGsm,
  setPaperGsm,
  colorType,
  setColorType,
  printSides,
  setPrintSides,
  printingMethod,
  setPrintingMethod,
  finishingOptions,
  setFinishingOptions,
  foldingType,
  setFoldingType,
  artworkFileName,
  setArtworkFileName,
  artworkFilePath,
  setArtworkFilePath,
  additionalNotes,
  setAdditionalNotes,
  printDeadline,
  setPrintDeadline,
  deliveryDate,
  setDeliveryDate,
  priority,
  setPriority,
  onSubmit,
}) => {
  const { showError } = useToast();

  // Handle product type change
  const handleProductTypeChange = useCallback((value) => {
    setProductType(value);
    if (value !== "Custom") {
      setCustomProductType("");
    }
  }, [setProductType, setCustomProductType]);

  // Handle paper size change
  const handlePaperSizeChange = useCallback((value) => {
    setPaperSize(value);
    if (value !== "Custom") {
      setCustomSizeWidth("");
      setCustomSizeHeight("");
      setCustomSizeUnit("mm");
    }
  }, [setPaperSize, setCustomSizeWidth, setCustomSizeHeight, setCustomSizeUnit]);

  // Handle quantity change
  const handleQuantityChange = useCallback((value) => {
    setQuantity(value ? parseInt(value) : null);
  }, [setQuantity]);

  // Handle num pages change
  const handleNumPagesChange = useCallback((value) => {
    setNumPages(value ? parseInt(value) : null);
  }, [setNumPages]);

  // Handle custom size width
  const handleCustomSizeWidthChange = useCallback((value) => {
    setCustomSizeWidth(value ? parseFloat(value) : null);
  }, [setCustomSizeWidth]);

  // Handle custom size height
  const handleCustomSizeHeightChange = useCallback((value) => {
    setCustomSizeHeight(value ? parseFloat(value) : null);
  }, [setCustomSizeHeight]);

  // Handle custom size unit
  const handleCustomSizeUnitChange = useCallback((value) => {
    setCustomSizeUnit(value);
  }, [setCustomSizeUnit]);

  // Handle finishing options multi-select
  const handleFinishingOptionChange = useCallback((option) => {
    try {
      const current = finishingOptions ? JSON.parse(finishingOptions) : [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      setFinishingOptions(JSON.stringify(updated));
    } catch {
      setFinishingOptions(JSON.stringify([option]));
    }
  }, [finishingOptions, setFinishingOptions]);

  // Parse finishing options for display
  const getSelectedFinishingOptions = useCallback(() => {
    try {
      return finishingOptions ? JSON.parse(finishingOptions) : [];
    } catch {
      return [];
    }
  }, [finishingOptions]);

  // Handle folding type change
  const handleFoldingTypeChange = useCallback((value) => {
    setFoldingType(value);
  }, [setFoldingType]);

  // Handle artwork file upload (simulated - in production would handle actual file)
  const handleArtworkUpload = useCallback((fileName) => {
    setArtworkFileName(fileName);
  }, [setArtworkFileName]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!productType || !quantity || !paperSize || !paperType || !colorType) {
      showError("Product Type, Quantity, Paper Size, Paper Type, and Color Type are required");
      return;
    }
    if (paperSize === "Custom" && (!customSizeWidth || !customSizeHeight)) {
      showError("Custom size width and height are required");
      return;
    }
    onSubmit();
    setShowProductionModal(false);
  }, [
    productType,
    quantity,
    paperSize,
    customSizeWidth,
    customSizeHeight,
    paperType,
    colorType,
    onSubmit,
    setShowProductionModal,
  ]);

  const selectedFinishingOptions = getSelectedFinishingOptions();

  if (!showProductionModal) return null;

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Production Requirements</h5>
              <button
                className="btn-close"
                onClick={() => {
                  setShowProductionModal(false);
                }}
              />
            </div>
            <div className="modal-body" style={{ maxHeight: "600px", overflowY: "auto" }}>

              {/* 1. Product Details */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">1️⃣ Product Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Product Type</label>
                      <select
                        className="form-select"
                        value={productType || ""}
                        onChange={(e) => handleProductTypeChange(e.target.value)}
                      >
                        <option value="">Select Product Type</option>
                        {PRODUCT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    {productType === "Custom" && (
                      <div className="col-md-6">
                        <label className="form-label">Custom Product Type</label>
                        <input
                          type="text"
                          className="form-control"
                          value={customProductType || ""}
                          onChange={(e) => setCustomProductType(e.target.value)}
                          placeholder="Describe product"
                        />
                      </div>
                    )}
                    <div className="col-md-6">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={quantity || ""}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        placeholder="Number of units"
                        min="1"
                      />
                    </div>
                    {["Brochure", "Booklet", "Catalog"].includes(productType) && (
                      <div className="col-md-6">
                        <label className="form-label">Number of Pages</label>
                        <input
                          type="number"
                          className="form-control"
                          value={numPages || ""}
                          onChange={(e) => handleNumPagesChange(e.target.value)}
                          placeholder="Pages"
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Size Details */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">2️⃣ Size Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label">Paper Size</label>
                      <select
                        className="form-select"
                        value={paperSize || ""}
                        onChange={(e) => handlePaperSizeChange(e.target.value)}
                      >
                        <option value="">Select Paper Size</option>
                        {PAPER_SIZE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    {paperSize === "Custom" && (
                      <>
                        <div className="col-md-4">
                          <label className="form-label">Width</label>
                          <input
                            type="number"
                            className="form-control"
                            value={customSizeWidth || ""}
                            onChange={(e) => handleCustomSizeWidthChange(e.target.value)}
                            placeholder="Width"
                            step="0.1"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Height</label>
                          <input
                            type="number"
                            className="form-control"
                            value={customSizeHeight || ""}
                            onChange={(e) => handleCustomSizeHeightChange(e.target.value)}
                            placeholder="Height"
                            step="0.1"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Unit</label>
                          <select
                            className="form-select"
                            value={customSizeUnit || "mm"}
                            onChange={(e) => handleCustomSizeUnitChange(e.target.value)}
                          >
                            <option value="mm">mm</option>
                            <option value="inches">inches</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Paper Specifications */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">3️⃣ Paper Specifications</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Paper Type</label>
                      <select
                        className="form-select"
                        value={paperType || ""}
                        onChange={(e) => setPaperType(e.target.value)}
                      >
                        <option value="">Select Paper Type</option>
                        {PAPER_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Paper GSM</label>
                      <select
                        className="form-select"
                        value={paperGsm || ""}
                        onChange={(e) => setPaperGsm(e.target.value)}
                      >
                        <option value="">Select GSM</option>
                        {PAPER_GSM_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Printing Specifications */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">4️⃣ Printing Specifications</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Color Type</label>
                      <select
                        className="form-select"
                        value={colorType || ""}
                        onChange={(e) => setColorType(e.target.value)}
                      >
                        <option value="">Select Color Type</option>
                        {COLOR_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Print Sides</label>
                      <select
                        className="form-select"
                        value={printSides || ""}
                        onChange={(e) => setPrintSides(e.target.value)}
                      >
                        <option value="">Select Print Sides</option>
                        {PRINT_SIDES_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Printing Method</label>
                      <select
                        className="form-select"
                        value={printingMethod || ""}
                        onChange={(e) => setPrintingMethod(e.target.value)}
                      >
                        <option value="">Select Printing Method</option>
                        {PRINTING_METHOD_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Finishing Options */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">5️⃣ Finishing Options (Multi-Select)</h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Select all that apply:</label>
                    <div className="d-flex flex-wrap gap-2">
                      {FINISHING_OPTIONS_LIST.map((option) => (
                        <div key={option} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`finishing_${option}`}
                            checked={selectedFinishingOptions.includes(option)}
                            onChange={() => handleFinishingOptionChange(option)}
                          />
                          <label className="form-check-label" htmlFor={`finishing_${option}`}>
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedFinishingOptions.includes("Folding") && (
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Folding Type</label>
                        <select
                          className="form-select"
                          value={foldingType || ""}
                          onChange={(e) => handleFoldingTypeChange(e.target.value)}
                        >
                          <option value="">Select Folding Type</option>
                          {FOLDING_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Client Artwork Upload */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">6️⃣ Client Artwork Upload</h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Upload Design File</label>
                    <div className="card border-dashed p-3 text-center" style={{ cursor: "pointer" }}>
                      <p className="text-muted mb-1">
                        <i className="ti ti-cloud-upload" style={{ fontSize: "24px" }} />
                      </p>
                      <small className="text-muted">
                        Supported formats: PDF, AI, PSD, EPS
                      </small>
                      <input
                        type="file"
                        accept=".pdf,.ai,.psd,.eps"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleArtworkUpload(file.name);
                          }
                        }}
                        style={{ display: "none" }}
                        id="artworkUpload"
                      />
                      <button
                        className="btn btn-sm btn-primary mt-2"
                        onClick={() => document.getElementById("artworkUpload")?.click()}
                      >
                        Choose File
                      </button>
                    </div>
                    {artworkFileName && (
                      <div className="alert alert-info mt-2 mb-0">
                        <small>
                          <i className="ti ti-file-check" /> {artworkFileName}
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Additional Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={additionalNotes || ""}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Any special instructions or notes..."
                    />
                  </div>
                </div>
              </div>

              {/* 8. Deadline & Delivery */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">8️⃣ Deadline & Delivery</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Print Deadline</label>
                      <input
                        type="date"
                        className="form-control"
                        value={printDeadline || ""}
                        onChange={(e) => setPrintDeadline(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Delivery Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={deliveryDate || ""}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={priority || "Normal"}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-light"
                onClick={() => {
                  setShowProductionModal(false);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Save Production Requirements
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
});

ProductionModal.displayName = "ProductionModal";
export default ProductionModal;
