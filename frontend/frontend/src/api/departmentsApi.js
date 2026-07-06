import api from "../utils/api";

export async function getDepartmentsMaster() {
  const response = await api.get("/api/departments");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getDepartmentsMasterByBranch(branchId) {
  const response = await api.get("/api/departments", {
    params: branchId ? { branchId } : {},
  });
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createDepartmentMaster(payload) {
  const response = await api.post("/api/departments", payload);
  return response?.data || null;
}

export async function updateDepartmentMaster(id, payload) {
  const response = await api.put(`/api/departments/${id}`, payload);
  return response?.data || null;
}

export async function deleteDepartmentMaster(id) {
  const response = await api.delete(`/api/departments/${id}`);
  return response?.data || null;
}
