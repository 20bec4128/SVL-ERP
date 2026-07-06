import React, { useEffect, useState } from "react";
import { getSalesOrders, getPaymentsForOrder } from "../../api/leadsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function CustomerStatusPage() {
  const [salesOrder, setSalesOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatusData();
  }, []);

  const loadStatusData = async () => {
    setLoading(true);
    try {
      const orders = await getSalesOrders();
      if (orders.length > 0) {
        const so = orders[0];
        setSalesOrder(so);
        const payList = await getPaymentsForOrder(so.id);
        setPayments(payList);
      }
    } catch (e) {
      console.error("Failed to load status details:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-5 text-center"><LoadingSpinner /></div>;
  if (!salesOrder) return <div className="p-5 text-center text-muted">No active orders or project status records found.</div>;

  // Determine active/completed steps based on sales order properties
  const isPaid = salesOrder.paidAmount >= salesOrder.totalAmount;
  const hasAdvance = salesOrder.paidAmount > 0;
  const isPendingVerify = payments.some(p => p.status === "PENDING");
  const soStatus = String(salesOrder.status || "").toUpperCase();

  const steps = [
    {
      title: "Order Placed & Registered",
      description: `Sales Order #${salesOrder.soNumber} successfully created on ${new Date(salesOrder.createdAt || Date.now()).toLocaleDateString()}`,
      status: "COMPLETED",
    },
    {
      title: "Advance Payment Verification",
      description: isPaid
        ? "Advance and full payments verified successfully."
        : isPendingVerify
        ? "Payment receipt submitted. Admin verification in progress."
        : hasAdvance
        ? `Partial payment of ₹${salesOrder.paidAmount} verified. Remaining: ₹${salesOrder.totalAmount - salesOrder.paidAmount}`
        : "Awaiting advance payment submission to initiate design/production.",
      status: isPaid || hasAdvance ? "COMPLETED" : isPendingVerify ? "ACTIVE" : "PENDING",
    },
    {
      title: "Design & Customization",
      description: soStatus === "DESIGN" || soStatus === "AWAITING_ADVANCE"
        ? "Design layouts and customization requests are being analyzed."
        : ["PRODUCTION", "COMPLETED", "DELIVERED", "INSTALLED"].includes(soStatus) || isPaid
        ? "Design sheets approved and sent to factory."
        : "Pending payment initiation.",
      status: ["PRODUCTION", "COMPLETED", "DELIVERED", "INSTALLED"].includes(soStatus) || isPaid
        ? "COMPLETED"
        : soStatus === "DESIGN" || hasAdvance
        ? "ACTIVE"
        : "PENDING",
    },
    {
      title: "Manufacturing & Production",
      description: soStatus === "PRODUCTION"
        ? "Job card issued. Production currently active at manufacturing unit."
        : ["COMPLETED", "DELIVERED", "INSTALLED"].includes(soStatus)
        ? "Production completed. Quality check cleared."
        : "Awaiting design sign-off.",
      status: ["COMPLETED", "DELIVERED", "INSTALLED"].includes(soStatus)
        ? "COMPLETED"
        : soStatus === "PRODUCTION"
        ? "ACTIVE"
        : "PENDING",
    },
    {
      title: "Delivery & Handover",
      description: ["DELIVERED", "INSTALLED"].includes(soStatus)
        ? "Goods delivered successfully."
        : salesOrder.deliveryDate
        ? `Delivery scheduled by ${new Date(salesOrder.deliveryDate).toLocaleDateString()}`
        : "Delivery details will be populated post production check.",
      status: ["DELIVERED", "INSTALLED"].includes(soStatus) ? "COMPLETED" : soStatus === "COMPLETED" ? "ACTIVE" : "PENDING",
    },
  ];

  return (
    <div className="card shadow-sm border-0 m-4" style={{ borderRadius: 16 }}>
      <div className="card-header bg-white border-0 py-3 px-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <h4 className="mb-0 fw-bold text-dark">Order Status Timeline</h4>
      </div>
      <div className="card-body p-4">
        {/* Summary Card */}
        <div className="p-3 bg-light rounded-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <span className="text-muted small">Active Order Number</span>
            <h5 className="mb-0 fw-bold text-dark">INV-{salesOrder.soNumber}</h5>
          </div>
          <div>
            <span className="text-muted small">Current Phase</span>
            <div className="mb-0 fw-bold">
              <span className={`badge px-3 py-2 rounded-pill ${soStatus === 'DELIVERED' || soStatus === 'INSTALLED' ? 'bg-success' : 'bg-primary'}`}>
                {salesOrder.status?.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Progress List */}
        <div className="position-relative ps-4 ms-2" style={{ borderLeft: "2px solid #e2e8f0" }}>
          {steps.map((step, idx) => {
            const isCompleted = step.status === "COMPLETED";
            const isActive = step.status === "ACTIVE";
            return (
              <div key={idx} className="mb-4 position-relative">
                {/* Visual Circle Indicator */}
                <div
                  className="position-absolute d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    left: -33,
                    top: 2,
                    width: 24,
                    height: 24,
                    backgroundColor: isCompleted ? "#22c55e" : isActive ? "#3b82f6" : "#ffffff",
                    border: isCompleted || isActive ? "none" : "2px solid #cbd5e1",
                    color: isCompleted || isActive ? "#ffffff" : "#cbd5e1",
                    boxShadow: isActive ? "0 0 0 4px rgba(59, 130, 246, 0.18)" : "none",
                    zIndex: 2,
                  }}
                >
                  {isCompleted ? (
                    <i className="ti ti-check" style={{ fontSize: "0.75rem", fontWeight: 700 }} />
                  ) : isActive ? (
                    <i className="ti ti-loader rotate-spin" style={{ fontSize: "0.75rem" }} />
                  ) : (
                    <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>{idx + 1}</span>
                  )}
                </div>

                {/* Step Details */}
                <div className="ms-2">
                  <h6 className={`fw-bold mb-1 ${isActive ? "text-primary" : "text-dark"}`} style={{ fontSize: "1rem" }}>
                    {step.title}
                  </h6>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.4 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
