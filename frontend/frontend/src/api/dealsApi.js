// --- Design Workflow ---
export async function startDesignWork(dealId) {
  const response = await api.post(`/api/v1/deals/${dealId}/design/start-work`);
  return response?.data || null;
}

export async function uploadDesignDraft(dealId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/api/v1/deals/${dealId}/design/upload-draft`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response?.data || null;
}

export async function sendDesignFeedback(dealId, message) {
  const response = await api.post(`/api/v1/deals/${dealId}/design/send-feedback`, { message });
  return response?.data || null;
}

export async function approveFinalDesign(dealId) {
  const response = await api.post(`/api/v1/deals/${dealId}/design/approve-final`);
  return response?.data || null;
}

export async function uploadFinalDesign(dealId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/api/v1/deals/${dealId}/design/upload-final`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response?.data || null;
}
import api from '../utils/api'

export async function getDeals() {
  const response = await api.get('/api/v1/deals')
  return Array.isArray(response?.data) ? response.data : []
}

export async function getDealById(id) {
  const response = await api.get(`/api/v1/deals/${id}`)
  return response?.data || null
}

export async function updateDeal(id, payload) {
  const response = await api.patch(`/api/v1/deals/${id}`, payload)
  return response?.data || null
}

export async function updateDealStatus(id, status, nextGroupId = null) {
  const payload = { status }
  if (nextGroupId != null) payload.nextGroupId = nextGroupId
  const response = await api.patch(`/api/v1/deals/${id}/status`, payload)
  return response?.data || null
}

export async function deleteDeal(id) {
  await api.delete(`/api/v1/deals/${id}`)
}

export async function getDesignRequests() {
  const response = await api.get('/api/v1/deals/design-requests')
  return Array.isArray(response?.data) ? response.data : []
}

export async function getProductionRequests() {
  const response = await api.get('/api/v1/deals/production-requests')
  return Array.isArray(response?.data) ? response.data : []
}

export async function updateProductionWorkStatus(dealId, workStatus) {
  const response = await api.patch(`/api/v1/deals/${dealId}/production-work-status`, { workStatus })
  return response?.data || null
}

export async function uploadDealPaymentProof(dealId, file) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await api.post(`/api/v1/deals/${dealId}/payment-proof`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response?.data || {}
}

export async function updateDealPaymentVerification(dealId, payload = {}) {
  const response = await api.patch(`/api/v1/deals/${dealId}/payment-verification`, payload)
  return response?.data || {}
}

export async function getDealByLeadId(leadId) {
  const response = await api.get(`/api/v1/deals/lead/${leadId}`)
  return response?.data || null
}
