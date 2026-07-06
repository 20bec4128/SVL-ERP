import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./LeadImportEditModal.css";

export default function LeadImportEditModal({
  isOpen,
  onClose,
  rowData,
  onSave,
  allowEditMandatory = false,
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (rowData) {
      setFormData({
        name: rowData.name || "",
        mobile: rowData.mobile || "",
        primarySource: rowData.primarySource || "",
        email: rowData.email || "",
        secondarySource: rowData.secondarySource || "",
        productType: rowData.productType || "",
        variant: rowData.variant || "",
        quantity: rowData.quantity != null ? String(rowData.quantity) : "",
        companyName: rowData.companyName || "",
        streetAddress: rowData.streetAddress || "",
        state: rowData.state || "",
        district: rowData.district || "",
      });
    }
  }, [rowData]);

  const showVariantQuantityFields =
    String(formData.variant || "").trim() !== "" ||
    String(formData.quantity || "").trim() !== "";

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen || !rowData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="modal-dialog modal-lg"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Lead Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={onClose}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="lead-import-edit-form">
                    {/* Mandatory Fields */}
                    <div className="form-section">
                      <h6 className="section-title">
                        Mandatory Information
                        {allowEditMandatory && (
                          <span className="badge bg-warning text-dark ms-2" style={{ fontSize: 11, fontWeight: 400 }}>
                            Editable — fix conflict then save
                          </span>
                        )}
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.name}
                            readOnly={!allowEditMandatory}
                            onChange={allowEditMandatory ? (e) => handleChange("name", e.target.value) : undefined}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Mobile *</label>
                          <input
                            type="tel"
                            className="form-control"
                            value={formData.mobile}
                            readOnly={!allowEditMandatory}
                            onChange={allowEditMandatory ? (e) => handleChange("mobile", e.target.value) : undefined}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label">Primary Source *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.primarySource}
                            readOnly={!allowEditMandatory}
                            onChange={allowEditMandatory ? (e) => handleChange("primarySource", e.target.value) : undefined}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Optional Fields - Editable */}
                    <div className="form-section">
                      <h6 className="section-title">Additional Details</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={formData.email}
                            onChange={(e) =>
                              handleChange("email", e.target.value)
                            }
                            placeholder="Enter email"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Secondary Source</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.secondarySource}
                            onChange={(e) =>
                              handleChange("secondarySource", e.target.value)
                            }
                            placeholder="e.g., Google, Referral"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            Product Type
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.productType}
                            onChange={(e) =>
                              handleChange("productType", e.target.value)
                            }
                            placeholder="e.g., Software, Hardware"
                          />
                        </div>
                        {showVariantQuantityFields ? (
                          <>
                            <div className="col-md-6">
                              <label className="form-label">Variant</label>
                              <input
                                type="text"
                                className="form-control"
                                value={formData.variant}
                                onChange={(e) =>
                                  handleChange("variant", e.target.value)
                                }
                                placeholder="e.g., Size, Color, Style"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Quantity</label>
                              <input
                                type="number"
                                className="form-control"
                                value={formData.quantity}
                                onChange={(e) =>
                                  handleChange("quantity", e.target.value)
                                }
                                placeholder="e.g., 100"
                              />
                            </div>
                          </>
                        ) : null}
                        <div className="col-md-6">
                          <label className="form-label">Company Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.companyName}
                            onChange={(e) =>
                              handleChange("companyName", e.target.value)
                            }
                            placeholder="Enter company name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div className="form-section">
                      <h6 className="section-title">Address</h6>
                      <div className="row g-3">
                        <div className="col-md-12">
                          <label className="form-label">Street Address</label>
                          <textarea
                            className="form-control"
                            value={formData.streetAddress}
                            onChange={(e) =>
                              handleChange("streetAddress", e.target.value)
                            }
                            placeholder="Enter street address"
                            rows={2}
                          ></textarea>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">State</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.state}
                            onChange={(e) =>
                              handleChange("state", e.target.value)
                            }
                            placeholder="e.g., Maharashtra"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">District/City</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.district}
                            onChange={(e) =>
                              handleChange("district", e.target.value)
                            }
                            placeholder="e.g., Mumbai"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            className="modal-backdrop fade show"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          ></motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
