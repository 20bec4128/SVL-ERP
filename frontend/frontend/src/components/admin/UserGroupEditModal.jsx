import { motion, useReducedMotion } from "motion/react";
import "./UserGroupEditModal.css";

function TeamBadgeList({ teamIds, teams, onRemove }) {
  const shouldReduceMotion = useReducedMotion();

  if (!teamIds.length) return null;

  return (
    <div className="mt-2 d-flex flex-wrap gap-2">
      {teamIds.map((teamId) => {
        const team = teams.find((item) => String(item.id) === String(teamId));
        return (
          <motion.span
            key={teamId}
            layout
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, y: 6 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="badge bg-primary d-inline-flex align-items-center gap-2 user-group-team-badge"
            style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
          >
            {team?.name || teamId}
            <i className="ti ti-x" style={{ cursor: "pointer" }} onClick={() => onRemove(teamId)}></i>
          </motion.span>
        );
      })}
    </div>
  );
}

function DepartmentBadgeList({ departmentIds, departments, onRemove }) {
  const shouldReduceMotion = useReducedMotion();

  if (!departmentIds.length) return null;

  return (
    <div className="mt-2 d-flex flex-wrap gap-2">
      {departmentIds.map((departmentId) => {
        const department = departments.find((item) => String(item.id) === String(departmentId));
        return (
          <motion.span
            key={departmentId}
            layout
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, y: 6 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="badge bg-secondary d-inline-flex align-items-center gap-2 user-group-team-badge"
            style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
          >
            {department?.name || departmentId}
            <i className="ti ti-x" style={{ cursor: "pointer" }} onClick={() => onRemove(departmentId)}></i>
          </motion.span>
        );
      })}
    </div>
  );
}

export default function UserGroupEditModal({
  form,
  onFormChange,
  scope,
  onScopeChange,
  headOffices,
  branches,
  departments,
  teams,
  selectedDepartmentId = "",
  onDepartmentSelect,
  onDepartmentRemove,
  orgLoading,
  isAdmin,
  isManager,
  isTeamLead,
  departmentMultiSelect = false,
  showDesignationPicker = true,
  selectedUserId,
  onUserSelect,
  assignableUsers,
  members,
  onAddMember,
  onRemoveMember,
  onSave,
  onDelete,
  loading,
  saving = false,
  groupName,
  showScopeEditor = true,
  showActions = true,
}) {
  const shouldReduceMotion = useReducedMotion();
  const lockDepartment = false;
  const lockTeam = false;
  const memberAssignableUsers = Array.isArray(assignableUsers)
    ? assignableUsers.filter((userItem) => {
        const role = String(userItem?.role || "").toUpperCase();
        return role === "EMPLOYEE" || role === "TEAM_LEAD";
      })
    : [];

  return (
    <motion.div
      className="user-group-edit-modal"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Group Name</label>
            <input
              className="form-control user-group-edit-input"
              value={form.name}
              readOnly={!showScopeEditor}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            />
          </div>
          {showScopeEditor ? (
          <div className="col-md-6">
            <label className="form-label">Head Office</label>
            <select
              className="form-select user-group-edit-input"
              value={scope.headOfficeId}
              onChange={(e) =>
                onScopeChange({
                  headOfficeId: e.target.value,
                  branchId: "",
                  departmentId: "",
                  departmentIds: [],
                  teamIds: [],
                })
              }
              disabled={orgLoading || isTeamLead || saving}
            >
              <option value="">Select Head Office</option>
              {headOffices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          ) : null}
          {showScopeEditor ? (
          <div className="col-md-6">
            <label className="form-label">Branch</label>
            <select
              className="form-select user-group-edit-input"
              value={scope.branchId}
              onChange={(e) =>
                onScopeChange({
                  ...scope,
                  branchId: e.target.value,
                  departmentId: "",
                  departmentIds: [],
                  teamIds: [],
                })
              }
              disabled={orgLoading || !scope.headOfficeId || isTeamLead || saving}
            >
              <option value="">Select Branch</option>
              {branches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          ) : null}
          {showScopeEditor && !isAdmin ? (
            <div className="col-md-6">
              <label className="form-label">User Department</label>
              {departmentMultiSelect ? (
                <>
                  <select
                    className="form-select user-group-edit-input"
                    value={selectedDepartmentId}
                    onChange={(e) => onDepartmentSelect?.(e.target.value)}
                    disabled={orgLoading || !scope.branchId || saving}
                  >
                    <option value="">Select User Department</option>
                    {departments
                      .filter((item) => !Array.isArray(scope.departmentIds) || !scope.departmentIds.includes(String(item.id)))
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                  <DepartmentBadgeList
                    departmentIds={Array.isArray(scope.departmentIds) ? scope.departmentIds : []}
                    departments={departments}
                    onRemove={onDepartmentRemove}
                  />
                </>
              ) : (
                <select
                  className="form-select user-group-edit-input"
                  value={scope.departmentId}
                  onChange={(e) =>
                    onScopeChange({
                      ...scope,
                      departmentId: e.target.value,
                      departmentIds: e.target.value ? [String(e.target.value)] : [],
                      teamIds: [],
                    })
                  }
                  disabled={orgLoading || !scope.branchId || (isTeamLead && !showDesignationPicker) || saving}
                >
                  <option value="">Select User Department</option>
                  {departments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}
          {showScopeEditor && showDesignationPicker ? (
            <div className="col-12">
              <label className="form-label">User Designations</label>
              <div className="d-flex gap-2">
                <select
                  className="form-select user-group-edit-input"
                  value=""
                  onChange={(e) => {
                    const teamId = e.target.value;
                    if (teamId && !scope.teamIds.includes(teamId)) {
                      onScopeChange({
                        ...scope,
                        teamIds: [...scope.teamIds, teamId],
                      });
                    }
                    e.target.value = "";
                  }}
                  disabled={orgLoading || !scope.departmentId || isManager || isTeamLead || lockTeam || saving}
                >
                  <option value="">Select User Designation</option>
                  {teams
                    .filter((item) => !scope.teamIds.includes(String(item.id)))
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <TeamBadgeList
                teamIds={scope.teamIds}
                teams={teams}
                onRemove={(teamId) =>
                  onScopeChange({
                    ...scope,
                    teamIds: scope.teamIds.filter((item) => item !== teamId),
                  })
                }
              />
            </div>
          ) : null}
        </div>
      </motion.div>

      <motion.div
        className="user-group-members-section"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <div className="mb-3">
          <label className="form-label">Add Users</label>
          <div className="d-flex gap-2">
            <select
              className="form-select user-group-edit-input"
              value={selectedUserId}
              onChange={(e) => onUserSelect(e.target.value)}
            >
              <option value="">Select Add Users</option>
              {memberAssignableUsers
                .filter((userItem) => !members.some((member) => String(member.userId) === String(userItem.id)))
                .map((userItem) => (
                  <option key={userItem.id} value={userItem.id}>
                    {userItem.username} ({userItem.role || "USER"})
                  </option>
                ))}
            </select>
            <button className="btn btn-primary" onClick={onAddMember} disabled={!selectedUserId || loading}>
              Add
            </button>
          </div>
        </div>

        <div className="table-responsive user-group-members-table">
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th className="text-end">Remove</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={3}>No members</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.userId}>
                    <td>{member.username || "-"}</td>
                    <td>{member.role || "-"}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onRemoveMember(member.userId)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {showActions ? (
        <motion.div
          className="user-group-edit-actions"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <button className="btn btn-danger" onClick={onDelete} disabled={loading}>
            Delete Group
          </button>
          <button className="btn btn-primary" onClick={onSave} disabled={loading}>
            {loading ? "Saving..." : "Save Group"}
          </button>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
