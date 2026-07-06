import api from '../utils/api'

export async function getSecondarySources() {
  const response = await api.get('/api/secondary-sources')
  return Array.isArray(response?.data) ? response.data : []
}

function normalizeSecondarySourcePayload(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }
  return { secondarySource: payload };
}

export async function createSecondarySource(payload) {
  const response = await api.post('/api/secondary-sources', normalizeSecondarySourcePayload(payload))
  return response?.data
}

export async function updateSecondarySource(id, payload) {
  const response = await api.put(`/api/secondary-sources/${id}`, normalizeSecondarySourcePayload(payload))
  return response?.data
}

export async function deleteSecondarySource(id) {
  const response = await api.delete(`/api/secondary-sources/${id}`)
  return response?.data
}
