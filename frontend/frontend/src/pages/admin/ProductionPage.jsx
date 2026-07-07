import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProductionRequests, updateDealStatus, getDealById } from "../../api/dealsApi";
import { getDesignRequirement } from "../../api/designRequirementApi";
import { getUsers } from "../../api/userAdminApi";
import { createStockRequest, getStockItems, getStockRequests } from "../../api/stocksApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import StockRequestFormModal from "../../components/system/StockRequestFormModal";
import api from "../../utils/api";

function pickAssignedUserId(...sources) {
  for (const source of sources) {
    const value =
      source?.assignedTo ??
      source?.productionAssignedToUserId ??
      source?.production_assigned_to_user_id ??
      source?.ownerUserId ??
      source?.owner_user_id ??
      source?.allocatorId ??
      source?.allocator_id ??
      null;
    if (value != null && String(value).trim() !== "") return value;
  }
  return null;
}

function pickAssignedName(...sources) {
  for (const source of sources) {
    const value =
      source?.productionAssignedToUserName ??
      source?.productionAssignedToName ??
      source?.production_assigned_to_user_name ??
      source?.assignedToName ??
      source?.ownerName ??
      source?.owner_name ??
      source?.allocatorName ??
      source?.allocator_name ??
      "";
    if (String(value).trim()) return String(value).trim();
  }
  return "";
}

export default function ProductionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const role = String(user?.role || "").toUpperCase();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockItems, setStockItems] = useState([]);
  const [showStockRequestModal, setShowStockRequestModal] = useState(false);
  const [stockRequestSubmitting, setStockRequestSubmitting] = useState(false);
  const [stockRequestError, setStockRequestError] = useState("");
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [userNameMap, setUserNameMap] = useState({});
  const [stockStatusRequests, setStockStatusRequests] = useState([]);
  const [showStockStatusModal, setShowStockStatusModal] = useState(false);
  const [searchText, setSearchText] = useState("");

  const loadUserNames = async () => {
    try {
      const usersData = await getUsers(0, 500);
      const map = {};
      if (Array.isArray(usersData?.items)) {
        usersData.items.forEach((u) => {
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
          map[u.id] = fullName || u.username || "";
        });
      }
      setUserNameMap(map);
    } catch {
      setUserNameMap({});
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProductionRequests();
      const rows = Array.isArray(data) ? data : [];
      const visibleStockRequests = await getStockRequests().catch(() => []);
      const enrichedRows = await Promise.all(
        rows.map(async (deal) => {
          const sourceLeadId = deal?.sourceLeadId;
          if (!sourceLeadId) return deal;
          try {
            const [dealDetails, designRequirement, stockRows] = await Promise.all([
              getDealById(deal.id).catch(() => null),
              getDesignRequirement(sourceLeadId).catch(() => null),
              visibleStockRequests.filter(
                (req) =>
                  String(req?.dealId ?? "") === String(deal.id) ||
                  String(req?.leadId ?? "") === String(sourceLeadId),
              ),
            ]);
            const stockRequests = Array.isArray(stockRows)
              ? [...stockRows].sort((a, b) => b.id - a.id)
              : [];
            const stockRequestId = stockRequests[0]?.id || null;

            // Resolve assigned user name
            let productionAssignedToName = pickAssignedName(null, dealDetails, deal) || "-";
            const assignedUserId = pickAssignedUserId(null, dealDetails, deal);
            if (assignedUserId && productionAssignedToName === "-") {
              productionAssignedToName =
                userNameMap[assignedUserId] ||
                (String(assignedUserId) === String(user?.id) ? "You" : "Assigned");
            }

            return {
              ...deal,
              stockRequests,
              stockRequestId,
              productionAssignedToUserId: assignedUserId,
              requirementType:
                designRequirement?.requirementType ||
                deal?.requirementType ||
                "",
              requirementNotes:
                designRequirement?.designAdditionalNotes ||
                designRequirement?.requirementNotes ||
                deal?.requirementNotes ||
                "",
              productionAssignedToName,
            };
          } catch {
            return deal;
          }
        }),
      );
      setDeals(enrichedRows);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load production requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user !== undefined) load();
  }, [user, userNameMap]);

  useEffect(() => {
    if (user !== undefined) loadUserNames();
  }, [user]);

  useEffect(() => {
    getStockItems()
      .then((rows) => setStockItems(Array.isArray(rows) ? rows : []))
      .catch(() => setStockItems([]));
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    getStockRequests()
      .then((rows) => setStockStatusRequests(Array.isArray(rows) ? rows : []))
      .catch(() => setStockStatusRequests([]));
  }, [user]);

  const downloadFinalDesign = async (deal) => {
    if (!deal?.designFinalFilePath || !deal?.designFinalFileName) return;
    try {
      const response = await api.get(deal.designFinalFilePath, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = deal.designFinalFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download final design"));
    }
  };

  const handleStockRequestSubmit = async ({ leadId, leadName, items }) => {
    setStockRequestSubmitting(true);
    setStockRequestError("");
    try {
      const payload = {
        requestedBy: user?.id,
        items,
      };
      
      // Include deal/lead info if a deal was selected
      if (selectedDeal?.id) {
        payload.dealId = selectedDeal.id;
        payload.leadId = selectedDeal?.sourceLeadId;
        payload.leadName = leadName || selectedDeal?.name || "";
      } else if (leadId) {
        // For global creation, use provided leadId/leadName if available
        payload.leadId = leadId;
        payload.leadName = leadName || "";
      }
      
      const req = await createStockRequest(payload);
      if (req?.id) {
        // Only update deal status if a deal was selected
        if (selectedDeal?.id) {
          await updateDealStatus(selectedDeal.id, "Stock Request");
        }
        setShowStockRequestModal(false);
        setSelectedDeal(null);
      }
    } catch (err) {
      setStockRequestError(extractApiErrorMessage(err, "Failed to create stock request"));
    } finally {
      setStockRequestSubmitting(false);
    }
  };

  const filteredDeals = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return deals;
    return deals.filter((deal) =>
      String(deal.requirementType || "").toLowerCase().includes(search) ||
      String(deal.requirementNotes || "").toLowerCase().includes(search) ||
      String(deal.productionWorkStatus || "").toLowerCase().includes(search) ||
      String(deal.productionAssignedToName || "").toLowerCase().includes(search)
    );
  }, [deals, searchText]);

  return (
    <div className="container-fluid content">
      {/* Header Block */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Production Requests</h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" className="text-decoration-none text-muted">
                    <i className="ti ti-smart-home" />
                  </a>
                </li>
                <li className="breadcrumb-item text-muted">CRM</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">
                  Production
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          {/* Search Controls Bar */}
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
              <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search production requests..."
                style={{ height: 36, fontSize: "0.9rem" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={() => {
                  setStockRequestError("");
                  setSelectedDeal(null);
                  setShowStockRequestModal(true);
                }}
              >
                <i className="ti ti-package" />
                Create Stock Request
              </button>
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={() => setShowStockStatusModal(true)}
              >
                <i className="ti ti-package-check" />
                Stock Request Status
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
                onClick={load}
              >
                <i className="ti ti-refresh" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center p-4 text-muted">No production requests found.</div>
          ) : (
            <div className="table-responsive leads-table-wrap border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <table className="table table-hover align-middle leads-table mb-0">
                <thead>
                  <tr>
                    <th className="text-muted" style={{ width: 100, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Requirement Type</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Requirement Notes</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Final Design</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Assigned to</th>
                    <th className="text-muted text-end" style={{ width: 160, fontWeight: "600", fontSize: "0.85rem" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal, idx) => (
                    <tr key={deal.id}>
                      <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{idx + 1}</td>
                      <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{deal.requirementType || "-"}</td>
                      <td style={{ color: "#475569", fontSize: "0.9rem" }}>{deal.requirementNotes || "-"}</td>
                      <td>
                        {(() => {
                          const s = deal.productionWorkStatus || "Not Started";
                          const badgeMap = { "Not Started": "secondary", "In Progress": "warning", "Quality Check": "info", "Ready for Delivery": "success", "Started": "info", "Completed": "success" };
                          return <span className={`badge bg-${badgeMap[s] || "secondary"}`} style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: 8 }}>{s}</span>;
                        })()}
                      </td>
                      <td>
                        {deal.designFinalFileName ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                            style={{ borderRadius: 8, fontSize: "0.85rem" }}
                            onClick={() => downloadFinalDesign(deal)}
                          >
                            <i className="ti ti-download"></i>
                            {deal.designFinalFileName}
                          </button>
                        ) : "-"}
                      </td>
                      <td style={{ color: "#475569", fontSize: "0.9rem" }}>{deal.productionAssignedToName || "-"}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => navigate(`/production-detail/${deal.id}`)}
                          >
                            <i className="ti ti-eye me-1"></i>View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stock Request Status Modal */}
      {showStockStatusModal && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: "#0f172a" }}>View Stock Request Status</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowStockStatusModal(false)}
                />
              </div>
              <div className="modal-body p-4">
                {stockStatusRequests.length === 0 ? (
                  <div className="text-muted text-center py-4">
                    <i className="ti ti-package-off fs-1 d-block mb-3 text-secondary"></i>
                    No stock requests created yet.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {stockStatusRequests.map((stockReq) => (
                      <button
                        key={stockReq.id}
                        type="button"
                        className="btn btn-outline-primary text-start text-truncate d-flex align-items-center gap-2 p-3"
                        style={{ borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" }}
                        onClick={() => {
                          navigate(`/stock-requests/${stockReq.id}/status`);
                          setShowStockStatusModal(false);
                        }}
                      >
                        <i className="ti ti-package text-primary fs-5" />
                        <span className="fw-semibold">
                          {stockReq.leadName || stockReq.leadDisplayId || `Request #${stockReq.id}`}
                        </span>
                        {stockReq.status && (
                          <span className="badge bg-light text-primary ms-auto" style={{ border: "1px solid #cbd5e1" }}>
                            {stockReq.status}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2"
                  style={{ borderRadius: 10 }}
                  onClick={() => setShowStockStatusModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <StockRequestFormModal
        open={showStockRequestModal}
        leadId={selectedDeal?.id}
        initialLeadName={selectedDeal?.id ? `Deal #${selectedDeal?.id} - ${selectedDeal?.name || ""}` : ""}
        leadOptions={
          selectedDeal?.id
            ? [{ id: selectedDeal.id, displayId: selectedDeal.id, name: selectedDeal?.name || "" }]
            : []
        }
        itemOptions={stockItems}
        requireLeadId={false}
        onClose={() => {
          setShowStockRequestModal(false);
          setSelectedDeal(null);
        }}
        onSubmit={handleStockRequestSubmit}
        submitting={stockRequestSubmitting}
      />
    </div>
  );
}
