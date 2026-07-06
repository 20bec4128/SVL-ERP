import api from "../utils/api";

export async function getTimesheets() {
  const response = await api.get("/api/timesheets");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createTimesheet(payload) {
  const response = await api.post("/api/timesheets", payload);
  return response?.data || null;
}

export async function updateTimesheet(id, payload) {
  const response = await api.put(`/api/timesheets/${id}`, payload);
  return response?.data || null;
}

export async function deleteTimesheet(id) {
  const response = await api.delete(`/api/timesheets/${id}`);
  return response?.data || null;
}
