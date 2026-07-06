import api from "../utils/api";

export async function getEmailTemplates() {
  const response = await api.get("/api/email-templates");
  return response.data;
}

export async function getEmailTemplate(templateKey) {
  const response = await api.get(`/api/email-templates/${encodeURIComponent(templateKey)}`);
  return response.data;
}

export async function createEmailTemplate(payload) {
  const response = await api.post("/api/email-templates", payload);
  return response.data;
}

export async function saveEmailTemplate(templateKey, payload) {
  const response = await api.put(`/api/email-templates/${encodeURIComponent(templateKey)}`, payload);
  return response.data;
}

export async function deleteEmailTemplate(templateKey) {
  const response = await api.delete(`/api/email-templates/${encodeURIComponent(templateKey)}`);
  return response.data;
}
