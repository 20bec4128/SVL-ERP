import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getLeadById, updateLeadDetails, getLeadInvoiceItems, saveLeadInvoiceItems, uploadLeadLogFile } from "../../api/leadsApi";
import { getAddressById } from "../../api/addressApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";

export default function PaymentVerificationApprovePage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // All useState hooks must be at the top level before any conditional logic
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [itemForms, setItemForms] = useState([{ description: "", quantity: "", unitPrice: "", hsn: "" }]);
  const [itemFormErrors, setItemFormErrors] = useState({});
  const [savingItems, setSavingItems] = useState(false);
  const [invoiceCgstPercent, setInvoiceCgstPercent] = useState(0);
  const [invoiceSgstPercent, setInvoiceSgstPercent] = useState(0);
  const [billingAddress, setBillingAddress] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadLead = async () => {
      setLoading(true);
      try {
        const data = await getLeadById(leadId);
        if (!mounted) {
          return;
        }
        setLead(data || null);
      } catch (e) {
        if (!mounted) {
          return;
        }
        showError(extractApiErrorMessage(e, "Failed to load payment verification"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (leadId) {
      loadLead();
    }

    return () => {
      mounted = false;
    };
  }, [leadId]);

  useEffect(() => {
    const loadAddresses = async () => {
      if (!lead?.id) return;
      try {
        if (lead.paymentVerificationBillingAddressId) {
          const billing = await getAddressById(lead.id, lead.paymentVerificationBillingAddressId);
          setBillingAddress(billing || null);
        }
        if (lead.paymentVerificationShippingAddressId) {
          const shipping = await getAddressById(lead.id, lead.paymentVerificationShippingAddressId);
          setShippingAddress(shipping || null);
        }
      } catch (err) {
        console.error("Error loading addresses:", err);
      }
    };
    loadAddresses();
  }, [lead?.id]);

  // Load saved invoice items if they exist
  useEffect(() => {
    if (!lead?.id) return;
    const loadItems = async () => {
      try {
        const savedItems = await getLeadInvoiceItems(lead.id);
        if (savedItems.length > 0) {
          // Map from backend entity format to frontend format
          setItems(savedItems.map(it => ({
            description: it.description || "",
            hsn: it.hsn || "",
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.unitPrice) || 0,
          })));
        } else if (lead.invoiceData) {
          // Fallback: load from JSON blob if table is empty
          try {
            const parsedData = typeof lead.invoiceData === "string"
              ? JSON.parse(lead.invoiceData)
              : lead.invoiceData;
            if (parsedData?.items && Array.isArray(parsedData.items)) {
              setItems(parsedData.items);
            }
          } catch { /* ignore parse errors */ }
        }
        // Auto-populate CGST/SGST from lead
        if (lead.invoiceCgstPercent != null) setInvoiceCgstPercent(Number(lead.invoiceCgstPercent) || 0);
        if (lead.invoiceSgstPercent != null) setInvoiceSgstPercent(Number(lead.invoiceSgstPercent) || 0);
      } catch (err) {
        console.error("Error loading invoice items:", err);
      }
    };
    loadItems();
  }, [lead?.id]);

  const handleApprove = async (items, totals) => {
    if (!lead?.id) {
      return;
    }

    setSaving(true);
    try {
      const itemsForInvoice = items.map(it => ({ ...it, subtotal: Number(it.quantity) * Number(it.unitPrice) }));
      const invoiceDataJson = JSON.stringify({
        items: itemsForInvoice,
        totals,
        type: "payment",
        createdAt: new Date().toISOString(),
      });

      // Persist items to backend table first
      const mappedItems = items.map(it => ({
        description: it.description,
        hsn: it.hsn || "",
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
      }));
      await saveLeadInvoiceItems(lead.id, mappedItems, totals.cgstPercent, totals.sgstPercent);

      const invoiceFile = buildPaymentInvoicePdfFile(items, totals);
      const uploadedInvoice = await uploadLeadLogFile(lead.id, invoiceFile);

      await updateLeadDetails(lead.id, {
        paymentVerificationStatus: "APPROVED",
        invoiceData: invoiceDataJson,
        invoiceCgstPercent: totals.cgstPercent,
        invoiceSgstPercent: totals.sgstPercent,
        paymentVerificationInvoiceFileName: uploadedInvoice?.fileName || invoiceFile.name,
        paymentVerificationInvoiceFilePath: uploadedInvoice?.filePath || null,
      });
      showSuccess("Payment verified and invoice created successfully");
      navigate("/payment-verifications", { replace: true });
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to approve verification and create invoice"));
    } finally {
      setSaving(false);
    }
  };

  const handleApproveClick = async () => {
    await handleApprove(items, totals);
  };

  const buildPaymentInvoicePdfFile = (currentItems, currentTotals) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageMargin = 10;
    const invoiceNumber = `INV-${lead.leadId || lead.id}-${Date.now()}`;
    const verificationAmount = parseFloat(lead.paymentVerificationAmount) || 0;

    doc.setFontSize(18);
    doc.text("INVOICE", pageMargin, 15);

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

    const blockY = 55;
    const blockHeight = 30;
    const blockWidth = (pageWidth - pageMargin * 3) / 2;
    const billingX = pageMargin;
    const shippingX = pageMargin + blockWidth + pageMargin;
    const titleY = blockY + 3;
    const textY = blockY + 9;

    const formatAddress = (address) => {
      if (!address) return "-";
      const parts = [
        address.companyName,
        address.contactPersonName,
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.pincode,
        address.country,
      ].filter(Boolean);
      return parts.join(", ");
    };

    const billingLines = doc.splitTextToSize(formatAddress(billingAddress), blockWidth - 4);
    const shippingLines = doc.splitTextToSize(formatAddress(shippingAddress), blockWidth - 4);

    doc.rect(billingX, blockY, blockWidth, blockHeight);
    doc.rect(shippingX, blockY, blockWidth, blockHeight);

    doc.setFontSize(8.5);
    doc.text("BILLING ADDRESS", billingX + 2, titleY);
    doc.text("SHIPPING ADDRESS", shippingX + 2, titleY);
    doc.setFontSize(8);
    doc.text(billingLines, billingX + 2, textY);
    doc.text(shippingLines, shippingX + 2, textY);

    const itemsWithTotals = currentItems.map((item) => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
    }));

    autoTable(doc, {
      startY: blockY + blockHeight + 6,
      head: [["#", "Description", "HSN", "Qty", "Unit Price", "Amount"]],
      body: itemsWithTotals.map((item, idx) => ([
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

    const finalY = (doc.lastAutoTable?.finalY || blockY + blockHeight + 6) + 5;
    const summaryXLabel = pageWidth - 72;
    const summaryXVal = pageWidth - pageMargin;
    const lineGap = 4.2;

    doc.setFontSize(8.5);
    doc.text("Subtotal:", summaryXLabel, finalY);
    doc.text(`Rs ${currentTotals.subtotal.toFixed(2)}`, summaryXVal, finalY, { align: "right" });

    doc.text(`CGST (${currentTotals.cgstPercent.toFixed(2)}%):`, summaryXLabel, finalY + lineGap);
    doc.text(`Rs ${currentTotals.cgst.toFixed(2)}`, summaryXVal, finalY + lineGap, { align: "right" });

    doc.text(`SGST (${currentTotals.sgstPercent.toFixed(2)}%):`, summaryXLabel, finalY + lineGap * 2);
    doc.text(`Rs ${currentTotals.sgst.toFixed(2)}`, summaryXVal, finalY + lineGap * 2, { align: "right" });

    doc.setFontSize(9);
    doc.text("Grand Total:", summaryXLabel, finalY + lineGap * 3);
    doc.text(`Rs ${currentTotals.grandTotal.toFixed(2)}`, summaryXVal, finalY + lineGap * 3, { align: "right" });

    doc.text("Amount Verified (This Payment):", summaryXLabel, finalY + lineGap * 4.2);
    doc.text(`Rs ${verificationAmount.toFixed(2)}`, summaryXVal, finalY + lineGap * 4.2, { align: "right" });

    doc.text("Total Paid Amount:", summaryXLabel, finalY + lineGap * 5.2);
    doc.text(`Rs ${(currentTotals.paidAmount + verificationAmount).toFixed(2)}`, summaryXVal, finalY + lineGap * 5.2, { align: "right" });

    doc.text("Remaining After Approval:", summaryXLabel, finalY + lineGap * 6.2);
    doc.text(`Rs ${Math.max(0, currentTotals.grandTotal - (currentTotals.paidAmount + verificationAmount)).toFixed(2)}`, summaryXVal, finalY + lineGap * 6.2, { align: "right" });

    doc.setFontSize(8);
    doc.text("DRAFT - Not Yet Approved", pageMargin, pageHeight - 10);

    const pdfBlob = doc.output("blob");
    return new File([pdfBlob], `PaymentVerificationInvoice-${invoiceNumber}.pdf`, { type: "application/pdf" });
  };

  const handleDownloadInvoice = async () => {
    try {
      const file = buildPaymentInvoicePdfFile(items, totals);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      showError("Unable to generate invoice PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h4>Approve Payment Verification</h4>
            <p className="text-muted">Loading approval form...</p>
          </div>
        </div>
        <div className="text-center py-5">
          <LoadingSpinner size="page" label="Loading payment verification" />
        </div>
      </>
    );
  }

  if (!lead) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h4>Approve Payment Verification</h4>
            <p className="text-muted">Unable to load the request</p>
          </div>
        </div>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Approval Page Error</h4>
          <p>Payment verification not found.</p>
          <hr />
          <button
            className="btn btn-outline-danger"
            onClick={() => navigate("/payment-verifications")}
          >
            Back to Payment Verifications
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
      
      // Replace items state with the saved forms (not append to avoid duplicates)
      setItems(filledForms.map(f => ({
        description: f.description,
        quantity: parseFloat(f.quantity),
        unitPrice: parseFloat(f.unitPrice),
        hsn: f.hsn,
      })));
      
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

  const totals = {
    subtotal: itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0),
    cgstPercent: parseFloat(invoiceCgstPercent) || 0,
    sgstPercent: parseFloat(invoiceSgstPercent) || 0,
    cgst: (itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0) * (parseFloat(invoiceCgstPercent) || 0)) / 100,
    sgst: (itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0) * (parseFloat(invoiceSgstPercent) || 0)) / 100,
    paidAmount: parseFloat(lead.paidAmount) || 0,
  };

  const verificationAmount = parseFloat(lead.paymentVerificationAmount) || 0;

  totals.grandTotal = totals.subtotal + totals.cgst + totals.sgst;
  totals.verificationAmount = verificationAmount;
  // Remaining = grand total - verification amount being approved
  totals.remainingAmount = totals.grandTotal - verificationAmount;

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Payment Verification</h4>
          <p className="text-muted">Lead: <strong>{lead.name}</strong> (ID: #{lead.leadId || lead.id})</p>
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/payment-verifications")}
          disabled={saving}
        >
          <i className="ti ti-arrow-left me-1"></i> Back to List
        </button>
      </div>



      {/* Show Invoice Form only for Pending */}
      {lead.paymentVerificationStatus === "PENDING" && (
        <div className="row">
          <div className="col-md-12">
            {/* Prominent summary cards */}
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
                <div className="card border-warning h-100">
                  <div className="card-body py-3">
                    <div className="text-muted small mb-1">Amount Being Verified</div>
                    <div className="fw-bold fs-3 text-warning">
                      ₹{verificationAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-muted small mt-1">Submitted by customer</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body py-3">
                    <div className="text-muted small mb-1">Already Paid (before this request)</div>
                    <div className="fw-semibold fs-5 text-success">
                      ₹{totals.paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Show saved items message if they exist */}
            {items.length > 0 && (
              <div className="alert alert-success mb-3">
                <i className="ti ti-circle-check me-2"></i>
                {items.length} item(s) loaded. You can edit them below before approving.
              </div>
            )}

            {/* Multiple Item Forms */}
            {lead.paymentVerificationStatus === "PENDING" && (
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
            )}

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
                            disabled={saving || lead.paymentVerificationStatus !== "PENDING"}
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
                      <tr className="table-warning">
                        <td><strong>Amount Being Verified:</strong></td>
                        <td className="text-end"><span className="text-warning fw-bold fs-4">₹{verificationAmount.toFixed(2)}</span></td>
                      </tr>
                      <tr className={totals.remainingAmount <= 0 ? "table-success" : "table-danger"}>
                        <td><strong>Remaining After Approval:</strong></td>
                        <td className="text-end"><strong>₹{Math.max(0, totals.remainingAmount).toFixed(2)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!items.length && (
              <div className="alert alert-warning">
                <i className="ti ti-alert-circle me-2"></i>
                Please add at least one invoice item before approving
              </div>
            )}

         

            <div className="row mt-4">
              <div className="col-md-12">
                {lead.paymentVerificationStatus === "PENDING" && (
                  <>
                    <button
                      className="btn btn-info"
                      onClick={handleDownloadInvoice}
                      disabled={items.length === 0}
                      title="Download invoice as PDF before approving"
                    >
                      <i className="ti ti-download me-1"></i>Download Invoice
                    </button>
                    <button
                      className="btn btn-primary ms-2"
                      onClick={handleApproveClick}
                      disabled={saving || items.length === 0}
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner size="sm" className="me-2" label="Approving payment verification" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-check me-1"></i>Approve Payment & Create Invoice
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  className="btn btn-outline-secondary ms-2"
                  onClick={() => navigate(`/payment-verifications/${lead.id}`)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
