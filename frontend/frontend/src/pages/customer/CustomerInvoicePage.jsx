import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSalesOrders, getPaymentsForOrder } from "../../api/leadsApi";
import { getCustomerLead } from "../../api/customerApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function CustomerInvoicePage() {
  const navigate = useNavigate();
  const [salesOrder, setSalesOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const [orders, leadData] = await Promise.all([
        getSalesOrders(),
        getCustomerLead()
      ]);
      setLead(leadData);
      if (orders.length > 0) {
        const so = orders[0];
        setSalesOrder(so);
        const pays = await getPaymentsForOrder(so.id);
        setPayments(pays);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-5 text-center"><LoadingSpinner /></div>;
  if (!salesOrder) return <div className="p-5 text-center text-muted">No active orders or invoices found.</div>;

  const balance = salesOrder.totalAmount - salesOrder.paidAmount;

  return (
    <div className="card shadow-sm border-0 m-4 print-invoice-wrap" style={{ borderRadius: 16 }}>
      {/* Action Header (Hidden during Print) */}
      <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between print-none" style={{ borderBottom: "1px solid #f1f5f9" }}>
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
        {/* Printable Header Section */}
        <div className="row mb-4 align-items-center">
          <div className="col-sm-6">
            <h3 className="fw-bold text-primary mb-1">SVL ERP</h3>
            <span className="text-muted small">Sales Order & Proforma Billing</span>
          </div>
          <div className="col-sm-6 text-sm-end mt-3 mt-sm-0">
            <span className="text-muted small d-block">Invoice Number</span>
            <h4 className="fw-bold text-dark mb-0">INV-{salesOrder.soNumber}</h4>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: "#e2e8f0" }} />

        {/* Invoice Metadata (Dates, Statuses, Customer Info) */}
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

        {/* Itemized Table */}
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

        {/* Bank & UPI QR Payment Section */}
        <div className="row g-4 align-items-center">
          <div className="col-md-6">
            <h6 className="fw-bold text-dark mb-2">Bank Account Transfer Details:</h6>
            <div className="p-3 bg-light rounded-4">
              <p className="small text-dark mb-1"><strong>Bank:</strong> HDFC Bank Ltd</p>
              <p className="small text-dark mb-1"><strong>Account No:</strong> 50200045612345</p>
              <p className="small text-dark mb-0"><strong>IFSC:</strong> HDFC0000123</p>
            </div>
          </div>
          <div className="col-md-6 text-md-end print-none">
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

      {/* Print Specific CSS Stylesheet Overrides */}
      <style>{`
        @media print {
          .print-none {
            display: none !important;
          }
          .print-invoice-wrap {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
          }
          .card-body {
            padding: 0 !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
}
