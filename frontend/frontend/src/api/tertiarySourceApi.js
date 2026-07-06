import api from '../utils/api'

export async function getTertiarySources() {
  const response = await api.get('/api/tertiary-sources')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createTertiarySource(tertiarySource) {
  const response = await api.post('/api/tertiary-sources', { tertiarySource })
  return response?.data
}

export async function updateTertiarySource(id, tertiarySource) {
  const response = await api.put(`/api/tertiary-sources/${id}`, { tertiarySource })
  return response?.data
}

export async function deleteTertiarySource(id) {
  const response = await api.delete(`/api/tertiary-sources/${id}`)
  return response?.data
}
