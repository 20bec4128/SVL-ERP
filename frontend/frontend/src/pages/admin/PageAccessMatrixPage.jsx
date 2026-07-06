import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/admin/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import { PAGE_ACCESS_OPTIONS, getEquivalentPageKeys, hasEquivalentPageKey } from "../../constants/pageAccess";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import {
  getDepartmentPermissions,
  getDesignationPermissions,
  getGlobalPermissions,
  saveDepartmentPermissions,
  saveDesignationPermissions,
  saveGlobalPermissions,
} from "../../api/pageAccessApi";

const ROLE_TABS = [
  { key: "SUPER_ADMIN", label: "Super Admin" },
  { key: "ADMIN", label: "Admin" },
  { key: "MANAGER", label: "Manager" },
  { key: "DESIGNATION", label: "Designation" },
];

const DESIGNATION_ROLE_OPTIONS = [
  { key: "TEAM_LEAD", label: "Team Lead" },
  { key: "EMPLOYEE", label: "Employee" },
];

const HIDDEN_PAGE_ACCESS_CATEGORIES = new Set(["Projects"]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function flattenPageOptions(options = []) {
  const rows = [];
  options.forEach((option) => {
    if (!option) return;
    const category = option.category || "Other";
    if (String(option.key || "").trim()) {
      rows.push({
        key: option.key,
        label: option.label || option.key,
        category,
        indent: false,
      });
    }
    if (Array.isArray(option.children)) {
      option.children.forEach((child) => {
        if (!child || !String(child.key || "").trim()) return;
        rows.push({
          key: child.key,
          label: child.label || child.key,
          category,
          indent: true,
        });
      });
    }
  });
  return rows;
}

function groupByCategory(rows = []) {
  return rows.reduce((acc, row) => {
    const category = row.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(row);
    return acc;
  }, {});
}

function buildBranchOptions(rows = []) {
  const seen = new Map();
  rows.forEach((row) => {
    if (!row?.branchId) return;
    const key = String(row.branchId);
    if (!seen.has(key)) {
      seen.set(key, {
        id: key,
        name: row.branchName || "Unassigned",
      });
    }
  });
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildDepartmentsByBranch(rows = []) {
  return rows.reduce((acc, row) => {
    const branchId = String(row?.branchId || "");
    if (!branchId) return acc;
    if (!acc[branchId]) acc[branchId] = [];
    acc[branchId].push(row);
    return acc;
  }, {});
}

function buildDesignationTree(rows = [], departmentMap = new Map()) {
  return rows.reduce((acc, row) => {
    const departmentId = String(row?.departmentId || "");
    const department = departmentMap.get(departmentId);
    const branchId = String(department?.branchId || "");
    if (!branchId || !departmentId) return acc;
    if (!acc[branchId]) acc[branchId] = {};
    if (!acc[branchId][departmentId]) {
      acc[branchId][departmentId] = {
        departmentName: row.departmentName || department?.name || "Unassigned",
        designations: [],
      };
    }
    acc[branchId][departmentId].designations.push(row);
    return acc;
  }, {});
}

function selectFirstDesignation(tree = {}, branchId = "") {
  const branch = tree[String(branchId)] || {};
  const departmentIds = Object.keys(branch);
  if (!departmentIds.length) return { departmentId: "", designationId: "" };
  const departmentId = departmentIds[0];
  const designationId = branch[departmentId]?.designations?.[0]?.id || "";
  return {
    departmentId: String(departmentId),
    designationId: designationId ? String(designationId) : "",
  };
}

export default function PageAccessMatrixPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("SUPER_ADMIN");
  const [globalInitials, setGlobalInitials] = useState({ SUPER_ADMIN: [], ADMIN: [] });
  const [globalDrafts, setGlobalDrafts] = useState({ SUPER_ADMIN: [], ADMIN: [] });
  const [departmentRows, setDepartmentRows] = useState([]);
  const [departmentInitials, setDepartmentInitials] = useState({});
  const [departmentDrafts, setDepartmentDrafts] = useState({});
  const [designationRowsByRole, setDesignationRowsByRole] = useState({
    TEAM_LEAD: [],
    EMPLOYEE: [],
  });
  const [designationInitialsByRole, setDesignationInitialsByRole] = useState({
    TEAM_LEAD: {},
    EMPLOYEE: {},
  });
  const [designationDraftsByRole, setDesignationDraftsByRole] = useState({
    TEAM_LEAD: {},
    EMPLOYEE: {},
  });
  const [managerBranchId, setManagerBranchId] = useState("");
  const [managerDepartmentId, setManagerDepartmentId] = useState("");
  const [designationRole, setDesignationRole] = useState("TEAM_LEAD");
  const [designationBranchId, setDesignationBranchId] = useState("");
  const [designationDepartmentId, setDesignationDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");

  const flatPageOptions = useMemo(() => flattenPageOptions(PAGE_ACCESS_OPTIONS), []);
  const groupedPageOptions = useMemo(() => groupByCategory(flatPageOptions), [flatPageOptions]);
  const allowedKeys = useMemo(() => {
    const keys = new Set();
    flatPageOptions.forEach((row) => {
      getEquivalentPageKeys(row.key).forEach((key) => keys.add(key));
    });
    return keys;
  }, [flatPageOptions]);

  const departmentMap = useMemo(
    () =>
      new Map(
        departmentRows
          .filter((row) => row?.id != null)
          .map((row) => [String(row.id), row]),
      ),
    [departmentRows],
  );

  const branchOptions = useMemo(() => buildBranchOptions(departmentRows), [departmentRows]);
  const departmentsByBranch = useMemo(() => buildDepartmentsByBranch(departmentRows), [departmentRows]);
  const designationTreeByRole = useMemo(
    () => ({
      TEAM_LEAD: buildDesignationTree(designationRowsByRole.TEAM_LEAD, departmentMap),
      EMPLOYEE: buildDesignationTree(designationRowsByRole.EMPLOYEE, departmentMap),
    }),
    [designationRowsByRole, departmentMap],
  );

  const managerDepartmentOptions = useMemo(
    () =>
      (departmentsByBranch[String(managerBranchId)] || [])
        .slice()
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [departmentsByBranch, managerBranchId],
  );

  const designationBranchOptions = useMemo(
    () => {
      const tree = designationTreeByRole[designationRole] || {};
      return branchOptions.filter((branch) => tree[String(branch.id)]);
    },
    [branchOptions, designationRole, designationTreeByRole],
  );

  const designationDepartmentOptions = useMemo(() => {
    const tree = designationTreeByRole[designationRole] || {};
    const branchTree = tree[String(designationBranchId)] || {};
    return Object.entries(branchTree)
      .map(([id, entry]) => ({
        id: String(id),
        name: entry.departmentName || "Unassigned",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [designationBranchId, designationRole, designationTreeByRole]);

  const designationOptions = useMemo(() => {
    const tree = designationTreeByRole[designationRole] || {};
    const branchTree = tree[String(designationBranchId)] || {};
    const department = branchTree[String(designationDepartmentId)];
    return (department?.designations || [])
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [designationBranchId, designationDepartmentId, designationRole, designationTreeByRole]);

  const currentKeys = useMemo(() => {
    if (activeTab === "SUPER_ADMIN" || activeTab === "ADMIN") {
      return globalDrafts[activeTab] || [];
    }
    if (activeTab === "MANAGER") {
      return departmentDrafts[String(managerDepartmentId)] || [];
    }
    return designationDraftsByRole[designationRole]?.[String(designationId)] || [];
  }, [
    activeTab,
    designationDraftsByRole,
    designationId,
    designationRole,
    departmentDrafts,
    globalDrafts,
    managerDepartmentId,
  ]);

  const load = async () => {
    setLoading(true);
    try {
      const safe = async (promiseFactory, fallback) => {
        try {
          return await promiseFactory();
        } catch {
          return fallback;
        }
      };

      const [
        superAdminKeys,
        adminKeys,
        departmentPermissionRows,
        teamLeadDesignationRows,
        employeeDesignationRows,
      ] = await Promise.all([
        safe(() => getGlobalPermissions("SUPER_ADMIN"), []),
        safe(() => getGlobalPermissions("ADMIN"), []),
        safe(() => getDepartmentPermissions(), []),
        safe(() => getDesignationPermissions("TEAM_LEAD"), []),
        safe(() => getDesignationPermissions("EMPLOYEE"), []),
      ]);

      const normalizedDepartmentRows = Array.isArray(departmentPermissionRows) ? departmentPermissionRows : [];
      const nextDepartmentInitials = Object.fromEntries(
        normalizedDepartmentRows.map((row) => [
          String(row.id),
          Array.isArray(row.pageKeys) ? row.pageKeys : [],
        ]),
      );

      const nextTeamLeadDesignations = Array.isArray(teamLeadDesignationRows) ? teamLeadDesignationRows : [];
      const nextEmployeeDesignations = Array.isArray(employeeDesignationRows) ? employeeDesignationRows : [];
      const nextTeamLeadInitials = Object.fromEntries(
        nextTeamLeadDesignations.map((row) => [String(row.id), Array.isArray(row.pageKeys) ? row.pageKeys : []]),
      );
      const nextEmployeeInitials = Object.fromEntries(
        nextEmployeeDesignations.map((row) => [String(row.id), Array.isArray(row.pageKeys) ? row.pageKeys : []]),
      );

      setGlobalInitials({
        SUPER_ADMIN: Array.isArray(superAdminKeys) ? superAdminKeys : [],
        ADMIN: Array.isArray(adminKeys) ? adminKeys : [],
      });
      setGlobalDrafts({
        SUPER_ADMIN: Array.isArray(superAdminKeys) ? superAdminKeys : [],
        ADMIN: Array.isArray(adminKeys) ? adminKeys : [],
      });
      setDepartmentRows(normalizedDepartmentRows);
      setDepartmentInitials(nextDepartmentInitials);
      setDepartmentDrafts(nextDepartmentInitials);
      setDesignationRowsByRole({
        TEAM_LEAD: nextTeamLeadDesignations,
        EMPLOYEE: nextEmployeeDesignations,
      });
      setDesignationInitialsByRole({
        TEAM_LEAD: nextTeamLeadInitials,
        EMPLOYEE: nextEmployeeInitials,
      });
      setDesignationDraftsByRole({
        TEAM_LEAD: nextTeamLeadInitials,
        EMPLOYEE: nextEmployeeInitials,
      });

      if (normalizedDepartmentRows.length > 0) {
        const firstBranchId = String(normalizedDepartmentRows[0].branchId || "");
        const firstDepartment =
          (normalizedDepartmentRows
            .filter((row) => String(row.branchId || "") === firstBranchId)
            .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))[0]) || null;
        setManagerBranchId(firstBranchId);
        setManagerDepartmentId(firstDepartment ? String(firstDepartment.id) : "");
      }

      const nextDesignationBranchOptions = branchOptions.length
        ? branchOptions
        : buildBranchOptions(normalizedDepartmentRows);
      const selectedTree = buildDesignationTree(nextTeamLeadDesignations, departmentMap.size ? departmentMap : new Map(normalizedDepartmentRows.map((row) => [String(row.id), row])));
      const firstDesignationBranch = nextDesignationBranchOptions.find((branch) => selectedTree[String(branch.id)]);
      if (firstDesignationBranch) {
        setDesignationRole("TEAM_LEAD");
        setDesignationBranchId(String(firstDesignationBranch.id));
        const picked = selectFirstDesignation(selectedTree, String(firstDesignationBranch.id));
        setDesignationDepartmentId(picked.departmentId);
        setDesignationId(picked.designationId);
      } else {
        setDesignationRole("TEAM_LEAD");
        setDesignationBranchId("");
        setDesignationDepartmentId("");
        setDesignationId("");
      }
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load page access data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!branchOptions.length) return;
    if (!managerBranchId || !branchOptions.some((branch) => String(branch.id) === String(managerBranchId))) {
      setManagerBranchId(String(branchOptions[0].id));
    }
  }, [branchOptions, managerBranchId]);

  useEffect(() => {
    if (!managerBranchId) return;
    if (!managerDepartmentOptions.length) {
      setManagerDepartmentId("");
      return;
    }
    if (!managerDepartmentOptions.some((dept) => String(dept.id) === String(managerDepartmentId))) {
      setManagerDepartmentId(String(managerDepartmentOptions[0].id));
    }
  }, [managerBranchId, managerDepartmentId, managerDepartmentOptions]);

  useEffect(() => {
    if (!designationBranchOptions.length) {
      setDesignationBranchId("");
      setDesignationDepartmentId("");
      setDesignationId("");
      return;
    }
    if (!designationBranchOptions.some((branch) => String(branch.id) === String(designationBranchId))) {
      setDesignationBranchId(String(designationBranchOptions[0].id));
      return;
    }
    if (!designationDepartmentOptions.length) {
      setDesignationDepartmentId("");
      setDesignationId("");
      return;
    }
    if (!designationDepartmentOptions.some((dept) => String(dept.id) === String(designationDepartmentId))) {
      setDesignationDepartmentId(String(designationDepartmentOptions[0].id));
      return;
    }
    if (!designationOptions.length) {
      setDesignationId("");
      return;
    }
    if (!designationOptions.some((designation) => String(designation.id) === String(designationId))) {
      setDesignationId(String(designationOptions[0].id));
    }
  }, [
    designationBranchId,
    designationBranchOptions,
    designationDepartmentId,
    designationDepartmentOptions,
    designationId,
    designationOptions,
    designationRole,
  ]);

  useEffect(() => {
    if (!designationRowsByRole[designationRole] || !designationRowsByRole[designationRole].length) {
      return;
    }
    if (!designationBranchOptions.length) return;
    if (!designationBranchOptions.some((branch) => String(branch.id) === String(designationBranchId))) {
      setDesignationBranchId(String(designationBranchOptions[0].id));
    }
  }, [designationBranchId, designationBranchOptions, designationRole, designationRowsByRole]);

  const setDraftKeysForActiveScope = (nextKeys) => {
    if (activeTab === "SUPER_ADMIN" || activeTab === "ADMIN") {
      setGlobalDrafts((prev) => ({ ...prev, [activeTab]: nextKeys }));
      return;
    }
    if (activeTab === "MANAGER") {
      setDepartmentDrafts((prev) => ({ ...prev, [String(managerDepartmentId)]: nextKeys }));
      return;
    }
    setDesignationDraftsByRole((prev) => ({
      ...prev,
      [designationRole]: {
        ...(prev[designationRole] || {}),
        [String(designationId)]: nextKeys,
      },
    }));
  };

  const handleToggleKey = (pageKey) => {
    const normalized = normalize(pageKey);
    if (!allowedKeys.has(normalized)) return;
    const current = new Set(currentKeys.map((key) => normalize(key)));
    const equivalents = getEquivalentPageKeys(normalized);
    const isSelected = equivalents.some((equivalent) => current.has(equivalent));
    if (isSelected) {
      equivalents.forEach((equivalent) => current.delete(equivalent));
    } else {
      equivalents.forEach((equivalent) => current.add(equivalent));
    }
    setDraftKeysForActiveScope(Array.from(current));
  };

  const handleClearRow = (pageKey) => {
    const normalized = normalize(pageKey);
    if (!allowedKeys.has(normalized)) return;
    const equivalents = new Set(getEquivalentPageKeys(normalized));
    const withoutKey = currentKeys.filter((key) => !equivalents.has(normalize(key)));
    setDraftKeysForActiveScope(withoutKey);
  };

  const handleEnableSection = (items = []) => {
    const current = new Set(currentKeys.map((key) => normalize(key)));
    items.forEach((item) => {
      const normalized = normalize(item?.key);
      if (!normalized || !allowedKeys.has(normalized)) return;
      getEquivalentPageKeys(normalized).forEach((key) => current.add(key));
    });
    setDraftKeysForActiveScope(Array.from(current));
  };

  const handleClearSection = (items = []) => {
    const keysToRemove = new Set();
    items.forEach((item) => {
      const normalized = normalize(item?.key);
      if (!normalized || !allowedKeys.has(normalized)) return;
      getEquivalentPageKeys(normalized).forEach((key) => keysToRemove.add(key));
    });
    const withoutKeys = currentKeys.filter((key) => !keysToRemove.has(normalize(key)));
    setDraftKeysForActiveScope(withoutKeys);
  };

  const handleReset = () => {
    if (activeTab === "SUPER_ADMIN" || activeTab === "ADMIN") {
      setGlobalDrafts((prev) => ({ ...prev, [activeTab]: globalInitials[activeTab] || [] }));
      return;
    }
    if (activeTab === "MANAGER") {
      setDepartmentDrafts((prev) => ({
        ...prev,
        [String(managerDepartmentId)]: departmentInitials[String(managerDepartmentId)] || [],
      }));
      return;
    }
    setDesignationDraftsByRole((prev) => ({
      ...prev,
      [designationRole]: {
        ...(prev[designationRole] || {}),
        [String(designationId)]: designationInitialsByRole[designationRole]?.[String(designationId)] || [],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "SUPER_ADMIN" || activeTab === "ADMIN") {
        const saved = await saveGlobalPermissions(activeTab, globalDrafts[activeTab] || []);
        setGlobalInitials((prev) => ({ ...prev, [activeTab]: saved }));
        setGlobalDrafts((prev) => ({ ...prev, [activeTab]: saved }));
      } else if (activeTab === "MANAGER") {
        if (!managerDepartmentId) {
          throw new Error("Select a department first");
        }
        const saved = await saveDepartmentPermissions(managerDepartmentId, departmentDrafts[String(managerDepartmentId)] || []);
        setDepartmentInitials((prev) => ({ ...prev, [String(managerDepartmentId)]: saved }));
        setDepartmentDrafts((prev) => ({ ...prev, [String(managerDepartmentId)]: saved }));
      } else {
        if (!designationId) {
          throw new Error("Select a designation first");
        }
        const saved = await saveDesignationPermissions(
          designationId,
          designationRole,
          designationDraftsByRole[designationRole]?.[String(designationId)] || [],
        );
        setDesignationInitialsByRole((prev) => ({
          ...prev,
          [designationRole]: {
            ...(prev[designationRole] || {}),
            [String(designationId)]: saved,
          },
        }));
        setDesignationDraftsByRole((prev) => ({
          ...prev,
          [designationRole]: {
            ...(prev[designationRole] || {}),
            [String(designationId)]: saved,
          },
        }));
      }
      showSuccess("Page access saved");
      window.dispatchEvent(new Event("page-access:refresh"));
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save page access"));
    } finally {
      setSaving(false);
    }
  };

  const pageRows = useMemo(() => {
    return Object.entries(groupedPageOptions)
      .filter(([category]) => !HIDDEN_PAGE_ACCESS_CATEGORIES.has(category))
      .map(([category, items]) => ({
        category,
        items,
      }));
  }, [groupedPageOptions]);
  const visiblePageItems = useMemo(
    () => pageRows.flatMap((section) => section.items),
    [pageRows],
  );
  const countVisibleEnabledRows = (pageKeys = []) =>
    visiblePageItems.reduce(
      (count, item) => count + (hasEquivalentPageKey(pageKeys, item.key) ? 1 : 0),
      0,
    );
  const activeVisibleCount = useMemo(() => {
    return countVisibleEnabledRows(currentKeys);
  }, [currentKeys, visiblePageItems]);

  const renderScopeSelector = () => {
    if (activeTab === "SUPER_ADMIN" || activeTab === "ADMIN") {
      return (
        <div className="alert alert-light border mb-3">
          <strong>{ROLE_TABS.find((tab) => tab.key === activeTab)?.label}</strong>
          <div className="text-muted small mt-1">Global permissions apply to the full system for this role.</div>
        </div>
      );
    }

    if (activeTab === "MANAGER") {
      return (
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Branch</label>
                <select
                  className="form-select"
                  value={managerBranchId}
                  onChange={(e) => {
                    setManagerBranchId(e.target.value);
                  }}
                >
                  <option value="">Select branch</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">User Department</label>
                <select
                  className="form-select"
                  value={managerDepartmentId}
                  onChange={(e) => setManagerDepartmentId(e.target.value)}
                  disabled={!managerBranchId}
                >
                  <option value="">{managerBranchId ? "Select user department" : "Select branch first"}</option>
                  {managerDepartmentOptions.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={designationRole}
                onChange={(e) => setDesignationRole(e.target.value)}
              >
                {DESIGNATION_ROLE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Branch</label>
              <select
                className="form-select"
                value={designationBranchId}
                onChange={(e) => setDesignationBranchId(e.target.value)}
                disabled={!designationBranchOptions.length}
              >
                <option value="">Select branch</option>
                {designationBranchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">User Department</label>
              <select
                className="form-select"
                value={designationDepartmentId}
                onChange={(e) => setDesignationDepartmentId(e.target.value)}
                disabled={!designationBranchId}
              >
                <option value="">{designationBranchId ? "Select user department" : "Select branch first"}</option>
                {designationDepartmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">User Designation</label>
              <select
                className="form-select"
                value={designationId}
                onChange={(e) => setDesignationId(e.target.value)}
                disabled={!designationDepartmentId}
              >
                <option value="">{designationDepartmentId ? "Select user designation" : "Select user department first"}</option>
                {designationOptions.map((designation) => (
                  <option key={designation.id} value={designation.id}>
                    {designation.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentScopeLabel = useMemo(() => {
    if (activeTab === "SUPER_ADMIN" || activeTab === "ADMIN") {
      return ROLE_TABS.find((tab) => tab.key === activeTab)?.label || activeTab;
    }
    if (activeTab === "MANAGER") {
      const branch = branchOptions.find((item) => String(item.id) === String(managerBranchId));
      const department = managerDepartmentOptions.find((item) => String(item.id) === String(managerDepartmentId));
      return [branch?.name, department?.name].filter(Boolean).join(" / ") || "Select branch and user department";
    }
    const branch = designationBranchOptions.find((item) => String(item.id) === String(designationBranchId));
    const department = designationDepartmentOptions.find((item) => String(item.id) === String(designationDepartmentId));
    const designation = designationOptions.find((item) => String(item.id) === String(designationId));
    return [designationRole.replace(/_/g, " "), branch?.name, department?.name, designation?.name]
      .filter(Boolean)
      .join(" / ") || "Select branch, user department and user designation";
  }, [
    activeTab,
    branchOptions,
    designationBranchId,
    designationBranchOptions,
    designationDepartmentId,
    designationDepartmentOptions,
    designationId,
    designationOptions,
    designationRole,
    managerBranchId,
    managerDepartmentId,
    managerDepartmentOptions,
  ]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container-fluid">
      <PageHeader
        title="Page Access"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin-dashboard" },
          { label: "Settings" },
          { label: "Page Access" },
        ]}
      />

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h5 className="mb-1">Unified permission matrix</h5>
              <div className="text-muted small">Edit role and scope-specific page access from one screen.</div>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={load} disabled={saving}>
                Reset
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>

          <div className="nav nav-pills flex-wrap gap-2 mb-3">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn ${activeTab === tab.key ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="badge bg-light text-dark ms-2">
                  {tab.key === "SUPER_ADMIN" || tab.key === "ADMIN"
                    ? countVisibleEnabledRows(globalDrafts[tab.key] || [])
                    : tab.key === "MANAGER"
                      ? countVisibleEnabledRows(departmentDrafts[String(managerDepartmentId)] || [])
                      : countVisibleEnabledRows(
                          designationDraftsByRole[designationRole]?.[String(designationId)] || [],
                        )}
                </span>
              </button>
            ))}
          </div>

          {renderScopeSelector()}

          <div className="alert alert-info d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div>
              <strong>Current scope:</strong> {currentScopeLabel}
            </div>
            <div>
              <strong>{activeVisibleCount}</strong> pages enabled
            </div>
          </div>

          <div className="d-flex flex-column gap-5">
            {pageRows.map(({ category, items }) => (
              <section key={category}>
                <div className="mb-2">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <h5 className="mb-0 text-uppercase fw-normal text-secondary">{category}</h5>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-3"
                        onClick={() => handleEnableSection(items)}
                      >
                        Enable
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm px-3"
                        onClick={() => handleClearSection(items)}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr className="border-bottom">
                        <th className="py-2" style={{ minWidth: "320px" }}>Page</th>
                        <th className="text-center py-2" style={{ width: "110px" }}>View</th>
                        <th className="text-center py-2" style={{ width: "110px" }}>Create</th>
                        <th className="text-center py-2" style={{ width: "110px" }}>Edit</th>
                        <th className="text-center py-2" style={{ width: "110px" }}>Delete</th>
                        <th className="text-center py-2" style={{ width: "120px" }}>All</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const checked = hasEquivalentPageKey(currentKeys, item.key);
                        return (
                          <tr key={item.key} className={index === items.length - 1 ? "border-bottom" : ""}>
                            <td className="py-3">
                              <div className={item.indent ? "ps-4" : ""}>
                                <div className="fw-semibold">{item.label}</div>
                                <div className="text-muted small">{item.key}</div>
                              </div>
                            </td>
                            {["View", "Create", "Edit", "Delete"].map((label) => (
                              <td key={`${item.key}-${label}`} className="text-center py-3">
                                <label className="d-inline-flex align-items-center justify-content-center">
                                  <input
                                    className="form-check-input m-0"
                                    type="checkbox"
                                    checked={checked}
                                    aria-label={`${label} ${item.label}`}
                                    onChange={() => handleToggleKey(item.key)}
                                  />
                                </label>
                              </td>
                            ))}
                            <td className="text-center py-3">
                              {checked ? (
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm px-3"
                                  onClick={() => handleClearRow(item.key)}
                                >
                                  Clear
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm px-3"
                                  onClick={() => handleToggleKey(item.key)}
                                >
                                  Enable
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
