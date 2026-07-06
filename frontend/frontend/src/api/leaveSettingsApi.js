import api from "../utils/api";

export async function getLeaveTypes() {
  const response = await api.get("/api/leave-settings/types");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createLeaveType(payload) {
  const response = await api.post("/api/leave-settings/types", payload);
  return response?.data || null;
}

export async function updateLeaveType(id, payload) {
  const response = await api.put(`/api/leave-settings/types/${id}`, payload);
  return response?.data || null;
}

export async function deleteLeaveType(id) {
  const response = await api.delete(`/api/leave-settings/types/${id}`);
  return response?.data || null;
}


export async function getLeavePolicies() {
  const response = await api.get("/api/leave-settings/policies");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createLeavePolicy(payload) {
  const response = await api.post("/api/leave-settings/policies", payload);
  return response?.data || null;
}

export async function updateLeavePolicy(id, payload) {
  const response = await api.put(`/api/leave-settings/policies/${id}`, payload);
  return response?.data || null;
}

export async function deleteLeavePolicy(id) {
  const response = await api.delete(`/api/leave-settings/policies/${id}`);
  return response?.data || null;
}

export async function getLeaveEligibility(employeeId) {
  if (!employeeId) return [];
  const response = await api.get(`/api/leave-settings/eligibility/${employeeId}`);
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getLeavePoliciesForType(leaveTypeId) {
  if (!leaveTypeId) return [];
  const response = await api.get(`/api/leave-settings/types/${leaveTypeId}/policies`);
  return Array.isArray(response?.data) ? response.data : [];
}
