import { useEffect, useState } from "react";
import { getSalesOrders, getPaymentsForOrder } from "../../api/leadsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function CustomerPaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const orders = await getSalesOrders();
      if (orders.length > 0) {
        const payList = await getPaymentsForOrder(orders[0].id);
        setPayments(payList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-5 text-center"><LoadingSpinner /></div>;
  if (payments.length === 0) return <div className="p-5 text-center text-muted">No payment transaction records submitted yet.</div>;

  return (
    <div className="card shadow-sm border-0 m-4" style={{ borderRadius: 12 }}>
      <div className="card-header bg-white border-0 py-3">
        <h4 className="mb-0 fw-bold">Payment Transaction History</h4>
      </div>
      <div className="card-body">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Submitted Date</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Reference No</th>
              <th>Verification Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td>{p.paymentMethod}</td>
                <td>₹{p.amount}</td>
                <td>{p.referenceNo}</td>
                <td>
                  <span className={`badge ${p.status === 'VERIFIED' ? 'bg-success' : p.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
