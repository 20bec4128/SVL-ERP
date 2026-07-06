import api from "../utils/api";

export async function getSecurityPolicySettings() {
  const response = await api.get("/api/settings/security-policy");
  return response?.data || null;
}

export async function saveSecurityPolicySettings(payload) {
  const response = await api.put("/api/settings/security-policy", payload);
  return response?.data || null;
}
