import api from "../utils/api";

// Additions
export async function getAdditions() {
  const response = await api.get("/api/payroll-items/additions");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createAddition(payload) {
  const response = await api.post("/api/payroll-items/additions", payload);
  return response?.data || null;
}

export async function updateAddition(id, payload) {
  const response = await api.put(`/api/payroll-items/additions/${id}`, payload);
  return response?.data || null;
}

export async function deleteAddition(id) {
  const response = await api.delete(`/api/payroll-items/additions/${id}`);
  return response?.data || null;
}

// Overtimes
export async function getOvertimes() {
  const response = await api.get("/api/payroll-items/overtimes");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createOvertime(payload) {
  const response = await api.post("/api/payroll-items/overtimes", payload);
  return response?.data || null;
}

export async function updateOvertime(id, payload) {
  const response = await api.put(`/api/payroll-items/overtimes/${id}`, payload);
  return response?.data || null;
}

export async function deleteOvertime(id) {
  const response = await api.delete(`/api/payroll-items/overtimes/${id}`);
  return response?.data || null;
}

// Deductions
export async function getDeductions() {
  const response = await api.get("/api/payroll-items/deductions");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createDeduction(payload) {
  const response = await api.post("/api/payroll-items/deductions", payload);
  return response?.data || null;
}

export async function updateDeduction(id, payload) {
  const response = await api.put(`/api/payroll-items/deductions/${id}`, payload);
  return response?.data || null;
}

export async function deleteDeduction(id) {
  const response = await api.delete(`/api/payroll-items/deductions/${id}`);
  return response?.data || null;
}
