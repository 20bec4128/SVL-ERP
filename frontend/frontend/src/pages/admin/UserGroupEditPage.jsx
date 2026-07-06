import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  addGroupMember,
  deleteUserGroup,
  getAssignableUsersForGroup,
  getGroupMembers,
  getUserGroups,
  removeGroupMember,
  updateUserGroup,
} from "../../api/userGroupApi";
import { getUserOrgSelection } from "../../api/orgHierarchyApi";
import { getUserDepartments, getUserDesignations } from "../../api/userPermissionsApi";
import { getHeadOffices } from "../../api/headOfficesApi";
import { getBranches } from "../../api/branchesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import ConfirmDialog from "../../components/system/ConfirmDialog";
import UserGroupEditModal from "../../components/admin/UserGroupEditModal";

const EMPTY_SCOPE = {
  headOfficeId: "",
  branchId: "",
  institutionId: "",
  departmentId: "",
  teamIds: [],
  memberScope: "NONE",
};

export default function UserGroupEditPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const currentRole = String(currentUser?.role || "").toUpperCase();
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const isAdmin = currentRole === "ADMIN";
  const isManager = currentRole === "MANAGER";
  const isTeamLead = currentRole === "TEAM_LEAD";
  const { showSuccess, showError } = useToast();

  const [group, setGroup] = useState(location.state?.group || null);
  const [form, setForm] = useState({ name: "" });
  const [scope, setScope] = useState(EMPTY_SCOPE);
  const [orgSelection, setOrgSelection] = useState(null);
  const [headOffices, setHeadOffices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [members, setMembers] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const normalize = (value) => String(value || "").trim().toLowerCase();

  const findByName = (rows, name) =>
    rows.find((row) => normalize(row?.name) === normalize(name));

  const selectedInstitution = useMemo(
    () => headOffices.find((item) => String(item.id) === String(scope.headOfficeId)),
    [headOffices, scope.headOfficeId],
  );
  const selectedBranch = useMemo(
    () => branches.find((item) => String(item.id) === String(scope.branchId)),
    [branches, scope.branchId],
  );
  const selectedDepartment = useMemo(
    () => departments.find((item) => String(item.id) === String(scope.departmentId)),
    [departments, scope.departmentId],
  );
  const selectedDepartmentIds = useMemo(
    () =>
      Array.isArray(scope.departmentIds) && scope.departmentIds.length
        ? scope.departmentIds
        : scope.departmentId
          ? [String(scope.departmentId)]
          : [],
    [scope.departmentId, scope.departmentIds],
  );
  const selectedDepartments = useMemo(
    () => departments.filter((item) => selectedDepartmentIds.some((id) => String(id) === String(item.id))),
    [departments, selectedDepartmentIds],
  );
  const selectedTeams = useMemo(
    () => designations.filter((designation) => scope.teamIds.some((tid) => String(tid) === String(designation.id))),
    [designations, scope.teamIds],
  );
  const selectedTeamNames = useMemo(
    () => selectedTeams.map((designation) => String(designation.name || "").trim()).filter(Boolean),
    [selectedTeams],
  );
  const selectedMemberScope = String(group?.memberScope || "NONE").toUpperCase();

  useEffect(() => {
    let isMounted = true;
    const loadBase = async () => {
      setOrgLoading(true);
      try {
        const [headOfficeRows, selection] = await Promise.all([
          getHeadOffices(),
          currentUser?.id ? getUserOrgSelection(currentUser.id) : Promise.resolve(null),
        ]);
        if (!isMounted) return;
        setHeadOffices(Array.isArray(headOfficeRows) ? headOfficeRows : []);
        setOrgSelection(selection || null);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load organization data"));
      } finally {
        if (isMounted) setOrgLoading(false);
      }
    };
    loadBase();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, showError]);

  useEffect(() => {
    let isMounted = true;
    const loadGroup = async () => {
      if (group) {
        setForm({ name: group.name || "" });
        return;
      }
      setLoading(true);
      try {
        const rows = await getUserGroups();
        const found = rows.find((row) => String(row.id) === String(id));
        if (!isMounted) return;
        if (!found) {
          showError("Group not found");
          return;
        }
        setGroup(found);
        setForm({ name: found.name || "" });
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load group"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadGroup();
    return () => {
      isMounted = false;
    };
  }, [group, id, showError]);

  useEffect(() => {
    let isMounted = true;
    const hydrateScope = async () => {
      if (!group || !headOffices.length) return;
      try {
        const preferredHeadOfficeId = String(group.headOfficeId || "");
        const preferredBranches = preferredHeadOfficeId ? await getBranches(preferredHeadOfficeId) : [];
        if (!isMounted) return;
        let branchRows = Array.isArray(preferredBranches) ? preferredBranches : [];
        let branch = group.branchId
          ? branchRows.find((item) => String(item.id) === String(group.branchId))
          : findByName(branchRows, group.institutionName);
        if (!branch) {
          const allBranches = await getBranches();
          if (!isMounted) return;
          branchRows = Array.isArray(allBranches) ? allBranches : branchRows;
          branch = group.branchId
            ? branchRows.find((item) => String(item.id) === String(group.branchId))
            : findByName(branchRows, group.institutionName);
        }
        const branchId = branch?.id ? String(branch.id) : "";
        if (!branchId) {
          setBranches(branchRows);
          setScope((prev) => ({ ...prev, headOfficeId: preferredHeadOfficeId || prev.headOfficeId || "" }));
          return;
        }
        setBranches(branchRows);
        const departmentRows = await getUserDepartments(branchId);
        if (!isMounted) return;
        setDepartments(Array.isArray(departmentRows) ? departmentRows : []);
        const groupDepartmentNames = String(group.departmentName || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        const departmentMatches = [];
        if (Array.isArray(group.departmentIds) && group.departmentIds.length) {
          for (const departmentIdValue of group.departmentIds) {
            const match = departmentRows.find((item) => String(item.id) === String(departmentIdValue));
            if (match) departmentMatches.push(match);
          }
        } else if (groupDepartmentNames.length) {
          for (const departmentName of groupDepartmentNames) {
            const match = departmentRows.find((item) => normalize(item.name) === normalize(departmentName));
            if (match) departmentMatches.push(match);
          }
        } else if (group.departmentId) {
          const match = departmentRows.find((item) => String(item.id) === String(group.departmentId));
          if (match) departmentMatches.push(match);
        }
        if (!departmentMatches.length) {
          const currentHeadOfficeId = String(branch?.headOfficeId || preferredHeadOfficeId || "");
          setScope((prev) => ({ ...prev, headOfficeId: currentHeadOfficeId, branchId }));
          return;
        }
        const primaryDepartmentId = String(departmentMatches[0].id);
        const teamRows = await getUserDesignations(primaryDepartmentId);
        if (!isMounted) return;
        setDesignations(Array.isArray(teamRows) ? teamRows : []);
        const teamIds = Array.isArray(group.teamNames)
          ? teamRows
              .filter((designation) =>
                group.teamNames.some((name) => normalize(name) === normalize(designation.name)),
              )
              .map((designation) => String(designation.id))
          : [];
        setScope({
          headOfficeId: String(branch.headOfficeId || preferredHeadOfficeId || ""),
          branchId,
          departmentId: primaryDepartmentId,
          departmentIds: departmentMatches.map((item) => String(item.id)),
          teamIds,
        });
        setSelectedDepartmentId("");
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load group scope"));
      }
    };
    hydrateScope();
    return () => {
      isMounted = false;
    };
  }, [group, headOffices, orgSelection?.institutionId, showError]);

  useEffect(() => {
    let isMounted = true;
    const loadMembers = async () => {
      if (!group?.id) return;
      setLoading(true);
      try {
        const [memberRows, userRows] = await Promise.all([
          getGroupMembers(group.id),
          getAssignableUsersForGroup({ groupId: group.id }),
        ]);
        if (!isMounted) return;
        setMembers(Array.isArray(memberRows) ? memberRows : []);
        setAssignableUsers(Array.isArray(userRows) ? userRows : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load members"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [group?.id, showError]);

  const deptNamesString = useMemo(
    () => selectedDepartments.map((d) => String(d.name || "")).sort().join(","),
    [selectedDepartments]
  );

  const teamNamesString = useMemo(
    () => selectedTeamNames.sort().join(","),
    [selectedTeamNames]
  );

  useEffect(() => {
    let isMounted = true;
    const loadAssignableBySelectedTeams = async () => {
      if (!group?.id) return;
      try {
        const params = {
          groupId: group.id,
          teams: selectedTeamNames,
          institutionName: selectedBranch?.name || "",
          departmentNames: selectedDepartments.map((d) => String(d.name || "")).filter(Boolean),
          memberScope: selectedMemberScope,
        };
        const rows = await getAssignableUsersForGroup(params);
        if (!isMounted) return;
        setAssignableUsers(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (isMounted) {
          showError(extractApiErrorMessage(e, "Failed to filter assignable users"));
        }
      }
    };
    loadAssignableBySelectedTeams();
    return () => {
      isMounted = false;
    };
  }, [group?.id, selectedBranch?.name, deptNamesString, teamNamesString, selectedMemberScope, showError]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!scope.headOfficeId) {
        setBranches([]);
        return;
      }
      try {
        const rows = await getBranches(scope.headOfficeId);
        if (isMounted) setBranches(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load branches"));
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [scope.headOfficeId, showError]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!scope.branchId) {
        setDepartments([]);
        return;
      }
      try {
        const rows = await getUserDepartments(scope.branchId);
        if (isMounted) setDepartments(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load departments"));
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [scope.branchId, showError]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!scope.departmentId) {
        setDesignations([]);
        return;
      }
      try {
        const rows = await getUserDesignations(scope.departmentId);
        if (isMounted) setDesignations(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load designations"));
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [scope.departmentId, showError]);

  useEffect(() => {
    if (!orgSelection) return;
    if (currentRole === "SUPER_ADMIN") return;
    setScope((prev) => ({
      ...prev,
      headOfficeId: String(orgSelection.institutionId || prev.headOfficeId || ""),
      branchId: String(prev.branchId || ""),
      departmentId: String(orgSelection.departmentId || prev.departmentId || ""),
      departmentIds: Array.isArray(prev.departmentIds) && prev.departmentIds.length
        ? prev.departmentIds
        : orgSelection.departmentId
          ? [String(orgSelection.departmentId)]
          : [],
      teamIds: prev.teamIds,
    }));
  }, [orgSelection, currentRole]);

  const handleDepartmentSelect = (departmentId) => {
    const nextDepartmentId = String(departmentId || "");
    setSelectedDepartmentId(nextDepartmentId);
    if (!nextDepartmentId) return;
    setScope((prev) => {
      const alreadySelected = Array.isArray(prev.departmentIds) && prev.departmentIds.some((id) => String(id) === nextDepartmentId);
      const departmentIds = alreadySelected
        ? prev.departmentIds
        : [...(Array.isArray(prev.departmentIds) ? prev.departmentIds : []), nextDepartmentId];
      return {
        ...prev,
        departmentIds,
        departmentId: departmentIds[0] || "",
      };
    });
    setSelectedDepartmentId("");
  };

  const removeDepartment = (departmentId) => {
    const nextDepartmentId = String(departmentId || "");
    setScope((prev) => {
      const departmentIds = (Array.isArray(prev.departmentIds) ? prev.departmentIds : []).filter((id) => String(id) !== nextDepartmentId);
      return {
        ...prev,
        departmentIds,
        departmentId: departmentIds[0] || "",
      };
    });
  };

  const refreshMembers = async () => {
    if (!group?.id) return;
    const params =
      selectedTeamNames.length > 0
        ? { groupId: group.id, teams: selectedTeamNames }
        : { groupId: group.id };
    const [memberRows, userRows] = await Promise.all([
      getGroupMembers(group.id),
      getAssignableUsersForGroup(params),
    ]);
    setMembers(Array.isArray(memberRows) ? memberRows : []);
    setAssignableUsers(Array.isArray(userRows) ? userRows : []);
  };

  const handleSave = async () => {
    if (!group?.id) return;
    if (!form.name.trim()) {
      showError("Group name is required");
      return;
    }
    if (!selectedInstitution) {
      showError("Head office is required");
      return;
    }
    if (!selectedBranch) {
      showError("Branch is required");
      return;
    }
    if (selectedDepartments.length === 0) {
      showError("User Department is required");
      return;
    }
    const invalidDepartment = selectedDepartments.find(
      (department) => String(department.branchId || department.branch?.id || "") !== String(selectedBranch.id || ""),
    );
    if (invalidDepartment) {
      showError("Selected department does not belong to the selected branch");
      return;
    }
    setLoading(true);
    try {
      const updated = await updateUserGroup(group.id, {
        name: form.name.trim(),
        headOfficeId: selectedInstitution.id,
        branchId: selectedBranch.id,
        departmentId: selectedDepartments[0]?.id || null,
        departmentIds: selectedDepartments.map((department) => department.id),
        institutionName: selectedBranch.name,
        departmentName: selectedDepartments.map((department) => department.name).join(","),
        teamNames: selectedTeams.map((designation) => designation.name),
        pageKeys: Array.isArray(group?.pageKeys) ? group.pageKeys : [],
        memberScope: "NONE",
      });
      const nextPageKeys = Array.isArray(updated.pageKeys)
        ? updated.pageKeys
        : Array.isArray(group?.pageKeys)
          ? group.pageKeys
          : [];
      setGroup({ ...updated, pageKeys: nextPageKeys });
      showSuccess("Group updated");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update group"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!group?.id || !selectedUserId) return;
    setLoading(true);
    try {
      await addGroupMember(group.id, selectedUserId);
      await refreshMembers();
      setSelectedUserId("");
      showSuccess("Member added");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to add member"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!group?.id || !userId) return;
    setLoading(true);
    try {
      await removeGroupMember(group.id, userId);
      await refreshMembers();
      showSuccess("Member removed");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to remove member"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group?.id) return;
    setLoading(true);
    try {
      await deleteUserGroup(group.id);
      showSuccess("Group deleted");
      navigate("/usergroups");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete group"));
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!group && loading) {
    return <div className="container-fluid"><div className="card"><div className="card-body">Loading...</div></div></div>;
  }

  if (!group && !loading) {
    return (
      <div className="container-fluid">
        <div className="card">
          <div className="card-body">
            <h5 className="mb-2">Group Not Found</h5>
            <button className="btn btn-light" onClick={() => navigate("/usergroups")}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Edit Group</h4>
          <button className="btn btn-light" onClick={() => navigate("/usergroups")}>
            Back
          </button>
        </div>
        <div className="card-body">
          <UserGroupEditModal
            form={form}
            onFormChange={setForm}
            scope={{ ...scope, memberScope: selectedMemberScope }}
            onScopeChange={(updates) => setScope((prev) => ({ ...prev, ...updates }))}
            headOffices={headOffices}
            branches={branches}
            departments={departments}
            teams={designations}
            selectedDepartmentId={selectedDepartmentId}
            onDepartmentSelect={handleDepartmentSelect}
            onDepartmentRemove={removeDepartment}
            orgLoading={orgLoading}
            isAdmin={isAdmin}
            isManager={isManager}
            isTeamLead={isTeamLead}
            departmentMultiSelect={isManager}
            showDesignationPicker={!isAdmin && !isManager}
            selectedUserId={selectedUserId}
            onUserSelect={setSelectedUserId}
            assignableUsers={assignableUsers}
            members={members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onSave={handleSave}
            onDelete={() => setShowDeleteConfirm(true)}
            loading={loading}
            saving={loading}
            groupName={group?.name}
            showScopeEditor={isSuperAdmin}
            showActions={isSuperAdmin}
          />
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete the group "${group?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}
