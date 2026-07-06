import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDesignRequests, getDealById } from "../../api/dealsApi";
import { getDesignRequirement } from "../../api/designRequirementApi";
import { getUsers } from "../../api/userAdminApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

function pickAssignedUserId(...sources) {
  for (const source of sources) {
    const value =
      source?.assignedTo ??
      source?.designAssignedToUserId ??
      source?.design_assigned_to_user_id ??
      null;
    if (value != null && String(value).trim() !== "") return value;
  }
  return null;
}

function pickAssignedName(...sources) {
  for (const source of sources) {
    const value =
      source?.designAssignedToName ??
      source?.design_assigned_to_name ??
      "";
    if (String(value).trim()) return String(value).trim();
  }
  return "";
}

export default function DesignPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const { showSuccess, showError } = useToast();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userNameMap, setUserNameMap] = useState({});
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
      const data = await getDesignRequests();
      const rows = Array.isArray(data) ? data : [];
      const enrichedRows = await Promise.all(
        rows.map(async (deal) => {
          const sourceLeadId = deal?.sourceLeadId;
          if (!sourceLeadId) return deal;
          try {
            const [dealDetails, designRequirement] = await Promise.all([
              getDealById(deal.id).catch(() => null),
              getDesignRequirement(sourceLeadId).catch(() => null),
            ]);

            const resolvedRequirementType =
              designRequirement?.requirementType ||
              deal?.requirementType ||
              "";

            const resolvedRequirementNotes =
              designRequirement?.designAdditionalNotes ||
              designRequirement?.requirementNotes ||
              deal?.requirementNotes ||
              "";

            // Resolve assigned user name — prefer design requirement's assignedTo, fall back to deal's designAssignedToUserId
            let designAssignedToName = pickAssignedName(designRequirement, dealDetails, deal) || "-";
            const assignedUserId = pickAssignedUserId(designRequirement, dealDetails, deal);
            if (assignedUserId && designAssignedToName === "-") {
              designAssignedToName =
                userNameMap[assignedUserId] ||
                (String(assignedUserId) === String(user?.id) ? "You" : "Assigned");
            }

            return {
              ...deal,
              requirementType: resolvedRequirementType,
              requirementNotes: resolvedRequirementNotes,
              designAssignedToUserId: assignedUserId,
              designAssignedToName,
            };
          } catch {
            return deal;
          }
        }),
      );
      setDeals(enrichedRows);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load design requests"));
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
    if (user === undefined) return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user, userNameMap]);

  const filteredDeals = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return deals;
    return deals.filter((deal) =>
      String(deal.requirementType || "").toLowerCase().includes(search) ||
      String(deal.requirementNotes || "").toLowerCase().includes(search) ||
      String(deal.designAssignedToName || "").toLowerCase().includes(search)
    );
  }, [deals, searchText]);

  return (
    <div className="container-fluid content">
      {/* Header Block */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Design Requests</h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" className="text-decoration-none text-muted">
                    <i className="ti ti-smart-home" />
                  </a>
                </li>
                <li className="breadcrumb-item text-muted">CRM</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">
                  Design
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
                placeholder="Search design requests..."
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
            <div className="text-center p-4">Loading…</div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center p-4 text-muted">
              No design requests found.
            </div>
          ) : (
            <div className="table-responsive leads-table-wrap border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <table className="table table-hover align-middle leads-table mb-0">
                <thead>
                  <tr>
                    <th className="text-muted" style={{ width: 100, fontWeight: "600", fontSize: "0.85rem" }}>#</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Requirement Type</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Requirement Notes</th>
                    <th className="text-muted" style={{ fontWeight: "600", fontSize: "0.85rem" }}>Assigned to</th>
                    <th className="text-muted text-end" style={{ width: 320, fontWeight: "600", fontSize: "0.85rem" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal, idx) => (
                    <tr key={deal.id}>
                      <td className="fw-semibold" style={{ color: "#1e293b", fontSize: "0.9rem" }}>{idx + 1}</td>
                      <td className="fw-semibold" style={{ color: "#0f172a", fontSize: "0.9rem" }}>{deal.requirementType || "-"}</td>
                      <td style={{ color: "#475569", fontSize: "0.9rem" }}>{deal.requirementNotes || "-"}</td>
                      <td style={{ color: "#475569", fontSize: "0.9rem" }}>{deal.designAssignedToName || "-"}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="btn btn-sm btn-outline-success"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => navigate(`/design-work/${deal.id}`)}
                          >
                            <i className="ti ti-play me-1"></i>Start Work
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: 8, fontWeight: "600" }}
                            onClick={() => navigate(`/design-detail/${deal.id}`)}
                          >
                            <i className="ti ti-eye me-1"></i>View Details
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
    </div>
  );
}
