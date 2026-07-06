import { useEffect, useState } from "react";
import { getSalesOrders, getPaymentsForOrder, verifyPayment, getJobForOrder, getJobTasks, updateJobTaskStatus, assignTaskOperator, submitTaskProof } from "../../api/leadsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Link } from "react-router-dom";

export default function AdminSalesOrderDashboard() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [job, setJob] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // overview, payments, workflow

  useEffect(() => {
    loadSalesOrders();
  }, []);

  const loadSalesOrders = async () => {
    setLoading(true);
    try {
      const data = await getSalesOrders();
      setSalesOrders(data);
    } catch (e) {
      console.error("Failed to load sales orders", e);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = async (so) => {
    setSelectedOrder(so);
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
      if (selectedOrder) {
        selectOrder(selectedOrder);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await updateJobTaskStatus(taskId, status);
      if (job) {
        const taskList = await getJobTasks(job.id);
        setTasks(taskList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div>
          <h2 className="mb-1">Sales Orders & Downstream ERP</h2>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/admin-dashboard"><i className="ti ti-smart-home"></i></Link>
              </li>
              <li className="breadcrumb-item active">Sales Orders</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        {/* Left Side: Sales Order List */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-semibold">Active Sales Orders</h5>
            </div>
            <div className="card-body p-0">
              {loading && salesOrders.length === 0 ? (
                <div className="p-4 text-center"><LoadingSpinner /></div>
              ) : salesOrders.length === 0 ? (
                <div className="p-4 text-center text-muted">No sales orders found. Accept a Quotation to generate.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {salesOrders.map((so) => (
                    <button
                      key={so.id}
                      onClick={() => selectOrder(so)}
                      className={`list-group-item list-group-item-action border-0 py-3 px-4 text-start ${selectedOrder?.id === so.id ? 'bg-light fw-bold' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-primary fw-semibold">{so.soNumber}</span>
                        <span className={`badge ${so.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}>
                          {so.status}
                        </span>
                      </div>
                      <div className="small text-muted mt-1">Total: ₹{so.totalAmount} | Paid: ₹{so.paidAmount}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Execution Dashboard */}
        <div className="col-lg-8">
          {selectedOrder ? (
            <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 fw-bold">{selectedOrder.soNumber}</h4>
                  <span className="badge bg-info p-2">{selectedOrder.status}</span>
                </div>
              </div>

              <div className="card-body">
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>Payments & Ledger</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'workflow' ? 'active' : ''}`} onClick={() => setActiveTab('workflow')}>Workflow Status</button>
                  </li>
                </ul>

                {activeTab === 'overview' && (
                  <div>
                    <h5 className="fw-semibold mb-3">Order Items Summary</h5>
                    <table className="table table-hover align-middle">
                      <thead>
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
                            <td>{item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>₹{item.unitPrice}</td>
                            <td>₹{item.lineTotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div>
                    <h5 className="fw-semibold mb-3">Payment Instalment Ledger</h5>
                    {payments.length === 0 ? (
                      <p className="text-muted">No payments recorded for this order yet.</p>
                    ) : (
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Reference</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p.id}>
                              <td>{p.paymentMethod}</td>
                              <td>₹{p.amount}</td>
                              <td>{p.referenceNo || 'N/A'}</td>
                              <td>
                                <span className={`badge ${p.status === 'VERIFIED' ? 'bg-success' : 'bg-warning'}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td>
                                {p.status === 'PENDING' && (
                                  <div className="btn-group btn-group-sm">
                                    <button className="btn btn-success" onClick={() => handleVerifyPayment(p.id, "VERIFIED")}>Verify</button>
                                    <button className="btn btn-danger" onClick={() => handleVerifyPayment(p.id, "REJECTED")}>Reject</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'workflow' && (
                  <div>
                    <h5 className="fw-semibold mb-3">Department Work Progress</h5>
                    {!job ? (
                      <p className="text-muted">Job allocation will start once advance payment conditions are verified (Minimum 50% paid).</p>
                    ) : (
                      <div>
                        <div className="mb-3">
                          <label className="form-label">Job Progress: {job.overallProgress}%</label>
                          <div className="progress" style={{ height: 10 }}>
                            <div className="progress-bar bg-success" style={{ width: `${job.overallProgress}%` }}></div>
                          </div>
                        </div>

                        <div className="list-group">
                          {tasks.map((task) => (
                            <div key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 fw-semibold">{task.department}</h6>
                                <span className="small text-muted">Status: {task.status}</span>
                              </div>
                              <div>
                                {task.status !== 'APPROVED' && (
                                  <button className="btn btn-sm btn-outline-success" onClick={() => handleUpdateTaskStatus(task.id, 'APPROVED')}>
                                    Approve & Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card shadow-sm border-0 p-5 text-center text-muted" style={{ borderRadius: 12 }}>
              Select a Sales Order on the left to view details and execute tasks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
