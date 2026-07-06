import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getAddressById } from "../../api/addressApi";

export default function InvoiceBuilderModal({ 
  lead, 
  paidAmount,
  onApprove, 
  onCancel,
  isLoading,
  standalone = false,
}) {
  const [items, setItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [invoiceCgstPercent, setInvoiceCgstPercent] = useState(0);
  const [invoiceSgstPercent, setInvoiceSgstPercent] = useState(0);
  const [billingAddress, setBillingAddress] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);

  const [formData, setFormData] = useState({
    description: "",
    quantity: "",
    unitPrice: "",
    hsn: "",
  });

  useEffect(() => {
    const loadAddresses = async () => {
      if (!lead?.id) return;
      try {
        if (lead.paymentVerificationBillingAddressId) {
          const billing = await getAddressById(lead.id, lead.paymentVerificationBillingAddressId);
          setBillingAddress(billing || null);
        } else {
          setBillingAddress(null);
        }
        if (lead.paymentVerificationShippingAddressId) {
          const shipping = await getAddressById(lead.id, lead.paymentVerificationShippingAddressId);
          setShippingAddress(shipping || null);
        } else {
          setShippingAddress(null);
        }
      } catch {
        setBillingAddress(null);
        setShippingAddress(null);
      }
    };
    loadAddresses();
  }, [lead?.id, lead?.paymentVerificationBillingAddressId, lead?.paymentVerificationShippingAddressId]);

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

  const MOCK_COMPANY = {
    name: "SVL Printing and Packaging",
    gstin: "07AABCS1234H1Z0",
    address: "103-A, Industrial Complex, SVL Business Park",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    pin: "560001",
    phone: "+91-080-41234567",
    email: "billing@svlprinting.com",
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description.trim()) newErrors.description = "Required";
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = "Must be > 0";
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) newErrors.unitPrice = "Must be > 0";
    if (!formData.hsn.trim()) newErrors.hsn = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddItem = () => {
    if (!validateForm()) return;

    const newItem = {
      description: formData.description,
      quantity: parseFloat(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      hsn: formData.hsn,
    };

    if (editingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingIndex] = newItem;
      setItems(updatedItems);
      setEditingIndex(null);
    } else {
      setItems([...items, newItem]);
    }

    setFormData({
      description: "",
      quantity: "",
      unitPrice: "",
      hsn: "",
    });
    setShowItemForm(false);
    setErrors({});
  };

  const handleEditItem = (index) => {
    setFormData(items[index]);
    setEditingIndex(index);
    setShowItemForm(true);
  };

  const handleDeleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateItemTotals = () => {
    return items.map((item) => {
      const subtotal = item.quantity * item.unitPrice;
      return { ...item, subtotal };
    });
  };

  const itemsWithTotals = calculateItemTotals();
  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0);
  const cgst = subtotal * ((parseFloat(invoiceCgstPercent) || 0) / 100);
  const sgst = subtotal * ((parseFloat(invoiceSgstPercent) || 0) / 100);
  const grandTotal = subtotal + cgst + sgst;

  const totals = {
    subtotal,
    cgst,
    sgst,
    cgstPercent: parseFloat(invoiceCgstPercent) || 0,
    sgstPercent: parseFloat(invoiceSgstPercent) || 0,
    grandTotal,
    paidAmount: parseFloat(paidAmount) || 0,
    remainingAmount: (grandTotal - (parseFloat(paidAmount) || 0)),
  };

  const generateAndDownloadPDF = async () => {
    try {
      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceDate = new Date().toLocaleDateString("en-IN");

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageMargin = 12;
      const contentWidth = pageWidth - pageMargin * 2;

      doc.setFontSize(13);
      doc.text(MOCK_COMPANY.name, pageMargin, 14);
      doc.setFontSize(8);
      doc.text(`GSTIN: ${MOCK_COMPANY.gstin}`, pageMargin, 18);
      doc.text(`${MOCK_COMPANY.address}, ${MOCK_COMPANY.city}, ${MOCK_COMPANY.state} - ${MOCK_COMPANY.pin}`, pageMargin, 21.5);
      doc.text(`Phone: ${MOCK_COMPANY.phone}   Email: ${MOCK_COMPANY.email}`, pageMargin, 25);

      doc.setFontSize(11);
      doc.text("TAX INVOICE", pageWidth - pageMargin, 14, { align: "right" });
      doc.setFontSize(8);
      doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - pageMargin, 18, { align: "right" });
      doc.text(`Date: ${invoiceDate}`, pageWidth - pageMargin, 21.5, { align: "right" });
      doc.text(`Lead ID: ${lead?.leadId || lead?.id || "-"}`, pageWidth - pageMargin, 25, { align: "right" });

      doc.setDrawColor(210, 210, 210);
      doc.line(pageMargin, 28, pageWidth - pageMargin, 28);

      const billingText = formatAddress(billingAddress);
      const shippingText = formatAddress(shippingAddress);
      const blockY = 31;
      const blockGap = 5;
      const blockWidth = (contentWidth - blockGap) / 2;
      const billingX = pageMargin;
      const shippingX = pageMargin + blockWidth + blockGap;
      const titleY = blockY + 4;
      const textY = blockY + 8;

      const billingLines = doc.splitTextToSize(
        [lead?.name || "-", lead?.email || "", lead?.mobile || "", billingText].filter(Boolean).join("\n"),
        blockWidth - 4
      );
      const shippingLines = doc.splitTextToSize(shippingText, blockWidth - 4);
      const linesCount = Math.max(billingLines.length, shippingLines.length, 3);
      const blockHeight = 8 + linesCount * 3.6;

      doc.setDrawColor(220, 220, 220);
      doc.rect(billingX, blockY, blockWidth, blockHeight);
      doc.rect(shippingX, blockY, blockWidth, blockHeight);

      doc.setFontSize(8.5);
      doc.text("BILLING ADDRESS", billingX + 2, titleY);
      doc.text("SHIPPING ADDRESS", shippingX + 2, titleY);
      doc.setFontSize(8);
      doc.text(billingLines, billingX + 2, textY);
      doc.text(shippingLines, shippingX + 2, textY);

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
      doc.text(`Rs ${totals.subtotal.toFixed(2)}`, summaryXVal, finalY, { align: "right" });

      doc.text(`CGST (${totals.cgstPercent.toFixed(2)}%):`, summaryXLabel, finalY + lineGap);
      doc.text(`Rs ${totals.cgst.toFixed(2)}`, summaryXVal, finalY + lineGap, { align: "right" });

      doc.text(`SGST (${totals.sgstPercent.toFixed(2)}%):`, summaryXLabel, finalY + lineGap * 2);
      doc.text(`Rs ${totals.sgst.toFixed(2)}`, summaryXVal, finalY + lineGap * 2, { align: "right" });

      doc.setFontSize(9);
      doc.text("Grand Total:", summaryXLabel, finalY + lineGap * 3);
      doc.text(`Rs ${totals.grandTotal.toFixed(2)}`, summaryXVal, finalY + lineGap * 3, { align: "right" });

      doc.setFontSize(9);
      doc.text("Paid Amount:", summaryXLabel, finalY + lineGap * 4.2);
      doc.text(`Rs ${totals.paidAmount.toFixed(2)}`, summaryXVal, finalY + lineGap * 4.2, { align: "right" });

      doc.text("Remaining Amount:", summaryXLabel, finalY + lineGap * 5.2);
      doc.text(`Rs ${totals.remainingAmount.toFixed(2)}`, summaryXVal, finalY + lineGap * 5.2, { align: "right" });

      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      alert("Unable to generate invoice file. Please try again.");
    }
  };

  const content = (
      <div className="card shadow-lg" style={{ width: "100%", maxWidth: "1000px", maxHeight: standalone ? "none" : "90vh", overflow: "auto" }}>
        <div className="card-header d-flex align-items-center justify-content-between bg-primary text-white">
          <h5 className="mb-0">Create Invoice & Approve Payment</h5>
          <button type="button" className="btn-close btn-close-white" onClick={onCancel} disabled={isLoading} />
        </div>

        <div className="card-body">
          <div className="alert alert-info mb-4">
            <div className="row">
              <div className="col-md-4">
                <strong>Lead Name:</strong> {lead.name}
              </div>
              <div className="col-md-4">
                <strong>Paid Amount:</strong> <span className="text-success">₹{parseFloat(paidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="col-md-4">
                <strong>Invoice Total:</strong> <span className="text-primary">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {showItemForm ? (
            <div className="card mb-3 border">
              <div className="card-body">
                <h6 className="mb-3">{editingIndex !== null ? "Edit Item" : "Add New Item"}</h6>
                <form>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <label className="small mb-1 text-dark">Description <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control form-control-sm text-dark ${errors.description ? "is-invalid" : ""}`}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Item description"
                        style={{ color: "#212529" }}
                      />
                      {errors.description && <div className="invalid-feedback d-block">{errors.description}</div>}
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="small mb-1 text-dark">HSN Code <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control form-control-sm text-dark ${errors.hsn ? "is-invalid" : ""}`}
                        value={formData.hsn}
                        onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                        placeholder="HSN code"
                        style={{ color: "#212529" }}
                      />
                      {errors.hsn && <div className="invalid-feedback d-block">{errors.hsn}</div>}
                    </div>
                    <div className="col-md-3 mb-2">
                      <label className="small mb-1 text-dark">Quantity <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control form-control-sm text-dark ${errors.quantity ? "is-invalid" : ""}`}
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0"
                        step="0.01"
                        style={{ color: "#212529" }}
                      />
                      {errors.quantity && <div className="invalid-feedback d-block">{errors.quantity}</div>}
                    </div>
                    <div className="col-md-3 mb-2">
                      <label className="small mb-1 text-dark">Unit Price (₹) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control form-control-sm text-dark ${errors.unitPrice ? "is-invalid" : ""}`}
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                        placeholder="0"
                        step="0.01"
                        style={{ color: "#212529" }}
                      />
                      {errors.unitPrice && <div className="invalid-feedback d-block">{errors.unitPrice}</div>}
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleAddItem}
                    >
                      {editingIndex !== null ? "Update Item" : "Add Item"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary ms-2"
                      onClick={() => {
                        setShowItemForm(false);
                        setEditingIndex(null);
                        setFormData({ description: "", quantity: "", unitPrice: "", hsn: "" });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-success mb-3"
              onClick={() => setShowItemForm(true)}
              disabled={isLoading}
            >
              <i className="ti ti-plus me-1"></i>Add Item
            </button>
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
                          className="btn btn-xs btn-warning me-1"
                          onClick={() => handleEditItem(idx)}
                          title="Edit"
                          disabled={isLoading}
                        >
                          <i className="ti ti-edit"></i>
                        </button>
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={() => handleDeleteItem(idx)}
                          title="Delete"
                          disabled={isLoading}
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
                    <tr>
                      <td><strong>Paid Amount:</strong></td>
                      <td className="text-end"><span className="text-success"><strong>₹{totals.paidAmount.toFixed(2)}</strong></span></td>
                    </tr>
                    <tr className={totals.remainingAmount > 0 ? "table-warning" : "table-success"}>
                      <td><strong>Remaining Amount:</strong></td>
                      <td className="text-end"><strong>₹{totals.remainingAmount.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!items.length && !showItemForm && (
            <div className="alert alert-warning">
              <i className="ti ti-alert-circle me-2"></i>
              Please add at least one invoice item before approving
            </div>
          )}

        </div>

        <div className="card-footer d-flex justify-content-between">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <div>
            {items.length > 0 && (
              <button
                className="btn btn-outline-primary me-2"
                onClick={generateAndDownloadPDF}
                disabled={isLoading}
              >
                <i className="ti ti-download me-1"></i>Download Invoice
              </button>
            )}
            <button
              className="btn btn-success"
              onClick={() => onApprove(itemsWithTotals, totals)}
              disabled={items.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Approving...
                </>
              ) : (
                <>
                  <i className="ti ti-check me-1"></i>Approve & Create Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1060 }}>
      {content}
    </div>
  );
}