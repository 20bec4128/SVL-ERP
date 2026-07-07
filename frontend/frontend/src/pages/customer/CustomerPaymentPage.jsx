import { useEffect, useState } from "react";
import { getSalesOrders, recordPayment, createRazorpayOrder, verifyRazorpayPayment } from "../../api/leadsApi";
import { uploadFileRecord } from "../../api/fileManagerApi";
import { useToast } from "../../components/system/ToastProvider";

export default function CustomerPaymentPage() {
  const { showSuccess, showError } = useToast();
  const [salesOrders, setSalesOrders] = useState([]);
  const [salesOrder, setSalesOrder] = useState(null);
  const [onlineAmount, setOnlineAmount] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);

  useEffect(() => {
    loadActiveOrders();
  }, []);

  const loadActiveOrders = async () => {
    try {
      const orders = await getSalesOrders();
      const activeOrders = Array.isArray(orders) ? orders : [];
      setSalesOrders(activeOrders);
      if (activeOrders.length > 0) {
        selectOrder(activeOrders[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectOrder = (order) => {
    setSalesOrder(order);
    const balance = order.totalAmount - order.paidAmount;
    setOnlineAmount(balance > 0 ? balance : 0);
    setManualAmount(balance > 0 ? balance : 0);
  };

  const handleOrderChange = (e) => {
    const selectedId = Number(e.target.value);
    const found = salesOrders.find(o => o.id === selectedId);
    if (found) {
      selectOrder(found);
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
    if (!onlineAmount || onlineAmount <= 0) {
      showError("Please enter a valid amount.");
      return;
    }

    setPayingOnline(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showError("Failed to load payment gateway script. Please check your internet connection.");
        setPayingOnline(false);
        return;
      }

      const orderData = await createRazorpayOrder({
        amount: Number(onlineAmount),
        leadId: salesOrder.leadId,
        salesOrderId: salesOrder.id
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SVL CRM Payments",
        description: `Payment for Sales Order #${salesOrder.id}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verification = await verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              salesOrderId: salesOrder.id
            });
            if (verification.status === "SUCCESS") {
              showSuccess("Online Payment successful!");
              loadActiveOrders();
            } else {
              showError("Payment verification failed.");
            }
          } catch (err) {
            showError("Error verifying online payment.");
          }
        },
        prefill: {
          name: salesOrder.customerName || "",
          email: salesOrder.customerEmail || "",
          contact: salesOrder.customerMobile || ""
        },
        theme: {
          color: "#3b82f6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showError("Failed to initiate online payment.");
    } finally {
      setPayingOnline(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manualAmount || manualAmount <= 0) {
      showError("Please enter a valid payment amount.");
      return;
    }
    if (paymentMethod === "Bank Transfer" && !referenceNo) {
      showError("Please enter the transaction reference number.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentName = "";
      let attachmentPath = "";
      let attachmentSize = 0;
      let attachmentType = "";

      if (selectedFile) {
        const uploadRes = await uploadFileRecord(selectedFile);
        attachmentName = uploadRes.originalFileName;
        attachmentPath = uploadRes.filePath;
        attachmentSize = uploadRes.fileSize;
        attachmentType = uploadRes.fileType;
      }

      await recordPayment({
        leadId: salesOrder.leadId,
        salesOrderId: salesOrder.id,
        amount: Number(manualAmount),
        paymentMethod,
        referenceNo,
        proofFileName: attachmentName,
        proofFilePath: attachmentPath,
        status: "PENDING"
      });
      showSuccess("Payment submission recorded! Status: PENDING Verification");
      setReferenceNo("");
      setSelectedFile(null);
      const fileInput = document.getElementById("paymentProofFile");
      if (fileInput) fileInput.value = "";
      loadActiveOrders();
    } catch (err) {
      showError("Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!salesOrder) return <div className="p-5 text-center text-muted">No active orders available to submit payments.</div>;

  return (
    <div className="container-fluid py-4">
      {/* Selector dropdown for multiple orders */}
      {salesOrders.length > 1 && (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: 12, maxWidth: 1100 }}>
          <div className="card-body py-3 px-4 d-flex align-items-center gap-3">
            <span className="fw-semibold text-muted text-nowrap"><i className="ti ti-receipt me-1"></i>Select Sales Order to Pay:</span>
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
                  <span className="text-muted d-block small mb-1">Total Amount</span>
                  <span className="fw-bold text-dark fs-4">₹{salesOrder.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block small mb-1">Amount Paid</span>
                  <span className="fw-bold text-success fs-4">₹{salesOrder.paidAmount?.toLocaleString()}</span>
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
              <div className="p-3 bg-light rounded-4 mb-4 border border-light">
                <h6 className="fw-bold text-dark mb-2">Pay Instantly Online</h6>
                <p className="text-muted small mb-3">Pay securely with UPI, Credit Cards, Debit Cards, NetBanking, or Wallets.</p>
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  <div style={{ maxWidth: 150 }}>
                    <input
                      type="number"
                      className="form-control bg-white"
                      placeholder="Online Amount"
                      value={onlineAmount}
                      onChange={(e) => setOnlineAmount(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary d-inline-flex align-items-center gap-2"
                    onClick={handleOnlinePayment}
                    disabled={payingOnline || onlineAmount <= 0}
                    style={{ borderRadius: 8, fontWeight: "600", padding: "10px 20px" }}
                  >
                    {payingOnline ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-shield-check fs-5" />}
                    Pay Online with Razorpay (₹{Number(onlineAmount || 0)?.toLocaleString()})
                  </button>
                </div>
              </div>

              {/* Offline payment entry form */}
              <form onSubmit={handleSubmit}>
                <h5 className="fw-bold mb-3 text-muted" style={{ fontSize: "0.95rem" }}>Or Record Manual Transfer</h5>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">Amount to Pay (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter amount"
                      required
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  {paymentMethod === "Bank Transfer" && (
                    <div className="col-12">
                      <label className="form-label fw-semibold">Transaction Reference Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="UTR / Reference Number"
                        required
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label fw-semibold">Upload Payment Proof (Receipt / Screenshot)</label>
                    <input
                      type="file"
                      className="form-control"
                      id="paymentProofFile"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <button
                      type="submit"
                      className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                      disabled={submitting}
                      style={{ borderRadius: 8, fontWeight: "600", padding: "10px 20px" }}
                    >
                      {submitting && <span className="spinner-border spinner-border-sm me-1" />}
                      Submit Manual Receipt
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
