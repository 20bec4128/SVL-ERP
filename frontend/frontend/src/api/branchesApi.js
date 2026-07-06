import api from "../utils/api";

export async function getBranches(headOfficeId) {
  const params = {};
  if (headOfficeId) params.headOfficeId = headOfficeId;
  const response = await api.get("/api/branches", { params });
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createBranch(payload) {
  const response = await api.post("/api/branches", payload);
  return response?.data || null;
}

export async function updateBranch(id, payload) {
  const response = await api.put(`/api/branches/${id}`, payload);
  return response?.data || null;
}

export async function deleteBranch(id) {
  const response = await api.delete(`/api/branches/${id}`);
  return response?.data || null;
}

