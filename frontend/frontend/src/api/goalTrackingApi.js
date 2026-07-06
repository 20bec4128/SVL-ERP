import api from "../utils/api";

export async function getGoalTrackingList() {
  const response = await api.get("/api/goal-tracking");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createGoalTracking(payload) {
  const response = await api.post("/api/goal-tracking", payload);
  return response?.data || null;
}

export async function updateGoalTracking(id, payload) {
  const response = await api.put(`/api/goal-tracking/${id}`, payload);
  return response?.data || null;
}

export async function deleteGoalTracking(id) {
  const response = await api.delete(`/api/goal-tracking/${id}`);
  return response?.data || null;
}
