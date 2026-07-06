import React from "react";
import { Link, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const InvoiceDetailsPage = () => {
  const location = useLocation();
  const lead = location.state?.lead;

  if (!lead) {
    return (
      <div className="content">
        <div className="card p-5 text-center">
          <h4>No Invoice Selected</h4>
          <p className="text-muted">Please select an invoice from the invoices list.</p>
          <Link to="/invoices" className="btn btn-primary d-inline-flex align-items-center mt-3">
            <i className="ti ti-arrow-left me-2"></i>Back to List
          </Link>
        </div>
      </div>
    );
  }

  // Parse invoice details
  const invoiceDataStr = lead.paymentVerifiedInvoiceData || lead.invoiceData || "{}";
  let invoice = {};
  try {
    invoice = JSON.parse(invoiceDataStr);
  } catch (err) {
    console.error("Failed to parse invoice data JSON", err);
  }

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = Number(invoice.subtotal || 0);
  const cgstPercent = Number(lead.invoiceCgstPercent || 0);
  const sgstPercent = Number(lead.invoiceSgstPercent || 0);
  const cgstAmount = subtotal * (cgstPercent / 100);
  const sgstAmount = subtotal * (sgstPercent / 100);
  const grandTotal = Number(invoice.grandTotal || invoice.grand_total || (subtotal + cgstAmount + sgstAmount));

  const getInvoiceNumber = () => {
    return `INV-${lead.leadId || lead.id}`;
  };

  const getFormattedDate = (dateVal) => {
    if (!dateVal) return "-";
    try {
      return new Date(dateVal).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(dateVal);
    }
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      const pageMargin = 15;
      const pageWidth = doc.internal.pageSize.width;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("TAX INVOICE", pageMargin, 20);

      // Invoice info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Invoice Number: ${getInvoiceNumber()}`, pageWidth - pageMargin - 80, 20);
      doc.text(`Date: ${getFormattedDate(lead.createdAt)}`, pageWidth - pageMargin - 80, 26);
      doc.text(`Status: ${lead.paymentVerifiedInvoiceData ? "Paid" : "Sent"}`, pageWidth - pageMargin - 80, 32);

      // Line separator
      doc.line(pageMargin, 38, pageWidth - pageMargin, 38);

      // Client info
      doc.setFont("helvetica", "bold");
      doc.text("Billed To:", pageMargin, 45);
      doc.setFont("helvetica", "normal");
      doc.text(lead.name || "", pageMargin, 51);
      doc.text(lead.email || "", pageMargin, 57);
      doc.text(lead.phone || "", pageMargin, 63);
      if (lead.address) {
        doc.text(lead.address, pageMargin, 69);
      }

      // Table headers & rows
      const tableHeaders = [["Item Description", "Qty", "Unit Price (₹)", "Subtotal (₹)"]];
      const tableRows = items.map((it) => [
        it.description || "",
        it.quantity || "0",
        Number(it.unitPrice || 0).toFixed(2),
        Number(it.subtotal || 0).toFixed(2),
      ]);

      // Add table
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 78,
        margin: { left: pageMargin, right: pageMargin },
        theme: "striped",
      });

      // Totals block
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Sub Total:`, pageWidth - pageMargin - 70, finalY);
      doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - pageMargin - 20, finalY, { align: "right" });

      doc.text(`CGST (${cgstPercent}%):`, pageWidth - pageMargin - 70, finalY + 6);
      doc.text(`₹${cgstAmount.toFixed(2)}`, pageWidth - pageMargin - 20, finalY + 6, { align: "right" });

      doc.text(`SGST (${sgstPercent}%):`, pageWidth - pageMargin - 70, finalY + 12);
      doc.text(`₹${sgstAmount.toFixed(2)}`, pageWidth - pageMargin - 20, finalY + 12, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.text(`Total Amount:`, pageWidth - pageMargin - 70, finalY + 18);
      doc.text(`₹${grandTotal.toFixed(2)}`, pageWidth - pageMargin - 20, finalY + 18, { align: "right" });

      doc.save(`Invoice-${getInvoiceNumber()}.pdf`);
    } catch (err) {
      console.error("Failed to generate and download PDF:", err);
      alert("Failed to download PDF invoice.");
    }
  };

  return (
    <>
      <div className="content">
        {/* Breadcrumb */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Invoices</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard"><i className="ti ti-smart-home"></i></Link>
                </li>
                <li className="breadcrumb-item">Application</li>
                <li className="breadcrumb-item active" aria-current="page">Invoices</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
            <div className="mb-2">
              <button onClick={handleDownloadPdf} className="btn btn-dark d-flex align-items-center">
                <i className="ti ti-download me-2"></i>Download
              </button>
            </div>
          </div>
        </div>
        {/* /Breadcrumb */}

        {/* Invoices */}
        <div>
          <div className="row">
            <div className="col-sm-10 mx-auto">
              <Link to="/invoices" className="back-icon d-flex align-items-center fs-12 fw-medium mb-3 d-inline-flex">
                <span className="d-flex justify-content-center align-items-center rounded-circle me-2">
                  <i className="ti ti-arrow-left"></i>
                </span>
                Back to List
              </Link>
              <div className="card">
                <div className="card-body">
                  <div className="row justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div className="col-md-6">
                      <div className="mb-2">
                        <img src="/assets/img/logo.svg" className="img-fluid" alt="logo" />
                      </div>
                      <p className="mb-0 text-muted">SVL Business Invoice Center</p>
                    </div>
                    <div className="col-md-6 text-end">
                      <h5 className="text-gray mb-1">Invoice No <span className="text-primary">#{getInvoiceNumber()}</span></h5>
                      <p className="mb-1 fw-medium">Invoice Date : <span className="text-dark">{getFormattedDate(lead.createdAt)}</span></p>
                      <p className="fw-medium">Status : <span className={`badge ${lead.paymentVerifiedInvoiceData ? "bg-success" : "bg-warning"}`}>{lead.paymentVerifiedInvoiceData ? "Paid" : "Sent"}</span></p>
                    </div>
                  </div>

                  <div className="row border-bottom mb-3 pb-3">
                    <div className="col-md-6">
                      <p className="text-dark mb-2 fw-semibold">To</p>
                      <div>
                        <h4 className="mb-1">{lead.name}</h4>
                        <p className="mb-1 text-muted">{lead.address || "No Address Provided"}</p>
                        <p className="mb-1">Email : <span className="text-dark">{lead.email}</span></p>
                        <p>Phone : <span className="text-dark">{lead.phone || "-"}</span></p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="mb-3">Invoice Details</h5>
                    <div className="table-responsive mb-3">
                      <table className="table">
                        <thead className="thead-light">
                          <tr>
                            <th>Description</th>
                            <th className="text-end">Qty</th>
                            <th className="text-end">Unit Price</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, idx) => (
                            <tr key={idx}>
                              <td>{it.description}</td>
                              <td className="text-end">{it.quantity}</td>
                              <td className="text-end">₹{Number(it.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              <td className="text-end fw-semibold">₹{Number(it.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="row border-bottom mb-3 pb-3 justify-content-end">
                    <div className="col-md-5">
                      <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                        <p className="mb-0">Sub Total</p>
                        <p className="text-dark fw-medium mb-2">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                        <p className="mb-0">CGST ({cgstPercent}%)</p>
                        <p className="text-dark fw-medium mb-2">₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                        <p className="mb-0">SGST ({sgstPercent}%)</p>
                        <p className="text-dark fw-medium mb-2">₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                        <h5>Total Amount</h5>
                        <h5>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDetailsPage;
