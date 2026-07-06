import api from "../utils/api";

export async function getPolicies() {
  const response = await api.get("/api/policies");
  return Array.isArray(response?.data) ? response.data : [];
}

function buildPolicyFormData(payload, file) {
  const formData = new FormData();
  const json = JSON.stringify(payload);
  formData.append("data", new Blob([json], { type: "application/json" }));
  if (file) {
    formData.append("file", file);
  }
  return formData;
}

export async function createPolicy(payload, file) {
  const formData = buildPolicyFormData(payload, file);
  const response = await api.post("/api/policies", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data || null;
}

export async function updatePolicy(id, payload, file) {
  const formData = buildPolicyFormData(payload, file);
  const response = await api.put(`/api/policies/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data || null;
}

export async function deletePolicy(id) {
  const response = await api.delete(`/api/policies/${id}`);
  return response?.data || null;
}
