import api from '../utils/api'

export const DEFAULT_LEAD_STATUSES = [
  'New Lead',
  'Attempted',
  'Not Attempted',
  'Interested',
  'Requirement',
  'Payment',
  'Production',
  'Accounts',
]

export async function getLeadStatuses() {
  const response = await api.get('/api/lead-statuses')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createLeadStatus(leadStatus) {
  const response = await api.post('/api/lead-statuses', { leadStatus })
  return response?.data
}

export async function updateLeadStatus(id, leadStatus) {
  const response = await api.put(`/api/lead-statuses/${id}`, { leadStatus })
  return response?.data
}

export async function deleteLeadStatus(id) {
  const response = await api.delete(`/api/lead-statuses/${id}`)
  return response?.data
}
