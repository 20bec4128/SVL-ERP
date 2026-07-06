import api from "../utils/api";

export async function getInstitutions() {
  const response = await api.get("/api/org/institutions");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getBranches() {
  return getInstitutions();
}

export async function createInstitution(name) {
  const response = await api.post("/api/org/institutions", {
    name,
    status: "ACTIVE",
  });
  return response?.data || null;
}

export async function createBranch(name) {
  return createInstitution(name);
}

export async function getInstitutionCategories(institutionId) {
  if (!institutionId) return [];
  return [];
}

export async function createInstitutionCategory(institutionId, name) {
  return { id: null, name, status: "ACTIVE" };
}

export async function getInstitutionTypes(institutionId, categoryId) {
  if (!institutionId) return [];
  return [];
}

export async function createInstitutionType(institutionId, categoryId, name) {
  return { id: null, name, status: "ACTIVE" };
}

export async function getDepartments(institutionId) {
  if (!institutionId) return [];
  const response = await api.get("/api/org/departments", {
    params: { institutionId },
  });
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getDepartmentsByBranch(branchId) {
  return getDepartments(branchId);
}

export async function createDepartment(
  institutionId,
  categoryIdOrName,
  typeIdOrStatus,
  maybeName,
  maybeStatus = "ACTIVE",
) {
  const hasLegacyParams = maybeName !== undefined;
  const name = hasLegacyParams ? maybeName : categoryIdOrName;
  const status = hasLegacyParams ? maybeStatus : typeIdOrStatus || "ACTIVE";
  const response = await api.post("/api/org/departments", {
    institutionId: Number(institutionId),
    name,
    status,
  });
  return response?.data || null;
}

export async function createDepartmentInBranch(branchId, name, status = "ACTIVE") {
  return createDepartment(branchId, name, status);
}

export async function getTeams(
  institutionId,
  legacyCategoryIdOrDepartmentId,
  legacyTypeId,
  legacyDepartmentId,
) {
  const departmentId =
    legacyDepartmentId !== undefined ? legacyDepartmentId : legacyCategoryIdOrDepartmentId;
  if (!institutionId || !departmentId) return [];
  const response = await api.get("/api/org/teams", {
    params: { institutionId, departmentId },
  });
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getTeamsByBranch(branchId, departmentId) {
  return getTeams(branchId, departmentId);
}

export async function createTeam(
  institutionId,
  legacyCategoryIdOrDepartmentId,
  legacyTypeIdOrName,
  legacyDepartmentIdOrName,
  legacyName,
) {
  const hasLegacyParams = legacyName !== undefined;
  const departmentId = hasLegacyParams
    ? legacyDepartmentIdOrName
    : legacyCategoryIdOrDepartmentId;
  const name = hasLegacyParams ? legacyName : legacyTypeIdOrName;
  const response = await api.post("/api/org/teams", {
    institutionId: Number(institutionId),
    departmentId: Number(departmentId),
    name,
    status: "ACTIVE",
  });
  return response?.data || null;
}

export async function createTeamInBranch(branchId, departmentId, name) {
  return createTeam(branchId, departmentId, name);
}

export async function getUserOrgSelection(userId) {
  if (!userId) return null;
  const response = await api.get(`/api/org/user/${userId}`);
  return response?.data || null;
}
