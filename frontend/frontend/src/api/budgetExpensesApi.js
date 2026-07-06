import api from '../utils/api'

export async function getBudgetExpenses() {
  const response = await api.get('/api/budget-expenses')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createBudgetExpense(payload) {
  const response = await api.post('/api/budget-expenses', payload)
  return response?.data || {}
}

export async function updateBudgetExpense(id, payload) {
  const response = await api.put(`/api/budget-expenses/${id}`, payload)
  return response?.data || {}
}

export async function deleteBudgetExpense(id) {
  const response = await api.delete(`/api/budget-expenses/${id}`)
  return response?.data || {}
}
