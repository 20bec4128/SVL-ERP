import api from '../utils/api'

export async function getPrimarySources() {
  const response = await api.get('/api/primary-sources')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createPrimarySource(primarySource) {
  const response = await api.post('/api/primary-sources', { primarySource })
  return response?.data
}

export async function updatePrimarySource(id, primarySource) {
  const response = await api.put(`/api/primary-sources/${id}`, { primarySource })
  return response?.data
}

export async function deletePrimarySource(id) {
  const response = await api.delete(`/api/primary-sources/${id}`)
  return response?.data
}
