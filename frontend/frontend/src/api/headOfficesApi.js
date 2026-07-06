import api from "../utils/api";

export async function getHeadOffices() {
  const response = await api.get("/api/head-offices");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createHeadOffice(payload) {
  const response = await api.post("/api/head-offices", payload);
  return response?.data || null;
}

export async function updateHeadOffice(id, payload) {
  const response = await api.put(`/api/head-offices/${id}`, payload);
  return response?.data || null;
}

export async function deleteHeadOffice(id) {
  const response = await api.delete(`/api/head-offices/${id}`);
  return response?.data || null;
}

