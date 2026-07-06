import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/admin/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import { PAGE_ACCESS_OPTIONS, getEquivalentPageKeys, hasEquivalentPageKey } from "../../constants/pageAccess";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import {
  getDesignationPermissions,
  saveDesignationPermissions,
} from "../../api/pageAccessApi";

function groupByDepartment(rows) {
  return rows.reduce((acc, row) => {
    const key = row.departmentName || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

const ROLE_OPTIONS = ["TEAM_LEAD", "EMPLOYEE"];

export default function DesignationPermissionsPage() {
  const { showSuccess, showError } = useToast();
  const [role, setRole] = useState("TEAM_LEAD");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [draftMap, setDraftMap] = useState({});

  const allowedKeys = useMemo(
    () =>
      new Set(
        PAGE_ACCESS_OPTIONS.flatMap((option) => [
          ...getEquivalentPageKeys(option.key),
          ...(Array.isArray(option.children)
            ? option.children.flatMap((child) => getEquivalentPageKeys(child.key))
            : []),
        ]).filter(Boolean),
      ),
    [],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getDesignationPermissions(role);
        if (!active) return;
        const safeRows = Array.isArray(data) ? data : [];
        setRows(safeRows);
        setDraftMap(
          Object.fromEntries(
            safeRows.map((row) => [
              String(row.id),
              Array.isArray(row.pageKeys)
                ? row.pageKeys.map((key) => String(key || "").trim().toLowerCase()).filter(Boolean)
                : [],
            ]),
          ),
        );
      } catch (e) {
        if (active) showError(extractApiErrorMessage(e, "Failed to load designation permissions"));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [role, showError]);

  const groupedRows = useMemo(() => groupByDepartment(rows), [rows]);

  const toggleKey = (designationId, key) => {
    const normalized = String(key || "").trim().toLowerCase();
    if (!allowedKeys.has(normalized)) return;
    setDraftMap((current) => {
      const existing = new Set(current[String(designationId)] || []);
      const equivalents = getEquivalentPageKeys(normalized);
      const hasSelected = equivalents.some((equivalent) => existing.has(equivalent));
      if (hasSelected) {
        equivalents.forEach((equivalent) => existing.delete(equivalent));
      } else {
        equivalents.forEach((equivalent) => existing.add(equivalent));
      }
      return { ...current, [String(designationId)]: Array.from(existing) };
    });
  };

  const handleSave = async (designationId) => {
    setSavingId(designationId);
    try {
      const saved = await saveDesignationPermissions(
        designationId,
        role,
        draftMap[String(designationId)] || [],
      );
      setDraftMap((current) => ({ ...current, [String(designationId)]: saved }));
      showSuccess("Designation permissions saved");
      window.dispatchEvent(new Event("page-access:refresh"));
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save designation permissions"));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Designation Permissions"
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Settings", path: "" },
          { label: "Designation Permissions", path: "" },
        ]}
      />
      <div className="card mb-3">
        <div className="card-body">
          <label className="form-label">Role</label>
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <PageLoader />
      ) : (
        <div className="row g-3">
          {Object.entries(groupedRows).map(([departmentName, designations]) => (
            <div className="col-12" key={departmentName}>
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">{departmentName}</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {designations.map((designation) => (
                      <div className="col-xl-6" key={designation.id}>
                        <div className="border rounded-3 p-3 h-100 bg-light bg-opacity-25">
                          <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                            <div>
                              <h6 className="mb-1">{designation.name}</h6>
                              <div className="text-muted small">{role.replace(/_/g, " ")} access scope</div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSave(designation.id)}
                              disabled={savingId === designation.id}
                            >
                              {savingId === designation.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                          <div className="d-flex flex-column gap-2">
                            {PAGE_ACCESS_OPTIONS.map((option) => (
                              <label className="form-check d-flex gap-2" key={`${designation.id}-${option.key}`}>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={hasEquivalentPageKey(draftMap[String(designation.id)] || [], option.key)}
                                  onChange={() => toggleKey(designation.id, option.key)}
                                />
                                <span className="form-check-label">{option.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
