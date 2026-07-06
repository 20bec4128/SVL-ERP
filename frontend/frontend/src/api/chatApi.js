import api from "../utils/api";

export async function getChatUsers() {
  const response = await api.get("/api/v1/chat/users");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getChatRooms() {
  const response = await api.get("/api/v1/chat/rooms");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createChatRoom(payload) {
  const response = await api.post("/api/v1/chat/rooms", payload);
  return response?.data || null;
}

export async function getChatMessages(roomId) {
  const response = await api.get(`/api/v1/chat/rooms/${roomId}/messages`);
  return Array.isArray(response?.data) ? response.data : [];
}

export async function sendChatMessage(roomId, payload) {
  const response = await api.post(`/api/v1/chat/rooms/${roomId}/messages`, payload);
  return response?.data || null;
}

export async function pinChatRoom(roomId) {
  const response = await api.post(`/api/v1/chat/rooms/${roomId}/pin`);
  return response?.data || null;
}

export async function muteChatRoom(roomId) {
  const response = await api.post(`/api/v1/chat/rooms/${roomId}/mute`);
  return response?.data || null;
}

export async function archiveChatRoom(roomId) {
  const response = await api.post(`/api/v1/chat/rooms/${roomId}/archive`);
  return response?.data || null;
}

export async function markChatAsRead(roomId) {
  const response = await api.post(`/api/v1/chat/rooms/${roomId}/read`);
  return response?.data || null;
}

export async function blockUser(userId) {
  const response = await api.post(`/api/v1/chat/users/${userId}/block`);
  return response?.data || null;
}

export async function unblockUser(userId) {
  const response = await api.post(`/api/v1/chat/users/${userId}/unblock`);
  return response?.data || null;
}
