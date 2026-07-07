import { useEffect, useState } from "react";
import { getSalesOrders, getPaymentsForOrder, verifyPayment, getJobForOrder, getJobTasks, updateJobTaskStatus } from "../../api/leadsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Link } from "react-router-dom";
import { useToast } from "../../components/system/ToastProvider";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function AdminSalesOrderDashboard() {
  const { showSuccess, showError } = useToast();
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [job, setJob] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // overview, payments, workflow
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadSalesOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const loadSalesOrders = async () => {
    setLoading(true);
    try {
      const data = await getSalesOrders();
      setSalesOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load sales orders", e);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = async (so) => {
    setSelectedOrder(so);
    setShowDetailModal(true);
    setActiveTab("overview");
    setLoading(true);
    try {
      const payList = await getPaymentsForOrder(so.id);
      setPayments(payList);

      const jobData = await getJobForOrder(so.id);
      setJob(jobData);

      if (jobData) {
        const taskList = await getJobTasks(jobData.id);
        setTasks(taskList);
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (payId, status) => {
    try {
      await verifyPayment(payId, status);
      showSuccess(`Payment status marked as ${status}`);
      if (selectedOrder) {
        const payList = await getPaymentsForOrder(selectedOrder.id);
        setPayments(payList);
        // Refresh orders list to update paidAmount / status
        loadSalesOrders();
      }
    } catch (e) {
      console.error(e);
      showError("Failed to update payment status.");
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (status === 'APPROVED' && taskObj && taskObj.department !== 'DESIGN') {
      const balance = selectedOrder.totalAmount - selectedOrder.paidAmount;
      if (balance > 0) {
        showError(`Cannot approve and complete ${taskObj.department} stage. Outstanding balance of ₹${balance.toLocaleString()} must be cleared first.`);
        return;
      }
    }
    try {
      await updateJobTaskStatus(taskId, status);
      showSuccess(`Task ${taskObj?.department || ''} status updated successfully.`);
      if (job) {
        const taskList = await getJobTasks(job.id);
        setTasks(taskList);
      }
    } catch (e) {
      console.error(e);
      showError("Failed to update task status.");
    }
  };

  const filteredOrders = salesOrders.filter((so) => {
    const matchesSearch = (so.soNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (so.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (so.companyName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || so.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="content">
      {/* White Header Breadcrumb Card */}
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div>
          <h2 className="mb-1">Sales Orders & Billing</h2>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/admin-dashboard"><i className="ti ti-smart-home"></i></Link>
              </li>
              <li className="breadcrumb-item">Finance & Accounts</li>
              <li className="breadcrumb-item active">Sales Orders</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
        <div className="card-header bg-white border-bottom py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h5 className="mb-0 fw-semibold text-dark">Active Sales Orders</h5>
          <div className="d-flex align-items-center gap-2">
            <div className="input-group input-group-sm" style={{ width: 220 }}>
              <span className="input-group-text bg-light border-0"><i className="ti ti-search text-muted"></i></span>
              <input
                type="text"
                className="form-control bg-light border-0"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select form-select-sm bg-light border-0 text-muted"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_DESIGN">IN_DESIGN</option>
              <option value="IN_PRODUCTION">IN_PRODUCTION</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-nowrap align-middle mb-0">
              <thead className="thead-light">
                <tr>
                  <th className="px-4">#</th>
                  <th>SO Number</th>
                  <th>Customer Details</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th className="text-end px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && salesOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      No sales orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((so, idx) => {
                    const balance = so.totalAmount - so.paidAmount;
                    return (
                      <tr key={so.id}>
                        <td className="px-4 text-muted">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td className="fw-bold text-primary">{so.soNumber || `#${so.id}`}</td>
                        <td>
                          <div className="fw-semibold text-dark">{so.customerName || "-"}</div>
                          <div className="text-muted small">{so.companyName || "No Company"}</div>
                        </td>
                        <td className="fw-semibold text-dark">₹{so.totalAmount?.toLocaleString()}</td>
                        <td className="text-success fw-semibold">₹{so.paidAmount?.toLocaleString()}</td>
                        <td className="text-danger fw-semibold">₹{balance?.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${so.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}>
                            {so.status}
                          </span>
                        </td>
                        <td className="text-end px-4">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => selectOrder(so)}
                            style={{ borderRadius: 6 }}
                          >
                            <i className="ti ti-eye"></i> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{ borderRadius: 6 }}
            >
              Previous
            </button>
            <span className="small text-muted fw-medium">Page {currentPage} of {totalPages}</span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{ borderRadius: 6 }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small">Sales Order Details</span>
                  <h4 className="modal-title fw-bold text-dark mt-1">{selectedOrder.soNumber || `#${selectedOrder.id}`}</h4>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                {/* Tabs Navigation */}
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'overview' ? 'active fw-bold' : ''}`}
                      onClick={() => setActiveTab('overview')}
                    >
                      Overview
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'payments' ? 'active fw-bold' : ''}`}
                      onClick={() => setActiveTab('payments')}
                    >
                      Payments & Ledger
                    </button>
                  </li>
                </ul>

                {/* Tab content */}
                {activeTab === 'overview' && (
                  <div>
                    <h5 className="fw-semibold mb-3">Order Items Summary</h5>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="thead-light">
                          <tr>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items?.map((item) => (
                            <tr key={item.id}>
                              <td className="fw-semibold text-dark">{item.productName}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.unitPrice?.toLocaleString()}</td>
                              <td className="fw-bold">₹{item.lineTotal?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div>
                    <h5 className="fw-semibold mb-3">Payment Instalment Ledger</h5>
                    {payments.length === 0 ? (
                      <p className="text-muted py-3 text-center bg-light rounded-3">No payments recorded for this order yet.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="thead-light">
                            <tr>
                              <th>Method</th>
                              <th>Amount</th>
                              <th>Reference</th>
                              <th>Status</th>
                              <th>Proof</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((p) => (
                              <tr key={p.id}>
                                <td className="fw-semibold text-dark">{p.paymentMethod}</td>
                                <td className="fw-bold">₹{p.amount?.toLocaleString()}</td>
                                <td>{p.referenceNo || 'N/A'}</td>
                                <td>
                                  <span className={`badge ${p.status === 'VERIFIED' ? 'bg-success' : p.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                                    {p.status}
                                  </span>
                                </td>
                                <td>
                                  {p.proofFilePath ? (
                                    <a
                                      href={resolveMediaUrl(p.proofFilePath)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-xs btn-outline-info d-inline-flex align-items-center gap-1"
                                    >
                                      <i className="ti ti-eye" /> View Proof
                                    </a>
                                  ) : (
                                    <span className="text-muted small">No File</span>
                                  )}
                                </td>
                                <td>
                                  {p.status === 'PENDING' && (
                                    <div className="d-flex gap-1">
                                      <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleVerifyPayment(p.id, "VERIFIED")}
                                      >
                                        Verify
                                      </button>
                                      <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleVerifyPayment(p.id, "REJECTED")}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer border-top py-3 px-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                  style={{ borderRadius: 8 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
