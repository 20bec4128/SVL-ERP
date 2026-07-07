import { useEffect, useState } from "react";
import { getSalesOrders, recordPayment, createRazorpayOrder, verifyRazorpayPayment } from "../../api/leadsApi";
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
  const [payingOnline, setPayingOnline] = useState(false);

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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOnlinePayment = async () => {
    if (!amount || amount <= 0) {
      showError("Please enter a valid amount.");
      return;
    }

    setPayingOnline(true);
    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showError("Failed to load payment gateway script. Please check your internet connection.");
        setPayingOnline(false);
        return;
      }

      // 2. Create Razorpay order on backend
      const orderData = await createRazorpayOrder({
        amount: Number(amount),
        leadId: salesOrder.leadId,
        salesOrderId: salesOrder.id
      });

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SVL CRM Payments",
        description: `Payment for Sales Order #${salesOrder.id}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 4. Verify payment on backend
            const verification = await verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              leadId: salesOrder.leadId,
              salesOrderId: salesOrder.id
            });

            if (verification.status === "SUCCESS") {
              showSuccess("Payment completed and verified successfully!");
              loadActiveOrder();
            } else {
              showError("Payment verification failed. Please contact support.");
            }
          } catch (verifyErr) {
            showError("Error verifying payment transaction.");
            console.error(verifyErr);
          }
        },
        prefill: {
          name: "",
          email: ""
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      showError("Failed to initiate online payment.");
      console.error(err);
    } finally {
      setPayingOnline(false);
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
      loadActiveOrder();
    } catch (err) {
      showError("Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!salesOrder) return <div className="p-5 text-center text-muted">No active orders available to submit payments.</div>;

  return (
    <div className="container-fluid py-4">
      <div className="row g-4" style={{ maxWidth: 1100 }}>
        {/* Order Details Panel */}
        <div className="col-md-5">
          <div className="card shadow-sm border-0 h-100" style={{ borderRadius: 12 }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Order Details</h5>
              <div className="mb-4">
                <span className="text-muted d-block small">Sales Order ID</span>
                <span className="fw-bold fs-5">#{salesOrder.id}</span>
              </div>
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <span className="text-muted d-block small">Total Amount</span>
                  <span className="fw-bold text-dark fs-6">₹{salesOrder.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block small">Amount Paid</span>
                  <span className="fw-bold text-success fs-6">₹{salesOrder.paidAmount?.toLocaleString()}</span>
                </div>
              </div>
              <div className="border-top pt-3">
                <span className="text-muted d-block small mb-1">Balance Due</span>
                <span className="fw-bold text-danger fs-3">
                  ₹{(salesOrder.totalAmount - salesOrder.paidAmount)?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Panel */}
        <div className="col-md-7">
          <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
            <div className="card-body p-4">
              <h4 className="fw-bold mb-4">Make Payment</h4>

              {/* Online Payment Option */}
              <div className="p-3 mb-4 bg-light rounded-3 border border-primary-subtle">
                <h5 className="fw-bold text-primary mb-1">Instant Online Payment</h5>
                <p className="text-muted small mb-3">Pay securely with UPI, Credit/Debit cards, or Netbanking.</p>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Amount to Pay (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOnlinePayment}
                  disabled={payingOnline}
                  className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
                >
                  {payingOnline ? "Initializing Secure Gateway..." : "Pay Instantly (Razorpay)"}
                </button>
              </div>

              <div className="text-center my-3 text-muted small fw-bold">—— OR UPLOAD RECEIPT ——</div>

              {/* Offline Receipt Upload */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Payment Method</label>
                  <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="NEFT">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CASH">Cash Deposit</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Transaction ID / UTR / Reference No</label>
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
                  <label className="form-label small fw-bold">Payment Proof (Screenshot / Receipt)</label>
                  <input
                    type="file"
                    id="paymentProofFile"
                    className="form-control"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept="image/*,application/pdf"
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn btn-outline-secondary w-100 py-2.5">
                  {submitting ? "Uploading..." : "Submit Receipt for Verification"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

