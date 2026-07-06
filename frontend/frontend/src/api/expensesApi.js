import api from '../utils/api'

export async function getExpenses() {
  const response = await api.get('/api/sales-expenses')
  return Array.isArray(response?.data) ? response.data : []
}

export async function createExpense(payload) {
  const response = await api.post('/api/sales-expenses', payload)
  return response?.data || {}
}

export async function updateExpense(id, payload) {
  const response = await api.put(`/api/sales-expenses/${id}`, payload)
  return response?.data || {}
}

export async function deleteExpense(id) {
  const response = await api.delete(`/api/sales-expenses/${id}`)
  return response?.data || {}
}
