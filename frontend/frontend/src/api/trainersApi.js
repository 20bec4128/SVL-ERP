import api from "../utils/api";

export async function getTrainers() {
  const response = await api.get("/api/trainers");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createTrainer(payload) {
  const response = await api.post("/api/trainers", payload);
  return response?.data || null;
}

export async function updateTrainer(id, payload) {
  const response = await api.put(`/api/trainers/${id}`, payload);
  return response?.data || null;
}

export async function deleteTrainer(id) {
  const response = await api.delete(`/api/trainers/${id}`);
  return response?.data || null;
}
