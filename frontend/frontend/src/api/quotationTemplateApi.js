import api from "../utils/api";

export async function getQuotationTemplate() {
  const response = await api.get("/api/quotation-template");
  return response.data;
}

export async function listQuotationTemplates() {
  const response = await api.get("/api/quotation-template/list");
  return response.data;
}

export async function createQuotationTemplate(payload) {
  const response = await api.post("/api/quotation-template", payload);
  return response.data;
}

export async function updateQuotationTemplate(id, payload) {
  const response = await api.put(`/api/quotation-template/${id}`, payload);
  return response.data;
}

export async function deleteQuotationTemplate(id) {
  const response = await api.delete(`/api/quotation-template/${id}`);
  return response.data;
}

export async function activateQuotationTemplate(id) {
  const response = await api.put(`/api/quotation-template/${id}/activate`);
  return response.data;
}
