import api from '../utils/api'

export async function getBudgets() {
  const response = await api.get('/api/budgets')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createBudget(payload) {
  const response = await api.post('/api/budgets', payload)
  return response?.data || {}
}

export async function updateBudget(id, payload) {
  const response = await api.put(`/api/budgets/${id}`, payload)
  return response?.data || {}
}

export async function deleteBudget(id) {
  const response = await api.delete(`/api/budgets/${id}`)
  return response?.data || {}
}
