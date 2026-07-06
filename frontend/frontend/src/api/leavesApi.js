import api from "../utils/api";

export async function getLeaves() {
  const response = await api.get("/api/leaves");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createLeave(payload) {
  const response = await api.post("/api/leaves", payload);
  return response?.data || null;
}

export async function updateLeave(id, payload) {
  const response = await api.put(`/api/leaves/${id}`, payload);
  return response?.data || null;
}

export async function deleteLeave(id) {
  const response = await api.delete(`/api/leaves/${id}`);
  return response?.data || null;
}
