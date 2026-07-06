import api from "../utils/api";

export async function getTerminations() {
  const response = await api.get("/api/terminations");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createTermination(payload) {
  const response = await api.post("/api/terminations", payload);
  return response?.data || null;
}

export async function updateTermination(id, payload) {
  const response = await api.put(`/api/terminations/${id}`, payload);
  return response?.data || null;
}

export async function deleteTermination(id) {
  const response = await api.delete(`/api/terminations/${id}`);
  return response?.data || null;
}
