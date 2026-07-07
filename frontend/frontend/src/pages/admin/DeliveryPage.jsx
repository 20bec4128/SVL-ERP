import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDeliveryRequests, markDelivered } from "../../api/dealsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

function formatDate(value) {
  if (!value) return "-";
  try { return new Date(value).toLocaleDateString(); } catch { return String(value); }
}

export default function DeliveryPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const role = String(user?.role || "").toUpperCase();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [markingId, setMarkingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryRequests();
      setDeals(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load delivery requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user !== undefined) load();
  }, [user]);

  const handleMarkDelivered = async (dealId) => {
    try {
      setMarkingId(dealId);
      await markDelivered(dealId);
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: "Delivered" } : d));
      showSuccess("Order marked as Delivered!");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to mark as delivered"));
    } finally {
      setMarkingId(null);
    }
  };

  const filteredDeals = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return deals;
    return deals.filter(d =>
      String(d.name || "").toLowerCase().includes(search) ||
      String(d.projectName || "").toLowerCase().includes(search) ||
      String(d.requirementType || "").toLowerCase().includes(search) ||
      String(d.status || "").toLowerCase().includes(search)
    );
  }, [deals, searchText]);

  const canMark = role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER";

  return (
    <div className="container-fluid content">
      {/* Header */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
              <i className="ti ti-truck me-2 text-primary"></i>Delivery
            </h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" className="text-decoration-none text-muted">
                    <i className="ti ti-smart-home" />
                  </a>
                </li>
                <li className="breadcrumb-item text-muted">CRM</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">Delivery</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card table-list-card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <div className="leads-controls-bar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex align-items-center gap-2 p-1 border" style={{ borderRadius: 12, backgroundColor: "#f8fafc", width: "100%", maxWidth: 350 }}>
              <i className="ti ti-search text-muted ms-2" style={{ fontSize: "1.1rem" }} />
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search delivery orders..."
                style={{ height: 36, fontSize: "0.9rem" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
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

          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="ti ti-truck-off display-4 d-block mb-3 text-muted opacity-50"></i>
              No delivery orders found.
            </div>
          ) : (
            <div className="table-responsive leads-table-wrap border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <table className="table table-hover align-middle leads-table mb-0">
                <thead>
                  <tr>
                    <th className="text-muted" style={{ width: 60, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Customer</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Project</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Requirement Type</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Requirement Notes</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Date</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Status</th>
                    {canMark && <th className="text-muted text-end" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal, idx) => {
                    const isDelivered = deal.status === "Delivered";
                    return (
                      <tr key={deal.id}>
                        <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{idx + 1}</td>
                        <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>
                          {deal.name || "-"}
                          {deal.mobile && <div className="text-muted small">{deal.mobile}</div>}
                        </td>
                        <td style={{ color: "#475569", fontSize: "0.9rem" }}>{deal.projectName || deal.name || "-"}</td>
                        <td style={{ color: "#475569", fontSize: "0.9rem" }}>{deal.requirementType || "-"}</td>
                        <td style={{ color: "#475569", fontSize: "0.9rem", maxWidth: 200 }}>
                          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {deal.requirementNotes || "-"}
                          </div>
                        </td>
                        <td style={{ color: "#475569", fontSize: "0.9rem" }}>{formatDate(deal.convertedAt)}</td>
                        <td>
                          <span className={`badge ${isDelivered ? "bg-success" : "bg-primary"}`} style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: 8 }}>
                            {isDelivered ? "✓ Delivered" : "Ready for Delivery"}
                          </span>
                        </td>
                        {canMark && (
                          <td className="text-end">
                            {!isDelivered ? (
                              <button
                                className="btn btn-sm btn-success"
                                style={{ borderRadius: 8, fontWeight: "600" }}
                                onClick={() => handleMarkDelivered(deal.id)}
                                disabled={markingId === deal.id}
                              >
                                {markingId === deal.id
                                  ? <span className="spinner-border spinner-border-sm me-1" />
                                  : <i className="ti ti-circle-check me-1"></i>}
                                Mark Delivered
                              </button>
                            ) : (
                              <span className="text-success fw-semibold small">
                                <i className="ti ti-check me-1"></i>Done
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
