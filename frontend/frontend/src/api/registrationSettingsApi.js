import api from "../utils/api";

export async function getRegistrationSettings() {
  const response = await api.get("/api/settings/registration");
  return response?.data || null;
}

export async function saveRegistrationSettings(payload) {
  const response = await api.put("/api/settings/registration", payload);
  return response?.data || null;
}
