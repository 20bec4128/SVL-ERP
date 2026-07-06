import api from "../utils/api";

export async function getUserDepartments(branchId) {
  const response = await api.get("/api/user-departments", {
    params: branchId ? { branchId } : {},
  });
  const rows = Array.isArray(response?.data) ? response.data : [];
  return rows.map((row) => ({
    ...row,
    branchId: row?.branchId ?? row?.branch?.id ?? null,
    branchName: row?.branchName ?? row?.branch?.name ?? "",
  }));
}

export async function createUserDepartment(payload) {
  const response = await api.post("/api/user-departments", payload);
  return response?.data || null;
}

export async function getUserDesignations(userDepartmentId) {
  const response = await api.get("/api/user-designations", {
    params: userDepartmentId ? { userDepartmentId } : {},
  });
  const rows = Array.isArray(response?.data) ? response.data : [];
  return rows.map((row) => ({
    ...row,
    userDepartmentId: row?.userDepartmentId ?? row?.userDepartment?.id ?? null,
    userDepartmentName: row?.userDepartmentName ?? row?.userDepartment?.name ?? "",
    branchId: row?.branchId ?? row?.userDepartment?.branch?.id ?? null,
    branchName: row?.branchName ?? row?.userDepartment?.branch?.name ?? "",
  }));
}

export async function createUserDesignation(payload) {
  const response = await api.post("/api/user-designations", payload);
  return response?.data || null;
}

export async function updateUserDepartment(id, payload) {
  const response = await api.put(`/api/user-departments/${id}`, payload);
  return response?.data || null;
}

export async function deleteUserDepartment(id) {
  const response = await api.delete(`/api/user-departments/${id}`);
  return response?.data || null;
}

export async function updateUserDesignation(id, payload) {
  const response = await api.put(`/api/user-designations/${id}`, payload);
  return response?.data || null;
}

export async function deleteUserDesignation(id) {
  const response = await api.delete(`/api/user-designations/${id}`);
  return response?.data || null;
}
