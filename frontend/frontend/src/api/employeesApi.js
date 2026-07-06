import api from "../utils/api";

function normalizeEmployeePageResponse(data) {
  if (Array.isArray(data)) {
    return {
      content: data,
      page: 1,
      size: data.length,
      totalElements: data.length,
      totalPages: 1,
    };
  }

  return {
    content: Array.isArray(data?.content) ? data.content : Array.isArray(data?.items) ? data.items : [],
    page: Number(data?.page ?? data?.number ?? 1) || 1,
    size: Number(data?.size ?? data?.pageSize ?? 25) || 25,
    totalElements: Number(data?.totalElements ?? data?.total ?? 0) || 0,
    totalPages: Number(data?.totalPages ?? data?.pages ?? 1) || 1,
  };
}

export async function getEmployees(params = null) {
  const response = await api.get("/api/employees", {
    params: params && Object.keys(params).length > 0 ? params : undefined,
  });
  if (!params || Object.keys(params).length === 0) {
    return Array.isArray(response?.data) ? response.data : [];
  }
  return normalizeEmployeePageResponse(response?.data);
}

export async function getAvailableEmployees(params = {}) {
  const response = await api.get("/api/employees/available", {
    params: params && Object.keys(params).length > 0 ? params : undefined,
  });
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createEmployee(payload) {
  const response = await api.post("/api/employees", payload);
  return response?.data || null;
}

export async function onboardEmployee(formData) {
  const response = await api.post("/api/employees/onboard", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data || null;
}

export async function updateOnboardEmployee(id, formData) {
  const response = await api.put(`/api/employees/${id}/onboard`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data || null;
}

export async function updateEmployee(id, payload) {
  const response = await api.put(`/api/employees/${id}`, payload);
  return response?.data || null;
}

export async function getEmployeeById(id) {
  const response = await api.get(`/api/employees/${id}`);
  return response?.data || null;
}

export async function deleteEmployee(id) {
  const response = await api.delete(`/api/employees/${id}`);
  return response?.data || null;
}

export async function generateEmployeeFormLink(employeeId) {
  const response = await api.post(`/api/employees/${employeeId}/form-link`);
  return response?.data || null;
}

export async function sendOfferLetterEmail(employeeId) {
  const response = await api.post(`/api/employees/${employeeId}/send-offer-letter`);
  return response?.data || null;
}

export async function resendOfferLetterEmail(employeeId) {
  const response = await api.post(`/api/employees/${employeeId}/resend-offer-letter`);
  return response?.data || null;
}

export async function getEmployeeVerification(employeeId) {
  const response = await api.get(`/api/employees/${employeeId}/verification`);
  return response?.data || null;
}

export async function verifyEmployeeFields(employeeId, payload) {
  const response = await api.post(`/api/employees/${employeeId}/verify-fields`, payload);
  return response?.data || null;
}

export async function resendRejectedEmployeeLink(employeeId) {
  const response = await api.post(`/api/employees/${employeeId}/resend-rejected-link`);
  return response?.data || null;
}

export async function resendProfileCompletionMail(employeeId) {
  const response = await api.post(`/api/employees/${employeeId}/resend-profile-completion-mail`);
  return response?.data || null;
}

export async function getPublicEmployeeForm(token) {
  const response = await api.get(`/api/public/employee-form/${token}`);
  return response?.data || null;
}

export async function submitPublicEmployeeForm(token, formData) {
  const response = await api.post(`/api/public/employee-form/${token}/submit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data || null;
}
