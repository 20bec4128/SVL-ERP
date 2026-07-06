import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  approveBudgetVerification,
  downloadLeadRequirementFile,
  getLeadById,
  getLeadInvoiceItems,
  saveLeadInvoiceItems,
  uploadLeadLogFile,
} from "../../api/leadsApi";
import { getDesignRequirement } from "../../api/designRequirementApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import api from "../../utils/api";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function BudgetVerificationApprovePage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [itemForms, setItemForms] = useState([{ description: "", quantity: "", unitPrice: "", hsn: "" }]);
  const [itemFormErrors, setItemFormErrors] = useState({});
  const [savingItems, setSavingItems] = useState(false);
  const [invoiceCgstPercent, setInvoiceCgstPercent] = useState(0);
  const [invoiceSgstPercent, setInvoiceSgstPercent] = useState(0);
  const [designRequirement, setDesignRequirement] = useState(null);
  const [showRequirementDetailsModal, setShowRequirementDetailsModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadLead = async () => {
      setLoading(true);
      try {
        const data = await getLeadById(leadId);
        if (!mounted) return;
        setLead(data || null);
      } catch (e) {
        if (!mounted) return;
        showError(extractApiErrorMessage(e, "Failed to load budget verification"));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (leadId) loadLead();
    return () => { mounted = false; };
  }, [leadId]);

  useEffect(() => {
    if (!lead?.id) return;
    const loadItems = async () => {
      try {
        const savedItems = await getLeadInvoiceItems(lead.id);
        if (savedItems.length > 0) {
          setItems(savedItems.map((it) => ({
            description: it.description || "",
            hsn: it.hsn || "",
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.unitPrice) || 0,
          })));
        } else if (lead.invoiceData) {
          try {
            const parsedData = typeof lead.invoiceData === "string"
              ? JSON.parse(lead.invoiceData)
              : lead.invoiceData;
            if (parsedData?.items && Array.isArray(parsedData.items)) {
              setItems(parsedData.items);
            }
          } catch { /* ignore parse errors */ }
        }
        if (lead.invoiceCgstPercent != null) setInvoiceCgstPercent(Number(lead.invoiceCgstPercent) || 0);
        if (lead.invoiceSgstPercent != null) setInvoiceSgstPercent(Number(lead.invoiceSgstPercent) || 0);
      } catch (err) {
        console.error("Error loading invoice items:", err);
      }
    };
    loadItems();
  }, [lead?.id]);

  useEffect(() => {
    if (!lead?.id) return;
    let mounted = true;

    const loadRequirementDetails = async () => {
      try {
        const designRow = await getDesignRequirement(lead.id);
        if (!mounted) return;
        setDesignRequirement(designRow || null);
      } catch (err) {
        if (!mounted) return;
        console.warn("Failed to load budget requirement details:", err);
      }
    };

    loadRequirementDetails();
    return () => {
      mounted = false;
    };
  }, [lead?.id]);

  const handleApprove = async () => {
    if (!lead?.id) return;
    setSaving(true);
    try {
      const itemsForInvoice = items.map(it => ({ ...it, subtotal: Number(it.quantity) * Number(it.unitPrice) }));
      const invoiceDataJson = JSON.stringify({
        items: itemsForInvoice,
        totals,
        type: "budget",
        createdAt: new Date().toISOString(),
      });
      const invoiceFile = buildBudgetInvoicePdfFile();
      const uploadedInvoice = await uploadLeadLogFile(lead.id, invoiceFile);
      await approveBudgetVerification(
        lead.id,
        items,
        totals,
        totals.cgstPercent,
        totals.sgstPercent,
        invoiceDataJson,
        {
          budgetInvoiceFileName: uploadedInvoice?.fileName || invoiceFile.name,
          budgetInvoiceFilePath: uploadedInvoice?.filePath || null,
        }
      );
      showSuccess("Budget approved and invoice created successfully");
      navigate("/budget-verifications", { replace: true });
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to approve budget and create invoice"));
    } finally {
      setSaving(false);
    }
  };

  const buildBudgetInvoicePdfFile = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageMargin = 10;
    const invoiceNumber = `BDG-${lead.leadId || lead.id}-${Date.now()}`;

    doc.setFontSize(18);
    doc.text("BUDGET INVOICE", pageMargin, 15);

    doc.setFontSize(10);
    doc.text("SVL Printing and Packaging", pageMargin, 25);
    doc.text("GSTIN: 07AABCS1234H1Z0", pageMargin, 30);
    doc.text("103-A, Industrial Complex, SVL Business Park", pageMargin, 35);
    doc.text("Bangalore, Karnataka, 560001, India", pageMargin, 40);
    doc.text("Email: billing@svlprinting.com | Phone: +91-080-41234567", pageMargin, 45);

    doc.setFontSize(9);
    doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - pageMargin - 60, 25);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - pageMargin - 60, 30);
    doc.text(`Lead: ${lead.name}`, pageWidth - pageMargin - 60, 35);
    if (lead.requirementType) {
      doc.text(`Requirement: ${lead.requirementType}`, pageWidth - pageMargin - 60, 40);
    }

    const itemsWithSub = items.map((item) => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
    }));

    autoTable(doc, {
      startY: 55,
      head: [["#", "Description", "HSN", "Qty", "Unit Price", "Amount"]],
      body: itemsWithSub.map((item, idx) => ([
        String(idx + 1),
        item.description,
        item.hsn,
        item.quantity.toFixed(2),
        item.unitPrice.toFixed(2),
        item.subtotal.toFixed(2),
      ])),
      margin: { left: pageMargin, right: pageMargin },
      styles: { fontSize: 7.8, cellPadding: 1.5 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        3: { halign: "right", cellWidth: 18 },
        4: { halign: "right", cellWidth: 28 },
        5: { halign: "right", cellWidth: 28 },
      },
    });

    const finalY = (doc.lastAutoTable?.finalY || 55) + 5;
    const summaryXLabel = pageWidth - 72;
    const summaryXVal = pageWidth - pageMargin;
    const lineGap = 4.2;

    doc.setFontSize(8.5);
    doc.text("Subtotal:", summaryXLabel, finalY);
    doc.text(`Rs ${totals.subtotal.toFixed(2)}`, summaryXVal, finalY, { align: "right" });

    doc.text(`CGST (${totals.cgstPercent.toFixed(2)}%):`, summaryXLabel, finalY + lineGap);
    doc.text(`Rs ${totals.cgst.toFixed(2)}`, summaryXVal, finalY + lineGap, { align: "right" });

    doc.text(`SGST (${totals.sgstPercent.toFixed(2)}%):`, summaryXLabel, finalY + lineGap * 2);
    doc.text(`Rs ${totals.sgst.toFixed(2)}`, summaryXVal, finalY + lineGap * 2, { align: "right" });

    doc.setFontSize(9);
    doc.text("Grand Total:", summaryXLabel, finalY + lineGap * 3);
    doc.text(`Rs ${totals.grandTotal.toFixed(2)}`, summaryXVal, finalY + lineGap * 3, { align: "right" });

    doc.setFontSize(8);
    doc.text("DRAFT - Budget Calculation", pageMargin, pageHeight - 10);

    const pdfBlob = doc.output("blob");
    return new File([pdfBlob], `BudgetInvoice-${invoiceNumber}.pdf`, { type: "application/pdf" });
  };

  const handleDownloadInvoice = () => {
    try {
      const file = buildBudgetInvoicePdfFile();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate invoice:", err);
      showError("Unable to generate invoice PDF. Please try again.");
    }
  };

  const downloadRequirementFile = async () => {
    try {
      const { blob, contentDisposition } = await downloadLeadRequirementFile(lead.id);
      if (!blob) return;
      const match = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(contentDisposition || "");
      const fallback = lead.requirementFileName || `requirement-${lead.id}`;
      const fileName = decodeURIComponent((match?.[1] || fallback).replace(/\"/g, "").trim());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download requirement file"));
    }
  };

  const downloadProtectedFile = async (filePath, fileName) => {
    try {
      const response = await api.get(filePath, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download file"));
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h4>Calculate Budget</h4>
            <p className="text-muted">Loading budget details</p>
          </div>
        </div>
        <div className="text-center py-5">
          <LoadingSpinner size="page" label="Loading budget details" />
        </div>
      </>
    );
  }

  if (!lead) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h4>Calculate Budget</h4>
            <p className="text-muted">Unable to load</p>
          </div>
        </div>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>Budget verification not found.</p>
          <hr />
          <button className="btn btn-outline-danger" onClick={() => navigate("/budget-verifications")}>
            Back to Budget Verifications
          </button>
        </div>
      </>
    );
  }

  const validateForms = () => {
    const newErrors = {};
    let isValid = true;

    itemForms.forEach((form, index) => {
      // Only validate if description is filled (indicating this form should be saved)
      if (form.description.trim()) {
        const formErrors = {};
        if (!form.quantity || parseFloat(form.quantity) <= 0) formErrors.quantity = "Must be > 0";
        if (!form.unitPrice || parseFloat(form.unitPrice) <= 0) formErrors.unitPrice = "Must be > 0";
        if (!form.hsn.trim()) formErrors.hsn = "Required";
        if (Object.keys(formErrors).length > 0) {
          newErrors[index] = formErrors;
          isValid = false;
        }
      }
    });

    setItemFormErrors(newErrors);
    return isValid;
  };

  const handleAddItem = () => {
    // Validate all current forms first
    if (!validateForms()) return;

    // Add new empty form
    setItemForms([...itemForms, { description: "", quantity: "", unitPrice: "", hsn: "" }]);
  };

  const handleUpdateFormField = (index, field, value) => {
    const updated = [...itemForms];
    updated[index] = { ...updated[index], [field]: value };
    setItemForms(updated);
  };

  const handleDeleteForm = (index) => {
    // Don't allow deleting if only one form remains
    if (itemForms.length === 1) return;
    setItemForms(itemForms.filter((_, i) => i !== index));
    // Clear errors for this form
    const updated = { ...itemFormErrors };
    delete updated[index];
    setItemFormErrors(updated);
  };

  const handleSaveItems = async () => {
    if (!lead?.id) return;

    // Validate all forms first
    if (!validateForms()) return;

    // Filter only filled forms (those with description)
    const filledForms = itemForms.filter(form => form.description.trim());
    if (filledForms.length === 0) {
      showError("Please add at least one item before saving");
      return;
    }

    setSavingItems(true);
    try {
      const mappedItems = filledForms.map((form) => ({
        description: form.description,
        hsn: form.hsn || "",
        quantity: Number(form.quantity) || 0,
        unitPrice: Number(form.unitPrice) || 0,
      }));
      
      await saveLeadInvoiceItems(lead.id, mappedItems, parseFloat(invoiceCgstPercent) || 0, parseFloat(invoiceSgstPercent) || 0);
      
      // Move saved forms to items table
      setItems([...items, ...filledForms.map(f => ({
        description: f.description,
        quantity: parseFloat(f.quantity),
        unitPrice: parseFloat(f.unitPrice),
        hsn: f.hsn,
      }))]);
      
      // Reset forms to single empty form
      setItemForms([{ description: "", quantity: "", unitPrice: "", hsn: "" }]);
      setItemFormErrors({});
      
      showSuccess("Invoice items saved");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save items"));
    } finally {
      setSavingItems(false);
    }
  };

  const itemsWithTotals = items.map((item) => ({
    ...item,
    subtotal: item.quantity * item.unitPrice,
  }));

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0);
  const cgstAmt = (subtotal * (parseFloat(invoiceCgstPercent) || 0)) / 100;
  const sgstAmt = (subtotal * (parseFloat(invoiceSgstPercent) || 0)) / 100;

  const totals = {
    subtotal,
    cgstPercent: parseFloat(invoiceCgstPercent) || 0,
    sgstPercent: parseFloat(invoiceSgstPercent) || 0,
    cgst: cgstAmt,
    sgst: sgstAmt,
    grandTotal: subtotal + cgstAmt + sgstAmt,
  };

  const isPending = lead.budgetVerificationStatus === "PENDING";

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Calculate Budget</h4>
          <p className="text-muted">Lead: <strong>{lead.name}</strong> (ID: #{lead.leadId || lead.id})</p>
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/budget-verifications")}
          disabled={saving}
        >
          <i className="ti ti-arrow-left me-1"></i> Back to List
        </button>
      </div>



      {/* Requirement Info */}
      {(lead.requirementType || lead.requirementNotes || lead.requirementFileName) && (
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><i className="ti ti-file-description me-2"></i>Requirement Details</h6>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowRequirementDetailsModal(true)}
              >
                <i className="ti ti-eye me-1"></i>View
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {lead.requirementType && (
                <div className="col-md-4">
                  <div className="text-muted small mb-1">Requirement Type</div>
                  <span className="badge bg-secondary fs-6">{lead.requirementType}</span>
                </div>
              )}
              {lead.requirementNotes && (
                <div className="col-md-8">
                  <div className="text-muted small mb-1">Notes</div>
                  <div className="fw-semibold">{lead.requirementNotes}</div>
                </div>
              )}
              {lead.requirementFileName && (
                <div className="col-md-12">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={downloadRequirementFile}
                  >
                    <i className="ti ti-download me-1"></i>Download Requirement File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRequirementDetailsModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" aria-modal="true" role="dialog">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Requirement Details for #{lead.leadId || lead.id}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRequirementDetailsModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="text-muted small mb-1">Lead Name</div>
                      <div className="fw-semibold">{lead.name || "-"}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small mb-1">Selected Category</div>
                      <span className="badge bg-secondary fs-6">{lead.requirementType || "-"}</span>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small mb-1">Notes</div>
                      <div className="fw-semibold">{lead.requirementNotes || "-"}</div>
                    </div>
                    {lead.requirementFileName && (
                      <div className="col-md-12">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          <div className="fw-semibold text-break">{lead.requirementFileName}</div>
                          <button className="btn btn-sm btn-outline-secondary" onClick={downloadRequirementFile}>
                            <i className="ti ti-download me-1"></i>Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {designRequirement && (
                    <div className="card mb-4">
                      <div className="card-header">
                        <h6 className="mb-0"><i className="ti ti-palette me-2"></i>Design Requirement Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-4"><div className="text-muted small mb-1">Requirement Type</div><div className="fw-semibold">{designRequirement.requirementType || "-"}</div></div>
                          <div className="col-md-4"><div className="text-muted small mb-1">Product Type</div><div className="fw-semibold">{designRequirement.designProductType || "-"}</div></div>
                          <div className="col-md-4"><div className="text-muted small mb-1">Size</div><div className="fw-semibold">{designRequirement.designSize || "-"}</div></div>
                          <div className="col-md-4"><div className="text-muted small mb-1">Orientation</div><div className="fw-semibold">{designRequirement.designOrientation || "-"}</div></div>
                          <div className="col-md-4"><div className="text-muted small mb-1">Pages</div><div className="fw-semibold">{designRequirement.designNumPages || "-"}</div></div>
                          <div className="col-md-4"><div className="text-muted small mb-1">Purpose</div><div className="fw-semibold">{designRequirement.designPurpose || "-"}</div></div>
                          <div className="col-md-6"><div className="text-muted small mb-1">Target Audience</div><div className="fw-semibold">{designRequirement.designTargetAudience || "-"}</div></div>
                          <div className="col-md-6"><div className="text-muted small mb-1">Style Preference</div><div className="fw-semibold">{designRequirement.designStylePref || "-"}</div></div>
                          <div className="col-md-6"><div className="text-muted small mb-1">Brand Colors</div><div className="fw-semibold">{designRequirement.designBrandColors || "-"}</div></div>
                          <div className="col-md-6"><div className="text-muted small mb-1">Fonts</div><div className="fw-semibold">{designRequirement.designFonts || "-"}</div></div>
                          <div className="col-md-12"><div className="text-muted small mb-1">Description</div><div className="fw-semibold">{designRequirement.designDescription || "-"}</div></div>
                          <div className="col-md-12"><div className="text-muted small mb-1">Additional Notes</div><div className="fw-semibold">{designRequirement.designAdditionalNotes || designRequirement.requirementNotes || "-"}</div></div>
                          <div className="col-md-6"><div className="text-muted small mb-1">Deadline</div><div className="fw-semibold">{designRequirement.designDeadline ? formatDateTime(designRequirement.designDeadline) : "-"}</div></div>
                          <div className="col-md-6"><div className="text-muted small mb-1">Priority</div><div className="fw-semibold">{designRequirement.designPriority || "-"}</div></div>
                          <div className="col-md-12"><div className="text-muted small mb-1">Reference Links</div><div className="fw-semibold">{designRequirement.designReferenceLinks || "-"}</div></div>
                          {designRequirement.designBrandGuidelinesFileName && (
                            <div className="col-md-6"><div className="text-muted small mb-1">Brand Guidelines</div><div className="d-flex flex-wrap gap-2 align-items-center"><div className="fw-semibold text-break">{designRequirement.designBrandGuidelinesFileName}</div>{designRequirement.designBrandGuidelinesFilePath && <button className="btn btn-sm btn-outline-secondary" onClick={() => downloadProtectedFile(designRequirement.designBrandGuidelinesFilePath, designRequirement.designBrandGuidelinesFileName)}><i className="ti ti-download me-1"></i>Download</button>}</div></div>
                          )}
                          {designRequirement.designLogoFileName && (
                            <div className="col-md-6"><div className="text-muted small mb-1">Logo File</div><div className="d-flex flex-wrap gap-2 align-items-center"><div className="fw-semibold text-break">{designRequirement.designLogoFileName}</div>{designRequirement.designLogoFilePath && <button className="btn btn-sm btn-outline-secondary" onClick={() => downloadProtectedFile(designRequirement.designLogoFilePath, designRequirement.designLogoFileName)}><i className="ti ti-download me-1"></i>Download</button>}</div></div>
                          )}
                          {designRequirement.designImagesFileName && (
                            <div className="col-md-6"><div className="text-muted small mb-1">Client Images</div><div className="d-flex flex-wrap gap-2 align-items-center"><div className="fw-semibold text-break">{designRequirement.designImagesFileName}</div>{designRequirement.designImagesFilePath && <button className="btn btn-sm btn-outline-secondary" onClick={() => downloadProtectedFile(designRequirement.designImagesFilePath, designRequirement.designImagesFileName)}><i className="ti ti-download me-1"></i>Download</button>}</div></div>
                          )}
                          {designRequirement.designReferenceImagesFileName && (
                            <div className="col-md-6"><div className="text-muted small mb-1">Reference Images</div><div className="d-flex flex-wrap gap-2 align-items-center"><div className="fw-semibold text-break">{designRequirement.designReferenceImagesFileName}</div>{designRequirement.designReferenceImagesFilePath && <button className="btn btn-sm btn-outline-secondary" onClick={() => downloadProtectedFile(designRequirement.designReferenceImagesFilePath, designRequirement.designReferenceImagesFileName)}><i className="ti ti-download me-1"></i>Download</button>}</div></div>
                          )}
                          {designRequirement.designPreviousDesignsFileName && (
                            <div className="col-md-6"><div className="text-muted small mb-1">Previous Designs</div><div className="d-flex flex-wrap gap-2 align-items-center"><div className="fw-semibold text-break">{designRequirement.designPreviousDesignsFileName}</div>{designRequirement.designPreviousDesignsFilePath && <button className="btn btn-sm btn-outline-secondary" onClick={() => downloadProtectedFile(designRequirement.designPreviousDesignsFilePath, designRequirement.designPreviousDesignsFileName)}><i className="ti ti-download me-1"></i>Download</button>}</div></div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowRequirementDetailsModal(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      <div className="row">
        <div className="col-md-12">
          {/* Summary cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 bg-light h-100">
                <div className="card-body py-3">
                  <div className="text-muted small mb-1">Lead Name</div>
                  <div className="fw-semibold fs-6">{lead.name}</div>
                  <div className="text-muted small">#{lead.leadId || lead.id}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className={`card h-100 ${isPending ? "border-info" : "border-success"}`}>
                <div className="card-body py-3">
                  <div className="text-muted small mb-1">Budget Status</div>
                  <div className={`fw-bold fs-5 ${isPending ? "text-info" : "text-success"}`}>
                    {lead.budgetVerificationStatus || "—"}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 bg-light h-100">
                <div className="card-body py-3">
                  <div className="text-muted small mb-1">Calculated Grand Total</div>
                  <div className="fw-bold fs-5 text-primary">
                    ₹{totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className="alert alert-success mb-3">
              <i className="ti ti-circle-check me-2"></i>
              {items.length} item(s) loaded. You can edit them below before approving.
            </div>
          )}

          {/* Multiple Item Forms */}
          <div className="card mb-3 border">
            <div className="card-body">
              <h6 className="mb-3">Add Invoice Items</h6>
              {itemForms.map((form, index) => (
                <div key={index} className="mb-4 p-3 border rounded" style={{ backgroundColor: "#f8f9fa" }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Item {index + 1}</h6>
                    {itemForms.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-danger"
                        onClick={() => handleDeleteForm(index)}
                        title="Delete this form"
                      >
                        <i className="ti ti-trash"></i> Delete
                      </button>
                    )}
                  </div>
                  <form>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <label className="small mb-1 text-dark">Description <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control form-control-sm text-dark ${itemFormErrors[index]?.description ? "is-invalid" : ""}`}
                          value={form.description}
                          onChange={(e) => handleUpdateFormField(index, "description", e.target.value)}
                          placeholder="Item description"
                        />
                        {itemFormErrors[index]?.description && <div className="invalid-feedback d-block">{itemFormErrors[index].description}</div>}
                      </div>
                      <div className="col-md-6 mb-2">
                        <label className="small mb-1 text-dark">HSN Code <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control form-control-sm text-dark ${itemFormErrors[index]?.hsn ? "is-invalid" : ""}`}
                          value={form.hsn}
                          onChange={(e) => handleUpdateFormField(index, "hsn", e.target.value)}
                          placeholder="HSN code"
                        />
                        {itemFormErrors[index]?.hsn && <div className="invalid-feedback d-block">{itemFormErrors[index].hsn}</div>}
                      </div>
                      <div className="col-md-3 mb-2">
                        <label className="small mb-1 text-dark">Quantity <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className={`form-control form-control-sm text-dark ${itemFormErrors[index]?.quantity ? "is-invalid" : ""}`}
                          value={form.quantity}
                          onChange={(e) => handleUpdateFormField(index, "quantity", e.target.value)}
                          placeholder="0"
                          step="0.01"
                        />
                        {itemFormErrors[index]?.quantity && <div className="invalid-feedback d-block">{itemFormErrors[index].quantity}</div>}
                      </div>
                      <div className="col-md-3 mb-2">
                        <label className="small mb-1 text-dark">Unit Price (₹) <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className={`form-control form-control-sm text-dark ${itemFormErrors[index]?.unitPrice ? "is-invalid" : ""}`}
                          value={form.unitPrice}
                          onChange={(e) => handleUpdateFormField(index, "unitPrice", e.target.value)}
                          placeholder="0"
                          step="0.01"
                        />
                        {itemFormErrors[index]?.unitPrice && <div className="invalid-feedback d-block">{itemFormErrors[index].unitPrice}</div>}
                      </div>
                    </div>
                  </form>
                </div>
              ))}
              <div className="mt-3">
                <button type="button" className="btn btn-sm btn-success" onClick={handleAddItem}>
                  <i className="ti ti-plus me-1"></i> Add Another Item
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary ms-2"
                  onClick={handleSaveItems}
                  disabled={savingItems || items.length === 0 && itemForms.every(f => !f.description.trim())}
                >
                  {savingItems ? "Saving..." : "Save Items (Draft)"}
                </button>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="card border">
                  <div className="card-body py-3">
                    <h6 className="mb-3">Invoice Tax (Whole Invoice)</h6>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <label className="small mb-1 text-dark">CGST %</label>
                        <input
                          type="number"
                          className="form-control form-control-sm text-dark"
                          value={invoiceCgstPercent}
                          onChange={(e) => setInvoiceCgstPercent(e.target.value)}
                          placeholder="0"
                          step="0.01"
                          disabled={!isPending}
                        />
                      </div>
                      <div className="col-md-6 mb-2">
                        <label className="small mb-1 text-dark">SGST %</label>
                        <input
                          type="number"
                          className="form-control form-control-sm text-dark"
                          value={invoiceSgstPercent}
                          onChange={(e) => setInvoiceSgstPercent(e.target.value)}
                          placeholder="0"
                          step="0.01"
                          disabled={!isPending}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="table-responsive mb-3">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Description</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                    <th style={{ width: "80px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWithTotals.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td>{item.hsn}</td>
                      <td className="text-end">{item.quantity}</td>
                      <td className="text-end">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="text-end">₹{item.subtotal.toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          title="Delete"
                          disabled={saving || !isPending}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length > 0 && (
            <div className="row mb-3">
              <div className="col-md-6 offset-md-6">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Subtotal:</strong></td>
                      <td className="text-end"><strong>₹{totals.subtotal.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                      <td><strong>CGST ({totals.cgstPercent.toFixed(2)}%):</strong></td>
                      <td className="text-end"><strong>₹{totals.cgst.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                      <td><strong>SGST ({totals.sgstPercent.toFixed(2)}%):</strong></td>
                      <td className="text-end"><strong>₹{totals.sgst.toFixed(2)}</strong></td>
                    </tr>
                    <tr className="table-primary">
                      <td><strong>Grand Total:</strong></td>
                      <td className="text-end"><strong>₹{totals.grandTotal.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!items.length && (
            <div className="alert alert-warning">
              <i className="ti ti-alert-circle me-2"></i>
              Please add at least one invoice item before approving the budget
            </div>
          )}

         

          <div className="row mt-4">
            <div className="col-md-12">
              {isPending && (
                <>
                  <button
                    className="btn btn-info"
                    onClick={handleDownloadInvoice}
                    disabled={items.length === 0}
                    title="Download budget invoice as PDF before approving"
                  >
                    <i className="ti ti-download me-1"></i>Download Invoice
                  </button>
                  <button
                    className="btn btn-primary ms-2"
                    onClick={handleApprove}
                    disabled={saving || items.length === 0}
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="me-2" label="Approving budget" />
                        Approving...
                      </>
                    ) : (
                      <><i className="ti ti-check me-1"></i>Approve Budget & Create Invoice</>
                    )}
                  </button>
                </>
              )}
              <button
                className="btn btn-outline-secondary ms-2"
                onClick={() => navigate("/budget-verifications")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
