import { useState } from "react";

export default function CreateGroupModal({
  show,
  onClose,
  form,
  onFormChange,
  createScope,
  onScopeChange,
  headOffices,
  branches,
  departments,
  teams,
  orgLoading,
  saving,
  onSubmit,
  formError,
  isAdmin,
  isManager,
  isTeamLead,
}) {
  if (!show) return null;

  const handleHeadOfficeChange = (headOfficeId) => {
    onScopeChange({
      headOfficeId,
      branchId: "",
      departmentId: "",
      teamIds: [],
    });
  };

  const handleBranchChange = (branchId) => {
    onScopeChange({
      ...createScope,
      branchId,
      departmentId: "",
      teamIds: [],
    });
  };

  const handleDepartmentChange = (departmentId) => {
    onScopeChange({
      ...createScope,
      departmentId,
      teamIds: [],
    });
  };

  const handleTeamToggle = (teamId) => {
    const teamIds = createScope.teamIds || [];
    const newTeamIds = teamIds.includes(teamId)
      ? teamIds.filter((id) => id !== teamId)
      : [...teamIds, teamId];
    onScopeChange({
      ...createScope,
      teamIds: newTeamIds,
    });
  };

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create Group</h5>
              <button className="btn-close" onClick={onClose} disabled={saving} />
            </div>
            <div className="modal-body">
              {formError && (
                <div className="alert alert-danger" role="alert">
                  {formError}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Group Name *</label>
                <input
                  className="form-control"
                  style={{ borderRadius: "1.5rem", border: "1px solid #d0d5dd", padding: "0.6rem 1rem" }}
                  value={form.name || ""}
                  onChange={(e) => onFormChange("name", e.target.value)}
                  placeholder="Enter group name"
                  disabled={saving}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Head Office *</label>
                <select
                  className="form-select"
                  style={{ borderRadius: "1.5rem", border: "1px solid #d0d5dd", padding: "0.6rem 1rem", fontSize: "0.95rem" }}
                  value={createScope.headOfficeId || ""}
                  onChange={(e) => handleHeadOfficeChange(e.target.value)}
                  disabled={orgLoading || isAdmin || isManager || isTeamLead || saving}
                >
                  <option value="">Select Head Office</option>
                  {headOffices.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Branch *</label>
                <select
                  className="form-select"
                  style={{ borderRadius: "1.5rem", border: "1px solid #d0d5dd", padding: "0.6rem 1rem", fontSize: "0.95rem" }}
                  value={createScope.branchId || ""}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  disabled={orgLoading || !createScope.headOfficeId || saving}
                >
                  <option value="">Select Branch</option>
                  {branches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  style={{ borderRadius: "1.5rem", border: "1px solid #d0d5dd", padding: "0.6rem 1rem", fontSize: "0.95rem" }}
                  value={createScope.departmentId || ""}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={orgLoading || !createScope.branchId || saving}
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {createScope.departmentId && teams.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Designations</label>
                  <div className="d-flex flex-wrap gap-2">
                    {teams.map((team) => (
                      <label key={team.id} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={createScope.teamIds?.includes(String(team.id)) || false}
                          onChange={() => handleTeamToggle(String(team.id))}
                          disabled={saving}
                        />
                        <span className="form-check-label">{team.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-light"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={saving || !form.name.trim() || !createScope.headOfficeId || !createScope.branchId}
              >
                {saving ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
