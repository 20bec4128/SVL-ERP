import api from "../utils/api";

export async function getSessionSettings() {
  const response = await api.get("/api/settings/session");
  return response?.data || null;
}

export async function saveSessionSettings(payload) {
  const response = await api.put("/api/settings/session", payload);
  return response?.data || null;
}
