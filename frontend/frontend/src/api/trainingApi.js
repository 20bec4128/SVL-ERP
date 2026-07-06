import api from "../utils/api";

export async function getTrainings() {
  const response = await api.get("/api/trainings");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createTraining(payload) {
  const response = await api.post("/api/trainings", payload);
  return response?.data || null;
}

export async function updateTraining(id, payload) {
  const response = await api.put(`/api/trainings/${id}`, payload);
  return response?.data || null;
}

export async function deleteTraining(id) {
  const response = await api.delete(`/api/trainings/${id}`);
  return response?.data || null;
}
