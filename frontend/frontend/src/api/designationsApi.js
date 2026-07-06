import api from "../utils/api";

export async function getDesignations(departmentId) {
  const response = await api.get("/api/designations", {
    params: departmentId ? { departmentId } : {},
  });
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createDesignation(payload) {
  const response = await api.post("/api/designations", payload);
  return response?.data || null;
}

export async function updateDesignation(id, payload) {
  const response = await api.put(`/api/designations/${id}`, payload);
  return response?.data || null;
}

export async function deleteDesignation(id) {
  const response = await api.delete(`/api/designations/${id}`);
  return response?.data || null;
}
