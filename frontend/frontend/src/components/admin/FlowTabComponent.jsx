import { useEffect, useMemo, useState } from "react";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { formatStatusLabel } from "../../utils/statusLabels";
import { useToast } from "../../components/system/ToastProvider";
import PageLoader from "../../components/common/PageLoader";

const emptyRule = (status) => ({
  status,
  handledByGroupId: "",
  next: {},
});

const normalizeStatusKey = (status) => {
  const key = String(status || "").trim().toLowerCase();
  if (key === "new") return "new lead";
  if (key === "requirement collected" || key === "requirements collected") return "requirement";
  if (key === "design & production" || key === "design and production") return "design + production";
  if (key === "stock requested") return "stock request";
  return key;
};

export default function FlowTabComponent({
  defaultStatuses,
  getFn,
  updateFn,
  canEdit,
  groups,
  label,
  allAvailableStatuses,
  selectedStatuses,
  onStatusAdd,
  onStatusRemove,
  hiddenFromTableStatuses = [],
  hiddenFromSelectedStatuses = [],
  hiddenFromAddStatuses = [],
  readOnlyGroupStatuses = [],
}) {
  const { showSuccess, showError } = useToast();

  const [rules, setRules] = useState(defaultStatuses.map(emptyRule));
  const [defaultGroupId, setDefaultGroupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusPickerRule, setStatusPickerRule] = useState(null);
  const [groupPickerRule, setGroupPickerRule] = useState(null);

  const groupOptions = useMemo(() => groups.filter((g) => g?.id != null), [groups]);
  const hiddenFromTableSet = useMemo(() => {
    return new Set(
      hiddenFromTableStatuses.map((status) => String(status || "").trim().toLowerCase()).filter(Boolean),
    );
  }, [hiddenFromTableStatuses]);
  const hiddenFromSelectedSet = useMemo(() => {
    return new Set(
      hiddenFromSelectedStatuses.map((status) => String(status || "").trim().toLowerCase()).filter(Boolean),
    );
  }, [hiddenFromSelectedStatuses]);
  const hiddenFromAddSet = useMemo(() => {
    return new Set(
      hiddenFromAddStatuses.map((status) => String(status || "").trim().toLowerCase()).filter(Boolean),
    );
  }, [hiddenFromAddStatuses]);
  const readOnlyGroupSet = useMemo(() => {
    return new Set(
      readOnlyGroupStatuses.map((status) => String(status || "").trim().toLowerCase()).filter(Boolean),
    );
  }, [readOnlyGroupStatuses]);
  const isHiddenFromTable = (status) =>
    hiddenFromTableSet.has(String(status || "").trim().toLowerCase());
  const isHiddenFromSelected = (status) =>
    hiddenFromSelectedSet.has(String(status || "").trim().toLowerCase());
  const isHiddenFromAdd = (status) =>
    hiddenFromAddSet.has(String(status || "").trim().toLowerCase());
  const isReadOnlyGroup = (status) =>
    readOnlyGroupSet.has(String(status || "").trim().toLowerCase());

  const allStatusOptions = useMemo(() => {
    return Array.from(new Set(defaultStatuses));
  }, [defaultStatuses]);

  const handleDefaultGroupChange = (nextGroupId) => {
    setDefaultGroupId(nextGroupId);
  };

  const statusPickerOptions = (currentStatus) =>
    selectedStatuses
      .filter((status) => normalizeStatusKey(status) !== normalizeStatusKey(currentStatus))
      .filter((status) => normalizeStatusKey(status) !== "new lead");

  const resolveSelectedStatus = (status) => {
    const key = normalizeStatusKey(status);
    return selectedStatuses.find((item) => normalizeStatusKey(item) === key) || "";
  };

  const cleanNextMap = (currentStatus, nextMap = {}) => {
    const cleaned = {};
    const currentKey = normalizeStatusKey(currentStatus);
    Object.entries(nextMap || {}).forEach(([rawStatus, groupId]) => {
      const selectedStatus = resolveSelectedStatus(rawStatus);
      const selectedKey = normalizeStatusKey(selectedStatus);
      if (!selectedStatus || !selectedKey || selectedKey === currentKey || selectedKey === "new lead") return;
      cleaned[selectedStatus] = groupId ?? null;
    });
    return cleaned;
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const flow = await getFn();
        if (!active) return;
        const loadedRules = Array.isArray(flow?.rules) ? flow.rules : [];
        const knownGroupIds = new Set(
          groupOptions.map((group) => String(group?.id)).filter(Boolean),
        );
        const knownStatuses = Array.from(
          new Set([
            ...defaultStatuses,
            ...loadedRules.map((r) => String(r?.status || "").trim()).filter(Boolean),
          ]),
        );
        const loadedDefaultGroupId = flow?.defaultGroupId != null && String(flow.defaultGroupId).trim() !== ""
          ? String(flow.defaultGroupId)
          : "";
        const fallbackGroupId = loadedDefaultGroupId
          ? (knownGroupIds.has(loadedDefaultGroupId) ? loadedDefaultGroupId : "")
          : groupOptions.length ? String(groupOptions[0].id) : "";
        setDefaultGroupId(fallbackGroupId);
        const merged = knownStatuses.map((status) => {
          const found = loadedRules.find(
            (r) => String(r?.status || "").trim().toLowerCase() === status.toLowerCase(),
          );
          const loadedGroupId =
            found?.handledByGroupId != null && String(found.handledByGroupId).trim() !== ""
              ? String(found.handledByGroupId)
              : "";
          return {
            ...emptyRule(status),
            ...found,
            status,
            handledByGroupId: loadedGroupId && knownGroupIds.has(loadedGroupId) ? loadedGroupId : "",
            next: cleanNextMap(status, found?.next && typeof found.next === "object" ? found.next : {}),
          };
        });
        setRules(merged);
      } catch (e) {
        if (active) showError(extractApiErrorMessage(e, "Failed to load flow"), { title: label });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRules((prev) => {
      const existingStatuses = new Set(prev.map((r) => r.status));
      const newStatuses = selectedStatuses.filter((s) => !existingStatuses.has(s));

      if (newStatuses.length > 0) {
        const newRules = newStatuses.map((status) => emptyRule(status));
        return [...prev, ...newRules];
      }

      return prev;
    });
  }, [selectedStatuses]);

  const visibleSelectedStatuses = useMemo(
    () => selectedStatuses.filter((status) => !isHiddenFromSelected(status)),
    [selectedStatuses, hiddenFromSelectedSet],
  );

  const filteredRules = useMemo(
    () => rules.filter((r) => selectedStatuses.includes(r.status) && !isHiddenFromTable(r.status)),
    [rules, selectedStatuses, hiddenFromTableSet],
  );

  const buildPayload = (ruleList, dgId) => ({
    defaultGroupId: dgId ? Number(dgId) : null,
    rules: ruleList
      .filter((r) => selectedStatuses.includes(r.status))
      .map((r) => ({
        status: r.status,
        handledByGroupId: r.handledByGroupId ? Number(r.handledByGroupId) : null,
        next: cleanNextMap(r.status, r.next || {}),
      })),
    statuses: selectedStatuses,
  });

  const persist = async (ruleList, successMsg, errMsg) => {
    setSaving(true);
    try {
      await updateFn(buildPayload(ruleList, defaultGroupId));
      showSuccess(successMsg, { title: label });
    } catch (e) {
      const msg = extractApiErrorMessage(e, errMsg);
      showError(msg, { title: label });
    } finally {
      setSaving(false);
    }
  };

  const toggleNextStatus = (status, nextStatus) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.status !== status) return r;
        const next = { ...(r.next || {}) };
        const nextStatusKey = normalizeStatusKey(nextStatus);
        const alreadySelected = Object.keys(next).some((key) => normalizeStatusKey(key) === nextStatusKey);
        if (alreadySelected) {
          Object.keys(next).forEach((key) => {
            if (normalizeStatusKey(key) === nextStatusKey) delete next[key];
          });
        } else {
          next[nextStatus] = null;
        }
        return { ...r, next };
      }),
    );
  };

  const updateNextGroup = (status, nextStatus, groupId) => {
    setRules((prev) =>
      prev.map((r) => {
        // Update the next map on the source status
        if (r.status === status) {
          const next = { ...(r.next || {}) };
          next[nextStatus] = groupId ? Number(groupId) : null;
          return { ...r, next };
        }
        // Auto-fill handledByGroupId on the TARGET status row when a real group is chosen
        if (r.status === nextStatus && groupId) {
          return { ...r, handledByGroupId: String(groupId) };
        }
        return r;
      }),
    );
  };

  const selectedNextStatuses = (rule) =>
    rule?.next && typeof rule.next === "object" ? Object.keys(cleanNextMap(rule.status, rule.next)) : [];

  const isNextStatusSelected = (rule, status) =>
    selectedNextStatuses(rule).some((item) => normalizeStatusKey(item) === normalizeStatusKey(status));

  const handleSave = () => persist(rules, "Flow saved", "Failed to save flow");

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* Status Configuration Section */}
      <div className="mb-5 pb-4 border-bottom">
        <h6 className="mb-3">Configure {label.split(" ")[0]} Statuses</h6>
        <div className="d-flex gap-2 mb-3 align-items-end">
          <div style={{ flex: 1 }}>
            <label className="form-label">Select Status</label>
            <select
              className="form-select"
              id={`status-select-${label}`}
              disabled={!canEdit || selectedStatuses.length === allAvailableStatuses.length}
            >
              <option value="">Choose status...</option>
              {allAvailableStatuses
                .filter((s) => !selectedStatuses.includes(s) && !isHiddenFromAdd(s))
                .map((status) => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const select = document.getElementById(`status-select-${label}`);
              if (select.value && !selectedStatuses.includes(select.value)) {
                onStatusAdd(select.value);
                select.value = "";
              }
            }}
            disabled={!canEdit}
          >
            Add
          </button>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {visibleSelectedStatuses.length > 0 ? (
            visibleSelectedStatuses.map((status) => (
              <span
                key={status}
                className="badge bg-info d-inline-flex align-items-center gap-2"
                style={{ padding: "0.5rem 0.75rem" }}
              >
                {formatStatusLabel(status)}
                {canEdit && (
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => onStatusRemove(status)}
                    title="Remove status"
                  />
                )}
              </span>
            ))
          ) : (
            <p className="text-muted mb-0">No statuses selected</p>
          )}
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Default Group</label>
          <select
            className="form-select"
            value={defaultGroupId}
            onChange={(e) => handleDefaultGroupChange(e.target.value)}
            disabled={!canEdit}
          >
            <option value="">Select Default Group</option>
            {groupOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Status</th>
              <th>Handled By Group</th>
              <th>Allowed Next Status</th>
              <th>Next Group (per status)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => (
              <tr
                key={rule.status}
                style={
                  rule.status === "Design" ? { backgroundColor: "#e7f3ff", borderLeft: "4px solid #0d6efd" } : {}
                }
              >
                <td className="fw-medium">
                  {formatStatusLabel(rule.status)}
                  {rule.status === "Design" && <span className="badge bg-primary ms-2">Design</span>}
                  {rule.status === "Design + Production" && <span className="badge bg-warning ms-2">Locked</span>}
                </td>
                <td>
                  <select
                    className="form-select"
                    value={rule.handledByGroupId || ""}
                    onChange={(e) =>
                      setRules((prev) =>
                        prev.map((r) =>
                          r.status === rule.status ? { ...r, handledByGroupId: e.target.value } : r,
                        ),
                      )
                    }
                    disabled={!canEdit || rule.status === "Design + Production" || isReadOnlyGroup(rule.status)}
                  >
                    <option value="">Select Group</option>
                    {groupOptions.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setStatusPickerRule(rule.status)}
                    disabled={!canEdit}
                  >
                    {selectedNextStatuses(rule).length
                      ? `${selectedNextStatuses(rule).length} selected`
                      : "Select Status"}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setGroupPickerRule(rule.status)}
                    disabled={!canEdit || selectedNextStatuses(rule).length === 0 || isReadOnlyGroup(rule.status)}
                  >
                    {selectedNextStatuses(rule).length ? "Set Next Group" : "No next status"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Picker Modal */}
      {statusPickerRule && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
          style={{ zIndex: 1050 }}
        >
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "720px" }}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Allowed Next Status</h5>
              <button type="button" className="btn-close" onClick={() => setStatusPickerRule(null)} />
            </div>
            <div className="card-body">
              <div className="row g-2">
                {statusPickerOptions(statusPickerRule).map((status) => {
                  const rule = rules.find((r) => r.status === statusPickerRule);
                  return (
                    <div className="col-md-6" key={`${statusPickerRule}-${status}`}>
                      <label className="d-flex align-items-center gap-2 border rounded px-3 py-2 bg-white text-dark">
                        <input
                          type="checkbox"
                          checked={isNextStatusSelected(rule, status)}
                          onChange={() => toggleNextStatus(statusPickerRule, status)}
                        />
                        <span className="fw-medium">{formatStatusLabel(status)}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Picker Modal */}
      {groupPickerRule && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
          style={{ zIndex: 1050 }}
        >
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "720px" }}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Next Group</h5>
              <button type="button" className="btn-close" onClick={() => setGroupPickerRule(null)} />
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                {selectedNextStatuses(rules.find((r) => r.status === groupPickerRule)).map((status) => {
                  const rule = rules.find((r) => r.status === groupPickerRule);
                  return (
                    <div key={`${groupPickerRule}-${status}`} className="d-flex align-items-center gap-3">
                      <div style={{ minWidth: 160 }} className="fw-medium text-dark">
                        {formatStatusLabel(status)}
                      </div>
                      <select
                        className="form-select"
                        value={cleanNextMap(groupPickerRule, rule?.next || {})?.[status] ?? ""}
                        onChange={(e) => updateNextGroup(groupPickerRule, status, e.target.value)}
                      >
                        <option value="">No Group Change</option>
                        {groupOptions.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {selectedNextStatuses(rules.find((r) => r.status === groupPickerRule)).length === 0 && (
                  <div className="text-muted">No next status selected.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-end mt-3">
        <button className="btn btn-primary" onClick={handleSave} disabled={!canEdit || saving}>
          {saving ? "Saving..." : "Save Flow"}
        </button>
      </div>
    </div>
  );
}
