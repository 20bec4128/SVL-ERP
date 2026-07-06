import api from '../utils/api'

export async function getLeadTypes() {
  const response = await api.get('/api/lead-types')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createLeadType(leadType) {
  const response = await api.post('/api/lead-types', { leadType })
  return response?.data
}

export async function updateLeadType(id, leadType) {
  const response = await api.put(`/api/lead-types/${id}`, { leadType })
  return response?.data
}

export async function deleteLeadType(id) {
  const response = await api.delete(`/api/lead-types/${id}`)
  return response?.data
}
