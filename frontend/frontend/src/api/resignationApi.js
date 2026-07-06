import api from "../utils/api";

export async function getResignations() {
  const response = await api.get("/api/resignations");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createResignation(payload) {
  const response = await api.post("/api/resignations", payload);
  return response?.data || null;
}

export async function updateResignation(id, payload) {
  const response = await api.put(`/api/resignations/${id}`, payload);
  return response?.data || null;
}

export async function deleteResignation(id) {
  const response = await api.delete(`/api/resignations/${id}`);
  return response?.data || null;
}
