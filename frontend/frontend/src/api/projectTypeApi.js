import api from '../utils/api'

export async function getProjectTypes() {
  const response = await api.get('/api/project-types')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createProjectType(projectType) {
  const response = await api.post('/api/project-types', { projectType })
  return response?.data
}

export async function updateProjectType(id, projectType) {
  const response = await api.put(`/api/project-types/${id}`, { projectType })
  return response?.data
}

export async function deleteProjectType(id) {
  const response = await api.delete(`/api/project-types/${id}`)
  return response?.data
}
