import { useEffect, useState } from "react";
import { getSalesOrders, recordPayment } from "../../api/leadsApi";
import { uploadFileRecord } from "../../api/fileManagerApi";
import { useToast } from "../../components/system/ToastProvider";

export default function CustomerPaymentPage() {
  const { showSuccess, showError } = useToast();
  const [salesOrder, setSalesOrder] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadActiveOrder();
  }, []);

  const loadActiveOrder = async () => {
    try {
      const orders = await getSalesOrders();
      if (orders.length > 0) {
        setSalesOrder(orders[0]);
        setAmount(orders[0].totalAmount - orders[0].paidAmount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      showError("Please enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      let proofFileName = "";
      let proofFilePath = "";
      if (selectedFile) {
        const uploaded = await uploadFileRecord(selectedFile);
        if (uploaded) {
          proofFileName = uploaded.name;
          proofFilePath = uploaded.path;
        }
      }

      await recordPayment({
        leadId: salesOrder.leadId,
        salesOrderId: salesOrder.id,
        amount: Number(amount),
        paymentMethod,
        referenceNo,
        proofFileName,
        proofFilePath,
        status: "PENDING"
      });
      showSuccess("Payment submission recorded! Status: PENDING Verification");
      setReferenceNo("");
      setSelectedFile(null);
      const fileInput = document.getElementById("paymentProofFile");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      showError("Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!salesOrder) return <div className="p-5 text-center text-muted">No active orders available to submit payments.</div>;

  return (
    <div className="card shadow-sm border-0 m-4" style={{ borderRadius: 12, maxWidth: 600 }}>
      <div className="card-header bg-white border-0 py-3">
        <h4 className="mb-0 fw-bold">Submit Payment Receipt</h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Payment Amount (₹)</label>
            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="NEFT">Bank Transfer (NEFT/RTGS)</option>
              <option value="CASH">Cash Deposit</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Transaction ID / UTR / Reference No</label>
            <input
              type="text"
              className="form-control"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Enter reference or UPI UTR number"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Payment Proof (Screenshot / Receipt)</label>
            <input
              type="file"
              id="paymentProofFile"
              className="form-control"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*,application/pdf"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary w-100 py-2">
            {submitting ? "Uploading..." : "Submit Receipt for Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
