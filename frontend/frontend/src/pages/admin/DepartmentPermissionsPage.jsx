import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/admin/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import { PAGE_ACCESS_OPTIONS } from "../../constants/pageAccess";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import {
  getDepartmentPermissions,
  saveDepartmentPermissions,
} from "../../api/pageAccessApi";

function groupByBranch(rows) {
  return rows.reduce((acc, row) => {
    const key = row.branchName || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

export default function DepartmentPermissionsPage() {
  const { showSuccess, showError } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [draftMap, setDraftMap] = useState({});

  const allowedKeys = useMemo(
    () =>
      new Set(
        PAGE_ACCESS_OPTIONS.flatMap((option) => [
          String(option.key || "").trim().toLowerCase(),
          ...(Array.isArray(option.children)
            ? option.children.map((child) => String(child.key || "").trim().toLowerCase())
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
        const data = await getDepartmentPermissions();
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
        if (active) showError(extractApiErrorMessage(e, "Failed to load department permissions"));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [showError]);

  const groupedRows = useMemo(() => groupByBranch(rows), [rows]);

  const toggleKey = (departmentId, key) => {
    const normalized = String(key || "").trim().toLowerCase();
    if (!allowedKeys.has(normalized)) return;
    setDraftMap((current) => {
      const existing = new Set(current[String(departmentId)] || []);
      if (existing.has(normalized)) {
        existing.delete(normalized);
      } else {
        existing.add(normalized);
      }
      return { ...current, [String(departmentId)]: Array.from(existing) };
    });
  };

  const handleSave = async (departmentId) => {
    setSavingId(departmentId);
    try {
      const saved = await saveDepartmentPermissions(departmentId, draftMap[String(departmentId)] || []);
      setDraftMap((current) => ({ ...current, [String(departmentId)]: saved }));
      showSuccess("Department permissions saved");
      window.dispatchEvent(new Event("page-access:refresh"));
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save department permissions"));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Department Permissions"
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Settings", path: "" },
          { label: "Department Permissions", path: "" },
        ]}
      />
      {loading ? (
        <PageLoader />
      ) : (
        <div className="row g-3">
          {Object.entries(groupedRows).map(([branchName, departments]) => (
            <div className="col-12" key={branchName}>
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">{branchName}</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {departments.map((department) => (
                      <div className="col-xl-6" key={department.id}>
                        <div className="border rounded-3 p-3 h-100 bg-light bg-opacity-25">
                          <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                            <div>
                              <h6 className="mb-1">{department.name}</h6>
                              <div className="text-muted small">MANAGER access scope</div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSave(department.id)}
                              disabled={savingId === department.id}
                            >
                              {savingId === department.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                          <div className="d-flex flex-column gap-2">
                            {PAGE_ACCESS_OPTIONS.map((option) => (
                              <label className="form-check d-flex gap-2" key={`${department.id}-${option.key}`}>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={(draftMap[String(department.id)] || []).includes(option.key)}
                                  onChange={() => toggleKey(department.id, option.key)}
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
