import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/admin/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import { getUserGroups, updateUserGroup } from "../../api/userGroupApi";
import { PAGE_ACCESS_OPTIONS, getEquivalentPageKeys, hasEquivalentPageKey } from "../../constants/pageAccess";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import "./GroupAccessPage.css";

function groupByCategory(options) {
  return options.reduce((acc, option) => {
    const category = option.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(option);
    return acc;
  }, {});
}

function countSelectedChildren(option, draftPageKeys) {
  if (!option.children?.length) return 0;
  return option.children.filter((child) => hasEquivalentPageKey(draftPageKeys, child.key)).length;
}

function isOptionFullySelected(option, draftPageKeys) {
  if (hasEquivalentPageKey(draftPageKeys, option.key)) return true;
  if (!option.children?.length) return false;
  return option.children.every((child) => hasEquivalentPageKey(draftPageKeys, child.key));
}

function isOptionPartiallySelected(option, draftPageKeys) {
  if (!option.children?.length || isOptionFullySelected(option, draftPageKeys)) return false;
  return option.children.some((child) => hasEquivalentPageKey(draftPageKeys, child.key));
}

function normalizePageKeys(pageKeys, allowedKeys) {
  const allowed = allowedKeys instanceof Set ? allowedKeys : new Set();
  return Array.from(
    new Set(
      (Array.isArray(pageKeys) ? pageKeys : [])
        .map((key) => String(key || "").trim().toLowerCase())
        .filter((key) => key && allowed.has(key)),
    ),
  );
}

const CATEGORY_ORDER = ["Main Menu", "CRM", "Projects", "Recruitment", "HRM", "Finance", "Services", "Reports", "Admin"];

export default function GroupAccessPage() {
  const { showSuccess, showError } = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [draftPageKeys, setDraftPageKeys] = useState([]);
  const [expandedParents, setExpandedParents] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const pageOptionsByCategory = useMemo(
    () => groupByCategory(PAGE_ACCESS_OPTIONS),
    [],
  );
  const allowedPageKeys = useMemo(() => {
    const keys = new Set();
    PAGE_ACCESS_OPTIONS.forEach((option) => {
      getEquivalentPageKeys(option.key).forEach((key) => keys.add(key));
      if (Array.isArray(option.children)) {
        option.children.forEach((child) =>
          getEquivalentPageKeys(child.key).forEach((key) => keys.add(key)),
        );
      }
    });
    return keys;
  }, []);
  const orderedCategoryEntries = useMemo(() => {
    const rank = (name) => {
      const index = CATEGORY_ORDER.indexOf(name);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return Object.entries(pageOptionsByCategory).sort(([a], [b]) => rank(a) - rank(b));
  }, [pageOptionsByCategory]);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === String(selectedGroupId)) || null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await getUserGroups();
        if (!active) return;
        setGroups(Array.isArray(rows) ? rows : []);
        if (rows?.length) {
          const firstId = String(rows[0].id);
          setSelectedGroupId((current) => current || firstId);
        }
      } catch (e) {
        if (active) {
          showError(extractApiErrorMessage(e, "Failed to load group access settings"));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [showError]);

  useEffect(() => {
    const nextPageKeys = normalizePageKeys(selectedGroup?.pageKeys, allowedPageKeys);
    setDraftPageKeys(nextPageKeys);

    const nextExpanded = new Set();
    PAGE_ACCESS_OPTIONS.forEach((option) => {
      if (
        option.children?.length &&
        nextPageKeys.some(
          (pageKey) =>
            pageKey === option.key || option.children.some((child) => child.key === pageKey),
        )
      ) {
        nextExpanded.add(option.key);
      }
    });
    setExpandedParents(nextExpanded);
  }, [selectedGroup, allowedPageKeys]);

  const togglePageKey = (key, children) => {
    setDraftPageKeys((current) => {
      const next = new Set(current);
      const childKeys = Array.isArray(children) ? children.map((child) => child.key) : [];
      const isSelected =
        hasEquivalentPageKey(current, key) ||
        (childKeys.length > 0 && childKeys.every((childKey) => hasEquivalentPageKey(current, childKey)));
      const equivalents = getEquivalentPageKeys(key);

      if (isSelected) {
        equivalents.forEach((equivalent) => next.delete(equivalent));
        childKeys.forEach((childKey) => {
          getEquivalentPageKeys(childKey).forEach((equivalent) => next.delete(equivalent));
        });
        return Array.from(next);
      }

      equivalents.forEach((equivalent) => next.add(equivalent));
      childKeys.forEach((childKey) => {
        getEquivalentPageKeys(childKey).forEach((equivalent) => next.add(equivalent));
      });
      return Array.from(next);
    });

    if (children?.length) {
      setExpandedParents((prev) => new Set([...prev, key]));
    }
  };

  const toggleChildPage = (childKey, parentKey, siblings) => {
    setDraftPageKeys((current) => {
      const next = new Set(current);
      // Parent keys with children should not force all submenu pages.
      // If a child is edited, clear parent and keep explicit child selections only.
      getEquivalentPageKeys(parentKey).forEach((equivalent) => next.delete(equivalent));
      const equivalents = getEquivalentPageKeys(childKey);
      const childSelected = equivalents.some((equivalent) => next.has(equivalent));
      if (childSelected) {
        equivalents.forEach((equivalent) => next.delete(equivalent));
      } else {
        equivalents.forEach((equivalent) => next.add(equivalent));
      }
      const childKeys = Array.isArray(siblings) ? siblings.map((child) => child.key) : [];
      const hasAnyChildSelected = childKeys.some((key) => hasEquivalentPageKey(next, key));
      if (!hasAnyChildSelected) {
        getEquivalentPageKeys(parentKey).forEach((equivalent) => next.delete(equivalent));
      }
      return Array.from(next);
    });
  };

  const toggleParentExpanded = (parentKey) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentKey)) {
        next.delete(parentKey);
      } else {
        next.add(parentKey);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedGroup) return;
    setSaving(true);
    try {
      const sanitizedDraftPageKeys = normalizePageKeys(draftPageKeys, allowedPageKeys);
      const updatedGroup = await updateUserGroup(selectedGroup.id, {
        name: selectedGroup.name,
        institutionName: selectedGroup.institutionName,
        departmentName: selectedGroup.departmentName,
        teamNames: selectedGroup.teamNames,
        pageKeys: sanitizedDraftPageKeys,
        memberScope: selectedGroup.memberScope,
      });
      const nextGroup = {
        ...selectedGroup,
        ...updatedGroup,
        pageKeys: normalizePageKeys(
          updatedGroup?.pageKeys?.length ? updatedGroup.pageKeys : sanitizedDraftPageKeys,
          allowedPageKeys,
        ),
      };
      setGroups((current) =>
        current.map((group) =>
          String(group.id) === String(selectedGroup.id) ? nextGroup : group,
        ),
      );
      setDraftPageKeys(nextGroup.pageKeys);
      window.dispatchEvent(new Event("page-access:refresh"));
      showSuccess("Group page access updated");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update group access"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Group Access" />

      {loading ? (
        <PageLoader />
      ) : (
        <div className="row g-3 align-items-start">
          <div className="col-xl-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Groups</h5>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {groups.length === 0 ? (
                    <div className="p-3 text-muted">No groups found.</div>
                  ) : (
                    groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        className={`list-group-item list-group-item-action text-start px-3 py-3 ${
                          String(group.id) === String(selectedGroupId) ? "active" : ""
                        }`}
                        onClick={() => setSelectedGroupId(String(group.id))}
                      >
                        <div className="fw-semibold">{group.name || "-"}</div>
                        <div className="small opacity-75 mt-1">
                          {group.departmentName || "No department"} | {group.members ?? 0} members
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-8">
            <div className="card">
              <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <h5 className="mb-0">Page Visibility</h5>
                  <div className="text-muted small mt-1">
                    {selectedGroup
                      ? `${selectedGroup.name} can open only the pages checked below`
                      : "Select a group to manage access"}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!selectedGroup || saving}
                >
                  {saving ? "Saving..." : "Save Access"}
                </button>
              </div>
              <div className="card-body">
                {!selectedGroup ? (
                  <div className="text-muted">Select a group from the left to edit access.</div>
                ) : (
                  <>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge bg-light text-dark border">
                        {draftPageKeys.length} pages selected
                      </span>
                      <span className="badge bg-light text-dark border">
                        {Object.keys(pageOptionsByCategory).length} sections
                      </span>
                    </div>

                    <div className="group-access-masonry">
                      {orderedCategoryEntries.map(([category, options]) => (
                        <div className="group-access-masonry-item" key={category}>
                          <div className="border rounded-3 p-3 bg-light bg-opacity-25">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h6 className="mb-0">{category}</h6>
                              <span className="badge bg-white text-dark border">
                                {options.length}
                              </span>
                            </div>

                            {options.map((option) => (
                              <div
                                key={option.key}
                                className="border rounded-3 bg-white px-3 py-2 mb-2 shadow-sm"
                              >
                                <div className="d-flex align-items-start justify-content-between gap-2">
                                  <div className="form-check mb-0 flex-grow-1">
                                    <input
                                      id={`group-${selectedGroup.id}-${option.key}`}
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={isOptionFullySelected(option, draftPageKeys)}
                                      aria-checked={
                                        isOptionPartiallySelected(option, draftPageKeys)
                                          ? "mixed"
                                          : isOptionFullySelected(option, draftPageKeys)
                                      }
                                      onChange={() => togglePageKey(option.key, option.children)}
                                    />
                                    <label
                                      className="form-check-label d-flex flex-column"
                                      htmlFor={`group-${selectedGroup.id}-${option.key}`}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <span className="fw-semibold text-dark">{option.label}</span>
                                      {option.children?.length > 0 && (
                                        <span className="small text-muted">
                                          {countSelectedChildren(option, draftPageKeys)}/
                                          {option.children.length} sub-pages selected
                                        </span>
                                      )}
                                    </label>
                                  </div>

                                  {option.children?.length > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1"
                                      onClick={() => toggleParentExpanded(option.key)}
                                      aria-label={
                                        expandedParents.has(option.key)
                                          ? `Collapse ${option.label}`
                                          : `Expand ${option.label}`
                                      }
                                    >
                                      {expandedParents.has(option.key) ? "Hide" : "Show"}
                                    </button>
                                  )}
                                </div>

                                {option.children?.length > 0 && expandedParents.has(option.key) && (
                                  <div className="mt-3 ms-1 ps-3 border-start">
                                    {option.children.map((child) => (
                                      <div
                                        className="form-check mb-2 rounded-3 px-2 py-1 bg-light"
                                        key={child.key}
                                      >
                                        <input
                                          id={`group-${selectedGroup.id}-${child.key}`}
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={hasEquivalentPageKey(draftPageKeys, child.key)}
                                          onChange={() =>
                                            toggleChildPage(child.key, option.key, option.children)
                                          }
                                        />
                                        <label
                                          className="form-check-label"
                                          htmlFor={`group-${selectedGroup.id}-${child.key}`}
                                          style={{ cursor: "pointer", fontSize: "0.9rem" }}
                                        >
                                          {child.label}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
