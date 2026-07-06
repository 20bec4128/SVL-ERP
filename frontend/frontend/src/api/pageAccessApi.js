import api from "../utils/api";

function normalizeKeys(keys) {
  return Array.isArray(keys)
    ? keys.map((key) => String(key || "").trim().toLowerCase()).filter(Boolean)
    : [];
}

function buildRoleQuery(role) {
  const value = String(role || "").trim().toUpperCase();
  return value ? `?role=${encodeURIComponent(value)}` : "";
}

export async function getMyPageKeys() {
  const response = await api.get("/api/page-access/my-keys");
  return normalizeKeys(response?.data);
}

export async function getDepartmentPermissions() {
  const response = await api.get("/api/page-access/departments");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getGlobalPermissions(role) {
  const response = await api.get(`/api/page-access/global${buildRoleQuery(role)}`);
  return normalizeKeys(response?.data);
}

export async function saveGlobalPermissions(role, pageKeys = []) {
  const response = await api.put(`/api/page-access/global${buildRoleQuery(role)}`, {
    pageKeys,
  });
  return normalizeKeys(response?.data);
}

export async function saveDepartmentPermissions(departmentId, pageKeys = []) {
  const response = await api.put(`/api/page-access/departments/${departmentId}`, {
    pageKeys,
  });
  return normalizeKeys(response?.data);
}

export async function getDesignationPermissions(role) {
  const response = await api.get(`/api/page-access/designations${buildRoleQuery(role)}`);
  return Array.isArray(response?.data) ? response.data : [];
}

export async function saveDesignationPermissions(designationId, role, pageKeys = []) {
  const response = await api.put(
    `/api/page-access/designations/${designationId}${buildRoleQuery(role)}`,
    { pageKeys },
  );
  return normalizeKeys(response?.data);
}
