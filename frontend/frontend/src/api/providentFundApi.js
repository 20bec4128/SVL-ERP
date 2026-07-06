import api from "../utils/api";

export async function getProvidentFunds() {
  const response = await api.get("/api/provident-fund");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createProvidentFund(payload) {
  const response = await api.post("/api/provident-fund", payload);
  return response?.data || null;
}

export async function updateProvidentFund(id, payload) {
  const response = await api.put(`/api/provident-fund/${id}`, payload);
  return response?.data || null;
}

export async function deleteProvidentFund(id) {
  const response = await api.delete(`/api/provident-fund/${id}`);
  return response?.data || null;
}
