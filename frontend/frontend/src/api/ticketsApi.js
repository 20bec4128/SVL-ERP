import api from "../utils/api";

export async function getTickets() {
  const response = await api.get("/api/tickets");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createTicket(payload) {
  const response = await api.post("/api/tickets", payload);
  return response?.data || null;
}

export async function updateTicket(id, payload) {
  const response = await api.put(`/api/tickets/${id}`, payload);
  return response?.data || null;
}

export async function deleteTicket(id) {
  const response = await api.delete(`/api/tickets/${id}`);
  return response?.data || null;
}
