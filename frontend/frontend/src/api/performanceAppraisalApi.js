import api from "../utils/api";

export async function getPerformanceAppraisals() {
  const response = await api.get("/api/performance-appraisals");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createPerformanceAppraisal(payload) {
  const response = await api.post("/api/performance-appraisals", payload);
  return response?.data || null;
}

export async function updatePerformanceAppraisal(id, payload) {
  const response = await api.put(`/api/performance-appraisals/${id}`, payload);
  return response?.data || null;
}

export async function deletePerformanceAppraisal(id) {
  const response = await api.delete(`/api/performance-appraisals/${id}`);
  return response?.data || null;
}
