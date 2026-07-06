import api from "../utils/api";

export async function getCustomerLead() {
  const response = await api.get("/api/customer/lead");
  return response?.data || null;
}

export async function updateCustomerLeadStatus(status, leadId, options = {}) {
  const payload = { status };
  if (options.rejectedReason) {
    payload.rejectedReason = options.rejectedReason;
  }
  if (options.rejectedReasonSubtype !== undefined) {
    payload.rejectedReasonSubtype = options.rejectedReasonSubtype;
  }
  const response = await api.patch("/api/customer/lead/status", payload);
  return response?.data || null;
}

export async function recordCustomerPayment({ amount, type }) {
  const response = await api.post("/api/customer/lead/payment", { amount, type });
  return response?.data || {};
}
