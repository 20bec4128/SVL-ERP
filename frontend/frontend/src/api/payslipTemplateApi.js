import api from "../utils/api";

export async function getPayslipTemplate() {
  const response = await api.get("/api/payslip-template");
  return response.data;
}

export async function savePayslipTemplate(payload) {
  const response = await api.post("/api/payslip-template", payload);
  return response.data;
}
