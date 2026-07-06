import api from "../utils/api";

export async function getEmployeeSalaries() {
  const response = await api.get("/api/employee-salaries");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createEmployeeSalary(payload) {
  const response = await api.post("/api/employee-salaries", payload);
  return response?.data || null;
}

export async function updateEmployeeSalary(id, payload) {
  const response = await api.put(`/api/employee-salaries/${id}`, payload);
  return response?.data || null;
}

export async function deleteEmployeeSalary(id) {
  const response = await api.delete(`/api/employee-salaries/${id}`);
  return response?.data || null;
}
