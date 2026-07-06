import api from '../utils/api'

export async function getProjects() {
  const response = await api.get('/api/projects')
  const data = response?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  return []
}

export async function createProject(payload) {
  const response = await api.post('/api/projects', payload)
  return response?.data
}

export async function updateProject(id, payload) {
  const response = await api.put(`/api/projects/${id}`, payload)
  return response?.data
}

export async function deleteProject(id) {
  const response = await api.delete(`/api/projects/${id}`)
  return response?.data
}
