import api from "../utils/api";

export async function getCalendarEvents() {
  const response = await api.get("/api/v1/calendar/events");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createCalendarEvent(payload) {
  const response = await api.post("/api/v1/calendar/events", payload);
  return response?.data || null;
}

export async function updateCalendarEvent(id, payload) {
  const response = await api.put(`/api/v1/calendar/events/${id}`, payload);
  return response?.data || null;
}

export async function deleteCalendarEvent(id) {
  const response = await api.delete(`/api/v1/calendar/events/${id}`);
  return response?.data || null;
}
