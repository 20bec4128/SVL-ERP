import api from "../utils/api";

// ── Run Payroll (generates payslips for all employees for a given month) ──
export async function runPayroll(month) {
  const response = await api.post("/api/payroll/run", { month });
  return Array.isArray(response?.data) ? response.data : [];
}

// ── Fetch generated payslips for a month ──
export async function getPayslipsForMonth(month) {
  const response = await api.get("/api/payroll/payslips", { params: { month } });
  return Array.isArray(response?.data) ? response.data : [];
}

// ── Bulk send payslip emails for a month ──
export async function sendPayslips(month) {
  const response = await api.post("/api/payroll/send-payslips", { month });
  return response?.data || null;
}

// ── Send payslip email to a single employee ──
export async function sendPayslipById(id) {
  const response = await api.post(`/api/payroll/payslips/${id}/send`);
  return response?.data || null;
}

// ── Download payslip as PDF bytes ──
export async function downloadPayslipPdf(id) {
  const response = await api.get(`/api/payroll/payslips/${id}/pdf`, {
    responseType: "blob",
  });
  return response?.data || null;
}

// ── Legacy: get all payslips (old endpoint — kept for backward compat) ──
export async function getPayslips() {
  const response = await api.get("/api/payslips");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createPayslip(payload) {
  const response = await api.post("/api/payslips", payload);
  return response?.data || null;
}

export async function deletePayslip(id) {
  const response = await api.delete(`/api/payslips/${id}`);
  return response?.data || null;
}
