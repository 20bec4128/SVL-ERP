import api from "../utils/api";

function isValidId(id) {
  if (id === null || id === undefined) {
    return false;
  }
  if (typeof id === "number") {
    return Number.isFinite(id);
  }
  const parsed = Number(String(id).trim());
  return Number.isFinite(parsed) && parsed > 0;
}

function normalizeId(id) {
  return typeof id === "number" ? id : Number(String(id).trim());
}

export async function getQuotations() {
  const response = await api.get("/api/quotations");
  return response.data;
}

export async function getQuotationsByLead(leadId) {
  const response = await api.get(`/api/quotations/lead/${normalizeId(leadId)}`);
  return response.data;
}

export async function getQuotationById(id) {
  const response = await api.get(`/api/quotations/${normalizeId(id)}`);
  return response.data;
}

export async function createQuotation(payload) {
  const response = await api.post("/api/quotations", payload);
  return response.data;
}

export async function updateQuotation(id, payload) {
  const response = await api.put(`/api/quotations/${normalizeId(id)}`, payload);
  return response.data;
}

export async function saveQuotation(payload) {
  if (isValidId(payload?.id)) {
    return updateQuotation(payload.id, payload);
  }
  return createQuotation(payload);
}

export async function sendQuotationForVerification(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/verify`, {
    notes: notes || "",
  });
  return response.data;
}

export async function approveQuotation(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/approve`, {
    notes: notes || "",
  });
  return response.data;
}

export async function rejectQuotationByAdmin(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/admin-reject`, {
    notes: notes || "",
  });
  return response.data;
}

export async function markQuotationSent(id, sendEmail = false, file = null) {
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-sent?sendEmail=${sendEmail}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
  const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-sent?sendEmail=${sendEmail}`);
  return response.data;
}

export async function markQuotationNegotiating(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-negotiating`, {
    notes: notes || "",
  });
  return response.data;
}

export async function markQuotationRejected(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-rejected`, {
    notes: notes || "",
  });
  return response.data;
}

export async function markQuotationAccepted(id, notes) {
  const response = await api.post(`/api/quotations/${normalizeId(id)}/mark-accepted`, {
    notes: notes || "",
  });
  return response.data;
}

export async function deleteQuotation(id) {
  await api.delete(`/api/quotations/${normalizeId(id)}`);
}
