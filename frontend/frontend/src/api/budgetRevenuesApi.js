import api from '../utils/api'

export async function getBudgetRevenues() {
  const response = await api.get('/api/budget-revenues')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createBudgetRevenue(payload) {
  const response = await api.post('/api/budget-revenues', payload)
  return response?.data || {}
}

export async function updateBudgetRevenue(id, payload) {
  const response = await api.put(`/api/budget-revenues/${id}`, payload)
  return response?.data || {}
}

export async function deleteBudgetRevenue(id) {
  const response = await api.delete(`/api/budget-revenues/${id}`)
  return response?.data || {}
}
