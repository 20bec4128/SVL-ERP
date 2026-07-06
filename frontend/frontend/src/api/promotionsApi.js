import api from "../utils/api";

export async function getPromotions() {
  const response = await api.get("/api/promotions");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createPromotion(payload) {
  const response = await api.post("/api/promotions", payload);
  return response?.data || null;
}

export async function updatePromotion(id, payload) {
  const response = await api.put(`/api/promotions/${id}`, payload);
  return response?.data || null;
}

export async function deletePromotion(id) {
  const response = await api.delete(`/api/promotions/${id}`);
  return response?.data || null;
}
