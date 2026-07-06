import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserGroup,
  deleteUserGroup,
  getUserGroups,
} from "../../api/userGroupApi";
import {
  getUserOrgSelection,
} from "../../api/orgHierarchyApi";
import { getHeadOffices } from "../../api/headOfficesApi";
import { getBranches } from "../../api/branchesApi";
import { getUserDepartments, getUserDesignations } from "../../api/userPermissionsApi";
import { useAuth } from "../../context/AuthContext";
import UserGroupWizardModal from "../../components/admin/UserGroupWizardModal";
import { useToast } from "../../components/system/ToastProvider";
import { useCreateGroupForm } from "../../hooks/useCreateGroupForm";
import { extractApiErrorMessage } from "../../utils/errorMessage";


function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function findById(rows, id) {
  return rows.find((row) => String(row.id) === String(id));
}

function findByName(rows, name) {
  return rows.find((row) => normalize(row?.name) === normalize(name));
}

export default function UsergroupsPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const currentRole = String(currentUser?.role || "").toUpperCase();
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const isAdmin = currentRole === "ADMIN";
  const isManager = currentRole === "MANAGER";
  const isTeamLead = currentRole === "TEAM_LEAD";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);

  const [createPageKeys, setCreatePageKeys] = useState([]);

  const [orgSelection, setOrgSelection] = useState(null);
  const [headOffices, setHeadOffices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [createUserDepartments, setCreateUserDepartments] = useState([]);
  const [createUserDesignations, setCreateUserDesignations] = useState([]);
  const {
    form,
    createScope,
    showModal: showCreateModal,
    formError,
    setFormError,
    selectedTeamId,
    selectedDepartmentId,
    updateFormField,
    updateScope,
    validateForm,
    handleTeamSelect,
    handleDepartmentSelect,
    removeDepartment,
    removeTeam,
    openModal,
    closeModal,
    setCreateScope,
  } = useCreateGroupForm();

  const ordered = useMemo(() => [...rows].sort((a, b) => a.name.localeCompare(b.name)), [rows]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUserGroups();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      showError(extractApiErrorMessage(e, "Failed to load user groups"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadOrgData = async () => {
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
        if (isMounted) {
          showError(extractApiErrorMessage(e, "Failed to load organization data"));
        }
      } finally {
        if (isMounted) setOrgLoading(false);
      }
    };
    loadOrgData();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!createScope.headOfficeId) {
        setBranches([]);
        return;
      }
      try {
        const data = await getBranches(createScope.headOfficeId);
        if (isMounted) setBranches(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) {
          showError(extractApiErrorMessage(e, "Failed to load branches"));
        }
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [createScope.headOfficeId]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!createScope.branchId) {
        setCreateUserDepartments([]);
        return;
      }
      try {
        const data = await getUserDepartments(createScope.branchId);
        if (isMounted) setCreateUserDepartments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) {
          showError(extractApiErrorMessage(e, "Failed to load user departments"));
        }
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [createScope.branchId]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!createScope.departmentId) {
        setCreateUserDesignations([]);
        return;
      }
      try {
        const data = await getUserDesignations(createScope.departmentId);
        if (isMounted) setCreateUserDesignations(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) {
          showError(extractApiErrorMessage(e, "Failed to load user designations"));
        }
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [createScope.departmentId]);


  const applyActorScopeDefaults = (scope) => {
    if (isSuperAdmin || !orgSelection) {
      return scope;
    }
    return {
      headOfficeId: String(orgSelection.institutionId || scope.headOfficeId || ""),
      branchId: String(scope.branchId || ""),
      departmentId: String(scope.departmentId || ""),
      departmentIds: Array.isArray(scope.departmentIds) ? scope.departmentIds : [],
      teamIds: Array.isArray(scope.teamIds) ? scope.teamIds : [],
    };
  };

  const openCreate = () => {
    setCreatePageKeys([]);
    openModal();
    setCreateScope(applyActorScopeDefaults({ ...EMPTY_SCOPE }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    const selectedHeadOffice = findById(headOffices, createScope.headOfficeId);
    const selectedBranch = findById(branches, createScope.branchId);
    const selectedDepartments = Array.isArray(createScope.departmentIds) && createScope.departmentIds.length
      ? createUserDepartments.filter((department) =>
          createScope.departmentIds.some((departmentId) => String(departmentId) === String(department.id)),
        )
      : createScope.departmentId
        ? [findById(createUserDepartments, createScope.departmentId)].filter(Boolean)
        : [];
    const selectedDesignations = createUserDesignations.filter((designation) =>
      createScope.teamIds.some((designationId) => String(designationId) === String(designation.id)),
    );
    if (!selectedHeadOffice) {
      setFormError("Head office is required");
      return;
    }
    if (!selectedBranch) {
      setFormError("Branch is required");
      return;
    }
    if (String(selectedBranch.headOfficeId || "") !== String(selectedHeadOffice.id || "")) {
      setFormError("Selected branch does not belong to the selected head office");
      return;
    }
    if (selectedDepartments.length === 0) {
      setFormError("User Department is required");
      return;
    }
    const invalidDepartment = selectedDepartments.find(
      (department) => String(department.branchId || department.branch?.id || "") !== String(selectedBranch.id || ""),
    );
    if (invalidDepartment) {
      setFormError("Selected user department does not belong to the selected branch");
      return;
    }
    setSaving(true);
    try {
      await createUserGroup({
        name: form.name.trim(),
        headOfficeId: selectedHeadOffice.id,
        branchId: selectedBranch.id,
        departmentId: selectedDepartments[0]?.id || null,
        departmentIds: selectedDepartments.map((department) => department.id),
        institutionName: selectedBranch.name,
        departmentName: selectedDepartments.map((department) => department.name).join(","),
        teamNames: selectedDesignations.map((designation) => designation.name),
        pageKeys: createPageKeys,
        memberScope: "NONE",
      });
      showSuccess("User group created");
      closeModal();
      await load();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to create group"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (group) => {
    navigate(`/usergroups/edit/${group.id}`, { state: { group } });
  };

  const handleDelete = async () => {
    if (!pendingDelete?.id) return;
    setSaving(true);
    try {
      await deleteUserGroup(pendingDelete.id);
      showSuccess("Deleted");
      setPendingDelete(null);
      await load();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .user-groups { padding-top: 0 !important; margin-top: 0 !important; }
        .user-groups .btn-primary { background-color: #45597a; border-color: #45597a; border-radius: 2rem; padding: 0.6rem 1.5rem; font-weight: 500; transition: all 0.3s ease; }
        .user-groups .btn-primary:hover { background-color: #354560; border-color: #354560; }
        .user-groups .btn-light { background-color: #f5f5f5; border-color: #d0d5dd; border-radius: 2rem; color: #34393f; }
        .user-groups .btn-light:hover { background-color: #efefef; }
        .user-groups .form-control, .user-groups .form-select { border-radius: 1.5rem; border: 1px solid #d0d5dd; padding: 0.6rem 1rem; font-size: 0.95rem; }
        .user-groups .form-control:focus, .user-groups .form-select:focus { border-color: #45597a; box-shadow: 0 0 0 0.2rem rgba(69, 89, 122, 0.15); }
        .user-groups .form-label { color: #34393f; font-weight: 500; font-size: 0.9rem; }
        .user-groups .modal-content { border-radius: 20px; border: none; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 15px 0 rgba(0, 0, 0, 0.12); background-color: #fcfcfc; }
        .user-groups .modal-header { background-color: transparent; border: none; padding: 2rem 2rem 1rem 2rem; }
        .user-groups .modal-title { color: #34393f; font-weight: 600; }
        .user-groups .modal-body { padding: 0 2rem 1.5rem 2rem; }
        .user-groups .modal-footer { background-color: transparent; border: none; padding: 1.5rem 2rem 2rem 2rem; }
        .user-groups .badge { border-radius: 1rem; }
        .user-groups .btn-sm { border-radius: 1.5rem; padding: 0.4rem 0.8rem; }
        .user-groups .table { background-color: transparent; }
        .user-groups .table thead th { background-color: transparent; color: #34393f; font-weight: 600; border: none; padding: 1rem; }
        .user-groups .table tbody td { padding: 1rem; border-color: #e9ecef; color: #34393f; }
      `}</style>
      <div className="container-fluid user-groups">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-0">User Groups</h4>
            <small className="text-muted">Manage group scope by branch, user department, and user designation.</small>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-light" onClick={() => navigate(-1)}>
              Back
            </button>
            {isSuperAdmin ? (
              <button className="btn btn-primary" onClick={openCreate}>
                Create Group
              </button>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Branch</th>
                    <th>User Department</th>
                    <th>User Designations</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5}>Loading...</td>
                    </tr>
                  ) : ordered.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No user groups found</td>
                    </tr>
                  ) : (
                    ordered.map((group) => (
                      <tr key={group.id}>
                        <td>{group.name || "-"}</td>
                        <td>{group.institutionName || "-"}</td>
                        <td>{group.departmentName || "-"}</td>
                        <td>{Array.isArray(group.teamNames) && group.teamNames.length ? group.teamNames.join(", ") : "-"}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(group)}>
                              {isSuperAdmin ? "Edit" : "Open"}
                            </button>
                            {isSuperAdmin ? (
                              <button className="btn btn-sm btn-outline-danger" onClick={() => setPendingDelete(group)}>
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <UserGroupWizardModal
          title="Create Group"
          icon="ti ti-users-group"
          stepLabel="Group Setup"
          formName={form.name}
          onFormNameChange={(value) => updateFormField("name", value)}
          scope={createScope}
          onScopeChange={updateScope}
          headOffices={headOffices}
          branches={branches}
          departments={createUserDepartments}
          teams={createUserDesignations}
          selectedTeamId={selectedTeamId}
          onTeamSelect={handleTeamSelect}
          onTeamRemove={removeTeam}
          orgLoading={orgLoading}
          disableBranch={false}
          disableDepartment={isAdmin}
          disableTeam={isAdmin || isManager}
          departmentMultiSelect={isManager}
          showDesignationPicker={!isAdmin && !isManager}
          selectedDepartmentId={selectedDepartmentId}
          onDepartmentSelect={handleDepartmentSelect}
          onDepartmentRemove={removeDepartment}
          errorMessage={formError}
          onClose={closeModal}
          onSubmit={handleSave}
          submitLabel="Create"
          saving={saving}
        />
      )}
      {pendingDelete && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Delete Group</h5>
                  <button className="btn-close" onClick={() => setPendingDelete(null)} />
                </div>
                <div className="modal-body">
                  <p>
                    Delete <strong>{pendingDelete.name}</strong>?
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-light" onClick={() => setPendingDelete(null)} disabled={saving}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show user-group-modal-backdrop" />
        </>
      )}
    </>
  );
}
