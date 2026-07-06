import api from "../utils/api";

export async function getUserSettings() {
  const response = await api.get("/api/settings/user");
  return response?.data || null;
}

export async function saveUserSettings(payload) {
  const response = await api.put("/api/settings/user", payload);
  return response?.data || null;
}
