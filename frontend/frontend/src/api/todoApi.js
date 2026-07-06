import api from "../utils/api";

export async function getTodos() {
  const response = await api.get("/api/v1/todos");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createTodo(payload) {
  const response = await api.post("/api/v1/todos", payload);
  return response?.data || null;
}

export async function updateTodo(id, payload) {
  const response = await api.put(`/api/v1/todos/${id}`, payload);
  return response?.data || null;
}

export async function deleteTodo(id) {
  const response = await api.delete(`/api/v1/todos/${id}`);
  return response?.data || null;
}
