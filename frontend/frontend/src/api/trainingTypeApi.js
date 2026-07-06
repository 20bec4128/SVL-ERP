import api from "../utils/api";

export async function getTrainingTypes() {
  const response = await api.get("/api/training-types");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createTrainingType(payload) {
  const response = await api.post("/api/training-types", payload);
  return response?.data || null;
}

export async function updateTrainingType(id, payload) {
  const response = await api.put(`/api/training-types/${id}`, payload);
  return response?.data || null;
}

export async function deleteTrainingType(id) {
  const response = await api.delete(`/api/training-types/${id}`);
  return response?.data || null;
}
