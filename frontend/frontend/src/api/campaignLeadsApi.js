import api from '../utils/api';

const BASE = '/api/v1/campaign-leads';

// GET – authenticated (uses api instance → auto Bearer token + correct base URL in prod)
export async function getCampaignLeads() {
  const response = await api.get(BASE);
  return response.data;
}

// POST assign – authenticated
export async function assignCampaignLead(id, employeeId, leadGroupId) {
  const response = await api.post(`${BASE}/${id}/assign`, { employeeId, leadGroupId });
  return response.data;
}

// POST test lead – public endpoint, but uses api instance so base URL is correct in production
export async function submitTestLead(payload) {
  const response = await api.post(`${BASE}/incoming-lead`, payload);
  return response.data;
}

// DELETE campaign lead
export async function deleteCampaignLead(id) {
  const response = await api.delete(`${BASE}/${id}`);
  return response.data;
}

