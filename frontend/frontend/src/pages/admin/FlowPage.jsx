import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/admin/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { getFlowGroups, getLeadFlow, updateLeadFlow } from "../../api/flowApi";
import { getUserOrgSelection } from "../../api/orgHierarchyApi";
import { getBranches } from "../../api/branchesApi";
import { useAuth } from "../../context/AuthContext";
import { LEAD_FLOW_STATUSES, DEAL_FLOW_STATUSES } from "../../constants/leadFlowStatuses";
import FlowTabComponent from "../../components/admin/FlowTabComponent";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function findById(rows, id) {
  return rows.find((row) => String(row.id) === String(id));
}

function findByName(rows, name) {
  return rows.find((row) => normalize(row?.name) === normalize(name));
}

export default function FlowPage() {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const canEdit = role === "SUPER_ADMIN" || role === "ADMIN";
  const [loading, setLoading] = useState(true);
  const [initializingScope, setInitializingScope] = useState(true);
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [leadStatuses, setLeadStatuses] = useState(LEAD_FLOW_STATUSES);
  const leadAvailableStatuses = useMemo(
    () => Array.from(new Set([...LEAD_FLOW_STATUSES, ...DEAL_FLOW_STATUSES])),
    [],
  );

  const selectedBranch = useMemo(
    () => findById(branches, selectedBranchId),
    [branches, selectedBranchId],
  );
  const currentScope = useMemo(
    () => ({
      branchId: selectedBranch?.id || null,
      institutionName: selectedBranch?.name || "",
    }),
    [selectedBranch?.id, selectedBranch?.name],
  );
  const scopeKey = useMemo(() => normalize(currentScope.institutionName), [currentScope.institutionName]);

  useEffect(() => {
    let active = true;
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [branchRows, groupRows, orgSelection] = await Promise.all([
          getBranches(),
          getFlowGroups(),
          user?.id ? getUserOrgSelection(user.id) : Promise.resolve(null),
        ]);
        if (!active) return;

        const safeBranches = Array.isArray(branchRows) ? branchRows : [];
        const safeGroups = Array.isArray(groupRows) ? groupRows : [];
        setBranches(safeBranches);
        setGroups(safeGroups);

        const currentInstitutionName =
          orgSelection?.institutionName ||
          user?.institutionName ||
          user?.institution ||
          "";

        const branchMatch =
          findByName(safeBranches, currentInstitutionName) || safeBranches[0] || null;
        setSelectedBranchId(branchMatch?.id ? String(branchMatch.id) : "");
      } catch (err) {
        if (active) {
          console.error("Failed to load flow data:", err);
          setGroups([]);
          setBranches([]);
        }
      } finally {
        if (active) {
          setInitializingScope(false);
          setLoading(false);
        }
      }
    };
    loadInitial();
    return () => {
      active = false;
    };
  }, [user?.id, user?.institution, user?.institutionName]);

  useEffect(() => {
    let active = true;
    const loadFlow = async () => {
      if (initializingScope) return;
      if (canEdit && !selectedBranchId) {
        return;
      }
      try {
        const flow = await getLeadFlow(currentScope);
        if (!active) return;
        if (flow?.statuses && Array.isArray(flow.statuses) && flow.statuses.length > 0) {
          setLeadStatuses(flow.statuses);
        } else {
          setLeadStatuses(LEAD_FLOW_STATUSES);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load scoped flow:", err);
          setLeadStatuses(LEAD_FLOW_STATUSES);
        }
      }
    };
    loadFlow();
    return () => {
      active = false;
    };
  }, [currentScope.institutionName, initializingScope, scopeKey]);

  if (loading) return <PageLoader />;

  return (
    <div className="container-fluid">
      <PageHeader
        title="Flow"
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Settings", path: "" },
          { label: "Flow", path: "" },
        ]}
      />
      <div className="card">
        <div className="card-body">
          {canEdit && (
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Branch</label>
                <select
                  className="form-select"
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                  }}
                  disabled={!branches.length}
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <FlowTabComponent
            key={scopeKey}
            label="Leads Flow"
            defaultStatuses={leadStatuses}
            getFn={() => getLeadFlow(currentScope)}
            updateFn={(payload) => updateLeadFlow(payload, currentScope)}
            canEdit={canEdit}
            groups={groups}
            allAvailableStatuses={leadAvailableStatuses}
            selectedStatuses={leadStatuses}
            hiddenFromTableStatuses={[]}
            hiddenFromSelectedStatuses={[]}
            hiddenFromAddStatuses={[]}
            readOnlyGroupStatuses={[]}
            onStatusAdd={(status) => setLeadStatuses((prev) => [...prev, status])}
            onStatusRemove={(status) => setLeadStatuses((prev) => prev.filter((s) => s !== status))}
          />
        </div>
      </div>
    </div>
  );
}
