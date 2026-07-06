import api from "../utils/api";

export async function getMailSettings() {
  const response = await api.get("/api/settings/mail");
  return response?.data || null;
}

export async function saveMailSettings(payload) {
  const response = await api.put("/api/settings/mail", payload);
  return response?.data || null;
}

export async function sendTestMail(toAddress) {
  const response = await api.post("/api/settings/mail/test", { toAddress });
  return response?.data || null;
}

