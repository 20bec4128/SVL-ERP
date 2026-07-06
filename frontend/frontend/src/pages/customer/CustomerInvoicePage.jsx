import { useEffect, useState } from "react";
import { getSalesOrders, getPaymentsForOrder } from "../../api/leadsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function CustomerInvoicePage() {
  const [salesOrder, setSalesOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const orders = await getSalesOrders();
      if (orders.length > 0) {
        // As a customer, load the first/active SalesOrder linked to them
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

  if (loading) return <div className="p-5 text-center"><LoadingSpinner /></div>;
  if (!salesOrder) return <div className="p-5 text-center text-muted">No active orders or invoices found.</div>;

  const balance = salesOrder.totalAmount - salesOrder.paidAmount;

  return (
    <div className="card shadow-sm border-0 m-4" style={{ borderRadius: 12 }}>
      <div className="card-header bg-white border-0 py-3">
        <h4 className="mb-0 fw-bold">Proforma Invoice</h4>
      </div>
      <div className="card-body">
        <div className="row mb-4">
          <div className="col-sm-6">
            <h6 className="text-muted mb-1">Invoice Number</h6>
            <h5>INV-{salesOrder.soNumber}</h5>
          </div>
          <div className="col-sm-6 text-sm-end">
            <h6 className="text-muted mb-1">Due Balance</h6>
            <h3 className="text-danger fw-bold">₹{balance.toLocaleString()}</h3>
          </div>
        </div>

        <table className="table table-hover align-middle mb-4">
          <thead>
            <tr>
              <th>Product / Service</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {salesOrder.items?.map((item) => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>₹{item.unitPrice}</td>
                <td>₹{item.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="row">
          <div className="col-md-6">
            <h6 className="fw-semibold">Bank Account Details</h6>
            <p className="small text-muted mb-0">Bank: HDFC Bank Ltd</p>
            <p className="small text-muted mb-0">A/C: 50200045612345</p>
            <p className="small text-muted">IFSC: HDFC0000123</p>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="d-inline-block p-3 border rounded text-center">
              <h6 className="mb-2 small">Scan QR to Pay via UPI</h6>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=nexorcrm@bank%26pn=NEXOR%20CRM%26am=${balance}%26cu=INR`}
                alt="UPI QR Code"
                style={{ width: 120, height: 120 }}
              />
              <div className="mt-2 small text-muted">UPI ID: nexorcrm@bank</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
