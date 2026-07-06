import api from '../utils/api'

export async function getProjectStatuses() {
  const response = await api.get('/api/project-statuses')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createProjectStatus(projectStatus) {
  const response = await api.post('/api/project-statuses', { projectStatus })
  return response?.data
}

export async function updateProjectStatus(id, projectStatus) {
  const response = await api.put(`/api/project-statuses/${id}`, { projectStatus })
  return response?.data
}

export async function deleteProjectStatus(id) {
  const response = await api.delete(`/api/project-statuses/${id}`)
  return response?.data
}
