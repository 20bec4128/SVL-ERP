import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import { getStockRequestById, updateStockRequest, getStockRequestLog, getStockItems, getStockRequestBillUrl, getStockCategories, verifyStockRequestBill } from "../../api/stocksApi";
import { getVendors } from "../../api/vendorsApi";
import { getLeadFlow } from "../../api/flowApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";

function parseStockRequestItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items !== "string" || !items.trim()) return [];
  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJSONArray(str) {
  if (Array.isArray(str)) return str;
  if (typeof str !== "string" || !str.trim()) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// New helper: filter vendors by category
function getVendorsForCategory(categoryId, allVendors, allCategories) {
  if (!categoryId) return allVendors; // no category specified, show all
  const category = allCategories.find((c) => String(c.id) === String(categoryId));
  if (!category) return allVendors; // category not found, show all
  const allowedTypeIds = parseJSONArray(category.allowedVendorTypeIds || "[]");
  if (allowedTypeIds.length === 0) return allVendors; // no restrictions, show all
  // filter vendors: show only those whose vendorTypeIds overlap with allowedTypeIds
  return allVendors.filter((v) => {
    const vendorTypes = parseJSONArray(v.vendorTypeIds || "[]");
    return vendorTypes.some((vt) => allowedTypeIds.includes(vt));
  });
}
function formatStockItemLabel(item) {
  if (!item) return "";
  const parts = [item.name];
  if (item.categoryName) parts.push(item.categoryName);
  if (item.vendorName) parts.push(item.vendorName);
  const qty = Number(item.quantity);
  if (!Number.isNaN(qty)) parts.push(`Qty ${qty}`);
  const minTh = Number(item.minThreshold);
  if (!Number.isNaN(minTh)) parts.push(`Min ${minTh}`);
  const values = item.values || {};
  const valueParts = [];
  const seen = new Set();
  ["material", "manufacturer", "supplier", "size", "uom"].forEach((key) => {
    const entry = values[key];
    if (entry) {
      const part = `${key}: ${entry}`;
      valueParts.push(part);
      seen.add(part);
    }
  });
  if (valueParts.length < 3) {
    for (const [key, value] of Object.entries(values)) {
      if (value && valueParts.length < 3) {
        const part = `${key}: ${value}`;
        if (!seen.has(part)) {
          valueParts.push(part);
          seen.add(part);
        }
      }
    }
  }
  if (valueParts.length) {
    parts.push(valueParts.join(" · "));
  }
  return parts.filter(Boolean).join(" · ");
}

export default function StockRequestEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const canEditVendors = role === "EMPLOYEE" || role === "MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN";
  const { showSuccess, showError } = useToast();
  // example budget threshold; ideally fetched from server/settings
  const BUDGET_THRESHOLD = 100000;

  const [request, setRequest] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseValue, setPurchaseValue] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [flowRules, setFlowRules] = useState([]); // rules fetched from backend
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [logs, setLogs] = useState([]); // stock request logs
  const [itemVendors, setItemVendors] = useState({}); // map of itemIndex -> vendorId
  const [savingVendors, setSavingVendors] = useState(false);
  const [vendorSaveMsg, setVendorSaveMsg] = useState("");
  const [approvingRequest, setApprovingRequest] = useState(false);
  const [approveMsg, setApproveMsg] = useState("");
  const [verifyingBill, setVerifyingBill] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");
  
  const stockRequestFlowStatuses = useMemo(() => {
    // full ordered status flow including delivery and closure steps
    return ["Stock Request", "Accounts Review", "Approval", "Verification", "Verified", "Closed", "Rejected"];
  }, []);

  const currentTimelineIndex = useMemo(() => {
    if (!request?.status) return -1;
    const st = String(request.status).toLowerCase();
    return stockRequestFlowStatuses.findIndex(
      (ts) => String(ts).toLowerCase() === st,
    );
  }, [request?.status, stockRequestFlowStatuses]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [data, vendorRows, flow, itemRows, categoryRows] = await Promise.all([
          getStockRequestById(id),
          getVendors(),
          getLeadFlow(),
          getStockItems(),
          getStockCategories(), // new: load categories
        ]);
        setRequest(data);
        setFlowRules(Array.isArray(flow?.rules) ? flow.rules : []);
        // normalize status to lowercase for consistent dropdown matching
        const statusStr = data?.status ? String(data.status).trim().toLowerCase() : "";
        setPurchaseValue(data?.purchaseValue || "");
        setVendorId(data?.vendorId || "");
        setVendors(Array.isArray(vendorRows) ? vendorRows : []);
        setStockItems(Array.isArray(itemRows) ? itemRows : []);
        setCategories(Array.isArray(categoryRows) ? categoryRows : []); // new: set categories
        setPurchaseValue(data?.purchaseValue || "");
        setVendorId(data?.vendorId || "");
        // initialise per-item vendor map from existing items JSON
        const parsedItems = parseStockRequestItems(data?.items);
        const vendorMap = {};
        parsedItems.forEach((it, idx) => {
          if (it.vendorId) vendorMap[idx] = String(it.vendorId);
        });
        setItemVendors(vendorMap);
        // fetch logs separately (not parallel with above to simplify error handling)
        try {
          const logRows = await getStockRequestLog(id);
          setLogs(Array.isArray(logRows) ? logRows : []);
        } catch (err) {
          console.error("failed to load logs", err);
        }
      } catch (e) {
        showError("Failed to load request");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApproveRequest = async () => {
    if (!request) return;
    setApprovingRequest(true);
    setApproveMsg("");
    try {
      const updated = await updateStockRequest(id, { status: "Approval" });
      setRequest((prev) => ({ ...(prev || {}), ...(updated || {}) }));
      setApproveMsg("Request approved.");
      setTimeout(() => setApproveMsg(""), 4000);
    } catch (e) {
      showError("Failed to approve request");
    } finally {
      setApprovingRequest(false);
    }
  };

  const handleVerifyBill = async () => {
    if (!request) return;
    setVerifyingBill(true);
    setVerifyMsg("");
    try {
      const updated = await verifyStockRequestBill(id);
      setRequest((prev) => ({ ...(prev || {}), ...(updated || {}) }));
      setVerifyMsg("Bill verified.");
      setTimeout(() => setVerifyMsg(""), 4000);
    } catch (e) {
      showError("Failed to verify bill");
    } finally {
      setVerifyingBill(false);
    }
  };

  const handleSaveItemVendors = async () => {
    if (!request) return;
    setSavingVendors(true);
    setVendorSaveMsg("");
    try {
      const parsedItems = parseStockRequestItems(request.items);
      const updatedItems = parsedItems.map((it, idx) => ({
        ...it,
        vendorId: itemVendors[idx] ? Number(itemVendors[idx]) : (it.vendorId || null),
      }));
      const updated = await updateStockRequest(id, { items: JSON.stringify(updatedItems) });
      setRequest((prev) => ({ ...(prev || {}), ...(updated || {}) }));
      setVendorSaveMsg("Vendors saved.");
      setTimeout(() => setVendorSaveMsg(""), 3000);
    } catch (e) {
      showError("Failed to save item vendors");
    } finally {
      setSavingVendors(false);
    }
  };

  return (
    <div className="container-fluid">
      <PageHeader
        title={`Stock Request ${id}`}
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Stock Requests", path: "/stock-requests" },
          { label: id, path: "" },
        ]}
      />
      <div className="mb-3 d-flex gap-2">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        {/* <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => navigate(`/stock-requests/${id}/chat`)}
        >
          Chat
        </button> */}
      </div>

      {/* timeline section */}
      <div className="lead-status-timeline mb-3">
        {stockRequestFlowStatuses.map((item, index) => {
          const stateClass =
            currentTimelineIndex === -1
              ? ""
              : index < currentTimelineIndex
              ? "is-done"
              : index === currentTimelineIndex
              ? "is-current"
              : "";
          return (
            <div key={item} className={`lead-status-step ${stateClass}`}>
              <div className="lead-status-dot" />
              <div className="lead-status-label">{item}</div>
            </div>
          );
        })}
      </div>

      {request && (
        <>
          {(role === "EMPLOYEE" || role === "MANAGER") && request.assignedTo !== user?.id && (
            <div className="card">
              <div className="card-body">
                <button
                  className="btn btn-sm btn-outline-primary mb-3"
                  onClick={async () => {
                    try {
                      const updated = await updateStockRequest(id, { assignedTo: user?.id });
                      setRequest(updated);
                    } catch (err) {
                      console.error(err);
                      showError("Failed to assign request");
                    }
                  }}
                >
                  Assign to me
                </button>
              </div>
            </div>
          )}

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card">
                <div className="card-body">
                  <h5 className="mb-3">Name & Team</h5>
                  <div className="mb-3">
                    <strong>Lead:</strong> {request.leadName || request.leadId || "-"}
                  </div>
                  <div className="mb-3">
                    <strong>Requested By:</strong>{" "}
                    {request.requestedByName || request.requestedBy || "-"}
                  </div>
                 
                  <h5 className="mb-3">Items & Notes</h5>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Items</strong>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setNotesModalVisible(true)}
                      >
                        View Notes
                      </button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered align-middle mb-2">
                        <thead className="table-light">
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            {canEditVendors ? <th>Assign Vendor</th> : <th>Vendor</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {parseStockRequestItems(request.items).map((it, idx) => {
                            const detail = stockItems.find((si) => String(si.id) === String(it.itemId));
                            const label = detail
                              ? formatStockItemLabel(detail)
                              : it.name || `Item ${it.itemId || ""}`;
                            const assignedVendor = vendors.find((v) => String(v.id) === String(it.vendorId));
                            // current value: prefer local editing state, fall back to saved value
                            const currentVendorValue =
                              itemVendors[idx] !== undefined
                                ? itemVendors[idx]
                                : it.vendorId != null
                                ? String(it.vendorId)
                                : "";
                            return (
                              <tr key={idx}>
                                <td>{label}</td>
                                <td>{it.qty}</td>
                                <td>
                                  {canEditVendors ? (
                                    <select
                                      className="form-select form-select-sm"
                                      value={currentVendorValue}
                                      onChange={(e) =>
                                        setItemVendors((prev) => ({ ...prev, [idx]: e.target.value }))
                                      }
                                    >
                                      <option value="">Select vendor</option>
                                      {getVendorsForCategory(it.categoryId, vendors, categories).map((v) => (
                                        <option key={v.id} value={String(v.id)}>
                                          {v.vendorName || v.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-muted">
                                      {assignedVendor ? (assignedVendor.vendorName || assignedVendor.name) : "-"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {canEditVendors && (
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={handleSaveItemVendors}
                          disabled={savingVendors}
                        >
                          {savingVendors ? "Saving…" : "Save Item Vendors"}
                        </button>
                        {vendorSaveMsg && (
                          <span className="text-success small">{vendorSaveMsg}</span>
                        )}
                        {![
                          "approval", "verification", "verified", "closed"
                        ].includes(String(request?.status || "").toLowerCase()) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={handleApproveRequest}
                            disabled={approvingRequest}
                          >
                            <i className="ti ti-check me-1"></i>
                            {approvingRequest ? "Approving…" : "Approve Request"}
                          </button>
                        )}
                        {approveMsg && (
                          <span className="text-success small fw-medium">{approveMsg}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card border">
                <div className="card-body">
                  <h5 className="mb-3">Request Status</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {stockRequestFlowStatuses.map((item) => {
                      const stateClass =
                        currentTimelineIndex === -1
                          ? ""
                          : stockRequestFlowStatuses.findIndex((s) => s === item) <
                            currentTimelineIndex
                          ? "bg-success text-white"
                          : item.toLowerCase() === String(request?.status || "").toLowerCase()
                          ? "bg-primary text-white"
                          : "bg-light text-dark";
                      return (
                        <span key={item} className={`badge ${stateClass}`}>
                          {item}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bill uploaded section — visible once bill exists */}
              {request.billFilePath && (
                <div className="card mt-3 border-success">
                  <div className="card-header bg-success text-white d-flex align-items-center gap-2">
                    <i className="ti ti-file-invoice"></i>
                    <h6 className="mb-0">Bill Uploaded</h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <strong>File:</strong>{" "}
                      <a
                        href={getStockRequestBillUrl(id)}
                        download={request.billFileName || "bill"}
                        className="text-decoration-none"
                      >
                        {request.billFileName || "View Bill"}
                      </a>
                    </div>
                    {request.billNote && (
                      <div className="mb-2">
                        <strong>Note:</strong>
                        <p className="mb-0 text-muted" style={{ whiteSpace: "pre-wrap" }}>
                          {request.billNote}
                        </p>
                      </div>
                    )}
                    {request.billUploadedAt && (
                      <div className="text-muted small">
                        Uploaded {new Date(request.billUploadedAt).toLocaleString()}
                      </div>
                    )}
                    {canEditVendors && String(request?.status || "").toLowerCase() === "verification" && (
                      <div className="mt-3 d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={handleVerifyBill}
                          disabled={verifyingBill}
                        >
                          <i className="ti ti-circle-check me-1"></i>
                          {verifyingBill ? "Verifying\u2026" : "Verify Bill"}
                        </button>
                        {verifyMsg && <span className="text-success small fw-medium">{verifyMsg}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="card mt-3">
                <div className="card-body">
                  <h5 className="mb-3">Log</h5>
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {logs.length === 0 ? (
                      <div className="text-muted">No log entries.</div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {logs.map((l) => (
                          <div key={l.id || l.createdAt}>
                            <div className="fw-medium">{l.action}</div>
                            <div className="text-muted">by {l.actor || 'system'}</div>
                            <div className="text-muted">
                              on {new Date(l.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* notes modal */}
              {notesModalVisible && (
                <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Item Notes</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setNotesModalVisible(false)}
                        />
                      </div>
                      <div className="modal-body">
                        <ul>
                          {parseStockRequestItems(request.items)
                            .filter((it) => it.notes)
                            .map((it, idx) => {
                              const detail = stockItems.find((si) => String(si.id) === String(it.itemId));
                              const label = detail
                                ? formatStockItemLabel(detail)
                                : it.name || `Item ${it.itemId || ""}`;
                              return (
                                <li key={idx}>
                                  <strong>{label}: </strong>
                                  {it.notes}
                                </li>
                              );
                            })}
                        </ul>
                        {parseStockRequestItems(request.items).every((it) => !it.notes) && (
                          <div className="text-muted">No notes available.</div>
                        )}
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setNotesModalVisible(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
