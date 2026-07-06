import api from "../utils/api";

export async function getGoalTypes() {
  const response = await api.get("/api/goal-types");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createGoalType(payload) {
  const response = await api.post("/api/goal-types", payload);
  return response?.data || null;
}

export async function updateGoalType(id, payload) {
  const response = await api.put(`/api/goal-types/${id}`, payload);
  return response?.data || null;
}

export async function deleteGoalType(id) {
  const response = await api.delete(`/api/goal-types/${id}`);
  return response?.data || null;
}
