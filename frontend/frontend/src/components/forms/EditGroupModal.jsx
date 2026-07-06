export default function EditGroupModal({
  show,
  onClose,
  form,
  onFormChange,
  editScope,
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
      ...editScope,
      branchId,
      departmentId: "",
      teamIds: [],
    });
  };

  const handleDepartmentChange = (departmentId) => {
    onScopeChange({
      ...editScope,
      departmentId,
      teamIds: [],
    });
  };

  const handleTeamToggle = (teamId) => {
    const teamIds = editScope.teamIds || [];
    const newTeamIds = teamIds.includes(String(teamId))
      ? teamIds.filter((id) => String(id) !== String(teamId))
      : [...teamIds, String(teamId)];
    onScopeChange({
      ...editScope,
      teamIds: newTeamIds,
    });
  };

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Group</h5>
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
                  value={editScope.headOfficeId || ""}
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
                  value={editScope.branchId || ""}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  disabled={orgLoading || !editScope.headOfficeId || saving}
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
                  value={editScope.departmentId || ""}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={orgLoading || !editScope.branchId || saving}
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {editScope.departmentId && teams.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Designations</label>
                  <div className="d-flex flex-wrap gap-2">
                    {teams.map((team) => (
                      <label key={team.id} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={editScope.teamIds?.includes(String(team.id)) || false}
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
                disabled={saving || !form.name.trim() || !editScope.headOfficeId || !editScope.branchId}
              >
                {saving ? "Updating..." : "Update Group"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
