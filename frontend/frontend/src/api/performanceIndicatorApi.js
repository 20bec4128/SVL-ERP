import api from "../utils/api";

export async function getPerformanceIndicators() {
  const response = await api.get("/api/performance-indicators");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createPerformanceIndicator(payload) {
  const response = await api.post("/api/performance-indicators", payload);
  return response?.data || null;
}

export async function updatePerformanceIndicator(id, payload) {
  const response = await api.put(`/api/performance-indicators/${id}`, payload);
  return response?.data || null;
}

export async function deletePerformanceIndicator(id) {
  const response = await api.delete(`/api/performance-indicators/${id}`);
  return response?.data || null;
}
