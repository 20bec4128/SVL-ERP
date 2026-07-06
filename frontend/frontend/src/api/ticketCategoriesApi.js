import api from "../utils/api";

export async function getTicketCategories() {
  const response = await api.get("/api/ticket-categories");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createTicketCategory(payload) {
  const response = await api.post("/api/ticket-categories", payload);
  return response?.data || null;
}
