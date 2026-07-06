import { useState } from "react";

const EMPTY_FORM = {
  name: "",
};

const EMPTY_SCOPE = {
  headOfficeId: "",
  branchId: "",
  institutionId: "",
  departmentId: "",
  departmentIds: [],
  teamIds: [],
};

export const useEditGroupForm = () => {
  const [editGroup, setEditGroup] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editScope, setEditScope] = useState(EMPTY_SCOPE);
  const [formError, setFormError] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  // Open edit modal
  const openEdit = (group) => {
    setEditGroup(group);
    setEditForm({ name: group.name || "" });
    setEditScope({
      headOfficeId: group.headOfficeId || "",
      branchId: group.branchId || "",
      institutionId: group.institutionId || "",
      departmentId: group.departmentId || "",
      departmentIds: Array.isArray(group.departmentIds) ? group.departmentIds : [],
      teamIds: Array.isArray(group.teamIds) ? group.teamIds : [],
    });
    setSelectedDepartmentId("");
    setFormError("");
  };

  // Close edit modal
  const closeEdit = () => {
    setEditGroup(null);
    setEditForm(EMPTY_FORM);
    setEditScope(EMPTY_SCOPE);
    setSelectedDepartmentId("");
    setFormError("");
  };

  // Update form field
  const updateFormField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  // Update scope field
  const updateScope = (updates) => {
    setEditScope((prev) => ({ ...prev, ...updates }));
    if (formError) setFormError("");
  };

  const handleDepartmentSelect = (departmentId) => {
    const nextDepartmentId = String(departmentId || "");
    setSelectedDepartmentId(nextDepartmentId);
    if (!nextDepartmentId) return;
    setEditScope((prev) => {
      const alreadySelected = prev.departmentIds.some((id) => String(id) === nextDepartmentId);
      const departmentIds = alreadySelected
        ? prev.departmentIds
        : [...prev.departmentIds, nextDepartmentId];
      return {
        ...prev,
        departmentIds,
        departmentId: departmentIds[0] || "",
      };
    });
    if (formError) setFormError("");
    setSelectedDepartmentId("");
  };

  const removeDepartment = (departmentId) => {
    const nextDepartmentId = String(departmentId || "");
    setEditScope((prev) => {
      const departmentIds = prev.departmentIds.filter((id) => String(id) !== nextDepartmentId);
      return {
        ...prev,
        departmentIds,
        departmentId: departmentIds[0] || "",
      };
    });
    if (formError) setFormError("");
  };

  // Validate form
  const validateForm = () => {
    if (!editForm.name.trim()) {
      setFormError("Group name is required");
      return false;
    }
    return true;
  };

  // Get formatted scope for API
  const getFormattedScope = () => ({
    headOfficeId: editScope.headOfficeId || "",
    branchId: editScope.branchId || "",
    institutionId: editScope.institutionId || "",
    departmentId: editScope.departmentId || "",
    departmentIds: Array.isArray(editScope.departmentIds) ? editScope.departmentIds : [],
    teamIds: Array.isArray(editScope.teamIds) ? editScope.teamIds : [],
  });

  return {
    // Form state
    editGroup,
    setEditGroup,
    editForm,
    setEditForm,
    editScope,
    setEditScope,
    formError,
    setFormError,
    selectedDepartmentId,

    // Form methods
    updateFormField,
    updateScope,
    handleDepartmentSelect,
    removeDepartment,
    validateForm,
    openEdit,
    closeEdit,
    getFormattedScope,

    // Constants
    EMPTY_FORM,
    EMPTY_SCOPE,
  };
};
