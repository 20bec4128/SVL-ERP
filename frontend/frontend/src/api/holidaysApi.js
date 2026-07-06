import api from "../utils/api";

export async function getHolidays() {
  const response = await api.get("/api/holidays");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createHoliday(payload) {
  const response = await api.post("/api/holidays", payload);
  return response?.data || null;
}

export async function updateHoliday(id, payload) {
  const response = await api.put(`/api/holidays/${id}`, payload);
  return response?.data || null;
}

export async function deleteHoliday(id) {
  const response = await api.delete(`/api/holidays/${id}`);
  return response?.data || null;
}
