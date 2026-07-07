import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSalesOrders, getPaymentsForOrder } from "../../api/leadsApi";
import { getCustomerLead } from "../../api/customerApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function CustomerInvoicePage() {
  const navigate = useNavigate();
  const [salesOrders, setSalesOrders] = useState([]);
  const [salesOrder, setSalesOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [orders, leadData] = await Promise.all([
        getSalesOrders(),
        getCustomerLead()
      ]);
      setLead(leadData);
      const activeOrders = Array.isArray(orders) ? orders : [];
      setSalesOrders(activeOrders);
      if (activeOrders.length > 0) {
        await selectOrder(activeOrders[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = async (order) => {
    setSalesOrder(order);
    try {
      const pays = await getPaymentsForOrder(order.id);
      setPayments(pays);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderChange = (e) => {
    const selectedId = Number(e.target.value);
    const found = salesOrders.find(o => o.id === selectedId);
    if (found) {
      selectOrder(found);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-5 text-center"><LoadingSpinner /></div>;
  if (!salesOrder) return <div className="p-5 text-center text-muted">No active orders or invoices found.</div>;

  const balance = salesOrder.totalAmount - salesOrder.paidAmount;

  // Words helper (simple Indian currency style)
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : 'Only';
    return str.trim();
  };

  return (
    <div className="container-fluid py-2">
      {/* Dynamic Selector Bar */}
      {salesOrders.length > 1 && (
        <div className="card shadow-sm border-0 m-4 mb-2 print-none" style={{ borderRadius: 12 }}>
          <div className="card-body py-3 px-4 d-flex align-items-center gap-3">
            <span className="fw-semibold text-muted text-nowrap"><i className="ti ti-receipt me-1"></i>Select Sales Order / Invoice:</span>
            <select
              className="form-select border-light shadow-none"
              style={{ maxWidth: 300, borderRadius: 8 }}
              value={salesOrder.id}
              onChange={handleOrderChange}
            >
              {salesOrders.map(o => (
                <option key={o.id} value={o.id}>
                  INV-{o.soNumber || o.id} (₹{o.totalAmount?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Screen View (Traditional Proforma styling remains exactly the same on screen) */}
      <div className="card shadow-sm border-0 m-4 print-none screen-invoice-wrap" style={{ borderRadius: 16 }}>
        <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h4 className="mb-0 fw-bold text-dark">Proforma Invoice</h4>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={handlePrint}
              style={{ borderRadius: 8, fontWeight: "500" }}
            >
              <i className="ti ti-printer" /> Print Invoice
            </button>
            {balance > 0 && (
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => navigate("/portal/payment")}
                style={{ borderRadius: 8, fontWeight: "500" }}
              >
                <i className="ti ti-credit-card" /> Pay Now
              </button>
            )}
          </div>
        </div>

        <div className="card-body p-4">
          <div className="row mb-4 align-items-center">
            <div className="col-sm-6">
              <h3 className="fw-bold text-primary mb-1">SVL ERP</h3>
              <span className="text-muted small">Sales Order & Proforma Billing</span>
            </div>
            <div className="col-sm-6 text-sm-end mt-3 mt-sm-0">
              <span className="text-muted small d-block">Invoice Number</span>
              <h4 className="fw-bold text-dark mb-0">INV-{salesOrder.soNumber || salesOrder.id}</h4>
            </div>
          </div>

          <hr className="my-4" style={{ borderColor: "#e2e8f0" }} />

          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-4">
              <span className="text-muted small fw-semibold d-block mb-1">Billed To:</span>
              {lead ? (
                <div className="text-dark">
                  <h6 className="fw-bold mb-1">{lead.name || "-"}</h6>
                  {lead.companyName && <p className="mb-1 small">{lead.companyName}</p>}
                  <p className="mb-1 small">{lead.mobile} | {lead.email}</p>
                  {lead.streetAddress && (
                    <p className="mb-1 small text-muted">
                      {lead.streetAddress}, {lead.district}, {lead.state}
                    </p>
                  )}
                  {lead.gstin && (
                    <p className="mb-0 small fw-semibold text-uppercase text-primary">GSTIN: {lead.gstin}</p>
                  )}
                </div>
              ) : (
                <span className="text-dark">-</span>
              )}
            </div>
            <div className="col-md-6 col-lg-4">
              <span className="text-muted small fw-semibold d-block mb-1">Order Details:</span>
              <p className="small text-dark mb-1">
                <strong>Order Date:</strong> {new Date(salesOrder.createdAt).toLocaleDateString()}
              </p>
              {salesOrder.deliveryDate && (
                <p className="small text-dark mb-1">
                  <strong>Delivery Date:</strong> {new Date(salesOrder.deliveryDate).toLocaleDateString()}
                </p>
              )}
              <div className="mt-2">
                <span className="small me-2 text-muted">Status:</span>
                <span className="badge bg-light text-primary px-3 py-2 rounded-pill font-weight-semibold">
                  {salesOrder.status?.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="col-md-12 col-lg-4 text-lg-end">
              <span className="text-muted small fw-semibold d-block mb-1">Payment Summary:</span>
              <h3 className="text-danger fw-bold mb-1">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <span className="small text-muted d-block">Due Balance Outstanding</span>
              {salesOrder.paidAmount > 0 && (
                <span className="small text-success d-block mt-1">Paid: ₹{salesOrder.paidAmount.toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="table-responsive mb-4">
            <table className="table table-hover align-middle border-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0">Product / Service</th>
                  <th className="border-0">Quantity</th>
                  <th className="border-0">Rate</th>
                  <th className="border-0 text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {salesOrder.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold text-dark">{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="text-end fw-bold text-dark">₹{item.lineTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr className="my-4" style={{ borderColor: "#e2e8f0" }} />

          <div className="row g-4 align-items-center">
            <div className="col-md-6">
              <h6 className="fw-bold text-dark mb-2">Bank Account Transfer Details:</h6>
              <div className="p-3 bg-light rounded-4">
                <p className="small text-dark mb-1"><strong>Bank:</strong> HDFC Bank Ltd</p>
                <p className="small text-dark mb-1"><strong>Account No:</strong> 50200045612345</p>
                <p className="small text-dark mb-0"><strong>IFSC:</strong> HDFC0000123</p>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-inline-block p-3 bg-white border border-light shadow-sm rounded-4 text-center">
                <h6 className="mb-2 small fw-bold">Scan to Pay instantly</h6>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=nexorcrm@bank%26pn=NEXOR%20CRM%26am=${balance}%26cu=INR`}
                  alt="UPI QR Code"
                  style={{ width: 110, height: 110 }}
                />
                <div className="mt-2 small text-muted font-weight-semibold">UPI ID: nexorcrm@bank</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT VIEW ONLY (Matches the Indian GST Tax Invoice template image exactly) */}
      <div className="print-invoice-layout print-only bg-white text-dark p-3" style={{ border: "1.5px solid #000", fontFamily: "sans-serif", fontSize: "11px" }}>
        <table className="w-100 table-bordered-dark" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {/* Top Info Bar */}
            <tr style={{ borderBottom: "1px solid #000" }}>
              <td colSpan="2" className="p-1 fw-bold" style={{ fontSize: "10px", width: "50%" }}>Page No. 1 of 1</td>
              <td colSpan="2" className="text-center p-1 fw-bold text-uppercase" style={{ fontSize: "12px", width: "50%" }}>TAX INVOICE</td>
            </tr>

            {/* Seller Company Details */}
            <tr style={{ borderBottom: "1px solid #000" }}>
              <td colSpan="4" className="text-center py-2 px-1">
                <h5 className="mb-1 fw-bold text-uppercase" style={{ letterSpacing: "1px", fontSize: "15px" }}>SVL PRIVATE LIMITED</h5>
                <p className="mb-1">Plot No. 42, Block C, Sector 62, Noida, Uttar Pradesh, 201301</p>
                <p className="mb-1">Mobile: +91 9999999999 | Email: account@svlprivate.com</p>
                <p className="mb-0 fw-semibold text-uppercase">GSTIN: 09AAAAA1234F000 | PAN: AAAAA1234F</p>
              </td>
            </tr>

            {/* Metadata (Invoice Details vs Transporter Details) */}
            <tr style={{ borderBottom: "1px solid #000" }}>
              {/* Invoice Specs */}
              <td colSpan="2" className="p-2 align-top" style={{ borderRight: "1px solid #000", width: "50%" }}>
                <table className="w-100" style={{ border: "none" }}>
                  <tbody>
                    <tr><td className="fw-bold py-1" style={{ width: "45%" }}>Invoice Number</td><td>: INV-{salesOrder.soNumber || salesOrder.id}</td></tr>
                    <tr><td className="fw-bold py-1">Invoice Date</td><td>: {new Date(salesOrder.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</td></tr>
                    <tr><td className="fw-bold py-1">Due Date</td><td>: {salesOrder.deliveryDate ? new Date(salesOrder.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "N/A"}</td></tr>
                    <tr><td className="fw-bold py-1">Place of Supply</td><td>: 09 - Uttar Pradesh</td></tr>
                  </tbody>
                </table>
              </td>
              {/* Transporter Specs */}
              <td colSpan="2" className="p-2 align-top" style={{ width: "50%" }}>
                <table className="w-100" style={{ border: "none" }}>
                  <tbody>
                    <tr><td className="fw-bold py-1" style={{ width: "45%" }}>Transporter</td><td>: Self / Sanjay Transportation</td></tr>
                    <tr><td className="fw-bold py-1">Vehicle No.</td><td>: N/A</td></tr>
                    <tr><td className="fw-bold py-1">E-Way Bill No.</td><td>: N/A</td></tr>
                    <tr><td className="fw-bold py-1">E-Way Bill Date</td><td>: N/A</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Billing vs Shipping Details */}
            <tr style={{ borderBottom: "1px solid #000" }}>
              {/* Billing Details */}
              <td colSpan="2" className="p-2 align-top" style={{ borderRight: "1px solid #000", width: "50%" }}>
                <div className="fw-bold mb-1 text-uppercase text-decoration-underline" style={{ fontSize: "10px" }}>Billing Details</div>
                <div className="fw-bold text-uppercase">{lead?.name || "-"}</div>
                {lead?.companyName && <div>Company: {lead.companyName}</div>}
                <div>GSTIN: {lead?.gstin || "URD"}</div>
                <div>Mobile: +91 {lead?.mobile} | Email: {lead?.email}</div>
                <div>Address: {lead?.streetAddress || "-"}, {lead?.district}, {lead?.state}</div>
              </td>
              {/* Shipping Details */}
              <td colSpan="2" className="p-2 align-top" style={{ width: "50%" }}>
                <div className="fw-bold mb-1 text-uppercase text-decoration-underline" style={{ fontSize: "10px" }}>Shipping Details</div>
                <div className="fw-bold text-uppercase">{lead?.name || "-"}</div>
                {lead?.companyName && <div>Company: {lead.companyName}</div>}
                <div>GSTIN: {lead?.gstin || "URD"}</div>
                <div>Mobile: +91 {lead?.mobile} | Email: {lead?.email}</div>
                <div>Address: {lead?.streetAddress || "-"}, {lead?.district}, {lead?.state}</div>
              </td>
            </tr>

            {/* IRN Bar */}
            <tr style={{ borderBottom: "1px solid #000", backgroundColor: "#f8fafc" }}>
              <td colSpan="4" className="p-1 text-muted" style={{ fontSize: "8.5px" }}>
                <strong>IRN:</strong> 3b866a8e310af0393d1dc43087ed8b59a666d7f9abafgdgd666djnsha776gdg &nbsp;|&nbsp; <strong>Ack No:</strong> 112510299999999 &nbsp;|&nbsp; <strong>Ack Date:</strong> {new Date().toLocaleDateString()}
              </td>
            </tr>

            {/* Items Header */}
            <tr className="fw-bold text-center bg-light" style={{ borderBottom: "1px solid #000" }}>
              <td className="p-1" style={{ width: "5%", borderRight: "1px solid #000" }}>Sr.</td>
              <td className="p-1" style={{ width: "50%", borderRight: "1px solid #000" }}>Item Description</td>
              <td className="p-1" style={{ width: "10%", borderRight: "1px solid #000" }}>HSN/SAC</td>
              <td className="p-1" style={{ width: "7%", borderRight: "1px solid #000" }}>Qty</td>
              <td className="p-1" style={{ width: "8%", borderRight: "1px solid #000" }}>Unit</td>
              <td className="p-1" style={{ width: "10%", borderRight: "1px solid #000" }}>Rate</td>
              <td className="p-1" style={{ width: "10%" }}>Amount (₹)</td>
            </tr>

            {/* Item Rows */}
            {salesOrder.items?.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td className="text-center p-2" style={{ borderRight: "1px solid #000" }}>{idx + 1}</td>
                <td className="p-2" style={{ borderRight: "1px solid #000" }}>
                  <div className="fw-semibold text-dark">{item.productName}</div>
                </td>
                <td className="text-center p-2" style={{ borderRight: "1px solid #000" }}>85076000</td>
                <td className="text-center p-2" style={{ borderRight: "1px solid #000" }}>{item.quantity}</td>
                <td className="text-center p-2" style={{ borderRight: "1px solid #000" }}>Box</td>
                <td className="text-end p-2" style={{ borderRight: "1px solid #000" }}>{item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="text-end p-2 fw-bold">{item.lineTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}

            {/* Spacer row to match look */}
            <tr style={{ height: "150px", borderBottom: "1px solid #000" }}>
              <td style={{ borderRight: "1px solid #000" }}></td>
              <td style={{ borderRight: "1px solid #000" }}></td>
              <td style={{ borderRight: "1px solid #000" }}></td>
              <td style={{ borderRight: "1px solid #000" }}></td>
              <td style={{ borderRight: "1px solid #000" }}></td>
              <td style={{ borderRight: "1px solid #000" }}></td>
              <td></td>
            </tr>

            {/* Subtotal row */}
            <tr style={{ borderBottom: "1px solid #000" }}>
              <td colSpan="6" className="text-end p-1 fw-bold bg-light" style={{ borderRight: "1px solid #000" }}>Total:</td>
              <td className="text-end p-1 fw-bold">₹{salesOrder.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>

            {/* Total In Words */}
            <tr style={{ borderBottom: "1px solid #000" }}>
              <td colSpan="4" className="p-2 align-top">
                <span className="fw-bold d-block text-muted text-uppercase mb-1" style={{ fontSize: "8px" }}>Total Amount (In Words):</span>
                <span className="fw-bold text-dark">{numberToWords(salesOrder.totalAmount)}</span>
                <div className="mt-2 text-muted" style={{ fontSize: "8.5px" }}>
                  Settled by Bank: ₹{salesOrder.paidAmount?.toLocaleString()} | Balance Outstanding: ₹{balance?.toLocaleString()}
                </div>
              </td>
            </tr>

            {/* Terms and Sign Block */}
            <tr>
              {/* Terms and Conditions */}
              <td colSpan="2" className="p-2 align-top" style={{ borderRight: "1px solid #000", width: "50%" }}>
                <div className="fw-bold text-decoration-underline mb-1" style={{ fontSize: "9px" }}>Terms & Conditions</div>
                <div style={{ fontSize: "8px", lineHeight: "1.3" }}>
                  1. Goods once sold will not be taken back.<br />
                  2. Interest @ 18% p.a. will be charged if payment is not settled within the stipulated time.<br />
                  3. Subject to 'Delhi' jurisdiction only.
                </div>
              </td>
              {/* Bank Details & QR */}
              <td colSpan="2" className="p-2 align-top" style={{ width: "50%" }}>
                <div className="row g-2 align-items-center">
                  <div className="col-8" style={{ fontSize: "8.5px" }}>
                    <div className="fw-bold text-decoration-underline mb-1" style={{ fontSize: "9px" }}>Bank A/C Details:</div>
                    <div><strong>Bank:</strong> HDFC Bank Ltd</div>
                    <div><strong>A/C No:</strong> 50200045612345</div>
                    <div><strong>IFSC:</strong> HDFC0000123</div>
                    <div><strong>Branch:</strong> Sector 62, Noida</div>
                  </div>
                  <div className="col-4 text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=nexorcrm@bank%26pn=SVL%20ERP%26am=${balance}%26cu=INR`}
                      alt="UPI QR Code"
                      style={{ width: 55, height: 55, border: "1px solid #ccc", padding: "2px" }}
                    />
                    <div style={{ fontSize: "6.5px", fontWeight: "bold" }}>Scan to Pay</div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CSS Stylesheet Overrides */}
      <style>{`
        /* Hide print layout by default on screen */
        .print-invoice-layout {
          display: none !important;
        }

        @media print {
          /* Hide all screen components on print */
          .print-none,
          .screen-invoice-wrap,
          .navbar,
          .sidebar,
          header,
          footer {
            display: none !important;
          }

          /* Force show the print layout */
          .print-invoice-layout {
            display: block !important;
          }

          .print-invoice-layout,
          .print-invoice-layout table {
            width: 100% !important;
            border: 1px solid #000 !important;
          }

          .print-invoice-layout th,
          .print-invoice-layout td {
            border: 1px solid #000 !important;
          }

          body {
            background: #fff !important;
            color: #000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
